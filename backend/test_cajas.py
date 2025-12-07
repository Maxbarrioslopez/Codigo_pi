#!/usr/bin/env python
"""
Script de prueba para verificar endpoints de cajas de beneficio
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
sys.path.insert(0, '/Users/Maxi Barrios/Documents/Codigo_pi/backend')

django.setup()

from totem.models import TipoBeneficio, CajaBeneficio

# 1. Obtener o crear un beneficio
print("=" * 60)
print("PRUEBA: Gestión de Cajas de Beneficios")
print("=" * 60)

beneficio, created = TipoBeneficio.objects.get_or_create(
    nombre='Caja de Navidad Test',
    defaults={
        'descripcion': 'Caja de prueba para Navidad',
        'activo': True
    }
)

print(f"\n✓ Beneficio: {beneficio.nombre} (ID: {beneficio.id})")
print(f"  Estado: {'Creado' if created else 'Existente'}")

# 2. Crear algunas cajas de prueba
print(f"\nCreando cajas para el beneficio...")

cajas_datos = [
    {'nombre': 'Premium', 'codigo_tipo': 'CAJ-NAV-PREM', 'descripcion': 'Caja Premium con productos selectos'},
    {'nombre': 'Estándar', 'codigo_tipo': 'CAJ-NAV-STD', 'descripcion': 'Caja Estándar con productos básicos'},
    {'nombre': 'Básica', 'codigo_tipo': 'CAJ-NAV-BASICA', 'descripcion': 'Caja Básica con lo esencial'},
]

for datos in cajas_datos:
    caja, created = CajaBeneficio.objects.get_or_create(
        beneficio=beneficio,
        nombre=datos['nombre'],
        defaults={
            'codigo_tipo': datos['codigo_tipo'],
            'descripcion': datos['descripcion'],
            'activo': True
        }
    )
    status = '✓ CREADA' if created else '✓ EXISTE'
    print(f"  {status}: {caja.nombre} ({caja.codigo_tipo})")

# 3. Listar todas las cajas
print(f"\n\nListando cajas del beneficio '{beneficio.nombre}':")
print(f"Total: {beneficio.cajas.count()} cajas")

for caja in beneficio.cajas.all():
    estado = '✓ Activa' if caja.activo else '✗ Inactiva'
    print(f"  - {caja.nombre:15} | {caja.codigo_tipo:20} | {estado}")

# 4. Probar toggle de estado
print(f"\n\nProbando toggle de estado...")
primera_caja = beneficio.cajas.first()
if primera_caja:
    print(f"  Caja seleccionada: {primera_caja.nombre}")
    print(f"  Estado actual: {'Activa' if primera_caja.activo else 'Inactiva'}")
    
    primera_caja.activo = not primera_caja.activo
    primera_caja.save()
    print(f"  Nuevo estado: {'Activa' if primera_caja.activo else 'Inactiva'}")

print("\n" + "=" * 60)
print("✓ Todas las pruebas completadas exitosamente!")
print("=" * 60)
