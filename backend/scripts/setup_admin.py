"""
Script para verificar o crear usuario admin con rol correcto.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings.development')
sys.path.insert(0, r'c:\Users\Maxi Barrios\Documents\Codigo_pi\backend')
django.setup()

from totem.models import Usuario

username = 'admin'
try:
    u = Usuario.objects.get(username=username)
    print(f"Usuario {username} existe. Rol actual: {u.rol}")
    if u.rol != Usuario.Roles.ADMIN:
        u.rol = Usuario.Roles.ADMIN
        u.save()
        print(f"Rol actualizado a {u.rol}")
    if not u.is_staff:
        u.is_staff = True
        u.save()
        print("is_staff ahora True")
    if not u.is_superuser:
        u.is_superuser = True
        u.save()
        print("is_superuser ahora True")
    print("Usuario admin configurado correctamente.")
except Usuario.DoesNotExist:
    u = Usuario.objects.create_superuser(username=username, password='admin123', email='admin@totem.local', rol=Usuario.Roles.ADMIN)
    print(f"Usuario admin creado con rol {u.rol}")
