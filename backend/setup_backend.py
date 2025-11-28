#!/usr/bin/env python
"""
Script de setup automatizado para el backend del Sistema Tótem Digital.
Ejecutar: python setup_backend.py
"""
import os
import sys
import subprocess
import secrets
from pathlib import Path

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def run_command(cmd, description):
    """Ejecuta un comando y maneja errores."""
    print(f"→ {description}...")
    try:
        subprocess.run(cmd, check=True, shell=True)
        print(f"  ✓ {description} completado\n")
        return True
    except subprocess.CalledProcessError as e:
        print(f"  ✗ Error en {description}: {e}\n")
        return False

def generate_secret_key():
    """Genera una clave secreta segura."""
    return secrets.token_urlsafe(50)

def create_env_file():
    """Crea archivo .env si no existe."""
    env_path = Path('.env')
    env_example_path = Path('.env.example')
    
    if env_path.exists():
        print("  ⚠ Archivo .env ya existe. No se sobrescribirá.")
        return True
    
    if not env_example_path.exists():
        print("  ✗ Archivo .env.example no encontrado")
        return False
    
    # Leer template
    with open(env_example_path, 'r') as f:
        content = f.read()
    
    # Generar secrets
    django_secret = generate_secret_key()
    jwt_secret = generate_secret_key()
    hmac_secret = generate_secret_key()
    
    # Reemplazar valores
    content = content.replace(
        'DJANGO_SECRET_KEY=change-this-in-production-use-strong-random-key',
        f'DJANGO_SECRET_KEY={django_secret}'
    )
    content = content.replace(
        'JWT_SECRET_KEY=another-strong-secret-for-jwt-signing',
        f'JWT_SECRET_KEY={jwt_secret}'
    )
    content = content.replace(
        'QR_HMAC_SECRET=hmac-secret-for-qr-signing-change-in-production',
        f'QR_HMAC_SECRET={hmac_secret}'
    )
    
    # Escribir .env
    with open(env_path, 'w') as f:
        f.write(content)
    
    print("  ✓ Archivo .env creado con secrets seguros\n")
    return True

def main():
    print_header("SETUP BACKEND - SISTEMA TÓTEM DIGITAL")
    
    # Verificar que estamos en el directorio correcto
    if not Path('manage.py').exists():
        print("✗ Error: Este script debe ejecutarse desde el directorio backend/")
        sys.exit(1)
    
    # Paso 1: Instalar dependencias
    print_header("Paso 1: Instalando dependencias")
    if not run_command(
        'pip install -r requirements.txt',
        'Instalación de paquetes Python'
    ):
        print("⚠ Advertencia: Algunas dependencias pueden no haberse instalado correctamente")
    
    # Paso 2: Crear directorio de logs
    print_header("Paso 2: Creando estructura de directorios")
    os.makedirs('logs', exist_ok=True)
    print("  ✓ Directorio logs/ creado\n")
    
    # Paso 3: Crear archivo .env
    print_header("Paso 3: Configurando variables de entorno")
    create_env_file()
    
    # Paso 4: Migraciones
    print_header("Paso 4: Aplicando migraciones de base de datos")
    run_command('python manage.py makemigrations', 'Generando migraciones')
    run_command('python manage.py migrate', 'Aplicando migraciones')
    
    # Paso 5: Cargar fixtures
    print_header("Paso 5: Cargando datos iniciales")
    if Path('totem/fixtures/initial_data.json').exists():
        run_command(
            'python manage.py loaddata initial_data',
            'Cargando fixtures'
        )
    else:
        print("  ⚠ Archivo de fixtures no encontrado, saltando...\n")
    
    # Paso 6: Crear superusuario
    print_header("Paso 6: Crear superusuario")
    print("Ahora crearás un superusuario para acceder al admin.\n")
    run_command(
        'python manage.py createsuperuser',
        'Creación de superusuario'
    )
    
    # Resumen final
    print_header("✓ SETUP COMPLETADO")
    print("El backend está listo para usarse.\n")
    print("Próximos pasos:")
    print("  1. Revisar archivo .env y ajustar configuraciones si es necesario")
    print("  2. Si usas PostgreSQL, configurar USE_POSTGRES=1 y credenciales")
    print("  3. Ejecutar: python manage.py runserver 0.0.0.0:8000")
    print("  4. Acceder al admin en: http://localhost:8000/admin/")
    print("  5. Ver documentación API en: http://localhost:8000/api/docs/")
    print("\nCron jobs recomendados:")
    print("  - Expirar tickets: */5 * * * * python manage.py expirar_tickets")
    print("  - Marcar agendamientos vencidos: 0 0 * * * python manage.py marcar_agendamientos_vencidos")
    print("\n¡Listo! 🚀\n")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n✗ Setup cancelado por el usuario.\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error inesperado: {e}\n")
        sys.exit(1)
