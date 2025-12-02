# Plan de Refactor y Mejora Enterprise - Tótem TMLUC

## Estado Actual del Proyecto

### ✅ Ya Completado (Sesión Actual)

#### Backend
- ✅ Estandarización de errores con handler global DRF
- ✅ Excepciones de negocio consistentes (`RUTInvalidException`, `ValidationException`, `TrabajadorNotFoundException`, etc.)
- ✅ `TicketService` endurecido:
  - No permite ciclos autogenerados
  - Previene múltiples tickets pendientes por trabajador/ciclo
  - Valida TTL, estado, HMAC correctamente
- ✅ Formato JSON de error estandarizado: `{ error: { message, code, status, details? } }`
- ✅ Import roto `views_debug` eliminado de `totem/urls.py`
- ✅ Comandos dev-only documentados (`cargar_nomina.py`, `crear_usuarios_test.py`)

#### Frontend
- ✅ Hook genérico `useScanner` creado:
  - Soporte PDF417 (cédulas) + QR_CODE
  - Parametrizable (formats, callbacks, deviceId)
  - Basado en @zxing/browser
- ✅ Utilidad `parseChileanIDFromPdf417`:
  - Extrae RUT con validación módulo-11
  - Maneja variaciones de formato
  - Retorna campos opcionales (nombres, apellidos, fecha nacimiento)
- ✅ Componente `TotemScannerPanel`:
  - Integra useScanner + parseChileanID
  - Reutilizable entre módulos
  - Manejo robusto de errores
- ✅ Hook `useTotemFlow`:
  - Estados centralizados (initial, validating, success, no-stock, etc.)
  - Transiciones de estado
  - Llamadas a servicios encapsuladas
- ✅ `TotemModule.tsx` parcialmente refactorizado:
  - Usa TotemScannerPanel
  - Mantiene lógica de pantallas actual

---

## 🎯 Plan de Ejecución Completo

### FASE 1: Completar Modularización Frontend (EN CURSO)

#### A. TotemModule - Finalizar Refactor
**Archivos a Modificar:**
- `front end/src/components/TotemModule.tsx`

**Acciones:**
1. ✅ Integrar `useTotemFlow` completamente (ya creado)
2. ✅ Extraer componentes de pantalla:
   - `TotemInitialScreen` (ya existe inline)
   - `TotemValidatingScreen` (ya existe inline)
   - `TotemSuccessChoice` (ya existe inline)
   - `TotemSuccessScreen` (ya existe inline)
   - `TotemNoStockScreen` (ya existe inline)
   - `TotemScheduleSelect` (ya existe inline)
   - `TotemScheduleConfirm` (ya existe inline)
   - `TotemNoBenefitScreen` (ya existe inline)
   - `TotemErrorScreen` (ya existe inline)
   - `TotemIncidentForm` (ya existe inline)
   - `TotemIncidentSent` (ya existe inline)
   - `TotemIncidentScan` (ya existe inline)
   - `TotemIncidentStatus` (ya existe inline)
3. 🔄 Conectar todas las pantallas a `useTotemFlow` para:
   - Gestión de estados
   - Llamadas API
   - Manejo de errores
4. 🔄 Verificar todos los botones:
   - Loading states
   - Error handling
   - Navegación coherente

**Resultado Esperado:**
- `TotemModule.tsx` < 200 líneas (orquestador)
- Componentes pequeños y testeables
- Estados manejados por `useTotemFlow`
- Todos los botones funcionales y conectados

#### B. GuardiaModule - Refactor Completo
**Archivos a Crear:**
- `front end/src/hooks/useGuardiaScanner.ts`
- `front end/src/hooks/useGuardiaMetrics.ts`
- `front end/src/hooks/useGuardiaIncidents.ts`
- `front end/src/components/guardia/GuardiaScannerTab.tsx`
- `front end/src/components/guardia/GuardiaIncidentsTab.tsx`
- `front end/src/components/guardia/GuardiaMetricsTab.tsx`

**Archivos a Modificar:**
- `front end/src/components/GuardiaModule.tsx`
- `front end/src/components/guardia/GuardiaQRScanner.tsx` (usar useScanner)

**Acciones:**
1. Crear `useGuardiaScanner`:
   - Reutiliza `useScanner` con formato QR_CODE
   - Maneja validación de tickets via API
   - Estados: scanning → validating → success/error
   - Manejo de errores de negocio (expirado, usado, inválido)

2. Crear `useGuardiaMetrics`:
   - Polling de métricas (ya existe `useMetricasGuardia`, mejorar)
   - Estados de carga
   - Cache local

3. Crear `useGuardiaIncidents`:
   - CRUD de incidencias
   - Filtros y búsqueda
   - Estados de carga

4. Dividir GuardiaModule en tabs:
   - `GuardiaScannerTab`: escaneo y validación
   - `GuardiaIncidentsTab`: gestión de incidencias
   - `GuardiaMetricsTab`: métricas y reportes

**Resultado Esperado:**
- `GuardiaModule.tsx` < 150 líneas
- Tabs modulares
- Hooks especializados
- Flujo de validación robusto

#### C. Otros Módulos - Verificación y Mejora
**Archivos a Revisar:**
- `front end/src/components/RRHHModuleNew.tsx`
- `front end/src/components/StockModule.tsx`
- `front end/src/components/NominaModule.tsx`
- `front end/src/components/AdministradorModule.tsx`

**Acciones:**
1. Verificar que todos los botones estén conectados
2. Agregar estados de loading/error consistentes
3. Mejorar responsividad (mobile-first)
4. Usar `useToast` para feedback

---

### FASE 2: Limpieza de Código Muerto

#### Archivos a Eliminar/Mover a Legacy:
**Componentes:**
- `front end/src/components/ReportesModule.tsx` (no montado)
- `front end/src/components/TrazabilidadModule.tsx` (no montado)
- `front end/src/components/CicloBimensualModule.tsx` (no montado)
- `front end/src/components/RRHHModule.tsx` (legacy, reemplazado por RRHHModuleNew)

**Servicios:**
- `front end/src/services/print.ts` (no usado)
- `front end/src/services/report.service.ts` (no usado)
- `front end/src/services/api.ts` (no usado)

**Hooks:**
- `front end/src/hooks/useQRScanner.ts` (reemplazado por useScanner)

**Acción:**
1. Crear carpeta `front end/src/legacy/`
2. Mover archivos no usados
3. Verificar build sin errores
4. Documentar en CHANGELOG

---

### FASE 3: Backend - Finalizar Endurecimiento

#### A. Validaciones TicketService (✅ Ya Hecho)
- ✅ HMAC verification
- ✅ TTL checks
- ✅ Estado validation
- ✅ Stock verification
- ✅ Unicidad por ciclo

#### B. Formato de Errores Estandarizado (✅ Ya Hecho)
```json
{
  "error": {
    "code": "ticket_expired",
    "message": "El ticket ha expirado",
    "status": 400
  }
}
```

**Códigos Implementados:**
- `rut_invalid`
- `trabajador_not_found`
- `trabajador_bloqueado`
- `no_beneficio`
- `no_stock`
- `ticket_expired`
- `ticket_invalid_state`
- `qr_invalid`
- `no_ciclo_activo`
- `validation_error`

#### C. Índices de Base de Datos
**Archivo a Crear:**
- `backend/totem/migrations/XXXX_add_performance_indexes.py`

**Índices a Agregar:**
```python
# Tickets pendientes
Index(fields=['estado', 'ciclo'], name='ticket_estado_ciclo_idx')
Index(fields=['trabajador', 'estado'], name='ticket_trabajador_estado_idx')

# Incidencias abiertas
Index(fields=['estado', 'created_at'], name='incidencia_estado_fecha_idx')

# Búsquedas por RUT
Index(fields=['rut'], name='trabajador_rut_idx')

# Stock por sucursal
Index(fields=['sucursal', 'cantidad'], name='stock_sucursal_cantidad_idx')
```

---

### FASE 4: Mejoras de UX y Responsividad

#### A. Responsividad Global
**Archivos a Revisar:**
- Todos los `*Module.tsx`
- Componentes de pantalla (Totem screens, Guardia tabs)

**Breakpoints Target:**
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+
- Totem: 1080p vertical (1080x1920)

**Clases Tailwind a Usar:**
- `sm:`, `md:`, `lg:`, `xl:` para layouts
- `min-h-screen` para pantallas completas
- `flex`, `grid` con breakpoints
- Botones: `min-h-[56px]` táctil

#### B. Estados de Loading Consistentes
**Pattern a Seguir:**
```tsx
{loading && <Spinner />}
{!loading && !error && <Content />}
{error && <ErrorMessage code={error.code} message={error.message} />}
```

#### C. Toast Notifications
**Usar `useToast` para:**
- Éxito en operaciones
- Errores de negocio
- Errores de red
- Confirmaciones

---

### FASE 5: Testing y Validación

#### Checklist de Funcionalidad:

**Flujo Tótem:**
- [ ] Escaneo de cédula chilena (PDF417) → extrae RUT
- [ ] Validación de beneficio
- [ ] Generación de ticket con QR
- [ ] Agendamiento de retiro
- [ ] Reporte de incidencias
- [ ] Consulta de incidencias
- [ ] Manejo de errores (sin stock, sin beneficio, RUT inválido)

**Flujo Guardia:**
- [ ] Escaneo de QR de ticket
- [ ] Validación con backend (HMAC + TTL + estado)
- [ ] Entrega de ticket
- [ ] Manejo de errores (expirado, ya usado, QR inválido)
- [ ] Visualización de métricas
- [ ] Gestión de incidencias

**Flujo RRHH:**
- [ ] Carga de nómina (CSV/Excel)
- [ ] Gestión de ciclos
- [ ] Reportes y métricas
- [ ] Gestión de trabajadores
- [ ] Trazabilidad de tickets

**Flujo Stock:**
- [ ] Visualización de stock por sucursal
- [ ] Movimientos de stock
- [ ] Alertas de stock bajo

**Flujo Admin:**
- [ ] Gestión de usuarios
- [ ] Configuración de parámetros operativos
- [ ] Logs y auditoría

---

## 📊 Resumen de Archivos

### Archivos Creados (✅ Completado)
- `front end/src/hooks/useScanner.ts`
- `front end/src/utils/parseChileanID.ts`
- `front end/src/hooks/useTotemFlow.ts`
- `front end/src/components/TotemScannerPanel.tsx`

### Archivos a Crear (🔄 Pendiente)
- `front end/src/hooks/useGuardiaScanner.ts`
- `front end/src/hooks/useGuardiaIncidents.ts`
- `front end/src/components/guardia/GuardiaScannerTab.tsx`
- `front end/src/components/guardia/GuardiaIncidentsTab.tsx`
- `front end/src/components/guardia/GuardiaMetricsTab.tsx`
- `front end/src/legacy/` (carpeta)
- `backend/totem/migrations/XXXX_add_performance_indexes.py`

### Archivos Modificados (✅/🔄)
- ✅ `backend/totem/views_trabajadores.py` (errores estandarizados)
- ✅ `backend/totem/views.py` (errores estandarizados)
- ✅ `backend/totem/services/ticket_service.py` (validaciones reforzadas)
- ✅ `backend/totem/urls.py` (import roto eliminado)
- ✅ `backend/totem/management/commands/cargar_nomina.py` (documentado dev-only)
- ✅ `backend/totem/management/commands/crear_usuarios_test.py` (documentado dev-only)
- 🔄 `front end/src/components/TotemModule.tsx` (parcial, falta completar)
- 🔄 `front end/src/components/GuardiaModule.tsx` (pendiente)
- 🔄 Otros módulos (RRHH, Stock, Nómina, Admin)

### Archivos a Mover a Legacy
- `front end/src/components/ReportesModule.tsx`
- `front end/src/components/TrazabilidadModule.tsx`
- `front end/src/components/CicloBimensualModule.tsx`
- `front end/src/components/RRHHModule.tsx`
- `front end/src/services/print.ts`
- `front end/src/services/report.service.ts`
- `front end/src/services/api.ts`
- `front end/src/hooks/useQRScanner.ts`

---

## 🎯 Próximos Pasos Inmediatos

1. **Completar refactor TotemModule** (conectar useTotemFlow totalmente)
2. **Refactorizar GuardiaModule** (crear hooks y tabs)
3. **Limpiar código muerto** (mover a legacy)
4. **Agregar índices de BD** (performance)
5. **Revisar responsividad** (todos los módulos)
6. **Testing end-to-end** (validar todos los flujos)
7. **Actualizar AUDITORIA_CODIGO.md** con cambios ejecutados

---

## 📝 Notas Importantes

- ✅ **NO romper compatibilidad de API** (contratos actuales mantenidos)
- ✅ **Mantener estilos visuales** (Tailwind + componentes actuales)
- ✅ **Sin nuevas dependencias** (usar las existentes)
- ✅ **Migraciones seguras** (solo índices, sin cambios de esquema)
- ✅ **Commits incrementales** (cuando usuario lo solicite)
- ✅ **Testing manual** (checklist de funcionalidad)

