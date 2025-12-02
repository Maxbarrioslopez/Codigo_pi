"""
Tests para autenticación y gestión de usuarios
"""
import pytest
from django.contrib.auth import authenticate
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from totem.models import Usuario


@pytest.mark.django_db
class TestAuthEndpoints:
    """Tests para endpoints de autenticación"""
    
    def setup_method(self):
        """Setup para cada test"""
        # Crear admin
        self.admin = Usuario.objects.create_superuser(
            username='admin',
            email='admin@test.com',
            password='AdminPass123',
            rol='admin'
        )
        
        # Crear guardias para testing
        self.guardia1 = Usuario.objects.create_user(
            username='guardia.uno',
            email='guardia1@test.com',
            password='GuardiaPass123',
            rol='guardia'
        )
        
        self.guardia2 = Usuario.objects.create_user(
            username='guardia.dos',
            email='guardia2@test.com',
            password='GuardiaPass123',
            rol='guardia'
        )
        
        self.client = APIClient()
    
    def get_admin_token(self):
        """Obtiene token JWT para admin"""
        refresh = RefreshToken.for_user(self.admin)
        return str(refresh.access_token)
    
    def test_reset_password_exitoso(self):
        """Resetear contraseña de usuario como admin"""
        token = self.get_admin_token()
        
        response = self.client.post(
            '/api/usuarios/reset-password/',
            {
                'username': 'guardia.uno',
                'new_password': 'NewPass456!'
            },
            HTTP_AUTHORIZATION=f'Bearer {token}',
            format='json'
        )
        
        assert response.status_code == 200
        assert response.data['success'] is True
        assert response.data['new_password'] is not None
        assert response.data['username'] == 'guardia.uno'
        
        # Verificar que la contraseña se cambió
        self.guardia1.refresh_from_db()
        assert self.guardia1.check_password('NewPass456!')
        assert self.guardia1.debe_cambiar_contraseña is True
    
    def test_reset_password_sin_contraseña_genera_temporal(self):
        """Si no se proporciona contraseña, se genera una temporal"""
        token = self.get_admin_token()
        
        response = self.client.post(
            '/api/usuarios/reset-password/',
            {'username': 'guardia.dos'},
            HTTP_AUTHORIZATION=f'Bearer {token}',
            format='json'
        )
        
        assert response.status_code == 200
        assert response.data['success'] is True
        new_password = response.data['new_password']
        assert new_password is not None
        assert len(new_password) >= 8
    
    def test_reset_password_usuario_no_existe(self):
        """Resetear contraseña de usuario inexistente retorna 404"""
        token = self.get_admin_token()
        
        response = self.client.post(
            '/api/usuarios/reset-password/',
            {'username': 'usuario.inexistente'},
            HTTP_AUTHORIZATION=f'Bearer {token}',
            format='json'
        )
        
        assert response.status_code == 404
        assert 'Usuario no encontrado' in response.data['username']
    
    def test_reset_password_sin_admin_permisos(self):
        """No-admin no puede resetear contraseña"""
        # Obtener token de guardia
        guardia_token = RefreshToken.for_user(self.guardia1)
        
        response = self.client.post(
            '/api/usuarios/reset-password/',
            {'username': 'guardia.dos'},
            HTTP_AUTHORIZATION=f'Bearer {str(guardia_token.access_token)}',
            format='json'
        )
        
        assert response.status_code == 403
        assert 'administradores' in response.data['detail'].lower()
    
    def test_reset_password_sin_autenticacion(self):
        """Sin autenticación no se puede resetear contraseña"""
        response = self.client.post(
            '/api/usuarios/reset-password/',
            {'username': 'guardia.uno'},
            format='json'
        )
        
        assert response.status_code == 401
    
    def test_auth_me_obtiene_usuario_actual(self):
        """Obtener información del usuario actual"""
        token = self.get_admin_token()
        
        response = self.client.get(
            '/api/auth/me/',
            HTTP_AUTHORIZATION=f'Bearer {token}',
        )
        
        assert response.status_code == 200
        assert response.data['username'] == 'admin'
        assert response.data['rol'] == 'admin'
        assert response.data['email'] == 'admin@test.com'
    
    def test_change_password_exitoso(self):
        """Cambiar contraseña del usuario actual"""
        token = self.get_admin_token()
        
        response = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'AdminPass123',
                'new_password': 'NewAdminPass456',
                'new_password_confirm': 'NewAdminPass456'
            },
            HTTP_AUTHORIZATION=f'Bearer {token}',
            format='json'
        )
        
        assert response.status_code == 200
        assert 'exitosamente' in response.data['message'].lower()
        
        # Verificar que la contraseña se cambió
        self.admin.refresh_from_db()
        assert self.admin.check_password('NewAdminPass456')
    
    def test_change_password_invalido(self):
        """Cambiar contraseña con contraseña anterior incorrecta"""
        token = self.get_admin_token()
        
        response = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'WrongPassword',
                'new_password': 'NewAdminPass456',
                'new_password_confirm': 'NewAdminPass456'
            },
            HTTP_AUTHORIZATION=f'Bearer {token}',
            format='json'
        )
        
        assert response.status_code == 400
        assert 'incorrecta' in response.data['old_password'].lower()
    
    def test_change_password_no_coinciden(self):
        """Cambiar contraseña donde las nuevas no coinciden"""
        token = self.get_admin_token()
        
        response = self.client.post(
            '/api/auth/change-password/',
            {
                'old_password': 'AdminPass123',
                'new_password': 'NewAdminPass456',
                'new_password_confirm': 'DifferentPass789'
            },
            HTTP_AUTHORIZATION=f'Bearer {token}',
            format='json'
        )
        
        assert response.status_code == 400
        assert 'no coinciden' in response.data['new_password_confirm'].lower()
