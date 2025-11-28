import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from .models import Trabajador

@pytest.mark.django_db
def test_beneficio_get_valid_rut():
    client = APIClient()
    t = Trabajador.objects.create(rut='12345678-5', nombre='Juan Perez', beneficio_disponible={'tipo': 'alimentario'})
    url = f'/api/beneficios/{t.rut}/'
    resp = client.get(url)
    assert resp.status_code == 200
    assert 'beneficio' in resp.data

@pytest.mark.django_db
def test_beneficio_get_invalid_rut_format():
    client = APIClient()
    url = '/api/beneficios/invalidrut/'
    resp = client.get(url)
    assert resp.status_code == 400

@pytest.mark.django_db
def test_create_ticket_flow(tmp_path):
    client = APIClient()
    t = Trabajador.objects.create(rut='12345678-5', nombre='Juan Perez', beneficio_disponible={'tipo': 'alimentario'})
    payload = {'trabajador_rut': t.rut, 'data': {'sucursal': 'Central', 'producto': 'A'}}
    resp = client.post('/api/tickets/', payload, format='json')
    assert resp.status_code == 201
    assert resp.data.get('uuid')
    assert resp.data.get('qr_image') is not None
