"""
Script para resetear la contraseña del admin
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from totem.models import Usuario

def reset_admin():
    try:
        admin = Usuario.objects.get(username='admin')
        new_password = 'admin123'
        admin.set_password(new_password)
        admin.debe_cambiar_contraseña = False
        admin.save()
        
        print(f'\n{"=" * 80}')
        print('CONTRASEÑA RESETEADA EXITOSAMENTE')
        print(f'{"=" * 80}')
        print(f'Username: admin')
        print(f'Password: {new_password}')
        print(f'Email: {admin.email}')
        print(f'{"=" * 80}\n')
        
        # Verificar que la contraseña funciona
        if admin.check_password(new_password):
            print('✅ Contraseña verificada correctamente\n')
        else:
            print('❌ Error: La contraseña no se guardó correctamente\n')
            
    except Usuario.DoesNotExist:
        print('❌ Error: Usuario admin no encontrado\n')

if __name__ == '__main__':
    reset_admin()
