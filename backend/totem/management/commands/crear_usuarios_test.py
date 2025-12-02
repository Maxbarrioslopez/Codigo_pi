"""
Management command para crear usuarios de prueba por defecto.
Crea: admin, guardia, rrhh
Uso: python manage.py crear_usuarios_test
"""
from django.core.management.base import BaseCommand
from totem.models import Usuario


class Command(BaseCommand):
    help = 'Crea usuarios de prueba por defecto (admin, guardia, rrhh)'

    def handle(self, *args, **options):
        usuarios_creados = []
        usuarios_existentes = []

        # Usuario Admin
        if not Usuario.objects.filter(username='admin').exists():
            admin = Usuario.objects.create_superuser(
                username='admin',
                email='admin@tmluc.cl',
                password='admin123',
                rol=Usuario.Roles.ADMIN,
                first_name='Admin',
                last_name='Sistema'
            )
            usuarios_creados.append('admin')
            self.stdout.write(
                self.style.SUCCESS(f'✓ Usuario ADMIN creado - username: admin, password: admin123')
            )
        else:
            usuarios_existentes.append('admin')

        # Usuario Guardia
        if not Usuario.objects.filter(username='guardia').exists():
            guardia = Usuario.objects.create_user(
                username='guardia',
                email='guardia@tmluc.cl',
                password='guardia123',
                rol=Usuario.Roles.GUARDIA,
                first_name='Juan',
                last_name='Pérez'
            )
            usuarios_creados.append('guardia')
            self.stdout.write(
                self.style.SUCCESS(f'✓ Usuario GUARDIA creado - username: guardia, password: guardia123')
            )
        else:
            usuarios_existentes.append('guardia')

        # Usuario RRHH
        if not Usuario.objects.filter(username='rrhh').exists():
            rrhh = Usuario.objects.create_user(
                username='rrhh',
                email='rrhh@tmluc.cl',
                password='rrhh123',
                rol=Usuario.Roles.RRHH,
                first_name='Patricia',
                last_name='Silva'
            )
            usuarios_creados.append('rrhh')
            self.stdout.write(
                self.style.SUCCESS(f'✓ Usuario RRHH creado - username: rrhh, password: rrhh123')
            )
        else:
            usuarios_existentes.append('rrhh')

        # Resumen
        self.stdout.write('')
        if usuarios_creados:
            self.stdout.write(
                self.style.SUCCESS(f'{len(usuarios_creados)} usuario(s) creado(s): {", ".join(usuarios_creados)}')
            )
        if usuarios_existentes:
            self.stdout.write(
                self.style.WARNING(f'⚠ {len(usuarios_existentes)} usuario(s) ya existían: {", ".join(usuarios_existentes)}')
            )
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('CREDENCIALES DE PRUEBA:'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write('Admin:    username: admin    | password: admin123')
        self.stdout.write('Guardia:  username: guardia  | password: guardia123')
        self.stdout.write('RRHH:     username: rrhh     | password: rrhh123')
        self.stdout.write(self.style.SUCCESS('=' * 60))
