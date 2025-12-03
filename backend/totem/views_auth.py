"""
Vistas de Autenticación y Gestión de Usuarios
Maneja login, logout, cambio de contraseña y creación de usuarios
"""

from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from totem.models import Usuario
from totem.serializers import CustomTokenObtainPairSerializer
import logging
import secrets
import string

logger = logging.getLogger(__name__)


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def auth_me(request):
    """
    Obtiene información del usuario actual
    ENDPOINT: GET /api/auth/me/
    PERMISOS: Autenticado (JWT)
    """
    try:
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'rol': user.rol,
            'debe_cambiar_contraseña': getattr(user, 'debe_cambiar_contraseña', False)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error en auth_me: {e}")
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_logout(request):
    """
    Logout del usuario
    ENDPOINT: POST /api/auth/logout/
    PERMISOS: Público (el logout es local en el frontend)
    """
    try:
        # Aquí se podría implementar blacklist de tokens si es necesario
        # Por ahora solo retornamos éxito
        return Response({'message': 'Sesión cerrada exitosamente'}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error en auth_logout: {e}")
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def auth_change_password(request):
    """
    Cambiar contraseña del usuario actual
    ENDPOINT: POST /api/auth/change-password/
    PERMISOS: Autenticado (JWT)
    
    BODY:
    {
        "old_password": "contraseña_actual",
        "new_password": "nueva_contraseña",
        "new_password_confirm": "nueva_contraseña"
    }
    """
    try:
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        new_password_confirm = request.data.get('new_password_confirm')

        # Validaciones
        if not all([old_password, new_password, new_password_confirm]):
            return Response({'detail': 'Todos los campos son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({'old_password': 'La contraseña actual es incorrecta'}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != new_password_confirm:
            return Response({'new_password_confirm': 'Las contraseñas no coinciden'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'new_password': 'La contraseña debe tener al menos 8 caracteres'}, status=status.HTTP_400_BAD_REQUEST)

        if old_password == new_password:
            return Response({'new_password': 'La nueva contraseña debe ser diferente'}, status=status.HTTP_400_BAD_REQUEST)

        # Cambiar contraseña
        user.set_password(new_password)
        user.debe_cambiar_contraseña = False  # Si existe este campo
        user.save()

        return Response({'message': 'Contraseña cambiada exitosamente'}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error en auth_change_password: {e}")
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def generate_temporary_password(length=12):
    """Genera una contraseña temporal segura"""
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(alphabet) for i in range(length))


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def usuarios_reset_password(request):
    """
    Resetear contraseña de un usuario (solo admin)
    ENDPOINT: POST /api/usuarios/reset-password/
    PERMISOS: Admin (JWT)
    
    BODY:
    {
        "username": "usuario.a.resetear",
        "new_password": "NuevaTemp123!" // Opcional, se genera si no se proporciona
    }
    """
    try:
        # Verificar que el usuario es admin
        if request.user.rol != 'admin' and not request.user.is_superuser:
            return Response({'detail': 'Solo administradores pueden resetear contraseñas'}, status=status.HTTP_403_FORBIDDEN)

        username = request.data.get('username', '').lower().strip()
        new_password = request.data.get('new_password')

        if not username:
            return Response({'username': 'El usuario es requerido'}, status=status.HTTP_400_BAD_REQUEST)

        # Buscar usuario
        try:
            usuario = Usuario.objects.get(username=username)
        except Usuario.DoesNotExist:
            return Response({'username': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # Generar contraseña temporal si no se proporciona
        if not new_password:
            new_password = generate_temporary_password()

        # Cambiar contraseña
        usuario.set_password(new_password)
        usuario.debe_cambiar_contraseña = True  # Marcar que debe cambiar en próximo ingreso
        usuario.save()

        return Response({
            'success': True,
            'message': 'Contraseña reseteada exitosamente',
            'new_password': new_password,
            'username': usuario.username
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error en usuarios_reset_password: {e}")
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def usuarios_view(request):
    """
    Vista combinada para listar (GET) y crear (POST) usuarios
    ENDPOINT: GET/POST /api/usuarios/
    PERMISOS: Admin (JWT)
    """
    try:
        # Verificar que el usuario es admin
        if request.user.rol != 'admin' and not request.user.is_superuser:
            return Response({'detail': 'Solo administradores pueden gestionar usuarios'}, status=status.HTTP_403_FORBIDDEN)

        if request.method == 'GET':
            # Listar usuarios
            usuarios = Usuario.objects.all().values(
                'id', 'username', 'email', 'first_name', 'last_name', 
                'rol', 'is_active', 'last_login', 'date_joined'
            )
            usuarios_list = list(usuarios)
            return Response(usuarios_list, status=status.HTTP_200_OK)
        
        elif request.method == 'POST':
            # Crear usuario
            username = request.data.get('username', '').lower().strip()
            email = request.data.get('email', '').lower().strip()
            rol = request.data.get('rol', 'guardia')
            first_name = request.data.get('first_name', '')
            last_name = request.data.get('last_name', '')
            password = request.data.get('password')

            # Validaciones
            if not username:
                return Response({'username': 'El usuario es requerido'}, status=status.HTTP_400_BAD_REQUEST)

            if not email:
                return Response({'email': 'El email es requerido'}, status=status.HTTP_400_BAD_REQUEST)

            if '@' not in email or '.' not in email:
                return Response({'email': 'Email inválido'}, status=status.HTTP_400_BAD_REQUEST)

            if rol not in ['admin', 'rrhh', 'guardia', 'supervisor']:
                return Response({'rol': 'Rol inválido'}, status=status.HTTP_400_BAD_REQUEST)

            # Verificar si el usuario ya existe
            if Usuario.objects.filter(username=username).exists():
                return Response({'username': 'El usuario ya existe'}, status=status.HTTP_400_BAD_REQUEST)

            if Usuario.objects.filter(email=email).exists():
                return Response({'email': 'El email ya está registrado'}, status=status.HTTP_400_BAD_REQUEST)

            # Generar contraseña temporal si no se proporciona
            if not password:
                password = generate_temporary_password()

            # Crear usuario
            usuario = Usuario.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=password,
                rol=rol,
                activo=True
            )

            # Marcar que debe cambiar contraseña en primer ingreso (para guardia/rrhh)
            if rol in ['guardia', 'rrhh']:
                usuario.debe_cambiar_contraseña = True
                usuario.save()

            return Response({
                'id': usuario.id,
                'username': usuario.username,
                'email': usuario.email,
                'first_name': usuario.first_name,
                'last_name': usuario.last_name,
                'rol': usuario.rol,
                'password': password,  # Solo se retorna en creación
                'debe_cambiar_contraseña': usuario.debe_cambiar_contraseña
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error en usuarios_view: {e}")
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
