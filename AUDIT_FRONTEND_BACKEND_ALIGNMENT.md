# 🔍 Auditoría Alineación Frontend-Backend
**Fecha:** 1 de Diciembre 2025  
**Estado:** ⚠️ CRÍTICO - Desalineación detectada

---

## 📋 Resumen Ejecutivo

### ✅ Lo que SÍ funciona
- Tótem (autoservicio QR básico)
- API Health checks
- Endpoints de incidencias
- Tickets (crear/validar/reimprimir)
- Agendamientos
- Ciclos (CRUD completo)

### ❌ Lo que NO está conectado
- **Gestión de Trabajadores** (frontend SIN conectar a API)
- **Agregar Persona para Beneficio** (NO implementado en backend)
- **Módulo RRHH** (frontend usa mock data, NO consulta API)
- **Ciclo Bimensual** (frontend disconnected)
- **Trazabilidad QR** (frontend disconnected)
- **Nómina** (frontend disconnected, API existe pero incompleta)
- **Reportes y Análisis** (frontend mock, API parcial)
- **Administración** (frontend mock, API existe)

### 🎯 Problemas Principales

#### 1. **Problema: Agregar Persona para Beneficio NO FUNCIONA**
```
FRONTEND: TrabajadoresModule.tsx
  ├─ Dialog "Agregar trabajador" ✅ existe
  ├─ Form con campos ✅ existe
  └─ onClick handler → SOLO actualiza mock data local ❌
     NO LLAMADA A API

BACKEND: views_trabajadores.py
  ├─ POST /api/trabajadores/ ✅ EXISTE
  ├─ Crea en DB ✅ IMPLEMENTADO
  └─ Retorna serializado ✅ LISTO
     PERO FRONTEND NO LO USA

SOLUCIÓN: Conectar TrabajadoresModule.tsx al endpoint POST /api/trabajadores/
```

#### 2. **Desorganización de Módulos**
```
ACTUAL (INCORRECTO):
  App.tsx
  ├─ Tótem ✅
  ├─ Guardia ✅
  ├─ RRHH ✅
  ├─ Trabajadores (debería estar EN RRHH) ❌
  ├─ Ciclo Bimensual (debería estar EN RRHH + Admin) ❌
  ├─ Trazabilidad QR (debería estar EN RRHH) ❌
  ├─ Nómina (debería estar EN RRHH) ❌
  ├─ Reportes (debería estar EN Admin + RRHH) ❌
  └─ Administración ✅

CORRECTO (PROPUESTO):
  
  👨‍💼 DASHBOARD RRHH
    ├─ Trabajadores (Create/Read/Update/Delete)
    ├─ Ciclo Bimensual
    ├─ Nómina Cíclica
    ├─ Trazabilidad QR
    └─ Reportes (lectura)
    
  ⚙️ DASHBOARD ADMINISTRACIÓN
    ├─ Configuración del Sistema
    ├─ Gestión de Roles/Usuarios
    ├─ Reportes y Análisis (edición/exportación)
    ├─ Parámetros Operativos
    └─ Alertas de Sistema
    
  👮 PANEL GUARDIA
    ├─ Validar Tickets
    ├─ Métricas de Entregas
    ├─ Historiales
    └─ (SIN cambios)
    
  🖥️ TÓTEM AUTOSERVICIO
    └─ (SIN cambios)
```

---

## 📊 Tabla de Alineación Actual

| Módulo | Frontend | Backend API | Estado | Problema |
|--------|----------|-------------|--------|---------|
| **Tótem** | ✅ TotemModule.tsx | ✅ /api/beneficios/ | ✅ FUNCIONA | Ninguno |
| | | ✅ /api/tickets/ | | |
| **Guardia** | ✅ GuardiaModule.tsx | ✅ /api/tickets/validar_guardia/ | ✅ FUNCIONA | Ninguno |
| | | ✅ /api/metricas/guardia/ | | |
| **Trabajadores** | ⚠️ TrabajadoresModule.tsx | ✅ /api/trabajadores/ | ❌ DESCONECTADO | Mock data only |
| | | POST no llamado | | POST no implementado |
| | | PUT no llamado | | PUT no implementado |
| | | DELETE no llamado | | DELETE no implementado |
| **Ciclo Bimensual** | ⚠️ CicloBimensualModule.tsx | ✅ /api/ciclos/ | ❌ DESCONECTADO | Mock data only |
| **Trazabilidad QR** | ⚠️ TrazabilidadModule.tsx | ✅ /api/incidencias/ | ❌ DESCONECTADO | Mock data only |
| **Nómina** | ⚠️ NominaModule.tsx | ⚠️ /api/nomina/ | ❌ INCOMPLETO | API parcial |
| **RRHH Dashboard** | ⚠️ RRHHModule.tsx | ✅ /api/reportes/ | ⚠️ PARCIAL | Usa API en algunos endpoints |
| **Reportes** | ⚠️ ReportesModule.tsx | ✅ /api/reportes/ | ❌ DESCONECTADO | Mock data mostly |
| **Administración** | ⚠️ AdministradorModule.tsx | ✅ /api/parametros/ | ⚠️ PARCIAL | Solo parametros |

---

## 🔗 Endpoints Backend Disponibles

### ✅ Totalmente Funcionales
```
GET  /api/health/                          - Health check
GET  /api/beneficios/{rut}/                - Obtener beneficio (TÓTEM)
POST /api/tickets/                         - Crear ticket (TÓTEM)
GET  /api/tickets/{uuid}/estado/           - Estado ticket
POST /api/tickets/{uuid}/validar_guardia/  - Validar guardia
POST /api/tickets/{uuid}/anular/           - Anular ticket
POST /api/incidencias/                     - Crear incidencia (TÓTEM)
GET  /api/incidencias/listar/              - Listar incidencias
POST /api/agendamientos/                   - Crear agendamiento (TÓTEM)
POST /api/ciclo/activo/                    - Obtener ciclo activo
```

### ⚠️ Implementados pero Sin Usar en Frontend
```
GET  /api/trabajadores/                    - Listar trabajadores
POST /api/trabajadores/                    - Crear trabajador ← PROBLEMA: frontend no lo usa
GET  /api/trabajadores/{rut}/              - Obtener trabajador
PUT  /api/trabajadores/{rut}/              - Actualizar trabajador ← NO IMPLEMENTADO EN FRONTEND
DELETE /api/trabajadores/{rut}/            - Eliminar trabajador ← NO IMPLEMENTADO EN FRONTEND
POST /api/trabajadores/{rut}/bloquear/     - Bloquear trabajador
POST /api/trabajadores/{rut}/desbloquear/  - Desbloquear trabajador
GET  /api/trabajadores/{rut}/timeline/     - Timeline trabajador

GET  /api/ciclos/                          - Listar ciclos
POST /api/ciclos/                          - Crear ciclo
GET  /api/ciclos/{id}/                     - Obtener ciclo
PUT  /api/ciclos/{id}/                     - Actualizar ciclo
POST /api/ciclos/{id}/cerrar/              - Cerrar ciclo
GET  /api/ciclos/{id}/estadisticas/        - Estadísticas ciclo

GET  /api/stock/resumen/                   - Resumen stock
GET  /api/stock/movimientos/               - Historial movimientos

POST /api/nomina/preview/                  - Preview nómina
POST /api/nomina/confirmar/                - Confirmar nómina
GET  /api/nomina/historial/                - Historial nómina

GET  /api/tickets/listar/                  - Listar tickets (RRHH)
GET  /api/reportes/retiros_por_dia/        - Retiros por día
```

### ✅ Llamadas desde Frontend a API
```
✅ GET /api/beneficios/{rut}               - TotemModule
✅ POST /api/tickets/                      - TotemModule
✅ GET /api/ciclo/activo/                  - Hook useCicloActivo
✅ POST /api/incidencias/                  - TotemModule
✅ POST /api/agendamientos/                - TotemModule
✅ GET /api/tickets/listar/                - RRHHModule
✅ GET /api/reportes/retiros_por_dia/      - RRHHModule
✅ POST /api/tickets/validar_guardia/      - GuardiaModule
✅ GET /api/metricas/guardia/              - GuardiaModule
```

---

## 🚨 Problemas Detectados

### 1️⃣ TrabajadoresModule.tsx - Sin Conectar a API
**Archivo:** `front end/src/components/TrabajadoresModule.tsx`

```typescript
// ❌ ACTUAL: Solo mock data
const mockWorkers = [
  { id: 1, rut: '12.345.678-9', name: 'María González', ... },
  // ...
];

// ❌ Al hacer click "Agregar Trabajador":
function handleAddWorker(formData) {
  mockWorkers.push(formData);  // ← SOLO LOCAL, NO SE GUARDA EN BD
  setWorkers([...mockWorkers]);
}

// ✅ DEBERÍA:
async function handleAddWorker(formData) {
  const response = await trabajadorService.createTrabajador(formData);
  setWorkers([...workers, response]);
}
```

**Impacto:** Los trabajadores agregados NO SE GUARDAN en la BD. Solo existen localmente.

**Solución:** Crear `trabajador.service.ts` con métodos CRUD y usarlos en frontend.

---

### 2️⃣ RRHHModule - Uso Parcial de API
**Archivo:** `front end/src/components/RRHHModule.tsx`

```typescript
// ✅ Usa API:
const [incidencias, setIncidencias] = useState<IncidenciaDTO[]>([]);
const [tickets, setTickets] = useState<TicketDTO[]>([]);
const [retirosDia, setRetirosDia] = useState<RetirosDiaDTO[]>([]);

// ❌ Pero mockea datos de trabajadores, ciclo, nómina:
function renderNominaTab() {
  return <div>Mock nómina content...</div>;  // No consulta /api/nomina/
}
```

**Solución:** Completar las llamadas a API para todos los tabs.

---

### 3️⃣ AdministradorModule - Usuarios Mocked
**Archivo:** `front end/src/components/AdministradorModule.tsx`

```typescript
// ❌ Mock data hardcodeado
const systemUsers = [
  { id: 1, name: 'Laura Méndez', email: 'laura.mendez@tml.cl', ... },
  // No se sincroniza con BD
];

// ❌ Roles mocked
const roles = [
  { id: 1, name: 'Administrador', users: 3, ... },
  // No hay endpoint de roles en backend
];
```

**Solución:** Crear endpoints de gestión de usuarios/roles en backend.

---

### 4️⃣ Falta de Servicios Frontend
**Archivos:** `front end/src/services/`

```
✅ Existen:
  - apiClient.ts
  - trabajador.service.ts (PERO INCOMPLETO)
  - ticket.service.ts
  - schedule.service.ts
  - incident.service.ts

❌ Faltan:
  - ciclo.service.ts (completar)
  - nomina.service.ts
  - stock.service.ts (completar)
  - admin.service.ts
  - usuario.service.ts
  - rol.service.ts
```

---

### 5️⃣ Sin Responsividad en Vistas
**Archivos afectados:**
- RRHHModule.tsx
- TrabajadoresModule.tsx
- CicloBimensualModule.tsx
- TrazabilidadModule.tsx
- NominaModule.tsx
- ReportesModule.tsx
- AdministradorModule.tsx

**Problemas:**
```
❌ Layouts fijos (1440×900 hardcodeado)
❌ No hay breakpoints md: lg:
❌ Tablas no scrollable en mobile
❌ Modales muy grandes en mobile
❌ Input/Select sin responsive padding
❌ Sin menús móviles
```

---

## 📋 Plan de Acción

### FASE 1: Corregir Conexiones API (2 horas)
```
1. ✅ Crear/completar servicios:
   - ciclo.service.ts
   - nomina.service.ts
   - stock.service.ts
   - usuario.service.ts (nuevo)
   
2. ✅ Conectar TrabajadoresModule al API
   - Usar GET /api/trabajadores/ al cargar
   - POST /api/trabajadores/ al crear
   - PUT /api/trabajadores/{rut}/ al editar
   - DELETE /api/trabajadores/{rut}/ al eliminar
   
3. ✅ Conectar CicloBimensualModule al API
   - GET /api/ciclos/ → listar
   - POST /api/ciclos/ → crear
   - PUT /api/ciclos/{id}/ → editar
   
4. ✅ Conectar NominaModule al API
   - POST /api/nomina/preview/
   - POST /api/nomina/confirmar/
   - GET /api/nomina/historial/
```

### FASE 2: Reorganizar Módulos (1 hora)
```
1. ✅ Mover TrabajadoresModule DENTRO de RRHHModule
2. ✅ Mover CicloBimensualModule DENTRO de RRHHModule
3. ✅ Mover TrazabilidadModule DENTRO de RRHHModule
4. ✅ Mover NominaModule DENTRO de RRHHModule
5. ✅ Reorganizar ReportesModule en Admin
6. ✅ Actualizar App.tsx para nueva estructura
```

### FASE 3: Responsividad Total (3 horas)
```
1. ✅ RRHHModule: agregar breakpoints md: lg:
2. ✅ Todas las tablas: scrollable en mobile
3. ✅ Todos los modales: responsive sizing
4. ✅ Todos los inputs: responsive padding
5. ✅ Header/Tabs: responsive layout
6. ✅ Testing en device emulation
```

### FASE 4: Testing (1 hora)
```
1. ✅ Verificar que CRUD funciona en cada módulo
2. ✅ Verificar responsividad mobile/tablet/desktop
3. ✅ Validar datos en consola
4. ✅ Testing de errores API
```

---

## 🎯 Orden de Ejecución

**Orden recomendado:**

1. **Crear servicios** → Luego todo lo usa
2. **Conectar TrabajadoresModule** → Lo más crítico
3. **Conectar CicloBimensualModule**
4. **Conectar NominaModule**
5. **Reorganizar estructura** → Ya todo está conectado
6. **Responsividad** → Último, no afecta funcionalidad

---

## 📝 Notas Técnicas

### Por qué TrabajadoresModule no funciona:
```typescript
// El formulario usa state local
const [newWorker, setNewWorker] = useState({ name: '', rut: '', ... });

// Al guardar, solo actualiza mock:
setWorkers([...workers, newWorker]);  // ← Sin persistencia en BD

// Recarga página → datos desaparecen porque no están en DB
```

### Por qué Ciclo Bimensual no funciona:
```typescript
// Usa mock data:
const mockCycles = [
  { id: 1, name: 'Ciclo 2024-01', ... },
];

// Nunca llama a:
// GET /api/ciclos/  ← Endpoint EXISTE pero NO se usa
```

### Por qué Nómina no funciona:
```typescript
// Frontend mockea todo:
function previewNomina() {
  return <div>Mock preview...</div>;  // No consulta API
}

// Backend tiene endpoints:
// POST /api/nomina/preview/  ← Implementado pero no se usa
```

---

## 📦 Archivos a Modificar

### Prioridad ALTA (Crítico)
- [ ] `front end/src/components/TrabajadoresModule.tsx` - Desconectar de mock, conectar a API
- [ ] `front end/src/services/trabajador.service.ts` - Completar CRUD
- [ ] `front end/src/components/RRHHModule.tsx` - Reorganizar, hacer responsive

### Prioridad MEDIA (Importante)
- [ ] `front end/src/components/CicloBimensualModule.tsx` - Conectar a API, responsive
- [ ] `front end/src/components/NominaModule.tsx` - Conectar a API, responsive
- [ ] `front end/src/components/TrazabilidadModule.tsx` - Conectar a API, responsive
- [ ] `front end/src/services/ciclo.service.ts` - Crear nuevo
- [ ] `front end/src/services/nomina.service.ts` - Crear nuevo
- [ ] `front end/src/App.tsx` - Reorganizar estructura

### Prioridad BAJA (Mejorable)
- [ ] `front end/src/components/ReportesModule.tsx` - Conectar reportes, responsive
- [ ] `front end/src/components/AdministradorModule.tsx` - Completar usuario/roles, responsive
- [ ] `front end/src/services/admin.service.ts` - Crear nuevo

---

## ✅ Checklist de Validación Final

```
CONEXIONES API:
  [ ] Trabajadores: CRUD completo funciona
  [ ] Ciclo: CRUD completo funciona
  [ ] Nómina: Preview/Confirmar funciona
  [ ] Stock: GET endpoints funciona
  [ ] Incidencias: Listar/Resolver funciona

REORGANIZACIÓN:
  [ ] Trabajadores está en RRHH
  [ ] Ciclo está en RRHH
  [ ] Nómina está en RRHH
  [ ] Trazabilidad está en RRHH
  [ ] Reportes está en Admin
  [ ] Estructura jerarquía es lógica

RESPONSIVIDAD:
  [ ] Mobile (360px): todo funciona
  [ ] Tablet (768px): todo funciona
  [ ] Desktop (1440px): todo funciona
  [ ] No hay scroll horizontal
  [ ] Texto legible en todos los tamaños

DATOS:
  [ ] Al recargar página, datos persisten
  [ ] CRUD operations se reflejan en tiempo real
  [ ] No hay inconsistencias entre frontend/backend
```

---

**Próximo paso:** Ejecutar FASE 1 - Crear servicios y conectar API
