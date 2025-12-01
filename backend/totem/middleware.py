"""
Custom middleware for Tótem Digital.
Includes audit logging and security headers.
"""

import logging
import time
import json
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser

# Loggers
audit_logger = logging.getLogger('audit')
security_logger = logging.getLogger('django.security')


class AuditLoggingMiddleware(MiddlewareMixin):
    """
    Middleware para registrar todas las peticiones API en audit.log.
    Cumple con ISO 27001: A.12.4.1 (Event logging).
    """
    
    def process_request(self, request):
        """Captura el inicio de la petición."""
        request._audit_start_time = time.time()
        return None
    
    def process_response(self, request, response):
        """Registra la petición completada con metadata."""
        # Solo auditar endpoints /api/
        if not request.path.startswith('/api/'):
            return response
        
        # Calcular tiempo de respuesta
        duration = 0
        if hasattr(request, '_audit_start_time'):
            duration = time.time() - request._audit_start_time
        
        # Obtener información del usuario
        user_info = {
            'username': 'anonymous',
            'user_id': None,
            'user_rol': None,
        }
        
        if request.user and not isinstance(request.user, AnonymousUser):
            user_info = {
                'username': request.user.username,
                'user_id': request.user.id,
                'user_rol': getattr(request.user, 'rol', None),
            }
        
        # Construir log estructurado
        audit_data = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'method': request.method,
            'path': request.path,
            'status_code': response.status_code,
            'duration_ms': round(duration * 1000, 2),
            'ip_address': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', '')[:200],
            **user_info,
        }
        
        # Agregar query params si existen (sanitizados)
        if request.GET:
            safe_params = {k: v for k, v in request.GET.items() if k not in ['password', 'token']}
            if safe_params:
                audit_data['query_params'] = safe_params
        
        # Log como JSON estructurado
        audit_logger.info(
            f"API Request",
            extra={
                'audit_data': audit_data,
                'structured': True,
            }
        )
        
        # Detectar intentos sospechosos
        if response.status_code in [401, 403]:
            security_logger.warning(
                f"Unauthorized access attempt: {request.method} {request.path}",
                extra={
                    'ip': self.get_client_ip(request),
                    'user': user_info['username'],
                    'status': response.status_code,
                }
            )
        
        return response
    
    @staticmethod
    def get_client_ip(request):
        """Obtiene la IP real del cliente (considerando proxies)."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'unknown')
        return ip


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware para agregar headers de seguridad.
    Cumple con OWASP A05:2021 (Security Misconfiguration).
    """
    
    def process_response(self, request, response):
        """Agrega headers de seguridad a todas las respuestas."""
        
        # X-Content-Type-Options
        response['X-Content-Type-Options'] = 'nosniff'
        
        # X-Frame-Options
        response['X-Frame-Options'] = 'DENY'
        
        # X-XSS-Protection (legacy pero aún útil)
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer-Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Permissions-Policy (Feature-Policy deprecated)
        response['Permissions-Policy'] = (
            'geolocation=(), microphone=(), camera=(), payment=()'
        )
        
        # Content-Security-Policy (CSP)
        # Ajustar según necesidades del frontend
        if not request.path.startswith('/admin/'):
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self'; "
                "frame-ancestors 'none';"
            )
        
        # Strict-Transport-Security (HSTS) - solo en HTTPS
        if request.is_secure():
            response['Strict-Transport-Security'] = (
                'max-age=31536000; includeSubDomains; preload'
            )
        
        return response


class RateLimitByUserMiddleware(MiddlewareMixin):
    """
    Middleware para rate limiting por usuario (no solo IP).
    Complementa django-ratelimit.
    """
    
    CACHE_PREFIX = 'ratelimit_user'
    MAX_REQUESTS = 100
    TIME_WINDOW = 60  # seconds
    
    def process_request(self, request):
        """Verifica rate limit por usuario autenticado."""
        from django.core.cache import cache
        from django.http import JsonResponse
        
        # Solo para usuarios autenticados
        if not request.user or isinstance(request.user, AnonymousUser):
            return None
        
        # Solo para endpoints /api/
        if not request.path.startswith('/api/'):
            return None
        
        # Clave de cache única por usuario
        cache_key = f"{self.CACHE_PREFIX}:{request.user.id}"
        
        # Obtener contador actual
        current_requests = cache.get(cache_key, 0)
        
        if current_requests >= self.MAX_REQUESTS:
            security_logger.warning(
                f"Rate limit exceeded by user: {request.user.username}",
                extra={
                    'user_id': request.user.id,
                    'requests': current_requests,
                }
            )
            return JsonResponse(
                {
                    'error': 'Rate limit exceeded',
                    'detail': f'Too many requests. Try again in {self.TIME_WINDOW} seconds.',
                },
                status=429
            )
        
        # Incrementar contador
        cache.set(cache_key, current_requests + 1, self.TIME_WINDOW)
        
        return None
