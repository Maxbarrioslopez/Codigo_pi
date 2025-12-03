"""
Verificar estado del usuario admin
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from totem.models import Usuario

admin = Usuario.objects.get(username='admin')
print(f'\nUsername: {admin.username}')
print(f'Email: {admin.email}')
print(f'Is active: {admin.is_active}')
print(f'Check password "admin123": {admin.check_password("admin123")}')
print(f'Is superuser: {admin.is_superuser}')
