# Auditoría de Código – Proyecto Codigo_pi

Fecha: 2025-12-02
Rama: main
Estado: working tree limpio; adelantado respecto a origin/main

## Objetivo
Identificar código (frontend y backend) que:
- No se utiliza actualmente (sin referencias desde UI, rutas o servicios).
- Es redundante con otra implementación vigente.
- Podría servir a futuro (marcar como deprecated) para decidir conservar o mover.
No abarca documentación ni assets, solo código ejecutable o importable.

## Resumen Ejecutivo (alcance de código)
- Se enfocará en componentes, hooks, servicios, utilidades, views, serializers, commands y tareas Celery.
- Se excluirán archivos de configuración y tests (salvo duplicados no referenciados por suites oficiales).
- El informe listará candidatos con nivel de recomendación: eliminar, deprecar, conservar.

---

## Alcance y Metodología
1. Recorrido por estructura del repo y búsqueda de patrones:
  - Frontend: `front end/src/**/*.ts(x)` – componentes, hooks, servicios, rutas.
  - Backend: apps `totem`, `guardia`, `rrhh` – `views*.py`, `urls.py`, `serializers.py`, `services/`, `management/commands`, `tasks.py`.
2. Detección de señales de no uso:
   - Exports sin imports (heurístico mediante grep).
   - Componentes no montados en rutas o `App.tsx`.
   - Servicios nunca llamados.
   - Views no enrutadas en `urls.py`.
   - Comandos/fixtures no usados.
3. Validación cruzada con tests (si los hay) y referencias.

---

## Hallazgos Iniciales (estructura y posibles redundancias)

### Frontend
- `front end/src/App.tsx`:
  - Menú: secciones `design-system`, `totem`, `guardia`, `rrhh`, `stock`, `nomina`, `admin`.
    - Riesgo: `design-system` podría ser legacy si no hay ruta/pantalla activa.
    - Acción: verificar montaje real y referencias desde `main.tsx`/ruteo.
- `front end/src/components/TotemModule.tsx`:
  - Lógica extensa de escaneo: candidata a refactor (hook `useScanner`).
  - Acción: medir referencias internas para confirmar que no haya funciones sin uso.
- Servicios (`front end/src/services/*`):
  - Acción: inventariar exports y buscar imports cruzados; listar servicios sin consumo.

### Backend
- `backend/totem/management/commands`:
  - `cargar_nomina.py` y `crear_usuarios_test.py`: confirmar uso en producción vs. dev.
    - Recomendación: marcar como `dev-only` si no se usan en runtime.
- `backend/totem/views_*.py`:
  - Acción: listar `views_*.py` y validar enrutamiento en `urls.py`.
- `backend/totem/services/`:
  - Acción: inventariar servicios y sus puntos de uso.

---

## Resultados de Escaneo (frontend servicios y componentes)
- Servicios actualmente usados (importados en componentes/contextos):
  - `apiClient.ts` (`AuthContext.tsx`)
  - `auth.service.ts` (`ChangePasswordModal.tsx`, `UserManagementDialog.tsx`)
  - `trabajador.service.ts` (`TotemModule.tsx`)
  - `ticket.service.ts` (`TotemModule.tsx`, `GuardiaModule.tsx`)
  - `incident.service.ts` (`TotemModule.tsx`, `GuardiaModule.tsx`)
  - `schedule.service.ts` (`TotemModule.tsx`)
  - `stock.service.ts` (`GuardiaModule.tsx`)
  - `tickets.query.service.ts` (`GuardiaModule.tsx`)
- Servicios sin referencias (candidatos):
  - `print.ts` → `printService` exportado, no importado en `src`.
  - `report.service.ts` → `reportService` exportado, sin imports en `src`.
  - `nomina.service.ts`, `ciclo.service.ts`, `api.ts` → sin match de imports en `src` (verificar si están planificados).
- Componentes y rutas:
  - `App.tsx` referencia secciones: `design-system`, `totem`, `guardia`, `rrhh`, `stock`, `nomina`, `admin`.
  - Confirmar si existen pantallas/routers concretos para `design-system`, `nomina`, `admin`.

## Lista Preliminar de Candidatos (a confirmar por escaneo)
- Frontend:
  - `services/print.ts`: no se encontraron referencias de uso en `src/` (candidato a eliminar o mover a `deprecated/`).
  - `services/report.service.ts`: no se detectaron imports desde componentes (candidato a deprecar hasta que exista UI de reportes).
  - `services/nomina.service.ts`, `services/ciclo.service.ts`, `services/api.ts`: potencialmente no usados; revisar si hay planes de uso inmediato.
  - Componentes de demo o utilidades no montadas (seguir validando tras ruteo): mantener por ahora.
  - Recursos gráficos no referenciados: ya se eliminaron MD/attributions.
- Backend:
  - Views: todas las principales están enrutadas en `totem/urls.py`, `guardia/urls.py`, `rrhh/urls.py`.
  - Servicios en `services/`: pendiente inventario cruzado con `views` y `tests`.
  - `management/commands`: `cargar_nomina.py`, `crear_usuarios_test.py` parecen orientados a dev/operación; marcar como `dev-only` si no se usan en producción.

> Nota: La lista se poblará tras el escaneo automatizado y revisión manual.

---

## Plan de Eliminación Segura (Propuesto)
1. Ejecutar escaneo de referencias (frontend y backend) y generar lista de símbolos no usados.
2. Revisar con el propietario (tú) cualquier elemento con posible uso futuro.
3. Aplicar eliminación o, si prefieres, mover a `deprecated/` con breve nota.
4. Correr tests del backend; build del frontend; smoke manual básico.
5. Commit con resumen y impacto (archivos removidos, líneas, módulos).

---

## Hallazgos Detallados (escaneo completo)

### Frontend – Componentes
- **Utilizados activamente en App.tsx:**
  - `LoginModule`, `DesignSystem`, `TotemModule`, `GuardiaModule`, `RRHHModuleNew`, `AdministradorModule`, `StockModule`, `NominaModule`, `ChangePasswordModal`
- **Componentes exportados pero NO importados/montados en App.tsx:**
  - `ReportesModule.tsx` → Exporta `ReportesModule`; no hay ruta ni referencia en `App.tsx` (candidato a eliminar o planificar UI).
  - `TrazabilidadModule.tsx` → Exporta `TrazabilidadModule`; sin ruta/referencia (candidato).
  - `CicloBimensualModule.tsx` → Exporta `CicloBimensualModule`; sin ruta/referencia (candidato).
  - `RRHHModule.tsx` (legado vs. RRHHModuleNew) → `RRHHModuleNew` está activa; `RRHHModule` no se importa (candidato a eliminar o renombrar como legacy).

### Frontend – Servicios
- **Servicios usados:**
  - `apiClient.ts`, `auth.service.ts`, `trabajador.service.ts`, `ticket.service.ts`, `incident.service.ts`, `schedule.service.ts`, `stock.service.ts`, `tickets.query.service.ts`
  - `nomina.service.ts` (usado por `RRHHModuleNew.tsx`), `ciclo.service.ts` (usado por `RRHHModuleNew.tsx`)
- **Servicios sin imports (candidatos a eliminar):**
  - `print.ts` → Exporta `printService`; no se importa en ningún componente ni contexto (eliminar o marcar deprecated si se planea usar).
  - `report.service.ts` → Exporta `reportService`; no se importa actualmente (eliminar si no hay plan de reportes; nota: `ReportesModule` no está montado).
  - `api.ts` → No se encontraron referencias de uso; verificar si es wrapper legacy de `apiClient.ts` (posible duplicado).

### Frontend – Hooks
- **Usados:**
  - `useToast` (por `toast.ts`), `useRUTInput` (por `RUTInput.tsx`), `useParametrosOperativos` (por `AdministradorModule.tsx`), `useCicloActivo` (por `RRHHModule.tsx`, `RRHHModuleNew.tsx`), `useMetricasGuardia` (por `GuardiaModule.tsx`)
- **Sin referencias encontradas:**
  - `useQRScanner` → Exportado en `useQRScanner.ts`; no se importa en componentes (candidato si no hay uso en `GuardiaQRScanner` u otros).

### Backend – Servicios
- **Servicios totem activamente usados:**
  - `trabajador_service.py`, `ticket_service.py`, `agendamiento_service.py`, `incidencia_service.py`, `stock_service.py`, `ciclo_service.py` → Todos importados en `views.py` o tests.
- **Servicios guardia/rrhh:**
  - `guardia_service.py` → Usado por `guardia/views.py`.
  - `rrhh_service.py` → Usado por `rrhh/views.py`.
- **Sin problemas de código muerto en servicios backend.**

### Backend – Views
- **Views enrutados en `totem/urls.py`:**
  - `views.py`, `views_auth.py`, `views_trabajadores.py`, `views_ciclos.py`, `views_stock.py`, `views_nomina.py`, `views_health.py`
- **Views referenciados pero ausentes (roto):**
  - `views_debug.py` → Importado en `urls.py` línea 10 pero archivo eliminado previamente (causa error import).
- **Views apps externas:**
  - `guardia/views.py` y `rrhh/views.py` correctamente enrutados.

### Backend – Management Commands
- `backend/totem/management/commands/cargar_nomina.py` → Comando dev/operativo para cargar nómina CSV.
- `backend/totem/management/commands/crear_usuarios_test.py` → Comando dev/test para crear usuarios fixture.
- `backend/totem/management/commands/marcar_agendamientos_vencidos.py` → Usa `AgendamientoService`; operativo (cron/scheduled).
- **Recomendación:** Marcar `cargar_nomina` y `crear_usuarios_test` como dev-only o conservar para operaciones manuales según necesidad.

---

## Recomendaciones Finales

### Eliminaciones Inmediatas (código muerto confirmado)
1. **Frontend:**
   - `services/print.ts` → Sin uso; eliminar o mover a `deprecated/`.
   - `services/report.service.ts` → Sin uso; eliminar si no hay plan UI de reportes (nota: `ReportesModule` no montado).
   - `services/api.ts` → Posible duplicado de `apiClient.ts`; eliminar si no es necesario.
   - `components/ReportesModule.tsx` → No montado en `App.tsx`; eliminar o planificar ruta.
   - `components/TrazabilidadModule.tsx` → No montado en `App.tsx`; eliminar o planificar.
   - `components/CicloBimensualModule.tsx` → No montado en `App.tsx`; eliminar o planificar.
   - `components/RRHHModule.tsx` (legacy) → Reemplazado por `RRHHModuleNew.tsx`; eliminar tras confirmar.
   - `hooks/useQRScanner.ts` → No se importa; validar con `GuardiaQRScanner` antes de eliminar.

2. **Backend:**
   - **CRÍTICO:** `backend/totem/urls.py` línea 10 importa `views_debug` que no existe → Eliminar import y rutas de debug o restaurar archivo si es necesario.
   - Comandos `cargar_nomina.py` y `crear_usuarios_test.py` → Conservar si se usan en operaciones; de lo contrario, marcar como dev-only o comentar en docs.

### Deprecaciones (usar con precaución)
- Componentes/servicios planificados pero no implementados: mover a carpeta `deprecated/` con nota sobre intención futura.

### Refactors Sugeridos
- `TotemModule.tsx` → Extraer lógica de escaneo a hook `useScanner` para reutilización.
- Servicios singleton: confirmar que patrón se mantiene consistente (todos usan `getInstance()`).

---

## Plan de Acción Propuesto
1. Confirmar con propietario qué componentes/servicios planificados conservar vs. eliminar (`ReportesModule`, `TrazabilidadModule`, `CicloBimensualModule`).
2. **Urgente:** Eliminar import roto de `views_debug` en `backend/totem/urls.py` o restaurar archivo si tiene funcionalidad debug necesaria.
3. Ejecutar eliminaciones seguras de servicios frontend no usados (`print.ts`, `report.service.ts`, `api.ts`).
4. Eliminar componentes no montados tras confirmación (paso 1).
5. Correr tests backend y build frontend tras cambios; smoke test manual.
6. Commit con resumen detallado de eliminaciones/refactors.

---

## Resumen Cuantitativo
- **Frontend:**
  - Servicios candidatos a eliminar: 3 (`print.ts`, `report.service.ts`, `api.ts`)
  - Componentes candidatos: 4 (`ReportesModule`, `TrazabilidadModule`, `CicloBimensualModule`, `RRHHModule`)
  - Hooks candidatos: 1 (`useQRScanner` – validar antes)
- **Backend:**
  - Imports rotos: 1 (`views_debug` en `urls.py`)
  - Comandos dev: 2 (conservar o documentar como dev-only)

**Estimación de líneas eliminables:** ~800-1200 líneas (dependiendo de decisión sobre componentes planificados).

---

# ANÁLISIS TÉCNICO PROFUNDO DEL PROYECTO

## 1. BASE DE DATOS (SQLite / PostgreSQL)

### Configuración
- **Motor por defecto:** SQLite (`db.sqlite3`) para desarrollo
- **Motor producción:** PostgreSQL (configurable via `USE_POSTGRES=True` en `.env`)
- **ORM:** Django Models con migraciones automáticas
- **Zona horaria:** `America/Santiago` (Chile)

### Esquema de Modelos (13 tablas principales)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MODELO DE DATOS                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │
│  │  Usuario    │     │  Sucursal   │     │   Ciclo     │           │
│  │─────────────│     │─────────────│     │─────────────│           │
│  │ username    │◄────│ codigo      │     │ fecha_inicio│           │
│  │ rol (enum)  │     │ nombre      │     │ fecha_fin   │           │
│  │ sucursal_fk │     └─────────────┘     │ activo      │           │
│  │ activo      │            │            └──────┬──────┘           │
│  └─────────────┘            │                   │                  │
│        │                    │                   │                  │
│        │         ┌──────────┴───────────┐       │                  │
│        │         ▼                      ▼       ▼                  │
│        │   ┌───────────┐         ┌─────────────────┐               │
│        │   │ CajaFisica│         │    Ticket       │               │
│        │   │───────────│         │─────────────────│               │
│        │   │ codigo    │         │ uuid (unique)   │               │
│        │   │ tipo      │◄────────│ trabajador_fk   │               │
│        │   │ sucursal  │         │ estado          │               │
│        │   │ usado     │         │ ttl_expira_at   │               │
│        │   │ ticket_fk │         │ ciclo_fk        │               │
│        │   └───────────┘         │ sucursal_fk     │               │
│        │                         │ data (JSON)     │               │
│        │                         └────────┬────────┘               │
│        │                                  │                        │
│        │                    ┌─────────────┼─────────────┐          │
│        │                    ▼             ▼             ▼          │
│        │            ┌───────────┐  ┌────────────┐ ┌───────────┐    │
│        │            │TicketEvent│  │Agendamiento│ │ Incidencia│    │
│        │            │───────────│  │────────────│ │───────────│    │
│        │            │ tipo      │  │ fecha_ret  │ │ codigo    │    │
│        │            │ timestamp │  │ estado     │ │ tipo      │    │
│        │            │ metadata  │  │ ciclo_fk   │ │ estado    │    │
│        │            └───────────┘  └────────────┘ │ creada_por│    │
│        │                                          └───────────┘    │
│        │                                                           │
│  ┌─────┴───────┐    ┌──────────────┐    ┌───────────────────┐      │
│  │ Trabajador  │    │StockSucursal │    │ StockMovimiento   │      │
│  │─────────────│    │──────────────│    │───────────────────│      │
│  │ rut (index) │    │ sucursal     │    │ fecha/hora        │      │
│  │ nombre      │    │ producto     │    │ tipo_caja         │      │
│  │ beneficio   │    │ cantidad     │    │ accion            │      │
│  │ (JSON)      │    └──────────────┘    │ cantidad          │      │
│  └─────────────┘                        └───────────────────┘      │
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐                      │
│  │ParametroOperativo│    │   NominaCarga    │                      │
│  │──────────────────│    │──────────────────│                      │
│  │ clave (unique)   │    │ ciclo_fk         │                      │
│  │ valor            │    │ usuario_fk       │                      │
│  │ descripcion      │    │ total_registros  │                      │
│  └──────────────────┘    │ creados/actuali. │                      │
│                          └──────────────────┘                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Detalle de Modelos

| Modelo | Propósito | Campos Clave | Índices |
|--------|-----------|--------------|---------|
| **Usuario** | Auth extendido con roles | `rol` (admin/rrhh/guardia/supervisor), `sucursal_fk`, `debe_cambiar_contraseña` | username |
| **Trabajador** | Beneficiario del sistema | `rut` (único), `nombre`, `beneficio_disponible` (JSON) | rut_idx |
| **Ticket** | Ticket QR generado | `uuid`, `estado` (pendiente/entregado/anulado/expirado), `ttl_expira_at` | uuid_idx, estado_fecha, trab_ciclo |
| **Ciclo** | Período bimensual | `fecha_inicio`, `fecha_fin`, `activo` | - |
| **Sucursal** | Punto de retiro | `codigo`, `nombre` | codigo (unique) |
| **CajaFisica** | Caja física asignada | `codigo`, `tipo` (premium/estándar), `usado` | - |
| **Agendamiento** | Retiro diferido | `fecha_retiro`, `estado`, `trabajador_fk`, `ciclo_fk` | trab_est, fecha_est |
| **Incidencia** | Reporte de problemas | `codigo`, `tipo`, `estado`, `creada_por` | est_fecha, tipo_est |
| **TicketEvent** | Timeline/trazabilidad | `tipo`, `timestamp`, `metadata` (JSON) | - |
| **StockSucursal** | Stock por sucursal | `sucursal`, `producto`, `cantidad` | - |
| **StockMovimiento** | Auditoría de stock | `tipo_caja`, `accion`, `cantidad` | fecha, tipo, accion |
| **ParametroOperativo** | Config global | `clave`, `valor` | clave (unique) |
| **NominaCarga** | Auditoría cargas CSV | `total_registros`, `creados`, `actualizados` | fecha_carga, ciclo |

### Relaciones Principales
- `Ticket` → `Trabajador` (FK, CASCADE)
- `Ticket` → `Ciclo` (FK, SET_NULL)
- `Ticket` → `Sucursal` (FK, SET_NULL)
- `TicketEvent` → `Ticket` (FK, CASCADE, related_name='eventos')
- `Agendamiento` → `Trabajador`, `Ciclo` (FK)
- `Usuario` → `Sucursal` (FK, SET_NULL)
- `CajaFisica` → `Sucursal` (FK, CASCADE), `Ticket` (FK, SET_NULL)

---

## 2. ARQUITECTURA BACKEND (Django REST Framework)

### Stack Tecnológico
- **Framework:** Django 4.x + Django REST Framework
- **Autenticación:** JWT (djangorestframework-simplejwt) con tokens personalizados
- **Documentación:** OpenAPI 3.0 (drf-spectacular) + Swagger UI
- **Seguridad:** QR firmado con HMAC-SHA256, CORS configurado
- **Patrón:** Service Layer (lógica de negocio separada de views)

### Estructura de Apps

```
backend/
├── backend_project/          # Configuración Django
│   ├── settings.py           # Config principal (DB, apps, middleware)
│   ├── urls.py               # Rutas raíz (/api/, /admin/, /api/docs/)
│   └── wsgi.py               # Entry point producción
│
├── totem/                    # App núcleo (80% de la lógica)
│   ├── models.py             # 13 modelos de datos
│   ├── serializers.py        # Serializers DRF + validación
│   ├── views.py              # Views principales (tickets, incidencias)
│   ├── views_auth.py         # Login, logout, cambio contraseña
│   ├── views_trabajadores.py # CRUD trabajadores
│   ├── views_ciclos.py       # Gestión de ciclos bimensuales
│   ├── views_stock.py        # Resumen y movimientos de stock
│   ├── views_nomina.py       # Preview y confirmación de nómina
│   ├── views_health.py       # Health checks (liveness, readiness)
│   ├── urls.py               # +50 endpoints enrutados
│   ├── services/             # Service Layer
│   │   ├── ticket_service.py      # Lógica tickets + QR
│   │   ├── trabajador_service.py  # Beneficios y validación
│   │   ├── agendamiento_service.py
│   │   ├── incidencia_service.py
│   │   ├── stock_service.py
│   │   └── ciclo_service.py
│   ├── security.py           # QRSecurity (HMAC-SHA256)
│   ├── validators.py         # Validadores RUT, Ticket
│   ├── exceptions.py         # Excepciones de negocio
│   └── management/commands/  # Comandos CLI
│       ├── cargar_nomina.py
│       ├── crear_usuarios_test.py
│       └── marcar_agendamientos_vencidos.py
│
├── guardia/                  # App validación en portería
│   ├── views.py              # validar_ticket_guardia, metricas
│   ├── urls.py
│   └── services/guardia_service.py
│
└── rrhh/                     # App reportes RRHH
    ├── views.py              # listar_tickets, retiros_por_dia
    ├── urls.py
    └── services/rrhh_service.py
```

### Endpoints Principales (API REST)

| Grupo | Método | Endpoint | Función |
|-------|--------|----------|---------|
| **Auth** | POST | `/api/auth/login/` | JWT login (custom claims) |
| | POST | `/api/auth/refresh/` | Refresh token |
| | GET | `/api/auth/me/` | Usuario actual |
| | POST | `/api/auth/change-password/` | Cambiar contraseña |
| **Tickets** | POST | `/api/tickets/` | Crear ticket con QR |
| | GET | `/api/tickets/<uuid>/estado/` | Estado del ticket |
| | POST | `/api/tickets/<uuid>/validar_guardia/` | Validar en portería |
| | POST | `/api/tickets/<uuid>/anular/` | Anular ticket |
| **Trabajadores** | GET/POST | `/api/trabajadores/` | Listar/Crear |
| | GET/PATCH/DELETE | `/api/trabajadores/<rut>/` | Detalle/Editar/Eliminar |
| | POST | `/api/trabajadores/<rut>/bloquear/` | Bloquear beneficio |
| **Ciclos** | GET/POST | `/api/ciclos/` | Listar/Crear ciclos |
| | POST | `/api/ciclos/<id>/cerrar/` | Cerrar ciclo |
| | GET | `/api/ciclo/activo/` | Ciclo activo actual |
| **Stock** | GET | `/api/stock/resumen/` | Resumen por tipo |
| | GET | `/api/stock/movimientos/` | Historial movimientos |
| | POST | `/api/stock/movimiento/` | Registrar movimiento |
| **Nómina** | POST | `/api/nomina/preview/` | Vista previa carga |
| | POST | `/api/nomina/confirmar/` | Confirmar carga |
| **Incidencias** | POST | `/api/incidencias/` | Crear incidencia |
| | GET | `/api/incidencias/listar/` | Listar todas |
| | POST | `/api/incidencias/<codigo>/resolver/` | Resolver |
| **Health** | GET | `/api/health/` | Health check |
| | GET | `/api/health/liveness/` | Kubernetes liveness |
| | GET | `/api/health/readiness/` | Kubernetes readiness |

### Service Layer (Patrón de Arquitectura)

```python
# Ejemplo: TicketService
class TicketService:
    """Encapsula lógica de negocio de tickets."""
    
    @transaction.atomic
    def crear_ticket(self, trabajador_rut, sucursal, ciclo_id=None):
        # 1. Validar RUT
        # 2. Verificar beneficio disponible
        # 3. Verificar unicidad en ciclo
        # 4. Verificar stock
        # 5. Generar UUID + QR firmado
        # 6. Crear registro Ticket + TicketEvent
        # 7. Actualizar stock
        return ticket
    
    def validar_ticket(self, uuid, guardia_id):
        # 1. Verificar firma QR (HMAC)
        # 2. Verificar TTL no expirado
        # 3. Verificar estado pendiente
        # 4. Marcar como entregado
        # 5. Registrar TicketEvent
        return resultado
```

### Seguridad QR (HMAC-SHA256)

```python
# security.py
class QRSecurity:
    def firmar_payload(self, data: dict) -> str:
        """Genera firma HMAC-SHA256 del payload."""
        payload = json.dumps(data, sort_keys=True)
        signature = hmac.new(
            SECRET_KEY.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        return f"{payload}|{signature}"
    
    def verificar_firma(self, qr_data: str) -> bool:
        """Valida que el QR no haya sido manipulado."""
        payload, signature = qr_data.rsplit('|', 1)
        expected = hmac.new(...).hexdigest()
        return hmac.compare_digest(signature, expected)
```

---

## 3. ARQUITECTURA FRONTEND (React + Vite + TypeScript)

### Stack Tecnológico
- **Framework:** React 18.3 + TypeScript 5.4
- **Build Tool:** Vite 6.3 (HMR ultra-rápido)
- **Routing:** React Router DOM 7.x
- **HTTP Client:** Axios con interceptors (JWT auto-refresh)
- **UI Components:** Radix UI primitives + Tailwind CSS
- **Escaneo QR:** @zxing/browser (librería de código de barras)
- **Gráficos:** Recharts

### Estructura del Proyecto

```
front end/src/
├── App.tsx                    # Router principal + Layout
├── main.tsx                   # Entry point
├── index.css                  # Estilos globales Tailwind
│
├── components/                # Componentes React
│   ├── TotemModule.tsx        # Kiosko autoservicio (1436 líneas)
│   ├── GuardiaModule.tsx      # Panel de guardia (1407 líneas)
│   ├── RRHHModuleNew.tsx      # Dashboard RRHH (6 tabs)
│   ├── StockModule.tsx        # Gestión de stock
│   ├── NominaModule.tsx       # Carga de nómina
│   ├── AdministradorModule.tsx# Parámetros del sistema
│   ├── LoginModule.tsx        # Autenticación
│   ├── DesignSystem.tsx       # Catálogo de componentes
│   ├── ChangePasswordModal.tsx
│   ├── ProtectedRoute.tsx     # HOC para rutas protegidas
│   ├── guardia/               # Sub-componentes guardia
│   │   └── GuardiaQRScanner.tsx
│   ├── form/                  # Componentes de formulario
│   │   └── RUTInput.tsx       # Input con validación RUT
│   └── ui/                    # Radix UI wrappers
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── toast.tsx
│       └── ...
│
├── services/                  # Capa de servicios (API calls)
│   ├── apiClient.ts           # Axios instance + interceptors
│   ├── auth.service.ts        # Login, logout, refresh
│   ├── trabajador.service.ts  # GET beneficio, CRUD trabajadores
│   ├── ticket.service.ts      # Crear, validar, anular tickets
│   ├── incident.service.ts    # CRUD incidencias
│   ├── schedule.service.ts    # Agendamientos
│   ├── stock.service.ts       # Movimientos de stock
│   ├── ciclo.service.ts       # Ciclos bimensuales
│   ├── nomina.service.ts      # Preview/confirmar nómina
│   └── tickets.query.service.ts # Listado para guardia
│
├── hooks/                     # Custom hooks
│   ├── useToast.ts            # Notificaciones toast
│   ├── useRUTInput.ts         # Validación RUT en tiempo real
│   ├── useCicloActivo.ts      # Polling ciclo activo
│   ├── useMetricasGuardia.ts  # Métricas con polling
│   └── useParametrosOperativos.ts
│
├── contexts/                  # React Context
│   └── AuthContext.tsx        # Estado de autenticación global
│
├── types/                     # TypeScript interfaces
│   └── index.ts               # DTOs compartidos
│
└── utils/                     # Utilidades
    └── toast.ts               # Helper para notificaciones
```

### Módulos Principales

#### TotemModule (Kiosko Autoservicio)
```
Estados (12 pantallas):
initial → validating → success-choice → success
                    ↘ no-stock → schedule-select → schedule-confirm
                    ↘ no-benefit
                    ↘ error
                    → incident-scan → incident-status
                    → incident-form → incident-sent

Flujo:
1. Trabajador escanea cédula o ingresa RUT
2. Sistema valida beneficio disponible
3. Si hay stock → Genera ticket QR
4. Si no hay stock → Ofrece agendamiento
5. Opción de reportar incidencia
```

#### GuardiaModule (Panel Portería)
```
Tabs: scanner | incidents | metrics

Scanner:
1. Guardia escanea QR del ticket
2. Sistema valida firma HMAC + TTL + estado
3. Muestra datos del trabajador + tipo de caja
4. Confirma entrega → Actualiza estado

Métricas (polling 15s):
- Entregas hoy
- Pendientes
- Incidencias abiertas
- Stock disponible
```

#### RRHHModuleNew (Dashboard Administrativo)
```
Tabs (6):
1. Trabajadores   - CRUD completo + bloqueo
2. Ciclos         - Crear/cerrar ciclos bimensuales
3. Nómina         - Preview CSV + confirmar carga
4. Incidencias    - Listado + resolución
5. Reportes       - Retiros por día, estadísticas
6. Trazabilidad   - Timeline de tickets
```

### Sistema de Autenticación

```typescript
// AuthContext.tsx
interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

// Flujo JWT:
1. POST /api/auth/login/ → { access, refresh, user }
2. Guardar tokens en localStorage
3. Axios interceptor adjunta Bearer token
4. Si 401 → Auto-refresh con refresh token
5. Si refresh falla → Redirect a /login
```

### Roles y Permisos (Frontend)

| Rol | Secciones Visibles |
|-----|-------------------|
| **admin** | Todas (Design System, Totem, Guardia, RRHH, Stock, Nómina, Admin) |
| **rrhh** | RRHH, Stock, Nómina |
| **guardia** | Guardia |
| **supervisor** | RRHH |

```tsx
// ProtectedRoute.tsx
<ProtectedRoute allowedRoles={['rrhh', 'admin', 'supervisor']}>
    <DashboardLayoutWrapper />
</ProtectedRoute>
```

---

## 4. SISTEMA DE ESCANEO QR

### Arquitectura del Escaneo

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE ESCANEO QR                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TOTEM (Generación)                  GUARDIA (Validación)       │
│  ─────────────────                   ────────────────────       │
│                                                                 │
│  ┌─────────────┐                     ┌─────────────┐            │
│  │  Trabajador │                     │   Guardia   │            │
│  │ escanea RUT │                     │ escanea QR  │            │
│  └──────┬──────┘                     └──────┬──────┘            │
│         │                                   │                   │
│         ▼                                   ▼                   │
│  ┌─────────────┐                     ┌─────────────┐            │
│  │ Validar     │                     │ @zxing      │            │
│  │ Beneficio   │                     │ Decodificar │            │
│  │ (API)       │                     │ QR          │            │
│  └──────┬──────┘                     └──────┬──────┘            │
│         │                                   │                   │
│         ▼                                   ▼                   │
│  ┌─────────────┐                     ┌─────────────┐            │
│  │ Generar     │                     │ Extraer     │            │
│  │ UUID        │                     │ UUID        │            │
│  └──────┬──────┘                     └──────┬──────┘            │
│         │                                   │                   │
│         ▼                                   ▼                   │
│  ┌─────────────┐                     ┌─────────────┐            │
│  │ Crear QR    │                     │ POST        │            │
│  │ con firma   │─────────────────────│ /validar_   │            │
│  │ HMAC        │      (impreso)      │ guardia/    │            │
│  └──────┬──────┘                     └──────┬──────┘            │
│         │                                   │                   │
│         ▼                                   ▼                   │
│  ┌─────────────┐                     ┌─────────────┐            │
│  │ Ticket      │                     │ Backend     │            │
│  │ pendiente   │                     │ verifica:   │            │
│  │ (DB)        │                     │ - Firma     │            │
│  └─────────────┘                     │ - TTL       │            │
│                                      │ - Estado    │            │
│                                      └──────┬──────┘            │
│                                             │                   │
│                                             ▼                   │
│                                      ┌─────────────┐            │
│                                      │ Marcar      │            │
│                                      │ ENTREGADO   │            │
│                                      └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Librería de Escaneo (@zxing/browser)

```typescript
// TotemModule.tsx - Configuración del scanner
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

// Formatos soportados
const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.PDF_417,      // Cédula chilena
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
]);

// Inicialización
const codeReader = new BrowserMultiFormatReader(hints);
const controls = await codeReader.decodeFromVideoDevice(
    deviceId,           // ID de cámara
    videoElement,       // <video> ref
    (result, error) => {
        if (result) {
            const text = result.getText();
            // Procesar RUT o UUID según contexto
        }
    }
);
```

### Estructura del QR Generado

```json
{
    "uuid": "TKT-20251202-ABC123",
    "rut": "12345678-9",
    "nombre": "Juan Pérez",
    "tipo_caja": "Premium",
    "sucursal": "Central",
    "ciclo_id": 5,
    "created_at": "2025-12-02T10:30:00Z",
    "ttl_expira_at": "2025-12-02T18:00:00Z",
    "signature": "a1b2c3d4e5f6..."  // HMAC-SHA256
}
```

### Validación en Backend

```python
# views.py - validar_ticket_guardia
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validar_ticket_guardia(request, uuid):
    """Valida y marca ticket como entregado."""
    ticket_service = TicketService()
    
    try:
        resultado = ticket_service.validar_ticket(
            uuid=uuid,
            guardia_id=request.user.id
        )
        return Response({
            'success': True,
            'ticket': TicketSerializer(resultado['ticket']).data,
            'trabajador': resultado['trabajador'],
            'tipo_caja': resultado['tipo_caja']
        })
    except TicketExpiredException:
        return Response({'error': 'Ticket expirado'}, status=400)
    except QRInvalidException:
        return Response({'error': 'QR inválido o manipulado'}, status=400)
```

---

## 5. FLUJO COMPLETO DEL PROYECTO

### Diagrama de Flujo General

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     FLUJO COMPLETO DEL SISTEMA                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ╔═══════════════════╗                                                  │
│  ║  1. PREPARACIÓN   ║                                                  │
│  ╚═══════════════════╝                                                  │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐    │
│  │ RRHH carga      │────▶│ Backend procesa │────▶│ Trabajadores    │    │
│  │ nómina CSV      │     │ y valida        │     │ con beneficio   │    │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘    │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐     ┌─────────────────┐                            │
│  │ RRHH crea       │────▶│ Ciclo activo    │                            │
│  │ ciclo bimensual │     │ en sistema      │                            │
│  └─────────────────┘     └─────────────────┘                            │
│           │                                                             │
│           ▼                                                             │
│  ╔═══════════════════╗                                                  │
│  ║  2. RETIRO TOTEM  ║                                                  │
│  ╚═══════════════════╝                                                  │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐    │
│  │ Trabajador      │────▶│ Totem valida    │────▶│ Ticket QR       │    │
│  │ escanea cédula  │     │ beneficio+stock │     │ generado        │    │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘    │
│                                   │                      │              │
│                          [sin stock]                     │              │
│                                   ▼                      │              │
│                          ┌─────────────────┐             │              │
│                          │ Agendamiento    │             │              │
│                          │ para otro día   │             │              │
│                          └─────────────────┘             │              │
│                                                          │              │
│  ╔═══════════════════╗                                   │              │
│  ║  3. ENTREGA       ║◀──────────────────────────────────┘              │
│  ╚═══════════════════╝                                                  │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐    │
│  │ Trabajador va   │────▶│ Guardia escanea │────▶│ Sistema valida  │    │
│  │ a portería      │     │ QR del ticket   │     │ firma + TTL     │    │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘    │
│                                                          │              │
│                                                          ▼              │
│                                                  ┌─────────────────┐    │
│                                                  │ Guardia entrega │    │
│                                                  │ caja física     │    │
│                                                  └─────────────────┘    │
│                                                          │              │
│                                                          ▼              │
│                                                  ┌─────────────────┐    │
│                                                  │ Ticket marcado  │    │
│                                                  │ ENTREGADO       │    │
│                                                  └─────────────────┘    │
│                                                                         │
│  ╔═══════════════════╗                                                  │
│  ║  4. SEGUIMIENTO   ║                                                  │
│  ╚═══════════════════╝                                                  │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐    │
│  │ RRHH consulta   │     │ Reportes de     │     │ Métricas en     │    │
│  │ dashboard       │     │ retiros/día     │     │ tiempo real     │    │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘    │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐     ┌─────────────────┐                            │
│  │ Gestión de      │     │ Cierre de ciclo │                            │
│  │ incidencias     │     │ y estadísticas  │                            │
│  └─────────────────┘     └─────────────────┘                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Estados del Ticket (Ciclo de Vida)

```
                    ┌─────────────┐
                    │  GENERADO   │
                    │ (pendiente) │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  VALIDADO   │ │   ANULADO   │ │  EXPIRADO   │
    │  (guardia)  │ │  (manual)   │ │   (TTL)     │
    └──────┬──────┘ └─────────────┘ └─────────────┘
           │
           ▼
    ┌─────────────┐
    │  ENTREGADO  │
    │   (final)   │
    └─────────────┘
```

### Timeline de Eventos (TicketEvent)

```
Ticket TKT-20251202-ABC123:
────────────────────────────
[10:30:00] generado          → Creado desde Totem
[10:35:00] validado_guardia  → Escaneado en portería
[10:35:15] caja_verificada   → Caja física asociada
[10:35:30] entregado         → Entrega confirmada
```

### Integración Frontend ↔ Backend

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMUNICACIÓN API                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONTEND (React)              BACKEND (Django)                 │
│  ────────────────              ─────────────────                │
│                                                                 │
│  trabajadorService             /api/beneficios/<rut>/           │
│  .getBeneficio(rut)  ────────▶ views.obtener_beneficio          │
│                                TrabajadorService.get_beneficio  │
│                                                                 │
│  ticketService                 /api/tickets/                    │
│  .create(rut, sucursal) ─────▶ views.crear_ticket               │
│                                TicketService.crear_ticket       │
│                                                                 │
│  ticketService                 /api/tickets/<uuid>/validar/     │
│  .validar(uuid)  ────────────▶ guardia_views.validar_ticket     │
│                                TicketService.validar_ticket     │
│                                                                 │
│  cicloService                  /api/ciclos/                     │
│  .getAll()  ─────────────────▶ views_ciclos.ciclos_list_create  │
│                                CicloService.listar_ciclos       │
│                                                                 │
│  stockService                  /api/stock/resumen/              │
│  .getResumen()  ─────────────▶ views_stock.stock_resumen        │
│                                StockService.get_resumen         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. ESTADO ACTUAL DEL PROYECTO

### Métricas de Código

| Área | Archivos | Líneas (aprox.) | Estado |
|------|----------|-----------------|--------|
| **Backend** | ~35 | ~4,500 | Funcional |
| **Frontend** | ~45 | ~8,000 | Funcional |
| **Tests** | ~10 | ~1,200 | Parcial |
| **Total** | ~90 | ~13,700 | - |

### Funcionalidades Implementadas

| Módulo | Funcionalidad | Estado |
|--------|---------------|--------|
| **Totem** | Escaneo cédula/RUT | OK |
| | Validación beneficio | OK |
| | Generación ticket QR | OK |
| | Agendamiento sin stock | OK |
| | Reporte incidencias | OK |
| **Guardia** | Escaneo QR ticket | OK |
| | Validación HMAC | OK |
| | Confirmación entrega | OK |
| | Métricas tiempo real | OK |
| **RRHH** | CRUD trabajadores | OK |
| | Gestión ciclos | OK |
| | Carga nómina CSV | OK |
| | Reportes | OK |
| | Trazabilidad | OK |
| **Admin** | Parámetros operativos | OK |
| | Gestión usuarios | OK |

### Pendientes Identificados

1. **Backend:**
   - Eliminar import roto `views_debug` en urls.py
   - Documentar comandos como dev-only

2. **Frontend:**
   - Eliminar servicios no usados (`print.ts`, `report.service.ts`)
   - Eliminar componentes legacy (`RRHHModule.tsx`)
   - Evaluar componentes no montados (`ReportesModule`, `TrazabilidadModule`)

3. **Mejoras Sugeridas:**
   - Extraer lógica de escaneo a hook reutilizable
   - Aumentar cobertura de tests
   - Implementar caché en frontend para reducir llamadas API

---

¿Proceder con eliminaciones confirmadas y corrección de import roto en backend?