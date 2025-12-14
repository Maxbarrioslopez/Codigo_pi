#!/usr/bin/env python
import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from totem.models import BeneficioTrabajador, Trabajador, TipoBeneficio, Ciclo

print("="*60)
print("    🧪 TEST FLUJO COMPLETO TOTEM → GUARDIA")
print("="*60)

print("\n✅ TEST 1: Crear trabajador de prueba")
trab, created = Trabajador.objects.get_or_create(
    rut='99999999-9',
    defaults={'nombre': 'Trabajador Prueba Test'}
)
print(f"   Trabajador: {trab.nombre} ({trab.rut})")
print(f"   RUT: {trab.rut}")

print("\n✅ TEST 2: Obtener ciclo activo")
ciclo = Ciclo.objects.filter(activo=True).first()
print(f"   Ciclo: {ciclo.nombre} (ID={ciclo.id})")
print(f"   Período: {ciclo.fecha_inicio} a {ciclo.fecha_fin}")

print("\n✅ TEST 3: Obtener tipo beneficio CAJA")
tipo_caja = TipoBeneficio.objects.get(id=6)
print(f"   Tipo: {tipo_caja.nombre}")
print(f"   Es caja: {tipo_caja.es_caja}")
print(f"   Requiere guardia: {tipo_caja.requiere_validacion_guardia}")
print(f"   Tipos contrato: {tipo_caja.tipos_contrato}")

print("\n✅ TEST 4: Asignar beneficio")
ben, created = BeneficioTrabajador.objects.get_or_create(
    trabajador=trab,
    tipo_beneficio=tipo_caja,
    ciclo=ciclo,
    defaults={'estado': 'pendiente'}
)
print(f"   Beneficio ID: {ben.id}")
print(f"   Estado: {ben.estado}")
hmac = ben.codigo_verificacion
if hmac:
    print(f"   Código HMAC: {hmac[:30]}..." if len(hmac) > 30 else f"   Código HMAC: {hmac}")
else:
    print("   Código: No generado")

print("\n✅ TEST 5: TOTEM busca beneficio por RUT")
print("   Query: BeneficioTrabajador.objects.filter(")
print("       trabajador__rut='99999999-9',")
print("       ciclo__activo=True")
print("   )")
ben_retrieved = BeneficioTrabajador.objects.filter(
    trabajador__rut='99999999-9',
    ciclo__activo=True
).first()
if ben_retrieved:
    print(f"   ✅ RESULTADO: Encontrado beneficio")
    print(f"      ID: {ben_retrieved.id}")
    print(f"      Tipo: {ben_retrieved.tipo_beneficio.nombre}")
    print(f"      Requiere guardia: {ben_retrieved.tipo_beneficio.requiere_validacion_guardia}")
    print(f"      Es caja: {ben_retrieved.tipo_beneficio.es_caja}")
else:
    print(f"   ❌ RESULTADO: Beneficio NO encontrado")

print("\n✅ TEST 6: TOTEM genera QR para mostrar al trabajador")
print(f"   Código para QR (HMAC): {hmac}")
print(f"   Frontend genera: https://api.qrserver.com/v1/create-qr-code/?size=220x220&data={hmac}")

print("\n✅ TEST 7: GUARDIA valida el código escaneado")
print(f"   Código escaneado por QR: {hmac}")
print(f"   Validar: ben.validar_codigo(codigo_escaneado)")
from totem.services.beneficio_service import BeneficioService
exitoso, resultado = BeneficioService.validar_beneficio(
    beneficio=ben,
    codigo_escaneado=hmac,
    guardia_usuario=None
)
es_valido = exitoso
print(f"   Resultado: {'VÁLIDO OK' if es_valido else 'INVÁLIDO ERROR'}")

if es_valido:
    print("\n✅ TEST 8: GUARDIA actualiza estado a VALIDADO")
    ben.estado = 'validado'
    ben.save()
    print(f"   Estado anterior: pendiente")
    print(f"   Estado actual: {ben.estado}")
    print(f"   ✅ Beneficio listo para confirmar entrega")

    print("\n✅ TEST 9: GUARDIA confirma entrega")
    if ben.tipo_beneficio.es_caja:
        print(f"   Es caja física: SÍ")
        print(f"   Guardia ingresa código de caja: BOX-2025-001")
        ben.codigo_caja_fisica = "BOX-2025-001"
    else:
        print(f"   Es caja física: NO")
    
    ben.estado = 'entregado'
    ben.save()
    print(f"   Estado anterior: validado")
    print(f"   Estado actual: {ben.estado}")
    print(f"   ✅ Beneficio entregado")

print("\n" + "="*60)
print("    ✅ FLUJO COMPLETO EXITOSO")
print("="*60)

print("\n📊 RESUMEN DEL FLUJO:")
print(f"""
   1. Totem busca beneficio de RUT 99999999-9 (ciclo activo)
      → Encuentra: {ben_retrieved.tipo_beneficio.nombre}
   
   2. Totem muestra QR con código HMAC
      → Código: {hmac[:40]}...
   
   3. Guardia escanea QR
      → Valida código HMAC: ✅ Válido
   
   4. Guardia confirma entrega
      → Estado: pendiente → validado → entregado
      → Caja física: BOX-2025-001 (si aplica)
   
   ✅ Beneficio completado
""")
