#!/usr/bin/env python
"""
Script de validación de credenciales y configuración para producción
Verifica que todas las variables de entorno necesarias estén configuradas
"""

import os
import sys
from pathlib import Path

# Colores para terminal
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_header(text):
    print(f"\n{BLUE}{'=' * 70}{RESET}")
    print(f"{BLUE}{text.center(70)}{RESET}")
    print(f"{BLUE}{'=' * 70}{RESET}\n")

def print_success(text):
    print(f"{GREEN}✓ {text}{RESET}")

def print_error(text):
    print(f"{RED}✗ {text}{RESET}")

def print_warning(text):
    print(f"{YELLOW}⚠ {text}{RESET}")

def check_env_var(var_name, required=True, secret=False, default=None):
    """Verifica si una variable de entorno está configurada"""
    value = os.getenv(var_name, default)
    
    if value is None or value == '':
        if required:
            print_error(f"{var_name}: NO CONFIGURADA (REQUERIDA)")
            return False
        else:
            print_warning(f"{var_name}: No configurada (opcional)")
            return True
    else:
        if secret:
            print_success(f"{var_name}: Configurada (***valor oculto***)")
        else:
            print_success(f"{var_name}: {value}")
        return True

def check_file_exists(filepath, description):
    """Verifica si un archivo existe"""
    if Path(filepath).exists():
        print_success(f"{description}: ENCONTRADO")
        return True
    else:
        print_error(f"{description}: NO ENCONTRADO")
        return False

def main():
    print_header("VALIDACIÓN DE CREDENCIALES Y CONFIGURACIÓN")
    
    # Detectar entorno
    env = os.getenv('DJANGO_SETTINGS_MODULE', 'backend_project.settings.development')
    is_production = 'production' in env
    is_development = 'development' in env
    
    print(f"Entorno detectado: {YELLOW}{env}{RESET}")
    print(f"Modo producción: {YELLOW}{is_production}{RESET}")
    
    all_valid = True
    
    # ==========================================
    # 1. ARCHIVOS DE CONFIGURACIÓN
    # ==========================================
    print_header("1. ARCHIVOS DE CONFIGURACIÓN")
    
    backend_dir = Path(__file__).resolve().parent
    env_file = backend_dir / '.env'
    
    if check_file_exists(env_file, "Archivo .env"):
        print(f"   Ubicación: {env_file}")
    else:
        print_warning(f"   Crea el archivo .env copiando .env.example")
        print(f"   cp .env.example .env")
        all_valid = False
    
    # ==========================================
    # 2. VARIABLES DJANGO BÁSICAS
    # ==========================================
    print_header("2. VARIABLES DJANGO BÁSICAS")
    
    all_valid &= check_env_var('DJANGO_SECRET_KEY', required=True, secret=True)
    all_valid &= check_env_var('DEBUG', required=False, default='False')
    all_valid &= check_env_var('ALLOWED_HOSTS', required=True)
    
    # ==========================================
    # 3. BASE DE DATOS
    # ==========================================
    print_header("3. CONFIGURACIÓN DE BASE DE DATOS")
    
    if is_production:
        print("Producción requiere PostgreSQL:")
        all_valid &= check_env_var('POSTGRES_DB', required=True)
        all_valid &= check_env_var('POSTGRES_USER', required=True)
        all_valid &= check_env_var('POSTGRES_PASSWORD', required=True, secret=True)
        all_valid &= check_env_var('POSTGRES_HOST', required=True)
        all_valid &= check_env_var('POSTGRES_PORT', required=False, default='5432')
        
        # Verificar conexión PostgreSQL
        try:
            import psycopg2
            conn_params = {
                'dbname': os.getenv('POSTGRES_DB'),
                'user': os.getenv('POSTGRES_USER'),
                'password': os.getenv('POSTGRES_PASSWORD'),
                'host': os.getenv('POSTGRES_HOST'),
                'port': os.getenv('POSTGRES_PORT', '5432'),
            }
            conn = psycopg2.connect(**conn_params)
            conn.close()
            print_success("Conexión a PostgreSQL: EXITOSA")
        except ImportError:
            print_warning("psycopg2 no instalado - no se puede verificar conexión")
        except Exception as e:
            print_error(f"Error conectando a PostgreSQL: {e}")
            all_valid = False
    else:
        print("Desarrollo usa SQLite por defecto")
        db_path = backend_dir / 'db.sqlite3'
        if db_path.exists():
            print_success(f"Base de datos SQLite encontrada: {db_path}")
        else:
            print_warning("Base de datos SQLite no existe aún (se creará con migrate)")
    
    # ==========================================
    # 4. CORS Y FRONTEND
    # ==========================================
    print_header("4. CONFIGURACIÓN CORS Y FRONTEND")
    
    all_valid &= check_env_var('CORS_ALLOWED_ORIGINS', required=True)
    
    # ==========================================
    # 5. JWT AUTHENTICATION
    # ==========================================
    print_header("5. JWT AUTHENTICATION")
    
    all_valid &= check_env_var('JWT_SECRET_KEY', required=False, secret=True)
    
    # Verificar que JWT_SECRET_KEY sea diferente de DJANGO_SECRET_KEY
    django_secret = os.getenv('DJANGO_SECRET_KEY')
    jwt_secret = os.getenv('JWT_SECRET_KEY')
    
    if django_secret and jwt_secret and django_secret == jwt_secret:
        print_error("JWT_SECRET_KEY debe ser diferente de DJANGO_SECRET_KEY")
        all_valid = False
    
    # ==========================================
    # 6. REDIS Y CACHE (Opcional en desarrollo)
    # ==========================================
    print_header("6. REDIS Y CACHÉ")
    
    if is_production:
        all_valid &= check_env_var('REDIS_URL', required=True)
        check_env_var('REDIS_PASSWORD', required=False, secret=True)
        
        # Verificar conexión Redis
        try:
            import redis
            redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
            r = redis.from_url(redis_url)
            r.ping()
            print_success("Conexión a Redis: EXITOSA")
        except ImportError:
            print_warning("redis no instalado - no se puede verificar conexión")
        except Exception as e:
            print_error(f"Error conectando a Redis: {e}")
            all_valid = False
    else:
        print("Redis es opcional en desarrollo")
        check_env_var('REDIS_URL', required=False)
    
    # ==========================================
    # 7. EMAIL (Opcional pero recomendado en producción)
    # ==========================================
    print_header("7. CONFIGURACIÓN DE EMAIL")
    
    if is_production:
        print("Configuración de email (recomendado para producción):")
        check_env_var('EMAIL_HOST', required=False)
        check_env_var('EMAIL_PORT', required=False, default='587')
        check_env_var('EMAIL_HOST_USER', required=False)
        check_env_var('EMAIL_HOST_PASSWORD', required=False, secret=True)
        check_env_var('DEFAULT_FROM_EMAIL', required=False)
    else:
        print("Email es opcional en desarrollo")
    
    # ==========================================
    # 8. CELERY (Opcional)
    # ==========================================
    print_header("8. CELERY (TAREAS ASÍNCRONAS)")
    
    check_env_var('CELERY_BROKER_URL', required=False)
    check_env_var('CELERY_RESULT_BACKEND', required=False)
    
    # ==========================================
    # 9. SEGURIDAD ADICIONAL
    # ==========================================
    print_header("9. CONFIGURACIÓN DE SEGURIDAD")
    
    check_env_var('QR_HMAC_SECRET', required=False, secret=True)
    check_env_var('QR_TTL_MINUTES', required=False, default='30')
    
    if is_production:
        check_env_var('ADMIN_URL', required=False, default='admin/')
        check_env_var('SENTRY_DSN', required=False, secret=True)
    
    # ==========================================
    # 10. VERIFICAR MIGRACIONES
    # ==========================================
    print_header("10. ESTADO DE MIGRACIONES")
    
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', env)
        import django
        django.setup()
        
        from django.core.management import call_command
        from io import StringIO
        
        # Verificar migraciones pendientes
        out = StringIO()
        call_command('showmigrations', '--plan', stdout=out)
        output = out.getvalue()
        
        if '[ ]' in output:
            print_warning("HAY MIGRACIONES PENDIENTES")
            print("   Ejecuta: python manage.py migrate")
        else:
            print_success("Todas las migraciones aplicadas")
            
    except Exception as e:
        print_error(f"No se pudo verificar migraciones: {e}")
    
    # ==========================================
    # RESUMEN FINAL
    # ==========================================
    print_header("RESUMEN")
    
    if all_valid:
        print_success("✅ TODAS LAS VALIDACIONES PASARON")
        print("\nPróximos pasos:")
        print("1. Ejecutar migraciones: python manage.py migrate")
        print("2. Crear superusuario: python manage.py createsuperuser")
        print("3. Recopilar archivos estáticos: python manage.py collectstatic")
        print("4. Iniciar servidor: python manage.py runserver")
        return 0
    else:
        print_error("❌ ALGUNAS VALIDACIONES FALLARON")
        print("\nAcciones requeridas:")
        print("1. Revisa los errores marcados con ✗")
        print("2. Configura las variables faltantes en .env")
        print("3. Vuelve a ejecutar este script")
        return 1

if __name__ == '__main__':
    sys.exit(main())
