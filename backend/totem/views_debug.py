from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_user(request):
    """Debug endpoint to verify JWT authentication and user roles."""
    u = request.user
    return Response({
        'username': u.username,
        'is_authenticated': u.is_authenticated,
        'is_superuser': u.is_superuser,
        'is_staff': u.is_staff,
        'rol': u.rol if hasattr(u, 'rol') else None,
        'es_admin': u.es_admin() if hasattr(u, 'es_admin') else None,
        'es_rrhh': u.es_rrhh() if hasattr(u, 'es_rrhh') else None,
        'es_guardia': u.es_guardia() if hasattr(u, 'es_guardia') else None,
    })
