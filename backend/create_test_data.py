#!/usr/bin/env python
"""
Script para crear datos de prueba en la base de datos.
Crea un trabajador con RUT 21.037.970-3 (Maximiliano Barrios) con beneficios.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from totem.models import Trabajador, StockSucursal, Ciclo
from datetime import date

def create_test_data():
    print("🔧 Creando datos de prueba...")
    
    # Crear o actualizar trabajador con beneficios
    beneficios = {
        'disponible': True,
        'tipo': 'INDEFINIDO',
        'items': [
            {
                'codigo': 'ALIM001',
                'nombre': 'Caja de Alimentos',
                'descripcion': 'Caja mensual con productos básicos',
                'cantidad': 1
            },
            {
                'codigo': 'UTIL001',
                'nombre': 'Kit Útiles Escolares',
                'descripcion': 'Set completo de útiles',
                'cantidad': 1
            },
            {
                'codigo': 'ROPA001',
                'nombre': 'Voucher Ropa',
                'descripcion': 'Cupón de vestimenta',
                'cantidad': 1
            }
        ]
    }
    
    trabajador, created = Trabajador.objects.update_or_create(
        rut='21037970-3',
        defaults={
            'nombre': 'Maximiliano Barrios',
            'beneficio_disponible': beneficios
        }
    )
    
    status = "creado" if created else "actualizado"
    print(f"✅ Trabajador {status}: {trabajador.nombre} (RUT: {trabajador.rut})")
    print(f"   Contrato: INDEFINIDO")
    print(f"   Beneficios: {len(beneficios['items'])} items disponibles")

    # Segundo trabajador de prueba
    trabajador2, created2 = Trabajador.objects.update_or_create(
        rut='16741794-9',
        defaults={
            'nombre': 'Pablo Larrondo',
            'beneficio_disponible': beneficios
        }
    )
    status2 = "creado" if created2 else "actualizado"
    print(f"✅ Trabajador {status2}: {trabajador2.nombre} (RUT: {trabajador2.rut})")
    
    # Crear stock en sucursales
    sucursales = ['Casa Matriz', 'Sucursal Norte', 'Sucursal Sur']
    productos = ['Caja de Alimentos', 'Kit Útiles Escolares', 'Voucher Ropa']
    
    print("\n📦 Creando stock en sucursales...")
    for sucursal in sucursales:
        for producto in productos:
            stock, created = StockSucursal.objects.update_or_create(
                sucursal=sucursal,
                producto=producto,
                defaults={'cantidad': 50}
            )
            if created:
                print(f"✅ Stock creado: {sucursal} - {producto}: 50 unidades")
    
    # Crear ciclo activo si no existe
    print("\n📅 Verificando ciclo activo...")
    ciclo = Ciclo.objects.filter(activo=True).first()
    if not ciclo:
        ciclo = Ciclo.objects.create(
            fecha_inicio=date(2025, 12, 1),
            fecha_fin=date(2025, 12, 31),
            activo=True
        )
        print(f"✅ Ciclo creado: {ciclo}")
    else:
        print(f"✅ Ciclo activo encontrado: {ciclo}")
    
    print("\n🎉 Datos de prueba creados correctamente!")
    print(f"\n📋 Resumen:")
    print(f"   Trabajador: {trabajador.nombre}")
    print(f"   RUT: {trabajador.rut}")
    print(f"   Beneficios disponibles: {len(beneficios['items'])}")
    print(f"   Stock en {len(sucursales)} sucursales")
    print(f"   Ciclo activo: {ciclo}")
    print(f"\n🧪 Puedes probar escaneando los RUT: 21037970-3 y 16741794-9")

if __name__ == '__main__':
    create_test_data()
