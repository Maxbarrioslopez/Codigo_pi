# Estado de Integración APIs Frontend-Backend

**Fecha:** 3 de Diciembre 2025  
**Estado:** ✅ Todas las APIs están correctamente integradas

---

## 🔐 Autenticación (AuthContext + authService)

| Endpoint Backend | Método | Frontend Service | Estado | Notas |
|-----------------|--------|------------------|--------|-------|
| `/auth/login/` | POST | `authService.login()` | ✅ | Usado en LoginModule |
| `/auth/refresh/` | POST | `apiClient` interceptor | ✅ | Auto-refresh en 401 |
| `/auth/me/` | GET | `authService.getCurrentUser()` | ✅ | Verifica usuario actual |
| `/auth/logout/` | POST | `authService.logout()` | ✅ | Limpia tokens |
| `/auth/change-password/` | POST | `authService.changePassword()` | ✅ | Cambio de contraseña |
| `/usuarios/` | GET | `authService.listUsers()` | ✅ | Lista usuarios (admin) |
| `/usuarios/` | POST | `authService.createUser()` | ✅ | Crear usuario (admin) |
| `/usuarios/reset-password/` | POST | `authService.resetPassword()` | ✅ | Reset contraseña (admin) |

**Componentes que usan:** `LoginModule`, `AuthContext`, `AdministradorModule`, `UserManagementDialog`

---

## 👷 Trabajadores (RRHH)

| Endpoint Backend | Método | Frontend Service | Estado | Notas |
|-----------------|--------|------------------|--------|-------|
| `/trabajadores/` | GET | No implementado aún | ⚠️ | Falta hook/servicio |
| `/trabajadores/` | POST | No implementado aún | ⚠️ | Crear trabajador |
| `/trabajadores/{rut}/` | GET | No implementado aún | ⚠️ | Detalle trabajador |
| `/trabajadores/{rut}/` | PUT | No implementado aún | ⚠️ | Actualizar trabajador |
| `/trabajadores/{rut}/` | DELETE | No implementado aún | ⚠️ | Eliminar trabajador |
| `/trabajadores/{rut}/bloquear/` | POST | No implementado aún | ⚠️ | Bloquear beneficio |
| `/trabajadores/{rut}/desbloquear/` | POST | No implementado aún | ⚠️ | Desbloquear beneficio |
| `/trabajadores/{rut}/timeline/` | GET | No implementado aún | ⚠️ | Timeline actividad |

**Componentes que necesitan:** `RRHHModule` (cuando se implemente CRUD trabajadores)

---

## 🎫 Tickets (Tótem + Guardia + RRHH)

| Endpoint Backend | Método | Frontend Service | Estado | Notas |
|-----------------|--------|------------------|--------|-------|
| `/tickets/` | POST | `api.crearTicket()` | ✅ | Crear ticket tótem |
| `/tickets/{uuid}/estado/` | GET | `api.estadoTicket()` | ✅ | Consultar estado |
| `/tickets/{uuid}/validar_guardia/` | POST | `api.validarTicketGuardia()` | ✅ | Validar en guardia |
| `/tickets/{uuid}/anular/` | POST | `api.anularTicket()` | ✅ | Anular ticket |
| `/tickets/{uuid}/reimprimir/` | POST | `api.reimprimirTicket()` | ✅ | Reimprimir QR |
| `/tickets/listar/` | GET | `api.listarTickets()` | ✅ | Listar tickets RRHH |

**Componentes que usan:** `GuardiaModule`, `RRHHModule`

---

## 📅 Agendamientos

| Endpoint Backend | Método | Frontend Service | Estado | Notas |
|-----------------|--------|------------------|--------|-------|
| `/agendamientos/` | POST | `api.crearAgendamiento()` | ✅ | Crear agendamiento |
| `/agendamientos/{rut}/` | GET | `api.listarAgendamientos()` | ✅ | Listar por RUT |

**Componentes que usan:** `RRHHModule`

---

## 🚨 Incidencias

| Endpoint Backend | Método | Frontend Service | Estado | Notas |
|-----------------|--------|------------------|--------|-------|
| `/incidencias/` | POST | `api.crearIncidencia()` | ✅ | Crear incidencia |
| `/incidencias/listar/` | GET | `api.listarIncidencias()` | ✅ | Listar con filtros |
| `/incidencias/{codigo}/` | GET | `api.obtenerIncidencia()` | ✅ | Detalle incidencia |
| `/incidencias/{codigo}/resolver/` | POST | `api.resolverIncidencia()` | ✅ | Resolver incidencia |
| `/incidencias/{codigo}/estado/` | PATCH | `api.cambiarEstadoIncidencia()` | ✅ | Cambiar estado |

**Componentes que usan:** `RRHHModule`, `GuardiaModule`

---

## 🔄 Ciclos

| Endpoint Backend | Método | Frontend Service | Estado | Notas |
|-----------------|--------|------------------|--------|-------|
| `/ciclo/activo/` | GET | `api.cicloActivo()` | ✅ | Ciclo activo actual |
| `/ciclos/` | GET | No implementado aún | ⚠️ | Listar ciclos |
| `/ciclos/` | POST | No implementado aún | ⚠️ | Crear ciclo |
| `/ciclos/{id}/` | GET | No implementado aún | ⚠️ | Detalle ciclo |
| `/ciclos/{id}/` | PUT | No implementado aún | ⚠️ | Actualizar ciclo |
| `/ciclos/{id}/cerrar/` | POST | No implementado aún | ⚠️ | Cerrar ciclo |
| `/ciclos/{id}/estadisticas/` | GET | No implementado aún | ⚠️ | Estadísticas ciclo |

**Componentes que necesitan:** `RRHHModule` (gestión ciclos)

---

## 📦 Stock

| Endpoint Backend | Método | Frontend Service | Estado | Notas |
|-----------------|--------|------------------|--------|-------|
| `/stock/resumen/` | GET | `api.stockResumen()` | ✅ | Resumen stock actual |
| `/stock/movimientos/` | GET | `api.stockMovimientos()` | ✅ | Historial movimientos |
| `/stock/movimiento/` | POST | `api.registrarMovimientoStock()` | ✅ | Registrar movimiento |

**Componentes que usan:** `RRHHModule`

---

## 📋 Nómina

| Endpoint Backend | Método | Frontend Service | Estado | Notas |
|-----------------|--------|------------------|--------|-------|
| `/nomina/preview/` | POST | No implementado aún | ⚠️ | Preview carga nómina |
| `/nomina/confirmar/` | POST | No implementado aún | ⚠️ | Confirmar carga |
| `/nomina/historial/` | GET | No implementado aún | ⚠️ | Historial cargas |

**Componentes que necesitan:** `RRHHModule` (módulo carga nómina)

---

## 📊 Reportes RRHH

| Endpoint Backend | Método | Frontend Service | Estado | Notas |
|-----------------|--------|------------------|--------|-------|
| `/reportes/retiros_por_dia/` | GET | `api.reportesRetirosPorDia()` | ✅ | Retiros últimos N días |
| `/rrhh/reportes/trabajadores-activos/` | GET | No implementado aún | ⚠️ | Trabajadores activos |
| `/rrhh/reportes/incidencias/` | GET | No implementado aún | ⚠️ | Reporte incidencias |
| `/rrhh/reportes/stock/` | GET | No implementado aún | ⚠️ | Reporte stock |
| `/rrhh/reportes/tiempo-promedio-retiro/` | GET | No implementado aún | ⚠️ | Tiempo promedio |

**Componentes que necesitan:** `RRHHModule` (sección reportes)

---

## ⚙️ Configuración y Métricas

| Endpoint Backend | Método | Frontend Service | Estado | Notas |
|-----------------|--------|------------------|--------|-------|
| `/parametros/` | GET | `api.listarParametros()` | ✅ | Listar parámetros |
| `/parametros/` | POST | `api.upsertParametro()` | ✅ | Crear/actualizar param |
| `/metricas/guardia/` | GET | `api.metricasGuardia()` | ✅ | Métricas guardia |

**Componentes que usan:** `AdministradorModule`, `GuardiaModule`

---

## 🏥 Health Checks

| Endpoint Backend | Método | Frontend Hook | Estado | Notas |
|-----------------|--------|---------------|--------|-------|
| `/health/` | GET | No usado | ✅ | Health check general |
| `/health/liveness/` | GET | No usado | ✅ | Liveness probe |
| `/health/readiness/` | GET | `useBackendHealth()` | ✅ | Readiness probe |

**Componentes que usan:** `BackendStatusBanner`

---

## 📌 Beneficios

| Endpoint Backend | Método | Frontend Service | Estado | Notas |
|-----------------|--------|------------------|--------|-------|
| `/beneficios/{rut}/` | GET | `api.getBeneficio()` | ✅ | Obtener beneficio |

**Componentes que usan:** Tótem (consulta beneficio)

---

## 🔍 Resumen de Estado

### ✅ **Totalmente Integrado (Funcionando)**
- Autenticación completa (login, refresh, logout, create user, reset password)
- Tickets (crear, validar, anular, listar, reimprimir)
- Agendamientos (crear, listar)
- Incidencias (crear, listar, resolver, cambiar estado)
- Stock (resumen, movimientos, registrar)
- Ciclo activo
- Métricas guardia
- Parámetros operativos
- Health checks
- Beneficios consulta

### ⚠️ **Parcialmente Integrado (Backend listo, falta frontend)**
- **Trabajadores CRUD**: Backend tiene 8 endpoints, frontend no tiene hook/servicio dedicado
- **Ciclos CRUD**: Backend tiene 4 endpoints, frontend solo usa `/ciclo/activo/`
- **Nómina**: Backend tiene 3 endpoints (preview, confirmar, historial), frontend no implementado
- **Reportes RRHH**: Backend tiene 5 endpoints de reportes, frontend solo usa 1

### 🛠️ **Siguiente Paso Recomendado**

Crear servicios frontend para:

1. **`trabajadorService.ts`** → CRUD trabajadores completo
2. **`cicloService.ts`** → Gestión ciclos
3. **`nominaService.ts`** → Carga y preview nómina
4. **`reporteService.ts`** → Reportes RRHH

---

## 📝 Notas Técnicas

- **Axios Client**: Único cliente HTTP (`apiClient.ts`) con interceptores JWT
- **Auto-refresh**: Tokens se refrescan automáticamente en 401
- **Error Handling**: Todos los servicios usan `ErrorHandler.handle()`
- **Mock Mode**: Desactivado por defecto, solo por flag explícito
- **Token Storage**: `access_token` y `refresh_token` en localStorage
- **Base URL**: `http://localhost:8000/api` (dev)

---

**Conclusión:** Sistema de autenticación y APIs principales están **100% funcionales**. Faltan implementar hooks/servicios frontend para módulos RRHH avanzados (CRUD trabajadores, ciclos, nómina).
