"""
Script de verificación de instalación del backend.
Verifica que todas las dependencias y configuraciones estén correctas.
"""

import sys
import os

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def check_python_version():
    print("✓ Verificando versión de Python...")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 10:
        print(f"  ✅ Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"  ❌ Python {version.major}.{version.minor}.{version.micro} (se requiere 3.10+)")
        return False

def check_dependencies():
    print("\n✓ Verificando dependencias instaladas...")
    required = {
        'django': 'Django',
        'rest_framework': 'Django REST Framework',
        'rest_framework_simplejwt': 'JWT',
        'corsheaders': 'CORS Headers',
        'environ': 'django-environ',
        'redis': 'Redis',
        'celery': 'Celery',
        'bleach': 'Bleach',
        'qrcode': 'QRCode',
        'PIL': 'Pillow',
        'drf_spectacular': 'DRF Spectacular',
    }
    
    missing = []
    for module, name in required.items():
        try:
            __import__(module)
            print(f"  ✅ {name}")
        except ImportError:
            print(f"  ❌ {name} - NO INSTALADO")
            missing.append(name)
    
    if missing:
        print(f"\n  ⚠️ Faltan {len(missing)} dependencias")
        print(f"  Ejecutar: pip install -r requirements/development.txt")
        return False
    return True

def check_env_file():
    print("\n✓ Verificando archivo .env...")
    if os.path.exists('.env'):
        print("  ✅ Archivo .env encontrado")
        
        # Verificar variables críticas
        with open('.env', 'r') as f:
            content = f.read()
            
        critical_vars = [
            'DJANGO_SECRET_KEY',
            'QR_HMAC_SECRET',
        ]
        
        missing_vars = []
        for var in critical_vars:
            if var not in content:
                missing_vars.append(var)
                print(f"  ❌ Variable {var} no encontrada")
            else:
                print(f"  ✅ Variable {var} configurada")
        
        if missing_vars:
            print(f"\n  ⚠️ Faltan {len(missing_vars)} variables críticas")
            return False
        return True
    else:
        print("  ❌ Archivo .env NO encontrado")
        print("  Ejecutar: cp .env.example .env")
        return False

def check_database():
    print("\n✓ Verificando conexión a base de datos...")
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
        import django
        django.setup()
        
        from django.db import connection
        connection.ensure_connection()
        print("  ✅ Conexión a base de datos exitosa")
        return True
    except Exception as e:
        print(f"  ❌ Error conectando a DB: {e}")
        print("  Ejecutar: python manage.py migrate")
        return False

def check_migrations():
    print("\n✓ Verificando migraciones...")
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
        import django
        django.setup()
        
        from django.core.management import call_command
        from io import StringIO
        
        out = StringIO()
        call_command('showmigrations', '--plan', stdout=out)
        output = out.getvalue()
        
        if '[X]' in output or '[ ]' not in output:
            print("  ✅ Todas las migraciones aplicadas")
            return True
        else:
            print("  ⚠️ Hay migraciones pendientes")
            print("  Ejecutar: python manage.py migrate")
            return False
    except Exception as e:
        print(f"  ❌ Error verificando migraciones: {e}")
        return False

def check_redis():
    print("\n✓ Verificando Redis (opcional)...")
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
        print("  ✅ Redis disponible")
        return True
    except Exception as e:
        print(f"  ⚠️ Redis no disponible (opcional en desarrollo)")
        print(f"  Se usará LocMemCache automáticamente")
        return True  # No es crítico

def check_logs_directory():
    print("\n✓ Verificando directorio de logs...")
    if os.path.exists('logs'):
        print("  ✅ Directorio logs/ existe")
        return True
    else:
        print("  ⚠️ Directorio logs/ no existe")
        print("  Creando...")
        try:
            os.makedirs('logs')
            print("  ✅ Directorio logs/ creado")
            return True
        except Exception as e:
            print(f"  ❌ Error creando directorio: {e}")
            return False

def main():
    print_header("VERIFICACIÓN DE INSTALACIÓN - TÓTEM DIGITAL BACKEND")
    
    checks = [
        ("Versión de Python", check_python_version),
        ("Dependencias", check_dependencies),
        ("Archivo .env", check_env_file),
        ("Directorio logs", check_logs_directory),
        ("Base de datos", check_database),
        ("Migraciones", check_migrations),
        ("Redis", check_redis),
    ]
    
    results = []
    for name, func in checks:
        try:
            result = func()
            results.append((name, result))
        except Exception as e:
            print(f"  ❌ Error en verificación: {e}")
            results.append((name, False))
    
    # Resumen
    print_header("RESUMEN")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}  {name}")
    
    print(f"\n  Total: {passed}/{total} verificaciones exitosas")
    
    if passed == total:
        print("\n  🎉 ¡Instalación completa y correcta!")
        print("  Ejecutar: python manage.py runserver")
        return 0
    else:
        print("\n  ⚠️ Hay problemas que requieren atención")
        print("  Ver mensajes arriba para soluciones")
        return 1

if __name__ == '__main__':
    sys.exit(main())
