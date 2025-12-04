#!/usr/bin/env python
import os
import sys
import django

# Agregar la ruta del proyecto al path
sys.path.insert(0, r'c:\Users\Maxi Barrios\Documents\Codigo_pi\backend')

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from totem.models import Ciclo, TipoBeneficio
from datetime import datetime, timedelta

# Verificar ciclos existentes
ciclos = Ciclo.objects.all()
print(f"✓ Total ciclos en BD: {ciclos.count()}")

if ciclos.count() == 0:
    print("\n⚠ No hay ciclos. Creando ciclos de prueba...")
    
    # Crear beneficios primero
    ben1, _ = TipoBeneficio.objects.get_or_create(
        nombre="Caja de Navidad",
        defaults={"descripcion": "Beneficio navideño", "activo": True}
    )
    ben2, _ = TipoBeneficio.objects.get_or_create(
        nombre="Paseo Familiar",
        defaults={"descripcion": "Paseo para familia", "activo": True}
    )
    
    # Crear ciclos
    inicio = datetime.now()
    fin = inicio + timedelta(days=60)
    
    ciclo1, _ = Ciclo.objects.get_or_create(
        nombre="Ciclo Diciembre 2025",
        defaults={
            "fecha_inicio": inicio.date(),
            "fecha_fin": fin.date(),
            "activo": True,
            "descripcion": "Ciclo de prueba"
        }
    )
    ciclo1.beneficios_activos.add(ben1, ben2)
    
    print(f"✓ Ciclo creado: {ciclo1.nombre}")
    print(f"  Fechas: {ciclo1.fecha_inicio} → {ciclo1.fecha_fin}")
    print(f"  Beneficios: {ciclo1.beneficios_activos.count()}")
else:
    print(f"\n✓ Ciclos existentes:")
    for ciclo in ciclos:
        print(f"  - {ciclo.nombre}: {ciclo.beneficios_activos.count()} beneficios")
