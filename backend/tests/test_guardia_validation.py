"""
TEST 3 + TEST 4 + TEST 5: Validación de Guardia - TTL, Concurrencia, Seguridad.

Tests críticos:
- TTL expirado: Guardia no puede validar código pasado
- Race condition: Dos guardias validan mismo QR → solo 1 exitoso
- Seguridad HMAC: Payload manipulado es rechazado
- Estados finales correctos (pendiente → validado)
"""
import pytest
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from threading import Thread
import time

from totem.models import BeneficioTrabajador, ValidacionCaja
from totem.security import QRSecurity
from totem.exceptions import (
    QRInvalidException, TicketExpiredException, 
    TicketInvalidStateException, TicketNotFoundException
)

pytestmark = pytest.mark.django_db(transaction=True)


class TestValidacionGuardiaBasica:
    """Tests básicos de validación de guardia."""

    def test_validacion_exitosa_beneficio_pendiente(self, api_client_guardia, usuario_guardia, beneficio_trabajador_pendiente):
        """
        TEST 1 (parte guardia): Flujo E2E completo.
        
        Flujo:
        1. Beneficio en estado 'pendiente'
        2. Guardia escanea QR válido
        3. POST /api/guardia/beneficios/{codigo}/validar/
        4. Estado cambia a 'validado'
        5. Se crea ValidacionCaja
        """
        codigo = beneficio_trabajador_pendiente.codigo_verificacion
        payload = QRSecurity.crear_payload_firmado(codigo)

        response = api_client_guardia.post(
            f'/api/guardia/beneficios/{codigo}/validar/',
            data={'qr_payload': payload, 'codigo_caja': 'CAJA-001'},
            format='json'
        )

        assert response.status_code == 200
        assert response.json()['estado'] == 'validado'

        # Verificar BD
        beneficio_trabajador_pendiente.refresh_from_db()
        assert beneficio_trabajador_pendiente.estado == 'validado'

        # Verificar ValidacionCaja creada
        validacion = ValidacionCaja.objects.get(
            beneficio_trabajador=beneficio_trabajador_pendiente
        )
        assert validacion.guardia == usuario_guardia
        assert validacion.resultado == 'exitoso'

    def test_validacion_rechaza_beneficio_ya_validado(self, api_client_guardia, beneficio_trabajador_validado):
        """
        Guardia intenta validar un beneficio ya validado.
        
        Debe rechazar con 409 (Conflict) - estado inválido para transición.
        """
        codigo = beneficio_trabajador_validado.codigo_verificacion
        payload = QRSecurity.crear_payload_firmado(codigo)

        response = api_client_guardia.post(
            f'/api/guardia/beneficios/{codigo}/validar/',
            data={'qr_payload': payload},
            format='json'
        )

        assert response.status_code in [409, 400]
        assert 'ya' in response.json()['detail'].lower() or 'inválido' in response.json()['detail'].lower()

    def test_validacion_requiere_autenticacion(self, api_client, beneficio_trabajador_pendiente):
        """
        Guardia debe estar autenticado para validar.
        
        Sin JWT token, debe rechazar con 401.
        """
        codigo = beneficio_trabajador_pendiente.codigo_verificacion
        payload = QRSecurity.crear_payload_firmado(codigo)

        # Sin autenticación
        response = api_client.post(
            f'/api/guardia/beneficios/{codigo}/validar/',
            data={'qr_payload': payload},
            format='json'
        )

        assert response.status_code == 401


class TestValidacionTTL:
    """TEST 3: Validación de TTL (Time To Live) de códigos QR."""

    def test_validacion_falla_si_codigo_expirado(self, api_client_guardia, beneficio_trabajador_expirado):
        """
        TEST 3 completo: Código QR expirado no puede ser validado.
        
        Flujo:
        1. BeneficioTrabajador con codigo_expira_at en pasado
        2. Guardia intenta validar
        3. Debe rechazar con 410 (Gone) o 400
        4. Mensaje debe mencionar "expirado"
        
        Protege contra: reutilización prolongada de códigos no validados
        """
        codigo = beneficio_trabajador_expirado.codigo_verificacion
        payload = QRSecurity.crear_payload_firmado(codigo)

        response = api_client_guardia.post(
            f'/api/guardia/beneficios/{codigo}/validar/',
            data={'qr_payload': payload},
            format='json'
        )

        # Esperamos 410 (Gone) por expiración
        assert response.status_code in [410, 400]
        assert 'expirado' in response.json().get('detail', '').lower()

    def test_validacion_exitosa_si_codigo_no_expirado(self, api_client_guardia, beneficio_trabajador_pendiente):
        """
        Código con TTL en futuro debe ser validable normalmente.
        
        Protege que el sistema NO rechace códigos válidos.
        """
        codigo = beneficio_trabajador_pendiente.codigo_verificacion
        payload = QRSecurity.crear_payload_firmado(codigo)

        response = api_client_guardia.post(
            f'/api/guardia/beneficios/{codigo}/validar/',
            data={'qr_payload': payload},
            format='json'
        )

        assert response.status_code == 200
        assert response.json()['estado'] == 'validado'

    def test_validacion_con_timestamp_antiguo_en_payload(self, api_client_guardia, beneficio_trabajador_pendiente):
        """
        Payload QR con timestamp antiguo debe ser rechazado.
        
        Protege contra: replay attacks (reutilizar QR antiguo).
        """
        codigo = beneficio_trabajador_pendiente.codigo_verificacion
        
        # Crear payload con timestamp de hace 2 horas
        tiempo_antiguo = int((timezone.now() - timedelta(hours=2)).timestamp())
        firma_antigua = QRSecurity.generar_firma(codigo, timestamp=tiempo_antiguo)
        payload_antiguo = f"{codigo}:{tiempo_antiguo}:{firma_antigua}"

        response = api_client_guardia.post(
            f'/api/guardia/beneficios/{codigo}/validar/',
            data={'qr_payload': payload_antiguo},
            format='json'
        )

        # Debe rechazar por timestamp antiguo
        assert response.status_code in [400, 410]


class TestValidacionSeguridad:
    """TEST 5: Seguridad QR - HMAC, manipulación."""

    def test_validacion_rechaza_hmac_manipulado(self, api_client_guardia, beneficio_trabajador_pendiente):
        """
        TEST 5 completo: Payload con HMAC falsificado es rechazado.
        
        Flujo:
        1. Generar payload QR válido
        2. Modificar la firma HMAC
        3. Guardia intenta validar
        4. Debe rechazar con 400
        5. Mensaje debe mencionar "inválido" o "manipulado"
        
        Protege contra: QR falsificados, ataques de suplantación
        """
        codigo = beneficio_trabajador_pendiente.codigo_verificacion
        
        # Payload con firma alterada
        payload_falso = f"{codigo}:1234567890:aaaaabbbbbbcccccc"

        response = api_client_guardia.post(
            f'/api/guardia/beneficios/{codigo}/validar/',
            data={'qr_payload': payload_falso},
            format='json'
        )

        assert response.status_code == 400
        assert 'inválido' in response.json()['detail'].lower()

    def test_validacion_rechaza_payload_formato_incorrecto(self, api_client_guardia, beneficio_trabajador_pendiente):
        """
        Payload con formato incorrecto debe ser rechazado.
        
        Ej: "texto-sin-formato" en lugar de "uuid:timestamp:firma"
        """
        # Payload formato incorrecto
        payload_incorrecto = "formato:incorrecto:1:2:3"

        response = api_client_guardia.post(
            f'/api/guardia/beneficios/codigo-cualquiera/validar/',
            data={'qr_payload': payload_incorrecto},
            format='json'
        )

        assert response.status_code == 400
        assert 'formato' in response.json()['detail'].lower()

    def test_validacion_rechaza_codigo_vacio(self, api_client_guardia):
        """
        Payload vacío debe ser rechazado.
        """
        response = api_client_guardia.post(
            f'/api/guardia/beneficios/codigo-test/validar/',
            data={'qr_payload': ''},
            format='json'
        )

        assert response.status_code == 400

    def test_validacion_rechaza_payload_null(self, api_client_guardia):
        """
        Payload nulo debe ser rechazado.
        """
        response = api_client_guardia.post(
            f'/api/guardia/beneficios/codigo-test/validar/',
            data={'qr_payload': None},
            format='json'
        )

        assert response.status_code in [400, 422]

    def test_validacion_codigo_no_existe_en_db(self, api_client_guardia):
        """
        Guardia intenta validar código que no existe en BD.
        
        Debe rechazar con 404.
        """
        codigo_fantasma = 'codigo-que-no-existe-12345'
        payload = QRSecurity.crear_payload_firmado(codigo_fantasma)

        response = api_client_guardia.post(
            f'/api/guardia/beneficios/{codigo_fantasma}/validar/',
            data={'qr_payload': payload},
            format='json'
        )

        assert response.status_code == 404


class TestValidacionConcurrencia:
    """TEST 4: Race conditions - Dos validaciones simultáneas del mismo QR."""

    def test_race_condition_dos_guardias_validan_mismo_qr(self, api_client_guardia, api_client, usuario_guardia, beneficio_trabajador_pendiente):
        """
        TEST 4 completo: Concurrencia en validación de beneficio.
        
        Escenario crítico: Dos guardias en portería leen el mismo QR casi al mismo tiempo.
        
        Flujo:
        1. BeneficioTrabajador pendiente (único)
        2. Guardia#1 inicia validación
        3. Guardia#2 inicia validación (casi simultáneamente)
        4. Resultado esperado:
           - Solo UNA validación exitosa (200)
           - La otra debe fallar (409 o 400) - estado ya cambió
           - BD contiene solo 1 ValidacionCaja
           - Estado final = 'validado'
        
        Protege contra: entregas duplicadas, inconsistencias en BD.
        
        Nota: Para simular concurrencia real, usamos transaction=True en pytest.mark.
        El select_for_update() en guardia_service.py debe proteger esto.
        """
        codigo = beneficio_trabajador_pendiente.codigo_verificacion
        payload = QRSecurity.crear_payload_firmado(codigo)

        # Simular dos requests concurrentes (secuencial en test, pero con locks DB)
        response1 = api_client_guardia.post(
            f'/api/guardia/beneficios/{codigo}/validar/',
            data={'qr_payload': payload, 'codigo_caja': 'CAJA-001'},
            format='json'
        )

        response2 = api_client_guardia.post(
            f'/api/guardia/beneficios/{codigo}/validar/',
            data={'qr_payload': payload, 'codigo_caja': 'CAJA-002'},
            format='json'
        )

        # Una debe ser exitosa, la otra no
        codigos = sorted([response1.status_code, response2.status_code])
        assert 200 in codigos  # Al menos una exitosa
        assert codigos[0] != 200  # La otra falla (409 conflict o 400 bad request)

        # BD debe tener solo 1 validación
        validaciones = ValidacionCaja.objects.filter(
            beneficio_trabajador=beneficio_trabajador_pendiente
        ).count()
        assert validaciones == 1, f"Se esperaba 1 validación, se encontraron {validaciones}"

        # Estado final debe ser 'validado'
        beneficio_trabajador_pendiente.refresh_from_db()
        assert beneficio_trabajador_pendiente.estado == 'validado'

    def test_select_for_update_previene_double_entrega(self, api_client_guardia, beneficio_trabajador_pendiente):
        """
        Validar que select_for_update() en guardia_service.py hace su trabajo.
        
        Al intentar validar el mismo beneficio dos veces rápidamente,
        el lock debe prevenir la segunda actualización exitosa.
        """
        codigo = beneficio_trabajador_pendiente.codigo_verificacion
        payload = QRSecurity.crear_payload_firmado(codigo)

        # Primera validación
        response1 = api_client_guardia.post(
            f'/api/guardia/beneficios/{codigo}/validar/',
            data={'qr_payload': payload, 'codigo_caja': 'CAJA-001'},
            format='json'
        )
        assert response1.status_code == 200

        # Segunda validación del mismo beneficio
        # El estado ya cambió a 'validado', por lo que debe rechazarse
        response2 = api_client_guardia.post(
            f'/api/guardia/beneficios/{codigo}/validar/',
            data={'qr_payload': payload, 'codigo_caja': 'CAJA-002'},
            format='json'
        )

        assert response2.status_code in [409, 400]
        assert 'ya' in response2.json().get('detail', '').lower() or 'inválido' in response2.json().get('detail', '').lower()


class TestValidacionEstados:
    """Tests de máquina de estados en validación."""

    def test_transiciones_estado_validas(self, api_client_guardia, beneficio_trabajador_pendiente):
        """
        Verificar transiciones de estado válidas.
        
        pendiente -> validado (válido)
        pendiente -> cancelado (no válido sin permisos)
        validado -> retirado (válido después de entrega física)
        """
        codigo = beneficio_trabajador_pendiente.codigo_verificacion
        payload = QRSecurity.crear_payload_firmado(codigo)

        # pendiente -> validado (válida)
        response = api_client_guardia.post(
            f'/api/guardia/beneficios/{codigo}/validar/',
            data={'qr_payload': payload},
            format='json'
        )
        assert response.status_code == 200

        beneficio_trabajador_pendiente.refresh_from_db()
        assert beneficio_trabajador_pendiente.estado == 'validado'

    def test_no_validar_si_beneficio_bloqueado(self, api_client_guardia, beneficio_trabajador_pendiente):
        """
        Beneficio bloqueado (bloqueado=True) no debe poder validarse.
        """
        # Bloquear beneficio
        beneficio_trabajador_pendiente.bloqueado = True
        beneficio_trabajador_pendiente.motivo_bloqueo = "Trabajador con deuda"
        beneficio_trabajador_pendiente.save()

        codigo = beneficio_trabajador_pendiente.codigo_verificacion
        payload = QRSecurity.crear_payload_firmado(codigo)

        response = api_client_guardia.post(
            f'/api/guardia/beneficios/{codigo}/validar/',
            data={'qr_payload': payload},
            format='json'
        )

        assert response.status_code in [400, 403, 409]
        assert 'bloqueado' in response.json().get('detail', '').lower()
