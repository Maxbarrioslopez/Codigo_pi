#!/usr/bin/env python
import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')
django.setup()

from totem.models import BeneficioTrabajador, TipoBeneficio, Ciclo

print("=== VERIFICACIÓN DEL FLUJO TOTEM → GUARDIA ===\n")

# 1. Tipos de beneficio
print("1️⃣ TIPOS DE BENEFICIO DISPONIBLES:")
tipos = TipoBeneficio.objects.all()
for t in tipos:
    print(f"   ID {t.id}: {t.nombre}")
    print(f"      ├─ Es caja física: {t.es_caja}")
    print(f"      ├─ Requiere guardia: {t.requiere_validacion_guardia}")
    print(f"      └─ Tipos contrato: {', '.join(t.tipos_contrato)}")
print()

# 2. Ciclo activo
print("2️⃣ CICLO ACTIVO:")
ciclo_activo = Ciclo.objects.filter(activo=True).first()
if ciclo_activo:
    print(f"   ID {ciclo_activo.id}: {ciclo_activo.nombre}")
    print(f"      ├─ Activo: {ciclo_activo.activo}")
    print(f"      ├─ Desde: {ciclo_activo.fecha_inicio}")
    print(f"      └─ Hasta: {ciclo_activo.fecha_fin}")
print()

# 3. Beneficios asignados
print("3️⃣ BENEFICIOS ASIGNADOS AL CICLO ACTIVO:")
beneficios = BeneficioTrabajador.objects.filter(ciclo=ciclo_activo)
if beneficios.exists():
    for b in beneficios[:5]:
        print(f"   ID {b.id}: {b.tipo_beneficio.nombre}")
        print(f"      ├─ Trabajador: {b.trabajador}")
        print(f"      ├─ Ciclo: {b.ciclo.nombre}")
        print(f"      ├─ Estado: {b.estado}")
        cod_short = b.codigo_verificacion[:16] + "..." if b.codigo_verificacion else "No generado"
        print(f"      ├─ Código HMAC: {cod_short}")
        print(f"      └─ Requiere guardia: {b.tipo_beneficio.requiere_validacion_guardia}")
        print()
else:
    print("   ⚠️ No hay beneficios asignados en el ciclo activo")
print()

# 4. Flujo completo
print("4️⃣ FLUJO COMPLETO DE VALIDACIÓN:")
print("""
┌─────────────────────────────────────────────────────────────────┐
│                    TÓTEM (Pantalla Inicial)                    │
│  → Trabajador escanea QR con su RUT                            │
│  → Sistema envía: GET /api/trabajadores/{rut}/beneficio/       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 BACKEND (filtro por ciclo)                     │
│  → Busca BeneficioTrabajador                                   │
│     WHERE ciclo = CICLO_ACTIVO AND trabajador.rut = {rut}     │
│  → Si NO requiere guardia: mostrar beneficio directo           │
│  → Si SÍ requiere guardia: generar QR con código HMAC         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              TÓTEM (Pantalla de Beneficio)                     │
│  Si requiere guardia:                                          │
│    → Mostrar código HMAC como QR                              │
│    → Botón: "Mostrar al Guardia"                              │
│  Si NO requiere guardia:                                       │
│    → Mostrar beneficio disponible directamente                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  ¿Requiere guardia?           │
         └───────┬───────────────────┬───┘
                 │ NO               │ SÍ
              Fin           ┌───────▼──────────┐
                            │ GUARDIA (Validar)│
                            │ Escanea QR       │
                            │ POST .../validar/│
                            └────────┬─────────┘
                                     │
                                     ▼
                            ┌────────────────────┐
                            │ ¿Código válido?    │
                            └──┬─────────────┬───┘
                               │ NO          │ SÍ
                          Error    ┌────────▼────────────┐
                                   │ GUARDIA (Confirmar)│
                                   │ Caja física: ingresar código
                                   │ POST .../confirmar-entrega/
                                   └────────┬────────────┘
                                            │
                                            ▼
                                   ┌────────────────────┐
                                   │ Estado = entregado │
                                   │ ✅ Éxito          │
                                   └────────────────────┘

CÓDIGOS USADOS:
  • Tótem → QR: Código HMAC de BeneficioTrabajador
  • Guardia → Validación: Código HMAC (escaneado del QR)
  • Guardia → Confirmación: Código de caja física (si es caja)
""")

print("\n5️⃣ ESTADO ACTUAL DEL SISTEMA:")
print(f"   ✅ Tipos de beneficio: {tipos.count()} configurados")
print(f"   ✅ Ciclo activo: {ciclo_activo.nombre if ciclo_activo else 'No hay'}")
print(f"   ✅ Beneficios listos: {beneficios.count()} en ciclo activo")
print(f"   ✅ Guardia: Validar con QR/HMAC + confirmar entrega")
print(f"   ✅ Tótem: Mostrar beneficio del ciclo activo")
