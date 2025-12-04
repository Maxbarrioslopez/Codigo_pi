"""
Production settings for Tótem Digital.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = get_env_list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

# Database - PostgreSQL required for production
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': get_env('POSTGRES_DB', default='totem_production'),
        'USER': get_env('POSTGRES_USER', default='postgres'),
        'PASSWORD': get_env('POSTGRES_PASSWORD', default='postgres'),
        'HOST': get_env('POSTGRES_HOST', default='localhost'),
        'PORT': get_env('POSTGRES_PORT', default='5432'),
        'CONN_MAX_AGE': 600,  # Persistent connections
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000',  # 30 seconds
        },
    }
}

# Security Settings
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'

CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'

# CORS - Strict origins only
CORS_ALLOWED_ORIGINS = get_env_list('CORS_ALLOWED_ORIGINS', default=['http://localhost:3000', 'http://localhost:5173'])
CORS_ALLOW_CREDENTIALS = True

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = get_env('EMAIL_HOST', default='localhost')
EMAIL_PORT = get_env_int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = get_env_bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = get_env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = get_env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = get_env('DEFAULT_FROM_EMAIL', default='noreply@totem.local')

# Static files - Use WhiteNoise for serving
try:
    import whitenoise
    MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
except ImportError:
    pass

# Cache - Redis required
try:
    import django_redis
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': get_env('REDIS_URL', default='redis://localhost:6379/1'),
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'SOCKET_CONNECT_TIMEOUT': 5,
                'SOCKET_TIMEOUT': 5,
                'CONNECTION_POOL_CLASS_KWARGS': {
                    'max_connections': 100,
                },
                'PASSWORD': get_env('REDIS_PASSWORD', default=None),
            },
            'KEY_PREFIX': 'totem_prod',
            'TIMEOUT': 300,
        }
    }
except ImportError:
    pass

# Celery - Production configuration
try:
    import celery
    CELERY_BROKER_URL = get_env('CELERY_BROKER_URL', default='redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = get_env('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
    CELERY_TASK_ALWAYS_EAGER = False
except ImportError:
    pass

# Logging - Production logging
# Use system logs if available, otherwise use local logs directory
import os
from pathlib import Path

log_dir = Path('/var/log/totem') if Path('/var/log/totem').exists() or os.geteuid() == 0 else (BASE_DIR / 'logs')
log_dir.mkdir(exist_ok=True, parents=True)

LOGGING['handlers']['file']['filename'] = str(log_dir / 'django.log')
LOGGING['handlers']['audit_file']['filename'] = str(log_dir / 'audit.log')
LOGGING['handlers']['security_file']['filename'] = str(log_dir / 'security.log')

# Error tracking with Sentry (optional)
sentry_dsn = get_env('SENTRY_DSN', None)
if sentry_dsn:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.celery import CeleryIntegration
        
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[
                DjangoIntegration(),
                CeleryIntegration(),
            ],
            traces_sample_rate=0.1,
            send_default_pii=False,
            environment='production',
        )
    except ImportError:
        pass

# Admin Security
ADMIN_URL = get_env('ADMIN_URL', 'admin/')

# Performance
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB

# JWT - Strict timing for production
SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'] = timedelta(minutes=15)
SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'] = timedelta(days=7)
