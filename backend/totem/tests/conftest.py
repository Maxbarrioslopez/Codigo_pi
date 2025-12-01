# -*- coding: utf-8 -*-
"""
Fixtures y datos de prueba para tests
RUTs válidos chilenos para testing
"""
import pytest
from datetime import date, timedelta
from django.contrib.auth import get_user_model

from totem.models import (
    Trabajador, Ciclo, Sucursal, Ticket, Agendamiento,
    Incidencia, StockSucursal, StockMovimiento
)

User = get_user_model()

# RUTs válidos chilenos para testing
RUTS_VALIDOS = [
    '11111111-1',
    '22222222-2',
    '33333333-3',
    '44444444-4',
    '15234567-8',
    '16789012-3',
    '17890123-4',
    '18901234-5',
    '19012345-6',
    '20123456-7',
]


@pytest.fixture
def rut_valido():
    """RUT válido para tests"""
    return RUTS_VALIDOS[0]


@pytest.fixture
def trabajador_base():
    """Trabajador de prueba"""
    return Trabajador.objects.create(
        rut=RUTS_VALIDOS[0],
        nombre='Juan Pérez Testing'
    )


@pytest.fixture
def trabajador_alternativo():
    """Segundo trabajador para tests múltiples"""
    return Trabajador.objects.create(
        rut=RUTS_VALIDOS[1],
        nombre='María González Testing'
    )


@pytest.fixture
def ciclo_activo():
    """Ciclo activo para tests"""
    return Ciclo.objects.create(
        fecha_inicio=date.today(),
        fecha_fin=date.today() + timedelta(days=60),
        activo=True
    )


@pytest.fixture
def ciclo_inactivo():
    """Ciclo inactivo para tests"""
    return Ciclo.objects.create(
        fecha_inicio=date.today() - timedelta(days=120),
        fecha_fin=date.today() - timedelta(days=60),
        activo=False
    )


@pytest.fixture
def sucursal_principal():
    """Sucursal principal para tests"""
    return Sucursal.objects.create(
        nombre='Sucursal Central',
        codigo='CENTRAL',
        direccion='Av. Principal 123',
        activo=True
    )


@pytest.fixture
def sucursal_secundaria():
    """Sucursal secundaria para tests"""
    return Sucursal.objects.create(
        nombre='Sucursal Norte',
        codigo='NORTE',
        direccion='Av. Norte 456',
        activo=True
    )


@pytest.fixture
def usuario_admin():
    """Usuario administrador"""
    return User.objects.create_user(
        username='admin_test',
        password='admin123test',
        rol='admin',
        is_staff=True,
        is_superuser=True
    )


@pytest.fixture
def usuario_rrhh():
    """Usuario RRHH"""
    return User.objects.create_user(
        username='rrhh_test',
        password='rrhh123test',
        rol='rrhh'
    )


@pytest.fixture
def usuario_guardia():
    """Usuario guardia"""
    return User.objects.create_user(
        username='guardia_test',
        password='guardia123test',
        rol='guardia'
    )


@pytest.fixture
def ticket_pendiente(trabajador_base, ciclo_activo):
    """Ticket en estado pendiente"""
    return Ticket.objects.create(
        trabajador=trabajador_base,
        ciclo=ciclo_activo,
        estado='pendiente'
    )


@pytest.fixture
def ticket_usado(trabajador_base, ciclo_activo):
    """Ticket usado"""
    return Ticket.objects.create(
        trabajador=trabajador_base,
        ciclo=ciclo_activo,
        estado='usado'
    )


@pytest.fixture
def agendamiento_pendiente(trabajador_base, ciclo_activo):
    """Agendamiento pendiente"""
    return Agendamiento.objects.create(
        trabajador=trabajador_base,
        ciclo=ciclo_activo,
        fecha_retiro=date.today() + timedelta(days=7),
        estado='pendiente'
    )


@pytest.fixture
def incidencia_abierta(trabajador_base):
    """Incidencia abierta"""
    return Incidencia.objects.create(
        trabajador=trabajador_base,
        tipo='Falla',
        descripcion='Problema de prueba para testing del sistema',
        estado='abierta',
        prioridad='Media'
    )


@pytest.fixture
def stock_disponible(sucursal_principal):
    """Stock disponible en sucursal"""
    return StockSucursal.objects.create(
        sucursal=sucursal_principal,
        tipo_caja='Estándar',
        cantidad_actual=100,
        cantidad_minima=10
    )


@pytest.fixture
def setup_completo(
    trabajador_base,
    ciclo_activo,
    sucursal_principal,
    usuario_admin
):
    """Setup completo con todos los fixtures principales"""
    return {
        'trabajador': trabajador_base,
        'ciclo': ciclo_activo,
        'sucursal': sucursal_principal,
        'usuario': usuario_admin
    }


def crear_trabajadores_multiples(cantidad=10):
    """Crear múltiples trabajadores para tests de performance"""
    trabajadores = []
    for i in range(cantidad):
        if i < len(RUTS_VALIDOS):
            rut = RUTS_VALIDOS[i]
        else:
            # Generar RUT ficticio
            rut = f'{10000000 + i}-{i % 10}'
        
        t = Trabajador.objects.create(
            rut=rut,
            nombre=f'Trabajador Test {i+1}'
        )
        trabajadores.append(t)
    
    return trabajadores


def crear_ciclos_historicos(cantidad=5):
    """Crear ciclos históricos para tests"""
    ciclos = []
    for i in range(cantidad):
        inicio = date.today() - timedelta(days=(cantidad - i) * 60)
        fin = inicio + timedelta(days=60)
        
        ciclo = Ciclo.objects.create(
            fecha_inicio=inicio,
            fecha_fin=fin,
            activo=(i == cantidad - 1)  # Solo el último activo
        )
        ciclos.append(ciclo)
    
    return ciclos


def limpiar_base_datos():
    """Limpiar todos los registros de prueba"""
    Ticket.objects.all().delete()
    Agendamiento.objects.all().delete()
    Incidencia.objects.all().delete()
    StockMovimiento.objects.all().delete()
    StockSucursal.objects.all().delete()
    Trabajador.objects.all().delete()
    Ciclo.objects.all().delete()
    Sucursal.objects.all().delete()
    User.objects.filter(username__contains='_test').delete()


# Configuración de pytest para usar fixtures automáticamente
@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """Habilitar acceso a DB para todos los tests"""
    pass
