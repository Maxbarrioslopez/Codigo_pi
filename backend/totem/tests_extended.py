import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from .models import Trabajador, Ciclo, Sucursal, CajaFisica, ParametroOperativo, Ticket

@pytest.mark.django_db
def setup_basic():
    Ciclo.objects.create(fecha_inicio=timezone.now().date(), fecha_fin=timezone.now().date(), activo=True)
    Sucursal.objects.create(nombre='Central', codigo='CENT')
    Trabajador.objects.create(rut='12345678-5', nombre='Juan Perez', beneficio_disponible={'stock': 5})

@pytest.mark.django_db
def test_ciclo_activo():
    setup_basic()
    client = APIClient()
    r = client.get('/api/ciclo/activo/')
    assert r.status_code == 200
    assert 'fecha_inicio' in r.data

@pytest.mark.django_db
def test_crear_agendamiento():
    setup_basic()
    client = APIClient()
    fecha = timezone.now().date().isoformat()
    r = client.post('/api/agendamientos/', {'trabajador_rut': '12345678-5', 'fecha_retiro': fecha}, format='json')
    assert r.status_code == 201
    assert r.data['fecha_retiro'] == fecha

@pytest.mark.django_db
def test_crear_incidencia_y_listar():
    setup_basic()
    client = APIClient()
    r = client.post('/api/incidencias/', {'trabajador_rut': '12345678-5', 'tipo': 'qr_ilegible', 'descripcion': 'No se lee', 'origen': 'totem'}, format='json')
    assert r.status_code == 201
    codigo = r.data['codigo']
    r2 = client.get(f'/api/incidencias/{codigo}/')
    assert r2.status_code == 200
    r3 = client.get('/api/incidencias/listar/')
    assert r3.status_code == 200
    assert len(r3.data) >= 1

@pytest.mark.django_db
def test_ticket_crear_validar_entregar():
    setup_basic()
    client = APIClient()
    # crear ticket
    r = client.post('/api/tickets/', {'trabajador_rut': '12345678-5', 'data': {'sucursal_codigo': 'CENT'}}, format='json')
    assert r.status_code == 201
    uuid = r.data['uuid']
    # TTL dinámico presente
    assert r.data.get('ttl_expira_at') is not None
    # validar guardia (sin caja)
    r2 = client.post(f'/api/tickets/{uuid}/validar_guardia/', {}, format='json')
    assert r2.status_code == 200
    assert r2.data['estado'] == 'entregado'

@pytest.mark.django_db
def test_ticket_anular_reimprimir_restricciones():
    setup_basic()
    client = APIClient()
    r = client.post('/api/tickets/', {'trabajador_rut': '12345678-5', 'data': {}}, format='json')
    uuid = r.data['uuid']
    # reimprimir pendiente ok
    r1 = client.post(f'/api/tickets/{uuid}/reimprimir/', {}, format='json')
    assert r1.status_code == 200
    # anular
    r2 = client.post(f'/api/tickets/{uuid}/anular/', {'motivo': 'error'}, format='json')
    assert r2.status_code == 200
    # reimprimir ya no permitido
    r3 = client.post(f'/api/tickets/{uuid}/reimprimir/', {}, format='json')
    assert r3.status_code == 400

@pytest.mark.django_db
def test_parametros_operativos_upsert():
    client = APIClient()
    r = client.post('/api/parametros/', {'clave': 'qr_ttl_min', 'valor': '30', 'descripcion': 'TTL QR minutos'}, format='json')
    assert r.status_code == 201
    r2 = client.get('/api/parametros/')
    assert r2.status_code == 200
    assert any(p['clave'] == 'qr_ttl_min' for p in r2.data)

@pytest.mark.django_db
def test_listar_tickets_rrhh():
    setup_basic()
    client = APIClient()
    # crear dos tickets
    client.post('/api/tickets/', {'trabajador_rut': '12345678-5', 'data': {}}, format='json')
    client.post('/api/tickets/', {'trabajador_rut': '12345678-5', 'data': {}}, format='json')
    r = client.get('/api/tickets/listar/')
    assert r.status_code == 200
    assert len(r.data) >= 2
