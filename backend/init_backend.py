"""
Script de inicialización rápida del backend.
Elimina la DB corrupta, aplica migraciones y crea usuario admin.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from django.core.management import call_command
from totem.models import Usuario, Sucursal

print("=== Inicialización del Backend ===\n")

# 1. Aplicar migraciones
print("1. Aplicando migraciones...")
try:
    call_command('migrate', '--noinput', verbosity=0)
    print("   ✓ Migraciones aplicadas\n")
except Exception as e:
    print(f"   ✗ Error en migraciones: {e}\n")
    print("   Nota: Si el servidor está corriendo, detenlo primero.\n")
    sys.exit(1)

# 2. Crear sucursal principal
print("2. Creando sucursal principal...")
sucursal, created = Sucursal.objects.get_or_create(
    codigo='SUC001',
    defaults={'nombre': 'Sucursal Principal'}
)
if created:
    print(f"   ✓ Sucursal creada: {sucursal}\n")
else:
    print(f"   • Sucursal ya existe: {sucursal}\n")

# 3. Crear usuario admin
print("3. Creando usuario administrador...")
if Usuario.objects.filter(username='admin').exists():
    print("   • Usuario 'admin' ya existe\n")
    admin_user = Usuario.objects.get(username='admin')
else:
    admin_user = Usuario.objects.create_superuser(
        username='admin',
        email='admin@tmluc.cl',
        password='admin123',
        rol='admin',
        first_name='Administrador',
        last_name='Sistema',
        sucursal=sucursal
    )
    print(f"   ✓ Usuario creado: {admin_user.username}\n")

# 4. Mostrar credenciales
print("=== Credenciales de Acceso ===")
print("Username: admin")
print("Password: admin123")
print("Rol:      admin")
print(f"Email:    {admin_user.email}\n")

print("✓ Backend inicializado correctamente")
print("  Servidor: http://127.0.0.1:8000/")
print("  API:      http://127.0.0.1:8000/api/")
