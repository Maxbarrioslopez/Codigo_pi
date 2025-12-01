"""
Pytest configuration and shared fixtures for Tótem Digital tests.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

Usuario = get_user_model()


@pytest.fixture
def api_client():
    """Fixture para APIClient de DRF."""
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Fixture para usuario administrador."""
    return Usuario.objects.create_user(
        username='admin_test',
        password='admin123',
        email='admin@test.com',
        rol=Usuario.Roles.ADMIN,
        is_staff=True,
        is_superuser=True
    )


@pytest.fixture
def rrhh_user(db):
    """Fixture para usuario RRHH."""
    return Usuario.objects.create_user(
        username='rrhh_test',
        password='rrhh123',
        email='rrhh@test.com',
        rol=Usuario.Roles.RRHH
    )


@pytest.fixture
def guardia_user(db):
    """Fixture para usuario guardia."""
    return Usuario.objects.create_user(
        username='guardia_test',
        password='guardia123',
        email='guardia@test.com',
        rol=Usuario.Roles.GUARDIA
    )


@pytest.fixture
def trabajador(db):
    """Fixture para trabajador."""
    from totem.models import Trabajador
    return Trabajador.objects.create(
        rut='12345678-9',
        nombre='Juan Pérez',
        beneficio_disponible={'tipo': 'premium', 'valor': 50000}
    )


@pytest.fixture
def sucursal(db):
    """Fixture para sucursal."""
    from totem.models import Sucursal
    return Sucursal.objects.create(
        nombre='Casa Matriz',
        codigo='CM01'
    )


@pytest.fixture
def ciclo_activo(db):
    """Fixture para ciclo activo."""
    from totem.models import Ciclo
    from django.utils import timezone
    from datetime import timedelta
    
    hoy = timezone.now().date()
    return Ciclo.objects.create(
        fecha_inicio=hoy - timedelta(days=30),
        fecha_fin=hoy + timedelta(days=30),
        activo=True
    )


@pytest.fixture
def ticket_pendiente(db, trabajador, ciclo_activo, sucursal):
    """Fixture para ticket pendiente."""
    from totem.models import Ticket
    from django.utils import timezone
    from datetime import timedelta
    import uuid
    
    return Ticket.objects.create(
        trabajador=trabajador,
        uuid=str(uuid.uuid4()),
        estado='pendiente',
        ciclo=ciclo_activo,
        sucursal=sucursal,
        ttl_expira_at=timezone.now() + timedelta(minutes=30),
        data={'producto': 'Caja Premium', 'valor': 50000}
    )


@pytest.fixture
def authenticated_admin_client(api_client, admin_user):
    """Fixture para cliente autenticado como admin."""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def authenticated_rrhh_client(api_client, rrhh_user):
    """Fixture para cliente autenticado como RRHH."""
    api_client.force_authenticate(user=rrhh_user)
    return api_client


@pytest.fixture
def authenticated_guardia_client(api_client, guardia_user):
    """Fixture para cliente autenticado como guardia."""
    api_client.force_authenticate(user=guardia_user)
    return api_client
