"""
Script para listar todos los usuarios del sistema
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from totem.models import Usuario

def list_users():
    users = Usuario.objects.all()
    print(f'\n{"=" * 80}')
    print(f'USUARIOS EN EL SISTEMA: {users.count()}')
    print(f'{"=" * 80}\n')
    
    for u in users:
        print(f'ID: {u.id}')
        print(f'Username: {u.username}')
        print(f'Email: {u.email}')
        print(f'Nombre: {u.first_name} {u.last_name}')
        print(f'Rol: {u.rol}')
        print(f'Activo: {u.is_active}')
        print(f'Superuser: {u.is_superuser}')
        print(f'Último login: {u.last_login}')
        print(f'Creado: {u.date_joined}')
        print(f'{"=" * 80}\n')

if __name__ == '__main__':
    list_users()
