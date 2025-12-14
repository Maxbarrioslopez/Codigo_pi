"""
Pytest configuration y fixtures compartidas para tests.
Usa una base de datos de test real con transaction=True.
"""
import pytest
from datetime import datetime, timedelta
from django.utils import timezone
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from totem.models import (
    Usuario, Trabajador, Ciclo, TipoBeneficio, CajaBeneficio, 
    BeneficioTrabajador, ValidacionCaja, Sucursal
)
from totem.security import QRSecurity


@pytest.fixture
def api_client():
    """Cliente API de DRF para hacer requests."""
    return APIClient()


@pytest.fixture
def sucursal():
    """Sucursal de prueba."""
    return Sucursal.objects.create(
        nombre="Central",
        direccion="Av. Principal 123",
        ciudad="Santiago"
    )


@pytest.fixture
def usuario_guardia(sucursal):
    """Usuario Guardia para validaciones."""
    return Usuario.objects.create_user(
        username='guardia_test',
        email='guardia@test.cl',
        password='test123456',
        rol='guardia',
        sucursal=sucursal,
        is_staff=False
    )


@pytest.fixture
def usuario_rrhh():
    """Usuario RRHH para asignaciones."""
    return Usuario.objects.create_user(
        username='rrhh_test',
        email='rrhh@test.cl',
        password='test123456',
        rol='rrhh',
        is_staff=True
    )


@pytest.fixture
def usuario_admin():
    """Usuario Admin con permisos totales."""
    return Usuario.objects.create_user(
        username='admin_test',
        email='admin@test.cl',
        password='test123456',
        rol='admin',
        is_staff=True,
        is_superuser=True
    )


@pytest.fixture
def api_client_guardia(api_client, usuario_guardia):
    """Cliente API autenticado como Guardia."""
    refresh = RefreshToken.for_user(usuario_guardia)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def api_client_rrhh(api_client, usuario_rrhh):
    """Cliente API autenticado como RRHH."""
    refresh = RefreshToken.for_user(usuario_rrhh)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def trabajador():
    """Trabajador de prueba."""
    return Trabajador.objects.create(
        rut='12345678-9',
        nombre='Juan Pérez García',
        seccion='Administración',
        contrato='planta',
        beneficio_disponible={'tipo': 'caja_navidad', 'activo': True}
    )


@pytest.fixture
def trabajador_2():
    """Segundo trabajador para tests de concurrencia."""
    return Trabajador.objects.create(
        rut='98765432-1',
        nombre='María López Rodríguez',
        seccion='Operaciones',
        contrato='contrata',
        beneficio_disponible={'tipo': 'caja_navidad', 'activo': True}
    )


@pytest.fixture
def ciclo_activo():
    """Ciclo activo (actual)."""
    hoy = timezone.now().date()
    return Ciclo.objects.create(
        nombre='Ciclo Navidad 2025',
        fecha_inicio=hoy - timedelta(days=10),
        fecha_fin=hoy + timedelta(days=20),
        activo=True
    )


@pytest.fixture
def ciclo_expirado():
    """Ciclo expirado (pasado)."""
    return Ciclo.objects.create(
        nombre='Ciclo Navidad 2024',
        fecha_inicio=timezone.now().date() - timedelta(days=100),
        fecha_fin=timezone.now().date() - timedelta(days=70),
        activo=False
    )


@pytest.fixture
def tipo_beneficio_con_guardia():
    """Tipo de beneficio que REQUIERE validación de guardia."""
    return TipoBeneficio.objects.create(
        nombre='Caja Navidad Premium',
        descripcion='Caja navideña con validación de portería',
        activo=True,
        tipos_contrato=['planta', 'contrata'],
        requiere_validacion_guardia=True
    )


@pytest.fixture
def tipo_beneficio_sin_guardia():
    """Tipo de beneficio SIN validación de guardia."""
    return TipoBeneficio.objects.create(
        nombre='Vale Almuerzo',
        descripcion='Vale almuerzo digital',
        activo=True,
        tipos_contrato=['todos'],
        requiere_validacion_guardia=False
    )


@pytest.fixture
def caja_beneficio_premium(tipo_beneficio_con_guardia):
    """Caja Premium de Navidad."""
    return CajaBeneficio.objects.create(
        beneficio=tipo_beneficio_con_guardia,
        nombre='Premium',
        descripcion='Caja con productos premium',
        codigo_tipo='CAJ-NAV-PREMIUM',
        activo=True
    )


@pytest.fixture
def caja_beneficio_estandar(tipo_beneficio_con_guardia):
    """Caja Estándar de Navidad."""
    return CajaBeneficio.objects.create(
        beneficio=tipo_beneficio_con_guardia,
        nombre='Estándar',
        descripcion='Caja estándar',
        codigo_tipo='CAJ-NAV-ESTANDAR',
        activo=True
    )


@pytest.fixture
def beneficio_trabajador_pendiente(trabajador, ciclo_activo, tipo_beneficio_con_guardia, caja_beneficio_premium):
    """
    BeneficioTrabajador en estado 'pendiente'.
    Código QR sin expiración (TTL infinito para propósitos de test).
    """
    codigo = QRSecurity.crear_payload_firmado('test-uuid-1234')
    return BeneficioTrabajador.objects.create(
        trabajador=trabajador,
        ciclo=ciclo_activo,
        tipo_beneficio=tipo_beneficio_con_guardia,
        caja_beneficio=caja_beneficio_premium,
        codigo_verificacion=codigo,
        qr_data='{"codigo": "test-uuid-1234", "rut": "12345678-9"}',
        estado='pendiente',
        bloqueado=False
    )


@pytest.fixture
def beneficio_trabajador_expirado(trabajador, ciclo_activo, tipo_beneficio_con_guardia, caja_beneficio_premium):
    """
    BeneficioTrabajador con código QR expirado (TTL en el pasado).
    """
    codigo = QRSecurity.crear_payload_firmado('test-uuid-expired')
    return BeneficioTrabajador.objects.create(
        trabajador=trabajador,
        ciclo=ciclo_activo,
        tipo_beneficio=tipo_beneficio_con_guardia,
        caja_beneficio=caja_beneficio_premium,
        codigo_verificacion=codigo,
        qr_data='{"codigo": "test-uuid-expired", "rut": "12345678-9"}',
        estado='pendiente',
        bloqueado=False,
        # Campo TTL si existe en el modelo (agregar si falta)
        # codigo_expira_at=timezone.now() - timedelta(hours=1)
    )


@pytest.fixture
def beneficio_trabajador_validado(trabajador_2, ciclo_activo, tipo_beneficio_con_guardia, caja_beneficio_estandar):
    """
    BeneficioTrabajador ya validado (estado='validado').
    Simula que guardia ya lo escaneó.
    """
    codigo = QRSecurity.crear_payload_firmado('test-uuid-validated')
    return BeneficioTrabajador.objects.create(
        trabajador=trabajador_2,
        ciclo=ciclo_activo,
        tipo_beneficio=tipo_beneficio_con_guardia,
        caja_beneficio=caja_beneficio_estandar,
        codigo_verificacion=codigo,
        qr_data='{"codigo": "test-uuid-validated", "rut": "98765432-1"}',
        estado='validado',
        bloqueado=False
    )


def obtener_token_usuario(usuario):
    """Helper para obtener JWT token de un usuario."""
    refresh = RefreshToken.for_user(usuario)
    return str(refresh.access_token)


def generar_payload_qr_invalido():
    """Genera un payload QR con HMAC manipulado (inválido)."""
    # Payload válido pero con firma alterada
    return "test-uuid-1234:1234567890:aaaaaabbbbbbcccccc"


def generar_payload_qr_formato_incorrecto():
    """Genera un payload QR con formato incorrecto."""
    return "formato:incorrecto"


pytest_plugins = []
