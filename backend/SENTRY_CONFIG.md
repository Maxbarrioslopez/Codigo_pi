# -*- coding: utf-8 -*-
"""
Configuración de Sentry para monitoreo de errores en producción.
"""

# backend_project/settings/production.py
"""
Agregar al final del archivo:

import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.redis import RedisIntegration

sentry_sdk.init(
    dsn=get_env('SENTRY_DSN'),
    integrations=[
        DjangoIntegration(),
        CeleryIntegration(),
        RedisIntegration(),
    ],
    environment=get_env('ENVIRONMENT', 'production'),
    traces_sample_rate=0.1,  # 10% de transacciones
    profiles_sample_rate=0.1,  # 10% de perfiles
    send_default_pii=False,  # No enviar información personal
    before_send=filter_sensitive_data,
)

def filter_sensitive_data(event, hint):
    # Filtrar datos sensibles antes de enviar a Sentry
    if 'request' in event:
        headers = event['request'].get('headers', {})
        headers.pop('Authorization', None)
        headers.pop('Cookie', None)
    return event
"""

# Instalación:
# pip install sentry-sdk[django]

# TODO: Configurar Sentry DSN en .env
# TODO: Implementar filter_sensitive_data completo
# TODO: Agregar Sentry al requirements.txt
