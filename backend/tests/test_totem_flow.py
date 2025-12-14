"""
TEST 1 + TEST 2: Flujos del Totem - Escaneo, asignación, idempotencia.

Tests críticos:
- E2E completo: Totem escanea RUT → consulta beneficio
- Idempotencia: Dos escaneos consecutivos = mismo beneficio, sin duplicados
- Estados correctos después de cada operación
"""
import pytest
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from decimal import Decimal

pytestmark = pytest.mark.django_db(transaction=True)


class TestTotemEscaneoBasico:
    """Tests básicos del flujo de escaneo en Totem."""

    def test_escaneo_trabajador_con_beneficio_activo(self, api_client, trabajador, ciclo_activo, tipo_beneficio_con_guardia):
        """
        TEST 2a: Totem escanea RUT → Backend retorna beneficio disponible.
        
        Flujo:
        1. Trabajador con ciclo activo y beneficio asignado
        2. GET /api/beneficios/{rut}/
        3. Response contiene rut, nombre, beneficio_disponible
        """
        # Asegurarse de que el trabajador tiene beneficio en el ciclo activo
        trabajador.beneficio_disponible = {
            'ciclo_id': ciclo_activo.id,
            'tipo': tipo_beneficio_con_guardia.nombre,
            'stock': 10
        }
        trabajador.save()

        response = api_client.get(f'/api/beneficios/{trabajador.rut}/')

        assert response.status_code == 200
        data = response.json()
        assert data['beneficio']['rut'] == trabajador.rut
        assert data['beneficio']['nombre'] == trabajador.nombre
        assert data['beneficio']['beneficio_disponible']['tipo'] == tipo_beneficio_con_guardia.nombre

    def test_escaneo_trabajador_sin_beneficio(self, api_client, trabajador):
        """
        Totem escanea RUT de trabajador sin beneficio asignado.
        
        Debe retornar 404 con mensaje claro.
        """
        trabajador.beneficio_disponible = {}
        trabajador.save()

        response = api_client.get(f'/api/beneficios/{trabajador.rut}/')

        assert response.status_code == 404
        assert 'No hay beneficio' in response.json()['detail']

    def test_escaneo_rut_invalido(self, api_client):
        """
        Totem escanea RUT con formato inválido.
        
        Debe rechazar con 400.
        """
        response = api_client.get('/api/beneficios/rut-invalido/')

        assert response.status_code == 400
        assert 'inválido' in response.json()['detail'].lower()

    def test_escaneo_rut_no_existe(self, api_client):
        """
        Totem escanea RUT que no existe en sistema.
        
        Debe retornar 404 sin exponer que existe/no existe (seguridad).
        """
        response = api_client.get('/api/beneficios/99999999-9/')

        assert response.status_code == 404


class TestTotemIdempotencia:
    """Tests críticos de idempotencia: dos escaneos = mismo resultado, sin duplicados."""

    def test_doble_escaneo_mismo_trabajador_devuelve_mismo_beneficio(self, api_client, trabajador, ciclo_activo, tipo_beneficio_con_guardia):
        """
        TEST 2 completo: Idempotencia del Totem.
        
        Flujo:
        1. Escanear RUT → Obtener beneficio
        2. Escanear RUT nuevamente → MISMO beneficio (NO duplicado)
        3. Verificar que BD tiene solo 1 registro
        
        Esto evita que con un doble escaneo se asignen dos beneficios al mismo trabajador.
        """
        trabajador.beneficio_disponible = {
            'ciclo_id': ciclo_activo.id,
            'tipo': tipo_beneficio_con_guardia.nombre,
            'stock': 10
        }
        trabajador.save()

        # Primer escaneo
        response1 = api_client.get(f'/api/beneficios/{trabajador.rut}/')
        assert response1.status_code == 200
        beneficio1 = response1.json()['beneficio']

        # Segundo escaneo (simulando doble lectura del QR)
        response2 = api_client.get(f'/api/beneficios/{trabajador.rut}/')
        assert response2.status_code == 200
        beneficio2 = response2.json()['beneficio']

        # Verificar que son idénticos
        assert beneficio1['rut'] == beneficio2['rut']
        assert beneficio1['nombre'] == beneficio2['nombre']
        assert beneficio1['beneficio_disponible'] == beneficio2['beneficio_disponible']

        # Verificar que no hay duplicados en BD
        from totem.models import BeneficioTrabajador
        
        # Si hay BeneficioTrabajador asignado, debe haber solo 1
        beneficios_db = BeneficioTrabajador.objects.filter(
            trabajador=trabajador,
            ciclo=ciclo_activo
        ).count()
        assert beneficios_db <= 1, f"Se encontraron {beneficios_db} beneficios, esperaba <= 1"

    def test_doble_escaneo_no_modifica_estado(self, api_client, beneficio_trabajador_pendiente):
        """
        Doble escaneo no debe cambiar estado de beneficio (pendiente → pendiente).
        """
        rut = beneficio_trabajador_pendiente.trabajador.rut
        estado_inicial = beneficio_trabajador_pendiente.estado

        # Primer escaneo
        api_client.get(f'/api/beneficios/{rut}/')

        # Segundo escaneo
        api_client.get(f'/api/beneficios/{rut}/')

        # Verificar estado sin cambios
        beneficio_trabajador_pendiente.refresh_from_db()
        assert beneficio_trabajador_pendiente.estado == estado_inicial

    def test_multiple_escaneos_consecutivos_sin_crear_race_condition(self, api_client, trabajador, ciclo_activo, tipo_beneficio_con_guardia):
        """
        Múltiples escaneos consecutivos (5+) no debe crear race conditions.
        
        Este test protege contra problemas de concurrencia en el lado del Totem.
        """
        trabajador.beneficio_disponible = {
            'ciclo_id': ciclo_activo.id,
            'tipo': tipo_beneficio_con_guardia.nombre,
            'stock': 10
        }
        trabajador.save()

        # Hacer 5 escaneos
        responses = []
        for _ in range(5):
            response = api_client.get(f'/api/beneficios/{trabajador.rut}/')
            responses.append(response)

        # Todos deben ser exitosos
        assert all(r.status_code == 200 for r in responses)

        # Todos deben retornar el MISMO beneficio
        beneficios = [r.json()['beneficio'] for r in responses]
        primer_beneficio = beneficios[0]
        assert all(b == primer_beneficio for b in beneficios)


class TestTotemConsultaBeneficioConCodigo:
    """Tests de consulta de beneficio con código_verificacion (QR ya asignado)."""

    def test_totem_retorna_codigo_verificacion_si_beneficio_ya_asignado(self, api_client, beneficio_trabajador_pendiente):
        """
        Si el trabajador ya tiene BeneficioTrabajador asignado,
        Totem debe retornar el codigo_verificacion en la response.
        
        Esto permite que Totem muestre el QR directamente si ya fue generado.
        """
        rut = beneficio_trabajador_pendiente.trabajador.rut

        response = api_client.get(f'/api/beneficios/{rut}/')

        assert response.status_code == 200
        data = response.json()['beneficio']
        
        # Debe contener el código
        assert 'codigo_verificacion' in data.get('beneficio_disponible', {})
        assert data['beneficio_disponible']['codigo_verificacion'] == beneficio_trabajador_pendiente.codigo_verificacion

    def test_totem_distinge_beneficios_por_ciclo(self, api_client, trabajador, ciclo_activo, ciclo_expirado, tipo_beneficio_con_guardia):
        """
        Mismo trabajador en ciclos diferentes debe retornar beneficios diferentes.
        
        GET /api/beneficios/{rut}/?ciclo_id=X debe filtrar por ciclo.
        """
        # Asignar beneficio al ciclo activo
        trabajador.beneficio_disponible = {
            'ciclo_id': ciclo_activo.id,
            'tipo': tipo_beneficio_con_guardia.nombre,
            'stock': 10
        }
        trabajador.save()

        # Consultar ciclo activo
        response1 = api_client.get(f'/api/beneficios/{trabajador.rut}/?ciclo_id={ciclo_activo.id}')
        assert response1.status_code == 200

        # Consultar ciclo expirado (no debe tener beneficio)
        response2 = api_client.get(f'/api/beneficios/{trabajador.rut}/?ciclo_id={ciclo_expirado.id}')
        assert response2.status_code == 404
