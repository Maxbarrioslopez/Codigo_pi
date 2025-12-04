#!/usr/bin/env python
"""
Generador de claves secretas para Django
Ejecutar: python generar_secrets.py
"""

import secrets
import string

def generate_secret_key(length=50):
    """Genera una clave secreta aleatoria"""
    chars = string.ascii_letters + string.digits + '!@#$%^&*(-_=+)'
    return ''.join(secrets.choice(chars) for _ in range(length))

def generate_django_secret():
    """Genera una secret key compatible con Django"""
    chars = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)'
    return ''.join(secrets.choice(chars) for _ in range(50))

print("=" * 70)
print("GENERADOR DE CLAVES SECRETAS PARA PRODUCCIÓN")
print("=" * 70)
print()

print("1. DJANGO_SECRET_KEY (para settings.py):")
print("-" * 70)
django_key = generate_django_secret()
print(django_key)
print()

print("2. JWT_SECRET_KEY (para autenticación JWT):")
print("-" * 70)
jwt_key = generate_django_secret()
print(jwt_key)
print()

print("3. QR_HMAC_SECRET (para firma de QR codes):")
print("-" * 70)
qr_key = generate_django_secret()
print(qr_key)
print()

print("4. POSTGRES_PASSWORD (contraseña base de datos):")
print("-" * 70)
db_password = generate_secret_key(24)
print(db_password)
print()

print("=" * 70)
print("INSTRUCCIONES:")
print("=" * 70)
print("1. Copia estas claves al archivo .env")
print("2. NUNCA compartas estas claves ni las subas a Git")
print("3. Usa claves diferentes para cada entorno (dev/staging/prod)")
print("4. Guarda estas claves en un lugar seguro (password manager)")
print()

# Generar un .env de ejemplo con las claves
env_content = f"""# Generado automáticamente - NO SUBIR A GIT
# Fecha: {__import__('datetime').datetime.now().isoformat()}

# ================================================
# DJANGO - CONFIGURACIÓN BÁSICA
# ================================================
DJANGO_SETTINGS_MODULE=backend_project.settings.production
DEBUG=False

DJANGO_SECRET_KEY={django_key}

ALLOWED_HOSTS=localhost,127.0.0.1,tu-dominio.com

# ================================================
# BASE DE DATOS POSTGRESQL
# ================================================
POSTGRES_DB=totem_production
POSTGRES_USER=totem_user
POSTGRES_PASSWORD={db_password}
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# ================================================
# CORS - FRONTEND
# ================================================
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://tu-dominio.com

# ================================================
# JWT - AUTENTICACIÓN
# ================================================
JWT_SECRET_KEY={jwt_key}

# ================================================
# REDIS
# ================================================
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=

# ================================================
# CELERY
# ================================================
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# ================================================
# EMAIL (Configurar según tu proveedor)
# ================================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-password-de-aplicacion
DEFAULT_FROM_EMAIL=noreply@tu-dominio.com

# ================================================
# SEGURIDAD ADICIONAL
# ================================================
ADMIN_URL=admin-{secrets.token_hex(8)}/
SENTRY_DSN=

QR_HMAC_SECRET={qr_key}
QR_TTL_MINUTES=30

# ================================================
# CONFIGURACIÓN OPERACIONAL
# ================================================
MAX_AGENDAMIENTOS_PER_DAY=50
MAX_AGENDAMIENTOS_PER_WORKER=1
"""

# Guardar en archivo
output_file = '.env.generated'
with open(output_file, 'w') as f:
    f.write(env_content)

print(f"✅ Archivo '{output_file}' creado con las claves generadas")
print()
print("⚠️  IMPORTANTE:")
print(f"   1. Renombra '{output_file}' a '.env':")
print(f"      mv {output_file} .env")
print("   2. Ajusta ALLOWED_HOSTS y CORS_ALLOWED_ORIGINS con tus dominios")
print("   3. Configura las credenciales de email si las necesitas")
print("   4. Verifica la configuración con: python validar_credenciales.py")
print()
