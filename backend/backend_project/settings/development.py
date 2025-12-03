"""
Development settings for Tótem Digital.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = get_env_bool('DEBUG', True)

ALLOWED_HOSTS = get_env_list('ALLOWED_HOSTS', ['localhost', '127.0.0.1', '0.0.0.0'])

# Database - SQLite for development
if not get_env_bool('USE_POSTGRES', False):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': get_env('POSTGRES_DB'),
            'USER': get_env('POSTGRES_USER'),
            'PASSWORD': get_env('POSTGRES_PASSWORD'),
            'HOST': get_env('POSTGRES_HOST', 'localhost'),
            'PORT': get_env('POSTGRES_PORT', '5432'),
            'CONN_MAX_AGE': 0,  # No persistent connections in dev
        }
    }

# Development-specific apps
try:
    import django_extensions
    INSTALLED_APPS += ['django_extensions']
except ImportError:
    pass

# CORS - Allow all origins in development for easier testing
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

print("🔧 CORS Configuration Applied in Development Settings")
print(f"CORS_ALLOW_ALL_ORIGINS: {CORS_ALLOW_ALL_ORIGINS}")

# Email backend for development (console)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Cache - Use local memory cache for development
# Note: django-ratelimit requires Redis. In development, we'll silence the warnings.
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'totem-dev-cache',
    }
}

# Silence django-ratelimit cache warnings in development
SILENCED_SYSTEM_CHECKS = ['django_ratelimit.E003', 'django_ratelimit.W001']

# Disable throttling and rate limiting in development
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {}

# Celery - Eager mode for development (synchronous)
try:
    import celery
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True
except ImportError:
    pass

# Logging - More verbose in development
LOGGING['loggers']['totem']['level'] = 'DEBUG'
LOGGING['root']['level'] = 'DEBUG'

# JWT - Longer tokens for development convenience
SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'] = timedelta(hours=8)
SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'] = timedelta(days=30)

# Security - Relaxed for development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Debug Toolbar (optional)
if DEBUG and get_env_bool('USE_DEBUG_TOOLBAR', False):
    try:
        import debug_toolbar
        INSTALLED_APPS += ['debug_toolbar']
        MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
        INTERNAL_IPS = ['127.0.0.1', 'localhost']
    except ImportError:
        pass

# Disable throttling in development
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '1000/hour',
    'user': '10000/hour',
}
