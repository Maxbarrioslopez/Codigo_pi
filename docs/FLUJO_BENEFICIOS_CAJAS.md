# Flujo de Beneficios con Cajas y Doble Autenticación

## Descripción General
Sistema completo para gestionar beneficios con cajas físicas específicas y validación de doble autenticación (QR + Guardia).

---

## Modelos Creados

### 1. **CajaBeneficio**
Define los tipos de cajas dentro de un beneficio.
```
Beneficio: "Caja de Navidad"
├── Cajas disponibles:
│   ├── CajaBeneficio 1: "Premium" (código: CAJ-NAV-PREMIUM)
│   └── CajaBeneficio 2: "Estándar" (código: CAJ-NAV-ESTANDAR)
```

**Campos:**
- `beneficio` (FK a TipoBeneficio): Qué beneficio contiene esta caja
- `nombre`: "Premium", "Estándar", etc.
- `codigo_tipo`: Código único para identificar la caja (ej: CAJ-NAV-PREMIUM)
- `descripcion`: Detalles de qué incluye
- `activo`: Si está disponible para asignar

---

### 2. **BeneficioTrabajador**
Asignación de beneficio específico a un trabajador en un ciclo.
```
Trabajador: Juan Pérez
Ciclo: Navidad 2025
├── Beneficio asignado: "Caja de Navidad"
├── Tipo de caja: "Premium"
├── Código verificación: "BEN-2025-0001-ABC123" (QR)
└── Estado: "pendiente" → "retirado"
```

**Campos:**
- `trabajador` (FK): Quién recibe el beneficio
- `ciclo` (FK): En qué ciclo
- `tipo_beneficio` (FK): Qué tipo de beneficio
- `caja_beneficio` (FK): Qué caja específica
- `codigo_verificacion`: Código único para generar QR
- `qr_data`: Datos del QR generado
- `estado`: pendiente, validado, retirado, cancelado
- `bloqueado`: Si no puede retirar
- `motivo_bloqueo`: Por qué no puede retirar

---

### 3. **ValidacionCaja**
Registro de la validación realizada por el guardia.
```
Guardia: Carlos López
├── Escanea QR del trabajador
├── Verifica código: "BEN-2025-0001-ABC123"
├── Confirma caja física: "CAJ-001" (Premium)
└── Resultado: "exitoso" ✓
```

**Campos:**
- `beneficio_trabajador` (FK): Cuál beneficio se valida
- `guardia` (FK a Usuario): Quién valida
- `codigo_escaneado`: Lo que el guardia ingresó/escaneó
- `resultado`: exitoso, rechazado, error
- `caja_validada`: Número/código de la caja física entregada
- `caja_coincide`: ¿Coincide con la asignada?
- `notas`: Observaciones del guardia
- `fecha_validacion`: Cuándo se validó

---

## Flujo Completo

### **FASE 1: Configuración (RRHH)**

#### 1.1. Crear Beneficio
```
RRHH → [Crear Beneficio]
├── Nombre: "Caja de Navidad"
├── Descripción: "Caja de regalos navideños"
├── Tipos de contrato: ["planta", "contrata"]
└── Activo: ✓
```

#### 1.2. Crear Cajas del Beneficio
```
RRHH → [Gestionar Cajas del Beneficio]
├── Caja 1:
│   ├── Nombre: "Premium"
│   ├── Código: "CAJ-NAV-PREMIUM"
│   └── Descripción: "Incluye regalos premium"
└── Caja 2:
    ├── Nombre: "Estándar"
    ├── Código: "CAJ-NAV-ESTANDAR"
    └── Descripción: "Incluye regalos estándar"
```

#### 1.3. Crear Ciclo
```
RRHH → [Crear Ciclo]
├── Nombre: "Navidad 2025"
├── Fecha inicio: 2025-12-01
├── Fecha fin: 2025-12-31
└── Beneficios: ["Caja de Navidad"]
```

---

### **FASE 2: Carga de Nómina (RRHH)**

#### 2.1. Cargar Nómina
```
RRHH → [Cargar Nómina] → Excel con trabajadores
├── Archivo: nomina_navidad.csv
├── Ciclo: Navidad 2025
└── Sistema asigna beneficios por contrato
```

#### 2.2. Asignar Cajas Específicas
```
Sistema crea BeneficioTrabajador para cada trabajador:
├── Juan Pérez (Planta): Caja Premium
├── María García (Contrata): Caja Estándar
└── ...
```

#### 2.3. Generar Códigos QR
```
Sistema genera automáticamente:
├── Código: "BEN-2025-00001-ABC123"
├── QR: Contiene el código + datos del trabajador
└── Status: Listo para retirar
```

---

### **FASE 3: Retiro del Trabajador (TOTEM)**

#### 3.1. Trabajador se autentica
```
Trabajador → TOTEM
├── Ingresa RUT
├── Sistema valida RUT en ciclo activo
└── Muestra: "Beneficio disponible: Caja de Navidad (Premium)"
```

#### 3.2. Genera QR
```
TOTEM → [Generar Código]
├── Muestra QR con: "BEN-2025-00001-ABC123"
├── Muestra código alfanumérico legible
└── Imprime o guarda en pantalla
```

---

### **FASE 4: Validación del Guardia (GUARDIA)**

#### 4.1. Recibe al Trabajador
```
Guardia → App Guardía
├── Opción: [Validar Beneficio]
└── Ingresa o escanea QR
```

#### 4.2. Valida Código
```
Guardia:
├── Escanea/ingresa código: "BEN-2025-00001-ABC123"
├── Sistema valida: ✓ Código válido
├── Sistema muestra:
│   ├── Trabajador: Juan Pérez
│   ├── Beneficio: Caja de Navidad
│   ├── Tipo asignado: Premium
│   └── Estado: Pendiente
└── Guardia confirma: "Código correcto"
```

#### 4.3. Valida Caja Física
```
Guardia:
├── Recibe caja física del almacén
├── Verifica código de caja: "CAJ-001"
├── Ingresa código en sistema
├── Sistema valida: ¿Coincide con Premium?
└── Resultado: Exitoso ✓
```

#### 4.4. Registra Validación
```
Sistema crea ValidacionCaja:
├── Guardia: Carlos López
├── Código escaneado: "BEN-2025-00001-ABC123"
├── Resultado: "exitoso"
├── Caja validada: "CAJ-001"
├── Caja coincide: true
├── Notas: "Todo correcto"
└── Estado BeneficioTrabajador → "retirado"
```

---

## Estados Disponibles

### BeneficioTrabajador.estado
- **pendiente**: Esperando retiro
- **validado**: Código verificado por guardia
- **retirado**: Caja entregada al trabajador
- **cancelado**: No retirará (desvinculado, etc.)

### ValidacionCaja.resultado
- **exitoso**: ✓ Beneficio entregado correctamente
- **rechazado**: ✗ Código incorrecto o caja no coincide
- **error**: ! Error en el proceso

---

## Endpoints necesarios

### Para RRHH
```
POST   /api/cajas-beneficio/              → Crear caja de beneficio
GET    /api/cajas-beneficio/?beneficio=1  → Listar cajas de un beneficio
PUT    /api/cajas-beneficio/{id}/         → Editar caja
DELETE /api/cajas-beneficio/{id}/         → Desactivar caja

POST   /api/beneficios-trabajadores/cargar-nomina/   → Asignar beneficios masivo
GET    /api/beneficios-trabajadores/?ciclo=1         → Ver asignaciones
```

### Para Guardia
```
POST   /api/validaciones-caja/            → Registrar validación
GET    /api/validaciones-caja/{codigo}/   → Validar código
PUT    /api/validaciones-caja/{id}/       → Actualizar resultado
```

### Para Trabajador (TOTEM)
```
GET    /api/beneficios-trabajador/mi-beneficio/?ciclo=1  → Ver mi beneficio
POST   /api/beneficios-trabajador/generar-qr/            → Generar QR
```

---

## Seguridad

1. **Doble Autenticación:**
   - Código QR del trabajador
   - Validación visual del guardia (coincidencia de caja)

2. **Bloqueos:**
   - RRHH puede bloquear un beneficio si hay fraude
   - Guardia puede rechazar si código/caja no coincide

3. **Auditoría:**
   - Cada validación registra guardia, hora, resultado
   - Historial completo por trabajador

4. **Códigos Únicos:**
   - Cada BeneficioTrabajador tiene código único imposible de repetir
   - QR no reutilizable después de retirado

---

## Próximos Pasos

1. ✅ Modelos creados
2. ✅ Migraciones aplicadas
3. ✅ Serializers creados
4. ⏳ Endpoints RRHH para gestionar cajas
5. ⏳ Endpoints Guardia para validar
6. ⏳ Endpoints Trabajador para ver y generar QR
7. ⏳ Frontend: Formularios de carga de nómina con asignación de cajas
8. ⏳ Frontend: App Guardia con validador QR
9. ⏳ Frontend: TOTEM mejorado con QR generator
