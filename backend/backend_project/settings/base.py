"""
Base settings for Tótem Digital.
Shared across all environments.
"""

import os
from pathlib import Path
from datetime import timedelta

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Ensure log directories exist
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

# Try to import django-environ, fallback to python-decouple
try:
    import environ
    
    env = environ.Env(
        # Set default values and casting
        DEBUG=(bool, False),
        USE_POSTGRES=(bool, False),
        ALLOWED_HOSTS=(list, ['localhost', '127.0.0.1']),
        CORS_ALLOWED_ORIGINS=(list, ['http://localhost:5173']),
    )
    
    # Read .env file
    environ.Env.read_env(os.path.join(BASE_DIR, '.env'))
    
    # Helper functions for compatibility
    def get_env(key, default=None, cast=None):
        return env(key, default=default, cast=cast) if cast else env(key, default=default)
    
    def get_env_list(key, default=None):
        return env.list(key, default=default or [])
    
    def get_env_int(key, default=None):
        return env.int(key, default=default)
    
    def get_env_bool(key, default=False):
        return env.bool(key, default=default)
        
except ImportError:
    # Fallback to python-decouple
    from decouple import config, Csv
    
    def get_env(key, default=None, cast=None):
        return config(key, default=default, cast=cast or str)
    
    def get_env_list(key, default=None):
        return config(key, default=','.join(default or []), cast=Csv())
    
    def get_env_int(key, default=None):
        return config(key, default=default, cast=int)
    
    def get_env_bool(key, default=False):
        return config(key, default=default, cast=bool)

# SECURITY WARNING: keep the secret key used in production secret!
# Fallback to a default for development if not set
SECRET_KEY = get_env('DJANGO_SECRET_KEY', default='django-insecure-development-key-change-in-production')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',
    
    # Local apps
    'totem',
    'guardia',
    'rrhh',
]

# Conditional apps (only if installed)
try:
    import rest_framework_simplejwt.token_blacklist
    INSTALLED_APPS.append('rest_framework_simplejwt.token_blacklist')
except ImportError:
    pass

try:
    import django_ratelimit
    INSTALLED_APPS.append('django_ratelimit')
except ImportError:
    pass

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Try to add custom middlewares if they exist
# Don't import here to avoid AppRegistryNotReady
try:
    # Just check if file exists, don't import yet
    import os
    middleware_file = BASE_DIR / 'totem' / 'middleware.py'
    if os.path.exists(middleware_file):
        MIDDLEWARE.extend([
            'totem.middleware.AuditLoggingMiddleware',
            'totem.middleware.SecurityHeadersMiddleware',
        ])
except Exception:
    pass

ROOT_URLCONF = 'backend_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend_project.wsgi.application'

# Database
# Override in specific settings files
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'es-CL'
TIME_ZONE = 'America/Santiago'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = []  # No custom static dirs in this project

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'totem.Usuario'

# CORS Configuration
CORS_ALLOWED_ORIGINS = get_env_list('CORS_ALLOWED_ORIGINS', ['http://localhost:5173', 'http://127.0.0.1:5173'])
CORS_ALLOW_CREDENTIALS = True
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

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'totem.pagination.StandardResultsSetPagination',
    'EXCEPTION_HANDLER': 'totem.exceptions.custom_exception_handler',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'auth': '10/minute',  # Autenticación
        'ticket_create': '20/hour',  # Creación de tickets
        'qr_validation': '100/hour',  # Validación QR
        'reports': '30/hour',  # Generación de reportes
        'nomina_upload': '5/hour',  # Carga de nómina
        'stock_movement': '50/hour',  # Movimientos de stock
        'burst': '60/minute',  # Límite de ráfaga
        'sustained': '1000/hour',  # Límite sostenido
    },
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),  # Reduced from 8h to 30min
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,  # Enable only if token_blacklist installed
    'UPDATE_LAST_LOGIN': True,
    'SIGNING_KEY': get_env('JWT_SECRET_KEY', SECRET_KEY),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# Enable blacklist if module is installed
try:
    import rest_framework_simplejwt.token_blacklist
    SIMPLE_JWT['BLACKLIST_AFTER_ROTATION'] = True
except ImportError:
    pass

# Spectacular (OpenAPI) Configuration
SPECTACULAR_SETTINGS = {
    'TITLE': 'Tótem Digital API',
    'DESCRIPTION': 'API para sistema de retiro digital de beneficios',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': '/api/',
}

# Cache Configuration (Redis or Local Memory)
try:
    import django_redis
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': get_env('REDIS_URL', 'redis://127.0.0.1:6379/1'),
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'SOCKET_CONNECT_TIMEOUT': 5,
                'SOCKET_TIMEOUT': 5,
                'CONNECTION_POOL_CLASS_KWARGS': {
                    'max_connections': 50,
                },
            },
            'KEY_PREFIX': 'totem',
            'TIMEOUT': 300,  # 5 minutes default
        }
    }
except ImportError:
    # Fallback to local memory cache
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'totem-cache',
        }
    }

# Celery Configuration (only if Celery is installed)
try:
    import celery
    
    CELERY_BROKER_URL = get_env('CELERY_BROKER_URL', 'redis://127.0.0.1:6379/0')
    CELERY_RESULT_BACKEND = get_env('CELERY_RESULT_BACKEND', 'redis://127.0.0.1:6379/0')
    CELERY_ACCEPT_CONTENT = ['json']
    CELERY_TASK_SERIALIZER = 'json'
    CELERY_RESULT_SERIALIZER = 'json'
    CELERY_TIMEZONE = TIME_ZONE
    CELERY_ENABLE_UTC = True
    CELERY_TASK_TRACK_STARTED = True
    CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes
    CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60  # 25 minutes
    
    # Celery Beat Schedule
    from celery.schedules import crontab
    CELERY_BEAT_SCHEDULE = {
        'expirar-tickets-cada-5-minutos': {
            'task': 'totem.tasks.expirar_tickets_automatico',
            'schedule': crontab(minute='*/5'),
        },
        'marcar-agendamientos-vencidos-diariamente': {
            'task': 'totem.tasks.marcar_agendamientos_vencidos',
            'schedule': crontab(hour=0, minute=0),
        },
    }
except ImportError:
    # Celery not installed, skip configuration
    pass

# Security Settings
QR_HMAC_SECRET = get_env('QR_HMAC_SECRET', 'change-me-in-production')
QR_TTL_MINUTES = get_env_int('QR_TTL_MINUTES', 30)

# Operational Settings
MAX_AGENDAMIENTOS_PER_DAY = get_env_int('MAX_AGENDAMIENTOS_PER_DAY', 50)
MAX_AGENDAMIENTOS_PER_WORKER = get_env_int('MAX_AGENDAMIENTOS_PER_WORKER', 1)

# Session Security
SESSION_COOKIE_SECURE = False  # Override in production
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# CSRF Security
CSRF_COOKIE_SECURE = False  # Override in production
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

# Security Headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# File Upload Settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
FILE_UPLOAD_PERMISSIONS = 0o644
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif']

# Logging Configuration (Structured Logging)
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {name} {module} {funcName} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'audit_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'audit.log',
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 10,
            'formatter': 'json',
        },
        'security_file': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'security.log',
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 10,
            'formatter': 'json',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['file', 'security_file'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['security_file'],
            'level': 'WARNING',
            'propagate': False,
        },
        'totem': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'audit': {
            'handlers': ['audit_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
}
