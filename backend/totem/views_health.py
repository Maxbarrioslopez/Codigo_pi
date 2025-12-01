# -*- coding: utf-8 -*-
"""
Endpoint de health check para monitoreo de salud del sistema.
Verifica conectividad con DB, Redis, Celery y otros servicios críticos.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.core.cache import cache
from django.utils import timezone
import structlog

logger = structlog.get_logger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    GET /api/health/
    
    Verifica el estado de salud del sistema y sus dependencias.
    Endpoint público para monitoreo por herramientas externas.
    
    ENDPOINT: GET /api/health/
    MÉTODO: GET
    PERMISOS: Público (sin autenticación)
    AUTENTICACIÓN: No requerida
    
    RESPUESTA (200 - Healthy):
        {
            "status": "healthy",
            "timestamp": "2025-11-30T10:30:00Z",
            "version": "1.0.0",
            "checks": {
                "database": "ok",
                "cache": "ok",
                "celery": "ok"
            }
        }
    
    RESPUESTA (503 - Unhealthy):
        {
            "status": "unhealthy",
            "timestamp": "2025-11-30T10:30:00Z",
            "version": "1.0.0",
            "checks": {
                "database": "ok",
                "cache": "error",
                "celery": "degraded"
            },
            "errors": [
                "Cache connection failed: Connection refused"
            ]
        }
    
    NOTAS:
        - Responde 200 si todos los checks son "ok"
        - Responde 503 si algún check falla
        - Útil para health checks de Kubernetes, Docker, load balancers
        - No expone información sensible
    """
    checks = {}
    errors = []
    overall_status = "healthy"
    
    # Check 1: Database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        checks['database'] = 'ok'
        logger.debug("health_check_db_ok")
    except Exception as e:
        checks['database'] = 'error'
        errors.append(f"Database: {str(e)}")
        overall_status = "unhealthy"
        logger.error("health_check_db_failed", error=str(e))
    
    # Check 2: Cache (Redis o local)
    try:
        cache_key = 'health_check_test'
        cache.set(cache_key, 'ok', 10)
        value = cache.get(cache_key)
        if value == 'ok':
            checks['cache'] = 'ok'
            logger.debug("health_check_cache_ok")
        else:
            checks['cache'] = 'degraded'
            errors.append("Cache: value mismatch")
            overall_status = "degraded"
    except Exception as e:
        checks['cache'] = 'error'
        errors.append(f"Cache: {str(e)}")
        overall_status = "unhealthy"
        logger.error("health_check_cache_failed", error=str(e))
    
    # Check 3: Celery (si está configurado)
    try:
        from celery import current_app
        from celery.app.control import Inspect
        
        # Verificar workers activos
        inspect = Inspect(app=current_app)
        stats = inspect.stats()
        
        if stats:
            checks['celery'] = 'ok'
            checks['celery_workers'] = len(stats)
            logger.debug("health_check_celery_ok", workers=len(stats))
        else:
            checks['celery'] = 'degraded'
            checks['celery_workers'] = 0
            errors.append("Celery: no workers active")
            # No marcamos como unhealthy si Celery está en modo eager
            if overall_status == "healthy":
                overall_status = "degraded"
    except ImportError:
        checks['celery'] = 'not_configured'
        logger.debug("health_check_celery_not_configured")
    except Exception as e:
        checks['celery'] = 'error'
        errors.append(f"Celery: {str(e)}")
        if overall_status == "healthy":
            overall_status = "degraded"
        logger.warning("health_check_celery_failed", error=str(e))
    
    # Check 4: Disk space (opcional)
    try:
        import shutil
        disk_usage = shutil.disk_usage('/')
        free_percent = (disk_usage.free / disk_usage.total) * 100
        
        if free_percent < 10:
            checks['disk_space'] = 'critical'
            errors.append(f"Disk space: only {free_percent:.1f}% free")
            overall_status = "unhealthy"
        elif free_percent < 20:
            checks['disk_space'] = 'warning'
            errors.append(f"Disk space: only {free_percent:.1f}% free")
            if overall_status == "healthy":
                overall_status = "degraded"
        else:
            checks['disk_space'] = 'ok'
            checks['disk_free_percent'] = round(free_percent, 1)
    except Exception as e:
        checks['disk_space'] = 'unknown'
        logger.warning("health_check_disk_failed", error=str(e))
    
    # Construir respuesta
    response_data = {
        'status': overall_status,
        'timestamp': timezone.now().isoformat(),
        'version': '1.0.0',  # TODO: leer desde settings o __version__
        'checks': checks
    }
    
    if errors:
        response_data['errors'] = errors
    
    # Código de estado HTTP
    http_status = status.HTTP_200_OK if overall_status == "healthy" else \
                  status.HTTP_503_SERVICE_UNAVAILABLE if overall_status == "unhealthy" else \
                  status.HTTP_200_OK  # degraded aún responde 200
    
    return Response(response_data, status=http_status)


@api_view(['GET'])
@permission_classes([AllowAny])
def liveness_check(request):
    """
    GET /api/health/liveness/
    
    Verifica que la aplicación esté viva (proceso corriendo).
    Lightweight check para Kubernetes liveness probe.
    
    ENDPOINT: GET /api/health/liveness/
    MÉTODO: GET
    PERMISOS: Público (sin autenticación)
    
    RESPUESTA (200):
        {
            "status": "alive",
            "timestamp": "2025-11-30T10:30:00Z"
        }
    
    NOTAS:
        - Siempre responde 200 si Django está corriendo
        - No verifica dependencias externas
        - Más rápido que health_check completo
    """
    return Response({
        'status': 'alive',
        'timestamp': timezone.now().isoformat()
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def readiness_check(request):
    """
    GET /api/health/readiness/
    
    Verifica que la aplicación esté lista para recibir tráfico.
    Kubernetes readiness probe - verifica DB y caché.
    
    ENDPOINT: GET /api/health/readiness/
    MÉTODO: GET
    PERMISOS: Público (sin autenticación)
    
    RESPUESTA (200 - Ready):
        {
            "status": "ready",
            "timestamp": "2025-11-30T10:30:00Z",
            "checks": {
                "database": "ok",
                "cache": "ok"
            }
        }
    
    RESPUESTA (503 - Not Ready):
        {
            "status": "not_ready",
            "timestamp": "2025-11-30T10:30:00Z",
            "checks": {
                "database": "error",
                "cache": "ok"
            }
        }
    
    NOTAS:
        - Verifica solo servicios críticos (DB, cache)
        - Más rápido que health_check completo
        - Responde 503 si no está listo
    """
    checks = {}
    is_ready = True
    
    # Check database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        checks['database'] = 'ok'
    except Exception as e:
        checks['database'] = 'error'
        is_ready = False
        logger.error("readiness_check_db_failed", error=str(e))
    
    # Check cache
    try:
        cache_key = 'readiness_check_test'
        cache.set(cache_key, 'ok', 5)
        if cache.get(cache_key) == 'ok':
            checks['cache'] = 'ok'
        else:
            checks['cache'] = 'error'
            is_ready = False
    except Exception as e:
        checks['cache'] = 'error'
        is_ready = False
        logger.error("readiness_check_cache_failed", error=str(e))
    
    response_data = {
        'status': 'ready' if is_ready else 'not_ready',
        'timestamp': timezone.now().isoformat(),
        'checks': checks
    }
    
    http_status = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return Response(response_data, status=http_status)
