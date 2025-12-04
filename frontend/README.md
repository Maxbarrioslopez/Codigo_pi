
# Plataforma Beneficios TMLUC

Frontend React + Vite (TypeScript) que consume API Django/DRF para la gestión de:
- Generación y validación de tickets (Tótem y Guardia)
- Ciclo bimensual de beneficios
- Agendamientos de retiro
- Incidencias y trazabilidad
- Parámetros operativos (Administrador)

## Arquitectura (Vista alta)

```
@startuml
title Flujo General Beneficios - TMLUC
actor Trabajador as W
actor Guardia as G
actor RRHH as H
actor Administrador as A

rectangle Totem {
  W --> (Consulta Beneficio)
  W --> (Generar Ticket QR)
  W --> (Agendar Retiro)
  W --> (Reportar Incidencia)
}

rectangle Guardia {
  (Escanear Ticket) --> (Validar Ticket)
  (Validar Ticket) --> (Entregar Beneficio)
  (Reportar Incidencia Guardia)
  (Ver Métricas)
}

rectangle RRHH {
  (Dashboard KPIs)
  (Ver Ciclo Activo)
  (Listar Tickets / Agendamientos / Incidencias)
  (Gestión Nómina - futuro)
}

rectangle Administrador {
  (Config Parámetros Operativos)
  (Roles y Permisos - futuro)
  (Usuarios Sistema - futuro)
}

Totem --> Guardia : Ticket UUID / QR
Guardia --> RRHH : Métricas / Eventos
RRHH --> Administrador : Solicitud ajuste parámetros
Administrador --> RRHH : Nuevos parámetros aplicados
@enduml
```

## Endpoints Backend (Resumen)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/beneficios/{rut}/ | Obtener beneficio asignado al trabajador |
| POST | /api/tickets/ | Crear ticket (genera QR) |
| GET | /api/tickets/{uuid}/estado/ | Estado + eventos del ticket |
| POST | /api/tickets/{uuid}/validar_guardia/ | Validar y marcar entrega (Guardia) |
| POST | /api/tickets/{uuid}/anular/ | Anular antes de entrega |
| POST | /api/tickets/{uuid}/reimprimir/ | Registrar reimpresión (pendiente) |
| GET | /api/tickets/listar/?rut= | Listar tickets (RRHH) opcional filtro rut |
| POST | /api/agendamientos/ | Crear agendamiento de retiro |
| GET | /api/agendamientos/{rut}/ | Listar agendamientos por trabajador |
| POST | /api/incidencias/ | Crear incidencia |
| GET | /api/incidencias/{codigo}/ | Obtener incidencia |
| GET | /api/incidencias/listar/ | Listar incidencias (filtro estado opcional) |
| GET | /api/ciclo/activo/ | Obtener ciclo activo |
| GET | /api/metricas/guardia/ | Métricas guardia (entregados, pendientes, incidencias) |
| GET | /api/reportes/retiros_por_dia/?dias=7 | Resumen retiros por día (entregados/pendientes/expirados) |
| GET | /api/parametros/ | Listar parámetros operativos |
| POST | /api/parametros/ | Upsert parámetro operativo |

## Parámetros Operativos
Claves usadas actualmente:
- cycle_duration (días)
- stock_threshold (unidades)
- qr_ttl_min (minutos de validez QR / TTL ticket)

## Instalación Frontend
```powershell
npm install
npm run dev
```

## Tests Frontend
Ejecutar pruebas (incluye test de capa de servicios mockeando fetch):
```powershell
npm test
```

## Hooks disponibles
Frontend provee hooks reutilizables:
- useCicloActivo: carga ciclo y estado
- useMetricasGuardia(pollMs): métricas con opcional polling
- useParametrosOperativos: listar/upsert parámetros y acceso rápido a valores

## Próximos pasos / TODO
- Autenticación completa (login + refresh tokens)
- WebSocket / SSE para métricas en tiempo real
- Separar modelos físicos en apps (migraciones) si necesario
- Reportes avanzados históricos y exportación CSV

## Notas
Este README se actualiza de forma incremental para reflejar el estado de integración de módulos y endpoints.
  