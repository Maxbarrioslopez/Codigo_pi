"""
Tests exhaustivos del backend del sistema Tótem.
Cubre: concurrencia, seguridad QR, validaciones, permisos, TTL, y lógica de negocio.
"""
import pytest
import uuid
from datetime import datetime, timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.test import APIClient
from totem.models import (
    Trabajador, Ticket, TicketEvent, Ciclo, Agendamiento, 
    Incidencia, CajaFisica, StockSucursal, Sucursal, ParametroOperativo
)
from totem.services.ticket_service import TicketService
from totem.services.agendamiento_service import AgendamientoService
from totem.security import QRSecurity
from totem.validators import AgendamientoValidator, TicketValidator, RUTValidator
from totem.exceptions import (
    TicketExpiredException, QRInvalidException, CupoExcedidoException,
    TicketInvalidStateException
)
import threading
import time

User = get_user_model()


@pytest.fixture
def api_client():
    """Cliente API para tests."""
    return APIClient()


@pytest.fixture
def setup_database(db):
    """Setup inicial de la base de datos para tests."""
    # Crear sucursal
    sucursal = Sucursal.objects.create(
        codigo='CENTRAL',
        nombre='Central',
        direccion='Av. Principal 123'
    )
    
    # Crear stock
    StockSucursal.objects.create(
        sucursal='Central',
        tipo_caja='premium',
        cantidad=50
    )
    
    # Crear ciclo activo
    ciclo = Ciclo.objects.create(
        nombre='Ciclo Test 2025',
        fecha_inicio=timezone.now().date(),
        fecha_fin=(timezone.now() + timedelta(days=60)).date(),
        activo=True
    )
    
    # Crear parámetros operativos
    ParametroOperativo.objects.create(clave='qr_ttl_min', valor='30')
    ParametroOperativo.objects.create(clave='max_agendamientos_dia', valor='50')
    ParametroOperativo.objects.create(clave='stock_umbral_bajo', valor='10')
    
    # Crear trabajador de prueba
    trabajador = Trabajador.objects.create(
        rut='12345678-5',
        nombre='Juan Pérez',
        email='juan@example.com',
        beneficio_disponible={'tipo': 'premium', 'monto': 50000}
    )
    
    # Crear cajas físicas
    for i in range(1, 6):
        CajaFisica.objects.create(
            codigo=f'CAJA{i:03d}',
            tipo='premium',
            usado=False
        )
    
    # Crear usuarios con roles
    admin_user = User.objects.create_user(
        username='admin',
        password='admin123',
        rol='admin'
    )
    
    guardia_user = User.objects.create_user(
        username='guardia',
        password='guardia123',
        rol='guardia'
    )
    
    rrhh_user = User.objects.create_user(
        username='rrhh',
        password='rrhh123',
        rol='rrhh'
    )
    
    return {
        'sucursal': sucursal,
        'ciclo': ciclo,
        'trabajador': trabajador,
        'admin': admin_user,
        'guardia': guardia_user,
        'rrhh': rrhh_user
    }


# ============================================================================
# TESTS DE CONCURRENCIA
# ============================================================================

@pytest.mark.django_db(transaction=True)
class TestConcurrencia:
    """Tests de race conditions y concurrencia."""
    
    def test_validacion_concurrente_mismo_ticket(self, setup_database):
        """
        Test: Dos guardias intentan validar el mismo ticket simultáneamente.
        Esperado: Solo uno debe tener éxito, el otro debe fallar.
        """
        # Crear ticket
        service = TicketService()
        ticket = service.crear_ticket(
            trabajador_rut='12345678-5',
            sucursal_nombre='Central'
        )
        
        qr_security = QRSecurity()
        payload = qr_security.crear_payload_firmado(ticket.uuid)
        
        resultados = []
        errores = []
        
        def validar_ticket():
            try:
                from guardia.services.guardia_service import GuardiaService
                guard_service = GuardiaService()
                result = guard_service.validar_y_entregar_ticket(
                    qr_payload=payload,
                    caja_codigo='CAJA001',
                    guardia_username='guardia1'
                )
                resultados.append(result)
            except Exception as e:
                errores.append(str(e))
        
        # Ejecutar 2 threads simultáneamente
        thread1 = threading.Thread(target=validar_ticket)
        thread2 = threading.Thread(target=validar_ticket)
        
        thread1.start()
        thread2.start()
        
        thread1.join()
        thread2.join()
        
        # Verificar que solo uno tuvo éxito
        assert len(resultados) == 1, "Solo un thread debe tener éxito"
        assert len(errores) == 1, "El otro thread debe fallar"
        assert resultados[0].estado == 'entregado'
    
    def test_stock_decremento_concurrente(self, setup_database):
        """
        Test: Múltiples usuarios crean tickets simultáneamente.
        Esperado: Stock debe decrementar correctamente sin race conditions.
        """
        stock_inicial = StockSucursal.objects.get(sucursal='Central', tipo_caja='premium')
        cantidad_inicial = stock_inicial.cantidad
        
        # Crear múltiples trabajadores
        for i in range(5):
            Trabajador.objects.create(
                rut=f'1111111{i}-{i}',
                nombre=f'Trabajador {i}',
                beneficio_disponible={'tipo': 'premium'}
            )
        
        resultados = []
        
        def crear_ticket(rut):
            try:
                service = TicketService()
                ticket = service.crear_ticket(
                    trabajador_rut=rut,
                    sucursal_nombre='Central'
                )
                resultados.append(ticket.uuid)
            except Exception as e:
                pass
        
        # Ejecutar 5 threads
        threads = []
        for i in range(5):
            t = threading.Thread(target=crear_ticket, args=(f'1111111{i}-{i}',))
            threads.append(t)
            t.start()
        
        for t in threads:
            t.join()
        
        # Verificar stock
        stock_final = StockSucursal.objects.get(sucursal='Central', tipo_caja='premium')
        tickets_creados = len(resultados)
        assert stock_final.cantidad == cantidad_inicial - tickets_creados


# ============================================================================
# TESTS DE SEGURIDAD QR
# ============================================================================

@pytest.mark.django_db
class TestSeguridadQR:
    """Tests de seguridad de códigos QR."""
    
    def test_qr_falsificado_rechazado(self, setup_database):
        """
        Test: QR con firma inválida debe ser rechazado.
        """
        from guardia.services.guardia_service import GuardiaService
        
        # QR falso (sin firma válida)
        fake_payload = f"{uuid.uuid4()}:FAKE_SIGNATURE"
        
        service = GuardiaService()
        with pytest.raises(QRInvalidException):
            service.validar_y_entregar_ticket(
                qr_payload=fake_payload,
                caja_codigo='CAJA001'
            )
    
    def test_qr_uuid_no_existe(self, setup_database):
        """
        Test: QR con UUID que no existe debe ser rechazado.
        """
        from guardia.services.guardia_service import GuardiaService
        from totem.exceptions import TicketNotFoundException
        
        # UUID válido pero ticket no existe
        fake_uuid = str(uuid.uuid4())
        qr_security = QRSecurity()
        valid_payload = qr_security.crear_payload_firmado(fake_uuid)
        
        service = GuardiaService()
        with pytest.raises(TicketNotFoundException):
            service.validar_y_entregar_ticket(
                qr_payload=valid_payload,
                caja_codigo='CAJA001'
            )
    
    def test_qr_modificado_rechazado(self, setup_database):
        """
        Test: QR con UUID modificado debe fallar validación.
        """
        from guardia.services.guardia_service import GuardiaService
        
        # Crear ticket válido
        service = TicketService()
        ticket = service.crear_ticket(
            trabajador_rut='12345678-5',
            sucursal_nombre='Central'
        )
        
        qr_security = QRSecurity()
        valid_payload = qr_security.crear_payload_firmado(ticket.uuid)
        
        # Modificar UUID manteniendo firma
        parts = valid_payload.split(':')
        modified_payload = f"{uuid.uuid4()}:{parts[1]}"
        
        guard_service = GuardiaService()
        with pytest.raises(QRInvalidException):
            guard_service.validar_y_entregar_ticket(
                qr_payload=modified_payload,
                caja_codigo='CAJA001'
            )


# ============================================================================
# TESTS DE TTL (Time To Live)
# ============================================================================

@pytest.mark.django_db
class TestTTL:
    """Tests de expiración de tickets."""
    
    def test_ticket_expirado_rechazado(self, setup_database):
        """
        Test: Ticket expirado debe ser rechazado en validación.
        """
        from guardia.services.guardia_service import GuardiaService
        
        # Crear ticket
        service = TicketService()
        ticket = service.crear_ticket(
            trabajador_rut='12345678-5',
            sucursal_nombre='Central'
        )
        
        # Forzar expiración
        ticket.ttl_expira_at = timezone.now() - timedelta(minutes=1)
        ticket.save()
        
        qr_security = QRSecurity()
        payload = qr_security.crear_payload_firmado(ticket.uuid)
        
        guard_service = GuardiaService()
        with pytest.raises(TicketExpiredException):
            guard_service.validar_y_entregar_ticket(
                qr_payload=payload,
                caja_codigo='CAJA001'
            )
        
        # Verificar que se marcó como expirado
        ticket.refresh_from_db()
        assert ticket.estado == 'expirado'
    
    def test_ticket_casi_expirado_valido(self, setup_database):
        """
        Test: Ticket con 1 minuto restante debe ser válido.
        """
        from guardia.services.guardia_service import GuardiaService
        
        # Crear ticket
        service = TicketService()
        ticket = service.crear_ticket(
            trabajador_rut='12345678-5',
            sucursal_nombre='Central'
        )
        
        # Establecer expiración en 1 minuto
        ticket.ttl_expira_at = timezone.now() + timedelta(minutes=1)
        ticket.save()
        
        qr_security = QRSecurity()
        payload = qr_security.crear_payload_firmado(ticket.uuid)
        
        guard_service = GuardiaService()
        validated_ticket = guard_service.validar_y_entregar_ticket(
            qr_payload=payload,
            caja_codigo='CAJA001'
        )
        
        assert validated_ticket.estado == 'entregado'
    
    def test_reimpresion_renueva_ttl(self, setup_database):
        """
        Test: Reimprimir ticket debe renovar el TTL.
        """
        # Crear ticket
        service = TicketService()
        ticket = service.crear_ticket(
            trabajador_rut='12345678-5',
            sucursal_nombre='Central'
        )
        
        ttl_original = ticket.ttl_expira_at
        
        # Esperar 1 segundo
        time.sleep(1)
        
        # Reimprimir
        ticket_reimpreso = service.reimprimir_ticket(ticket.uuid)
        
        # Verificar que TTL cambió
        assert ticket_reimpreso.ttl_expira_at > ttl_original


# ============================================================================
# TESTS DE VALIDACIONES DE AGENDAMIENTO
# ============================================================================

@pytest.mark.django_db
class TestValidacionesAgendamiento:
    """Tests de validaciones de agendamiento."""
    
    def test_agendamiento_fin_de_semana_rechazado(self, setup_database):
        """
        Test: No se puede agendar para sábado o domingo.
        """
        service = AgendamientoService()
        
        # Buscar próximo sábado
        hoy = timezone.now().date()
        dias_hasta_sabado = (5 - hoy.weekday()) % 7
        if dias_hasta_sabado == 0:
            dias_hasta_sabado = 7
        proximo_sabado = hoy + timedelta(days=dias_hasta_sabado)
        
        with pytest.raises(AgendamientoInvalidException, match='fin de semana'):
            service.crear_agendamiento(
                trabajador_rut='12345678-5',
                fecha_retiro=proximo_sabado.isoformat()
            )
    
    def test_agendamiento_fecha_pasada_rechazado(self, setup_database):
        """
        Test: No se puede agendar para fecha pasada.
        """
        service = AgendamientoService()
        
        ayer = (timezone.now() - timedelta(days=1)).date()
        
        with pytest.raises(AgendamientoInvalidException, match='pasado'):
            service.crear_agendamiento(
                trabajador_rut='12345678-5',
                fecha_retiro=ayer.isoformat()
            )
    
    def test_agendamiento_mas_30_dias_rechazado(self, setup_database):
        """
        Test: No se puede agendar para más de 30 días.
        """
        service = AgendamientoService()
        
        fecha_lejana = (timezone.now() + timedelta(days=35)).date()
        
        with pytest.raises(AgendamientoInvalidException, match='30 días'):
            service.crear_agendamiento(
                trabajador_rut='12345678-5',
                fecha_retiro=fecha_lejana.isoformat()
            )
    
    def test_agendamiento_duplicado_rechazado(self, setup_database):
        """
        Test: No se puede agendar dos veces para la misma fecha.
        """
        service = AgendamientoService()
        
        # Buscar próximo día hábil
        fecha = timezone.now().date() + timedelta(days=1)
        while fecha.weekday() >= 5:  # Saltar fines de semana
            fecha += timedelta(days=1)
        
        # Primer agendamiento
        service.crear_agendamiento(
            trabajador_rut='12345678-5',
            fecha_retiro=fecha.isoformat()
        )
        
        # Segundo agendamiento (debe fallar)
        with pytest.raises(AgendamientoInvalidException, match='duplicado'):
            service.crear_agendamiento(
                trabajador_rut='12345678-5',
                fecha_retiro=fecha.isoformat()
            )
    
    def test_cupo_maximo_por_dia(self, setup_database):
        """
        Test: No se puede exceder cupo máximo de agendamientos por día.
        """
        # Modificar parámetro a 2 para test rápido
        param = ParametroOperativo.objects.get(clave='max_agendamientos_dia')
        param.valor = '2'
        param.save()
        
        service = AgendamientoService()
        
        # Crear más trabajadores
        for i in range(3):
            Trabajador.objects.create(
                rut=f'2222222{i}-{i}',
                nombre=f'Worker {i}',
                beneficio_disponible={'tipo': 'premium'}
            )
        
        # Buscar próximo día hábil
        fecha = timezone.now().date() + timedelta(days=1)
        while fecha.weekday() >= 5:
            fecha += timedelta(days=1)
        
        # Crear 2 agendamientos (OK)
        service.crear_agendamiento('22222220-0', fecha.isoformat())
        service.crear_agendamiento('22222221-1', fecha.isoformat())
        
        # Tercer agendamiento debe fallar
        with pytest.raises(CupoExcedidoException):
            service.crear_agendamiento('22222222-2', fecha.isoformat())


# ============================================================================
# TESTS DE PERMISOS
# ============================================================================

@pytest.mark.django_db
class TestPermisos:
    """Tests de control de acceso por roles."""
    
    def test_guardia_puede_validar_ticket(self, api_client, setup_database):
        """
        Test: Usuario con rol guardia puede validar tickets.
        """
        # Login como guardia
        api_client.login(username='guardia', password='guardia123')
        
        # Crear ticket
        service = TicketService()
        ticket = service.crear_ticket(
            trabajador_rut='12345678-5',
            sucursal_nombre='Central'
        )
        
        qr_security = QRSecurity()
        payload = qr_security.crear_payload_firmado(ticket.uuid)
        
        # Intentar validar
        response = api_client.post(
            f'/api/guardia/tickets/{ticket.uuid}/validar/',
            {'qr_payload': payload, 'codigo_caja': 'CAJA001'},
            format='json'
        )
        
        assert response.status_code in [200, 201]
    
    def test_rrhh_no_puede_validar_ticket(self, api_client, setup_database):
        """
        Test: Usuario con rol RRHH NO puede validar tickets.
        """
        # Login como RRHH
        api_client.login(username='rrhh', password='rrhh123')
        
        # Crear ticket
        service = TicketService()
        ticket = service.crear_ticket(
            trabajador_rut='12345678-5',
            sucursal_nombre='Central'
        )
        
        qr_security = QRSecurity()
        payload = qr_security.crear_payload_firmado(ticket.uuid)
        
        # Intentar validar (debe fallar)
        response = api_client.post(
            f'/api/guardia/tickets/{ticket.uuid}/validar/',
            {'qr_payload': payload, 'codigo_caja': 'CAJA001'},
            format='json'
        )
        
        assert response.status_code == 403
    
    def test_rrhh_puede_ver_reportes(self, api_client, setup_database):
        """
        Test: Usuario con rol RRHH puede acceder a reportes.
        """
        # Login como RRHH
        api_client.login(username='rrhh', password='rrhh123')
        
        # Acceder a reporte
        response = api_client.get('/api/rrhh/reportes/retiros-por-dia/?dias=7')
        
        assert response.status_code == 200
    
    def test_guardia_no_puede_ver_reportes(self, api_client, setup_database):
        """
        Test: Usuario guardia NO puede acceder a reportes RRHH.
        """
        # Login como guardia
        api_client.login(username='guardia', password='guardia123')
        
        # Intentar acceder a reporte (debe fallar)
        response = api_client.get('/api/rrhh/reportes/retiros-por-dia/?dias=7')
        
        assert response.status_code == 403


# ============================================================================
# TESTS DE VALIDACIÓN RUT
# ============================================================================

@pytest.mark.django_db
class TestValidacionRUT:
    """Tests de validación de RUT chileno."""
    
    def test_rut_valido_aceptado(self):
        """Test: RUT válido debe ser aceptado."""
        es_valido, error = RUTValidator.validar_formato('12345678-5')
        assert es_valido
    
    def test_rut_invalido_rechazado(self):
        """Test: RUT con dígito verificador incorrecto debe ser rechazado."""
        es_valido, error = RUTValidator.validar_formato('12345678-9')
        assert not es_valido
    
    def test_rut_formato_incorrecto(self):
        """Test: RUT con formato incorrecto debe ser rechazado."""
        es_valido, error = RUTValidator.validar_formato('123456')
        assert not es_valido
    
    def test_rut_limpieza(self):
        """Test: RUT debe ser limpiado correctamente."""
        rut_limpio = RUTValidator.limpiar_rut('12.345.678-5')
        assert rut_limpio == '12345678-5'


# ============================================================================
# TESTS DE LÓGICA DE NEGOCIO
# ============================================================================

@pytest.mark.django_db
class TestLogicaNegocio:
    """Tests de reglas de negocio."""
    
    def test_trabajador_sin_beneficio_rechazado(self, setup_database):
        """
        Test: Trabajador sin beneficio disponible no puede crear ticket.
        """
        from totem.exceptions import NoBeneficioException
        
        # Crear trabajador sin beneficio
        trabajador = Trabajador.objects.create(
            rut='87654321-0',
            nombre='Sin Beneficio',
            beneficio_disponible=None
        )
        
        service = TicketService()
        with pytest.raises(NoBeneficioException):
            service.crear_ticket(
                trabajador_rut='87654321-0',
                sucursal_nombre='Central'
            )
    
    def test_ticket_ya_entregado_no_se_valida(self, setup_database):
        """
        Test: Ticket ya entregado no puede validarse nuevamente.
        """
        from guardia.services.guardia_service import GuardiaService
        
        # Crear y validar ticket
        service = TicketService()
        ticket = service.crear_ticket(
            trabajador_rut='12345678-5',
            sucursal_nombre='Central'
        )
        
        qr_security = QRSecurity()
        payload = qr_security.crear_payload_firmado(ticket.uuid)
        
        guard_service = GuardiaService()
        guard_service.validar_y_entregar_ticket(
            qr_payload=payload,
            caja_codigo='CAJA001'
        )
        
        # Intentar validar nuevamente (debe fallar)
        with pytest.raises(TicketInvalidStateException):
            guard_service.validar_y_entregar_ticket(
                qr_payload=payload,
                caja_codigo='CAJA002'
            )
    
    def test_un_ticket_por_ciclo(self, setup_database):
        """
        Test: Trabajador solo puede tener un ticket por ciclo.
        """
        service = TicketService()
        
        # Primer ticket
        ticket1 = service.crear_ticket(
            trabajador_rut='12345678-5',
            sucursal_nombre='Central'
        )
        
        # Segundo ticket (debe fallar)
        with pytest.raises(TicketInvalidStateException):
            service.crear_ticket(
                trabajador_rut='12345678-5',
                sucursal_nombre='Central'
            )
    
    def test_caja_usada_no_se_asigna(self, setup_database):
        """
        Test: Caja ya usada no puede asignarse a otro ticket.
        """
        from guardia.services.guardia_service import GuardiaService
        
        # Marcar caja como usada
        caja = CajaFisica.objects.get(codigo='CAJA001')
        caja.usado = True
        caja.save()
        
        # Crear ticket
        service = TicketService()
        ticket = service.crear_ticket(
            trabajador_rut='12345678-5',
            sucursal_nombre='Central'
        )
        
        qr_security = QRSecurity()
        payload = qr_security.crear_payload_firmado(ticket.uuid)
        
        guard_service = GuardiaService()
        with pytest.raises(Exception):  # Debe fallar al no encontrar caja disponible
            guard_service.validar_y_entregar_ticket(
                qr_payload=payload,
                caja_codigo='CAJA001'
            )


# ============================================================================
# TESTS DE EVENTOS
# ============================================================================

@pytest.mark.django_db
class TestEventos:
    """Tests de creación de eventos de auditoría."""
    
    def test_ticket_creado_genera_evento(self, setup_database):
        """
        Test: Crear ticket debe generar evento 'generado'.
        """
        service = TicketService()
        ticket = service.crear_ticket(
            trabajador_rut='12345678-5',
            sucursal_nombre='Central'
        )
        
        eventos = TicketEvent.objects.filter(ticket=ticket, tipo='generado')
        assert eventos.count() == 1
    
    def test_validacion_genera_multiples_eventos(self, setup_database):
        """
        Test: Validar ticket debe generar 3 eventos.
        """
        from guardia.services.guardia_service import GuardiaService
        
        # Crear ticket
        service = TicketService()
        ticket = service.crear_ticket(
            trabajador_rut='12345678-5',
            sucursal_nombre='Central'
        )
        
        qr_security = QRSecurity()
        payload = qr_security.crear_payload_firmado(ticket.uuid)
        
        # Validar
        guard_service = GuardiaService()
        guard_service.validar_y_entregar_ticket(
            qr_payload=payload,
            caja_codigo='CAJA001'
        )
        
        # Verificar eventos
        eventos = TicketEvent.objects.filter(ticket=ticket)
        tipos_eventos = set(eventos.values_list('tipo', flat=True))
        
        assert 'generado' in tipos_eventos
        assert 'validado_guardia' in tipos_eventos
        assert 'caja_verificada' in tipos_eventos
        assert 'entregado' in tipos_eventos


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
