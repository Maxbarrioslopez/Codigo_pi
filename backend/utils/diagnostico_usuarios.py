#!/usr/bin/env python
"""
Script de diagnóstico y corrección de usuarios
Verifica estado de cuentas y las reactiva si es necesario
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
from totem.models import Usuario

User = get_user_model()

print("=" * 60)
print("DIAGNÓSTICO DE USUARIOS")
print("=" * 60)

usuarios = User.objects.all()
print(f"\nTotal usuarios en sistema: {usuarios.count()}")

if usuarios.count() == 0:
    print("\n⚠️  NO HAY USUARIOS EN EL SISTEMA")
    print("\nCreando usuarios básicos...")
    
    # Crear admin
    try:
        admin = Usuario.objects.create_superuser(
            username='admin',
            password='admin123',
            email='admin@totem.local',
            rol=Usuario.Roles.ADMIN
        )
        print(f"✓ Usuario ADMIN creado: admin / admin123")
    except Exception as e:
        print(f"✗ Error creando admin: {e}")
    
    # Crear guardia
    try:
        guardia = Usuario.objects.create_user(
            username='guardia',
            password='guardia123',
            email='guardia@totem.local',
            rol=Usuario.Roles.GUARDIA
        )
        print(f"✓ Usuario GUARDIA creado: guardia / guardia123")
    except Exception as e:
        print(f"✗ Error creando guardia: {e}")
    
    # Crear rrhh
    try:
        rrhh = Usuario.objects.create_user(
            username='rrhh',
            password='rrhh123',
            email='rrhh@totem.local',
            rol=Usuario.Roles.RRHH
        )
        print(f"✓ Usuario RRHH creado: rrhh / rrhh123")
    except Exception as e:
        print(f"✗ Error creando rrhh: {e}")
    
    print("\n✅ Usuarios creados exitosamente")
    sys.exit(0)

print("\nDetalle de usuarios:\n")
for u in usuarios:
    print(f"Usuario: {u.username}")
    print(f"  - Email: {u.email}")
    print(f"  - Rol: {u.rol if hasattr(u, 'rol') else 'N/A'}")
    print(f"  - is_active: {u.is_active}")
    print(f"  - is_staff: {u.is_staff}")
    print(f"  - is_superuser: {u.is_superuser}")
    print(f"  - activo (campo custom): {u.activo if hasattr(u, 'activo') else 'N/A'}")
    
    # Verificar contraseña
    password_ok = u.check_password('admin123') if u.username == 'admin' else \
                  u.check_password('guardia123') if u.username == 'guardia' else \
                  u.check_password('rrhh123') if u.username == 'rrhh' else False
    print(f"  - Contraseña verificada: {'✓' if password_ok else '✗'}")
    print()

print("\n" + "=" * 60)
print("VERIFICANDO PROBLEMAS COMUNES")
print("=" * 60)

problemas = []
for u in usuarios:
    if not u.is_active:
        problemas.append(f"❌ {u.username}: is_active = False")
    if hasattr(u, 'activo') and not u.activo:
        problemas.append(f"❌ {u.username}: activo = False (campo custom)")
    if u.username == 'admin' and not u.is_superuser:
        problemas.append(f"❌ {u.username}: no es superuser")
    if u.username == 'admin' and not u.is_staff:
        problemas.append(f"❌ {u.username}: no es staff")

if problemas:
    print("\n⚠️  PROBLEMAS DETECTADOS:")
    for p in problemas:
        print(f"  {p}")
    
    print("\n¿Deseas corregir estos problemas? (s/n): ", end='')
    respuesta = input().lower()
    
    if respuesta == 's':
        print("\nCorrigiendo problemas...")
        for u in usuarios:
            modificado = False
            
            if not u.is_active:
                u.is_active = True
                modificado = True
                print(f"  ✓ {u.username}: is_active → True")
            
            if hasattr(u, 'activo') and not u.activo:
                u.activo = True
                modificado = True
                print(f"  ✓ {u.username}: activo → True")
            
            if u.username == 'admin':
                if not u.is_superuser:
                    u.is_superuser = True
                    modificado = True
                    print(f"  ✓ {u.username}: is_superuser → True")
                if not u.is_staff:
                    u.is_staff = True
                    modificado = True
                    print(f"  ✓ {u.username}: is_staff → True")
            
            if modificado:
                u.save()
        
        print("\n✅ Correcciones aplicadas exitosamente")
    else:
        print("\n⚠️  Correcciones canceladas")
else:
    print("\n✅ No se detectaron problemas")

print("\n" + "=" * 60)
print("RESUMEN FINAL")
print("=" * 60)
print("\nCredenciales disponibles:")
for u in usuarios:
    if u.username in ['admin', 'guardia', 'rrhh']:
        pwd = {'admin': 'admin123', 'guardia': 'guardia123', 'rrhh': 'rrhh123'}.get(u.username, '???')
        estado = "✓ ACTIVO" if u.is_active else "✗ INACTIVO"
        print(f"  {estado} | {u.username:10} / {pwd:15} | Rol: {u.rol if hasattr(u, 'rol') else 'N/A'}")

print("\n" + "=" * 60)
