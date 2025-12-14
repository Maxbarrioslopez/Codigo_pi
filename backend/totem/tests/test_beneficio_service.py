"""
Tests para BeneficioTrabajador y BeneficioService.
Cubre validación HMAC, cambios de estado, endpoints de guardia.
"""
import pytest
from django.utils import timezone
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
import hmac
import hashlib
import json

from totem.models import (
    Usuario, Trabajador, Ciclo, TipoBeneficio, CajaBeneficio, 
    BeneficioTrabajador, ValidacionCaja
)
from totem.services.beneficio_service import BeneficioService


@pytest.mark.django_db
class TestBeneficioService:
    """Tests para BeneficioService."""
    
    @pytest.fixture
    def trabajador(self):
        return Trabajador.objects.create(
            rut='12345678-9',
            nombre='Juan Pérez López'
        )
    
    @pytest.fixture
    def ciclo(self):
        return Ciclo.objects.create(
            nombre='Navidad 2025',
            fecha_inicio=timezone.now().date(),
            fecha_fin=(timezone.now() + timezone.timedelta(days=60)).date(),
            activo=True
        )
    
    @pytest.fixture
    def tipo_beneficio(self):
        obj, _ = TipoBeneficio.objects.get_or_create(
            nombre='Caja de Navidad',
            defaults={'activo': True}
        )
        return obj
    
    def test_asignar_beneficio(self, trabajador, ciclo, tipo_beneficio):
        """Test que al asignar beneficio se genera payload y firma HMAC."""
        beneficio = BeneficioService.asignar_beneficio(
            trabajador=trabajador,
            ciclo=ciclo,
            tipo_beneficio=tipo_beneficio,
            codigo_verificacion='VERIFY-001'
        )
        
        assert beneficio.id is not None
        assert beneficio.estado == 'pendiente'
        assert beneficio.qr_payload is not None
        assert beneficio.qr_signature is not None
        assert len(beneficio.qr_signature) == 64  # SHA256 hex string
    
    def test_calcular_hmac(self):
        """Test cálculo HMAC."""
        payload = {
            'beneficio_id': 5,
            'trabajador_rut': '12345678-9',
            'ciclo_id': 1,
            'tipo_beneficio': 'Caja de Navidad'
        }
        
        firma1 = BeneficioService.calcular_hmac(payload)
        firma2 = BeneficioService.calcular_hmac(payload)
        
        # Firmas deben ser iguales para mismo payload
        assert firma1 == firma2
        assert len(firma1) == 64
    
    def test_validar_hmac_correcto(self):
        """Test validación de firma HMAC correcta."""
        payload = {'id': 1, 'rut': '12345678-9'}
        firma_correcta = BeneficioService.calcular_hmac(payload)
        
        assert BeneficioService.validar_hmac(payload, firma_correcta) is True
    
    def test_validar_hmac_incorrecto(self):
        """Test validación de firma HMAC incorrecta."""
        payload = {'id': 1, 'rut': '12345678-9'}
        firma_incorrecta = '0000000000000000000000000000000000000000000000000000000000000000'
        
        assert BeneficioService.validar_hmac(payload, firma_incorrecta) is False
    
    def test_validar_beneficio_exitoso(self, trabajador, ciclo, tipo_beneficio):
        """Test validación exitosa de beneficio."""
        # Crear beneficio
        beneficio = BeneficioService.asignar_beneficio(
            trabajador=trabajador,
            ciclo=ciclo,
            tipo_beneficio=tipo_beneficio,
            codigo_verificacion='VERIFY-001'
        )
        
        assert beneficio.estado == 'pendiente'
        
        # Validar beneficio
        exitoso, resultado = BeneficioService.validar_beneficio(
            beneficio=beneficio,
            codigo_escaneado='VERIFY-001'
        )
        
        assert exitoso is True
        assert beneficio.estado == 'validado'
        
        # Verificar registro de validación
        validacion = ValidacionCaja.objects.get(beneficio_trabajador=beneficio)
        assert validacion.resultado == 'exitoso'
    
    def test_validar_beneficio_hmac_invalido(self, trabajador, ciclo, tipo_beneficio):
        """Test validación falla si HMAC es inválido."""
        beneficio = BeneficioService.asignar_beneficio(
            trabajador=trabajador,
            ciclo=ciclo,
            tipo_beneficio=tipo_beneficio,
            codigo_verificacion='VERIFY-001'
        )
        
        # Corromper firma
        beneficio.qr_signature = '0000000000000000000000000000000000000000000000000000000000000000'
        beneficio.save()
        
        exitoso, resultado = BeneficioService.validar_beneficio(
            beneficio=beneficio,
            codigo_escaneado='VERIFY-001'
        )
        
        assert exitoso is False
        assert 'Firma HMAC inválida' in resultado['razones']
    
    def test_validar_beneficio_estado_no_pendiente(self, trabajador, ciclo, tipo_beneficio):
        """Test validación falla si estado no es pendiente."""
        beneficio = BeneficioService.asignar_beneficio(
            trabajador=trabajador,
            ciclo=ciclo,
            tipo_beneficio=tipo_beneficio,
            codigo_verificacion='VERIFY-001'
        )
        
        # Cambiar a validado
        beneficio.estado = 'validado'
        beneficio.save()
        
        exitoso, resultado = BeneficioService.validar_beneficio(
            beneficio=beneficio,
            codigo_escaneado='VERIFY-001'
        )
        
        assert exitoso is False
        assert 'no es pendiente' in resultado['razones'][0]
    
    def test_confirmar_entrega_exitoso(self, trabajador, ciclo, tipo_beneficio):
        """Test confirmación de entrega exitosa."""
        beneficio = BeneficioService.asignar_beneficio(
            trabajador=trabajador,
            ciclo=ciclo,
            tipo_beneficio=tipo_beneficio,
            codigo_verificacion='VERIFY-001'
        )
        
        # Validar primero
        exitoso, _ = BeneficioService.validar_beneficio(
            beneficio=beneficio,
            codigo_escaneado='VERIFY-001'
        )
        assert exitoso is True
        assert beneficio.estado == 'validado'
        
        # Confirmar entrega
        exitoso, resultado = BeneficioService.confirmar_entrega(
            beneficio=beneficio,
            caja_fisica_codigo='CAJA-001'
        )
        
        assert exitoso is True
        assert beneficio.estado == 'retirado'
        assert resultado['estado_final'] == 'retirado'
    
    def test_confirmar_entrega_estado_no_validado(self, trabajador, ciclo, tipo_beneficio):
        """Test entrega falla si estado no es validado."""
        beneficio = BeneficioService.asignar_beneficio(
            trabajador=trabajador,
            ciclo=ciclo,
            tipo_beneficio=tipo_beneficio,
            codigo_verificacion='VERIFY-001'
        )
        
        # Intentar confirmar sin validar
        exitoso, resultado = BeneficioService.confirmar_entrega(
            beneficio=beneficio
        )
        
        assert exitoso is False
        assert 'debe ser VALIDADO' in resultado['razones'][0]
    
    def test_puede_retirarse_property(self, trabajador, ciclo, tipo_beneficio):
        """Test propiedad puede_retirarse."""
        beneficio = BeneficioService.asignar_beneficio(
            trabajador=trabajador,
            ciclo=ciclo,
            tipo_beneficio=tipo_beneficio,
            codigo_verificacion='VERIFY-001'
        )
        
        # No puede retirar mientras está en pendiente
        assert beneficio.puede_retirarse is False
        
        # Validar
        BeneficioService.validar_beneficio(beneficio, 'VERIFY-001')
        beneficio.refresh_from_db()
        
        # Ahora puede retirar
        assert beneficio.puede_retirarse is True
        
        # Bloquear
        BeneficioService.bloquear_beneficio(beneficio, 'Duplicado')
        assert beneficio.puede_retirarse is False
    
    def test_bloquear_desbloquear(self, trabajador, ciclo, tipo_beneficio):
        """Test bloqueo y desbloqueo de beneficios."""
        beneficio = BeneficioService.asignar_beneficio(
            trabajador=trabajador,
            ciclo=ciclo,
            tipo_beneficio=tipo_beneficio,
            codigo_verificacion='VERIFY-001'
        )
        
        assert beneficio.bloqueado is False
        
        # Bloquear
        BeneficioService.bloquear_beneficio(beneficio, 'Razón de bloqueo')
        assert beneficio.bloqueado is True
        assert beneficio.motivo_bloqueo == 'Razón de bloqueo'
        
        # Desbloquear
        BeneficioService.desbloquear_beneficio(beneficio)
        assert beneficio.bloqueado is False
        assert beneficio.motivo_bloqueo == ''


class TestValidarBeneficioEndpoint(TestCase):
    """Tests para endpoint POST /api/guardia/beneficios/{id}/validar/"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crear usuario guardia
        self.guardia = Usuario.objects.create_user(
            username='guardia1',
            password='pass123',
            rol=Usuario.Roles.GUARDIA
        )
        
        # Crear datos de prueba
        self.trabajador = Trabajador.objects.create(
            rut='12345678-9',
            nombre='Juan Pérez'
        )
        self.ciclo = Ciclo.objects.create(
            nombre='Navidad 2025',
            fecha_inicio=timezone.now().date(),
            fecha_fin=(timezone.now() + timezone.timedelta(days=60)).date(),
            activo=True
        )
        self.tipo_beneficio, _ = TipoBeneficio.objects.get_or_create(
            nombre='Caja de Navidad',
            defaults={'activo': True}
        )
        
        # Crear beneficio
        self.beneficio = BeneficioService.asignar_beneficio(
            trabajador=self.trabajador,
            ciclo=self.ciclo,
            tipo_beneficio=self.tipo_beneficio,
            codigo_verificacion='VERIFY-001'
        )
    
    def test_validar_beneficio_sin_autenticacion(self):
        """Test falla sin token."""
        response = self.client.post(
            f'/api/guardia/beneficios/{self.beneficio.id}/validar/',
            {'codigo_escaneado': 'VERIFY-001'},
            format='json'
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_validar_beneficio_exitoso(self):
        """Test validación exitosa."""
        self.client.force_authenticate(user=self.guardia)
        
        response = self.client.post(
            f'/api/guardia/beneficios/{self.beneficio.id}/validar/',
            {'codigo_escaneado': 'VERIFY-001'},
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['exitoso'] is True
        assert response.data['estado'] == 'validado'


class TestConfirmarEntregaEndpoint(TestCase):
    """Tests para endpoint POST /api/guardia/beneficios/{id}/confirmar-entrega/"""
    
    def setUp(self):
        self.client = APIClient()
        
        self.guardia = Usuario.objects.create_user(
            username='guardia1',
            password='pass123',
            rol=Usuario.Roles.GUARDIA
        )
        
        self.trabajador = Trabajador.objects.create(
            rut='12345678-9',
            nombre='Juan Pérez'
        )
        self.ciclo = Ciclo.objects.create(
            nombre='Navidad 2025',
            fecha_inicio=timezone.now().date(),
            fecha_fin=(timezone.now() + timezone.timedelta(days=60)).date(),
            activo=True
        )
        self.tipo_beneficio, _ = TipoBeneficio.objects.get_or_create(
            nombre='Caja de Navidad',
            defaults={'activo': True}
        )
        
        self.beneficio = BeneficioService.asignar_beneficio(
            trabajador=self.trabajador,
            ciclo=self.ciclo,
            tipo_beneficio=self.tipo_beneficio,
            codigo_verificacion='VERIFY-001'
        )
        
        # Validar el beneficio primero
        BeneficioService.validar_beneficio(self.beneficio, 'VERIFY-001')
    
    def test_confirmar_entrega_exitoso(self):
        """Test confirmación de entrega exitosa."""
        self.client.force_authenticate(user=self.guardia)
        
        response = self.client.post(
            f'/api/guardia/beneficios/{self.beneficio.id}/confirmar-entrega/',
            {'caja_fisica_codigo': 'CAJA-001'},
            format='json'
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['exitoso'] is True
        assert response.data['estado_final'] == 'retirado'
    
    def test_confirmar_entrega_sin_validar(self):
        """Test falla si no está validado."""
        # Crear otro beneficio sin validar con tipo_beneficio diferente
        tipo_beneficio2, _ = TipoBeneficio.objects.get_or_create(
            nombre='Caja de Verano',
            defaults={'activo': True}
        )
        beneficio2 = BeneficioService.asignar_beneficio(
            trabajador=self.trabajador,
            ciclo=self.ciclo,
            tipo_beneficio=tipo_beneficio2,
            codigo_verificacion='VERIFY-002'
        )
        
        self.client.force_authenticate(user=self.guardia)
        
        response = self.client.post(
            f'/api/guardia/beneficios/{beneficio2.id}/confirmar-entrega/',
            {},
            format='json'
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['exitoso'] is False
