#!/usr/bin/env python
"""Script para resetear contraseñas de usuarios"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

passwords = {
    'admin': 'admin123',
    'guardia': 'guardia123',
    'rrhh': 'rrhh123',
}

for username, password in passwords.items():
    try:
        user = User.objects.get(username=username)
        user.set_password(password)
        user.is_active = True
        user.activo = True
        user.save()
        print(f'✓ {username}: contraseña actualizada a "{password}" (is_active={user.is_active})')
    except User.DoesNotExist:
        print(f'✗ Usuario {username} no existe')

print('\n✅ Contraseñas reseteadas correctamente')
print('Puedes usar ahora:')
print('  - admin / admin123')
print('  - guardia / guardia123')
print('  - rrhh / rrhh123')
