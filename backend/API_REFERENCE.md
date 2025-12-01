# API Reference - Sistema Tótem Digital

> **Documentación completa de la API REST del sistema de retiro digital de beneficios**
> 
> Versión: 1.0.0  
> Base URL: `http://localhost:8000/api/`  
> Autenticación: JWT (Bearer Token)

---

## Índice

1. [Autenticación](#autenticación)
2. [Tótem (Público)](#tótem-público)
3. [Trabajadores (RRHH)](#trabajadores-rrhh)
4. [Ciclos (RRHH/Supervisor)](#ciclos-rrhh)
5. [Nómina (RRHH/Supervisor)](#nómina-rrhh)
6. [Stock (Guardia/Admin)](#stock-guardia)
7. [Guardia](#guardia)
8. [Reportes (RRHH)](#reportes-rrhh)
9. [Códigos de Error](#códigos-de-error)

---

## Autenticación

### Obtener Token JWT

**Endpoint:** `POST /api/auth/login/`  
**Permisos:** Público  
**Descripción:** Autentica un usuario y retorna tokens de acceso y refresco.

#### Request Body
```json
{
  "username": "admin",      // REQUERIDO: Nombre de usuario
  "password": "password123" // REQUERIDO: Contraseña
}
```

#### Response (200 OK)
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // Token de acceso (30 min)
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // Token de refresco (7 días)
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "rol": "admin"  // Valores: admin, rrhh, guardia, supervisor
  }
}
```

#### Errores
- `400`: Credenciales faltantes
- `401`: Credenciales inválidas

---

### Refrescar Token

**Endpoint:** `POST /api/auth/refresh/`  
**Permisos:** Público  

#### Request Body
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response (200 OK)
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // Nuevo token de acceso
}
```

---

## Tótem (Público)

Endpoints accesibles sin autenticación para uso del tótem físico.

### Obtener Beneficio

**Endpoint:** `GET /api/beneficios/{rut}/`  
**Permisos:** Público (sin autenticación)  
**Rate Limit:** 30 peticiones/minuto por IP

#### Parámetros URL
- `rut` (string): RUT del trabajador (formato: 12345678-9 o 12345678-K)

#### Response (200 OK)
```json
{
  "beneficio": {
    "id": 1,
    "rut": "12345678-9",
    "nombre": "Juan Pérez López",
    "beneficio_disponible": {
      "tipo": "Caja",                    // Tipo de beneficio
      "categoria": "Estándar",           // Categoría (Estándar, Premium)
      "descripcion": "Caja de mercadería estándar",
      "vigente_desde": "2025-11-01",
      "vigente_hasta": "2025-12-31"
    }
  }
}
```

#### Errores
- `400`: RUT con formato inválido
- `404`: Trabajador no encontrado
- `429`: Límite de peticiones excedido

---

### Crear Ticket

**Endpoint:** `POST /api/tickets/`  
**Permisos:** Público (sin autenticación)  
**Rate Limit:** 10 peticiones/minuto por IP

#### Request Body
```json
{
  "trabajador_rut": "12345678-9",  // REQUERIDO: RUT del trabajador
  "sucursal": "Central"            // OPCIONAL: Nombre de sucursal (default: "Central")
}
```

#### Response (201 Created)
```json
{
  "id": 123,
  "uuid": "ABC123DEF456",
  "trabajador": {
    "id": 1,
    "rut": "12345678-9",
    "nombre": "Juan Pérez López"
  },
  "estado": "pendiente",           // Estados: pendiente, entregado, expirado, anulado
  "qr_image": "/media/qr/ABC123DEF456.png",
  "qr_data": "ABC123DEF456:firma_segura_hash",
  "created_at": "2025-11-30T10:30:00Z",
  "expires_at": "2025-11-30T11:00:00Z",
  "ttl_minutos": 30,
  "sucursal": {
    "id": 1,
    "nombre": "Central",
    "codigo": "CENT"
  }
}
```

#### Errores
- `400`: Datos inválidos o faltantes
- `404`: Trabajador no encontrado o sin beneficio disponible
- `409`: Ya existe ticket pendiente para este trabajador
- `429`: Límite de peticiones excedido

---

### Estado de Ticket

**Endpoint:** `GET /api/tickets/{uuid}/estado/`  
**Permisos:** Público  
**Rate Limit:** 30 peticiones/minuto por IP

#### Parámetros URL
- `uuid` (string): UUID único del ticket

#### Response (200 OK)
```json
{
  "id": 123,
  "uuid": "ABC123DEF456",
  "estado": "pendiente",
  "trabajador": {
    "rut": "12345678-9",
    "nombre": "Juan Pérez López"
  },
  "created_at": "2025-11-30T10:30:00Z",
  "expires_at": "2025-11-30T11:00:00Z",
  "tiempo_restante_minutos": 25,
  "puede_retirar": true
}
```

---

## Trabajadores (RRHH)

Gestión de trabajadores y sus beneficios.

### Listar Trabajadores

**Endpoint:** `GET /api/trabajadores/`  
**Permisos:** `IsRRHHOrSupervisor` (rol: rrhh, supervisor, admin)  
**Autenticación:** JWT requerido

#### Query Parameters
- `q` (string, opcional): Búsqueda por nombre o RUT
- `rut` (string, opcional): Filtro exacto por RUT
- `seccion` (string, opcional): Filtro por sección
- `contrato` (string, opcional): Filtro por tipo de contrato

#### Response (200 OK)
```json
[
  {
    "id": 1,
    "rut": "12345678-9",
    "nombre": "Juan Pérez López",
    "seccion": "Producción",
    "contrato": "Indefinido",
    "sucursal": "Central",
    "beneficio_disponible": {
      "tipo": "Caja",
      "categoria": "Estándar",
      "vigente_desde": "2025-11-01",
      "vigente_hasta": "2025-12-31"
    },
    "created_at": "2025-01-15T10:00:00Z"
  }
]
```

---

### Crear Trabajador

**Endpoint:** `POST /api/trabajadores/`  
**Permisos:** `IsRRHHOrSupervisor`  
**Autenticación:** JWT requerido

#### Request Body
```json
{
  "rut": "12345678-9",              // REQUERIDO: RUT único del trabajador
  "nombre": "Juan Pérez López",     // REQUERIDO: Nombre completo
  "seccion": "Producción",          // OPCIONAL: Sección de trabajo
  "contrato": "Indefinido",         // OPCIONAL: Tipo de contrato
  "sucursal": "Central",            // OPCIONAL: Sucursal asignada
  "beneficio_disponible": {         // OPCIONAL: Beneficio asignado
    "tipo": "Caja",
    "categoria": "Estándar",
    "descripcion": "Caja de mercadería estándar"
  }
}
```

#### Response (201 Created)
```json
{
  "id": 1,
  "rut": "12345678-9",
  "nombre": "Juan Pérez López",
  "seccion": "Producción",
  "contrato": "Indefinido",
  "sucursal": "Central",
  "beneficio_disponible": {
    "tipo": "Caja",
    "categoria": "Estándar"
  },
  "created_at": "2025-11-30T10:30:00Z"
}
```

#### Errores
- `400`: RUT inválido o trabajador ya existe
- `401`: No autenticado
- `403`: Sin permisos (no es RRHH/Supervisor/Admin)

---

### Detalle de Trabajador

**Endpoint:** `GET /api/trabajadores/{rut}/`  
**Permisos:** `IsRRHHOrSupervisor`  
**Autenticación:** JWT requerido

#### Response (200 OK)
```json
{
  "id": 1,
  "rut": "12345678-9",
  "nombre": "Juan Pérez López",
  "seccion": "Producción",
  "contrato": "Indefinido",
  "sucursal": "Central",
  "beneficio_disponible": {
    "tipo": "Caja",
    "categoria": "Estándar"
  },
  "created_at": "2025-01-15T10:00:00Z"
}
```

---

### Actualizar Trabajador

**Endpoint:** `PUT /api/trabajadores/{rut}/`  
**Permisos:** `IsRRHHOrSupervisor`  
**Autenticación:** JWT requerido

#### Request Body
```json
{
  "nombre": "Juan Pérez López",     // OPCIONAL: Actualizar nombre
  "seccion": "Logística",           // OPCIONAL: Actualizar sección
  "beneficio_disponible": {         // OPCIONAL: Actualizar beneficio
    "tipo": "Caja",
    "categoria": "Premium"
  }
}
```

#### Response (200 OK)
```json
{
  "id": 1,
  "rut": "12345678-9",
  "nombre": "Juan Pérez López",
  "seccion": "Logística",
  "beneficio_disponible": {
    "tipo": "Caja",
    "categoria": "Premium"
  }
}
```

---

### Bloquear Trabajador

**Endpoint:** `POST /api/trabajadores/{rut}/bloquear/`  
**Permisos:** `IsRRHHOrSupervisor`  
**Autenticación:** JWT requerido

#### Request Body
```json
{
  "motivo": "Suspensión temporal por auditoría"  // REQUERIDO: Motivo del bloqueo
}
```

#### Response (200 OK)
```json
{
  "id": 1,
  "rut": "12345678-9",
  "nombre": "Juan Pérez López",
  "beneficio_disponible": {
    "tipo": "BLOQUEADO",
    "motivo": "Suspensión temporal por auditoría"
  }
}
```

---

### Desbloquear Trabajador

**Endpoint:** `POST /api/trabajadores/{rut}/desbloquear/`  
**Permisos:** `IsRRHHOrSupervisor`  
**Autenticación:** JWT requerido

#### Request Body
```json
{}  // Body vacío
```

#### Response (200 OK)
```json
{
  "id": 1,
  "rut": "12345678-9",
  "nombre": "Juan Pérez López",
  "beneficio_disponible": {
    "tipo": "Caja",
    "categoria": "Estándar"
  }
}
```

---

### Timeline de Trabajador

**Endpoint:** `GET /api/trabajadores/{rut}/timeline/`  
**Permisos:** `IsRRHHOrSupervisor`  
**Autenticación:** JWT requerido

#### Response (200 OK)
```json
{
  "rut": "12345678-9",
  "nombre": "Juan Pérez López",
  "eventos": [
    {
      "tipo": "ticket:creado",
      "fecha": "2025-11-30T10:30:00Z",
      "metadata": {
        "ticket": "ABC123",
        "sucursal": "Central"
      }
    },
    {
      "tipo": "ticket:entregado",
      "fecha": "2025-11-30T10:45:00Z",
      "metadata": {
        "ticket": "ABC123",
        "guardia": "jperez"
      }
    },
    {
      "tipo": "incidencia",
      "fecha": "2025-11-28T14:20:00Z",
      "metadata": {
        "codigo": "INC-12345",
        "tipo": "Falla",
        "estado": "resuelta"
      }
    }
  ]
}
```

---

## Ciclos (RRHH)

Gestión de ciclos bimensuales de retiro de beneficios.

### Listar Ciclos

**Endpoint:** `GET /api/ciclos/`  
**Permisos:** `IsRRHHOrSupervisor`  
**Autenticación:** JWT requerido

#### Response (200 OK)
```json
[
  {
    "id": 1,
    "fecha_inicio": "2025-11-01",
    "fecha_fin": "2025-12-31",
    "activo": true,
    "dias_restantes": 31
  },
  {
    "id": 2,
    "fecha_inicio": "2025-09-01",
    "fecha_fin": "2025-10-31",
    "activo": false,
    "dias_restantes": 0
  }
]
```

---

### Crear Ciclo

**Endpoint:** `POST /api/ciclos/`  
**Permisos:** `IsRRHHOrSupervisor`  
**Autenticación:** JWT requerido

#### Request Body
```json
{
  "fecha_inicio": "2025-12-01",  // REQUERIDO: Fecha de inicio (formato: YYYY-MM-DD)
  "fecha_fin": "2026-01-31"      // REQUERIDO: Fecha de fin (formato: YYYY-MM-DD)
}
```

#### Response (201 Created)
```json
{
  "id": 3,
  "fecha_inicio": "2025-12-01",
  "fecha_fin": "2026-01-31",
  "activo": true,
  "dias_restantes": 62
}
```

**Nota:** Al crear un ciclo, se desactiva automáticamente el ciclo activo anterior.

---

### Detalle de Ciclo

**Endpoint:** `GET /api/ciclos/{id}/`  
**Permisos:** `IsRRHHOrSupervisor`  
**Autenticación:** JWT requerido

#### Response (200 OK)
```json
{
  "id": 1,
  "fecha_inicio": "2025-11-01",
  "fecha_fin": "2025-12-31",
  "activo": true,
  "dias_restantes": 31
}
```

---

### Estadísticas de Ciclo

**Endpoint:** `GET /api/ciclos/{id}/estadisticas/`  
**Permisos:** `IsRRHHOrSupervisor`  
**Autenticación:** JWT requerido

#### Response (200 OK)
```json
{
  "id": 1,
  "fecha_inicio": "2025-11-01",
  "fecha_fin": "2025-12-31",
  "activo": true,
  "total_tickets": 450,
  "entregados": 320,
  "pendientes": 85,
  "expirados": 30,
  "anulados": 15,
  "tasa_entrega": 71.1,
  "tasa_expiracion": 6.7
}
```

---

### Cerrar Ciclo

**Endpoint:** `POST /api/ciclos/{id}/cerrar/`  
**Permisos:** `IsRRHHOrSupervisor`  
**Autenticación:** JWT requerido

#### Request Body
```json
{}  // Body vacío
```

#### Response (200 OK)
```json
{
  "detail": "Ciclo cerrado",
  "id": 1,
  "fecha_inicio": "2025-11-01",
  "fecha_fin": "2025-12-31",
  "activo": false
}
```

---

## Nómina (RRHH)

Carga y gestión de nóminas de trabajadores.

### Vista Previa de Nómina

**Endpoint:** `POST /api/nomina/preview/`  
**Permisos:** `IsRRHHOrSupervisor`  
**Autenticación:** JWT requerido  
**Content-Type:** `multipart/form-data`

#### Request (Form Data)
```
archivo: [archivo CSV o Excel]
actualizar: "1"  // OPCIONAL: "1" para actualizar existentes, omitir para solo crear nuevos
```

#### Formato CSV Esperado
```csv
rut,nombre,seccion,contrato,sucursal,beneficio,observaciones
12345678-9,Juan Pérez,Producción,Indefinido,Central,Caja Estándar,
87654321-K,María González,Logística,Plazo Fijo,Norte,Caja Premium,VIP
11111111-1,Pedro Soto,Administración,Indefinido,Central,SIN_BENEFICIO,Suspendido
```

#### Response (200 OK)
```json
{
  "detail": "Validación OK (dry-run). Revise logs de salida en consola.",
  "resumen": {
    "total_registros": 150,
    "validos": 145,
    "invalidos": 5,
    "a_crear": 120,
    "a_actualizar": 25,
    "sin_beneficio": 15,
    "errores": [
      {
        "fila": 23,
        "rut": "12345678-X",
        "error": "RUT inválido"
      }
    ]
  }
}
```

---

### Confirmar Carga de Nómina

**Endpoint:** `POST /api/nomina/confirmar/`  
**Permisos:** `IsRRHHOrSupervisor`  
**Autenticación:** JWT requerido  
**Content-Type:** `multipart/form-data`

#### Request (Form Data)
```
archivo: [archivo CSV o Excel]
actualizar: "1"  // OPCIONAL
```

#### Response (200 OK)
```json
{
  "detail": "Carga ejecutada exitosamente",
  "resumen": {
    "total_procesados": 145,
    "creados": 120,
    "actualizados": 25,
    "sin_beneficio": 15,
    "errores": 0
  }
}
```

---

### Historial de Cargas

**Endpoint:** `GET /api/nomina/historial/`  
**Permisos:** `IsRRHHOrSupervisor`  
**Autenticación:** JWT requerido

#### Query Parameters
- `ciclo` (int, opcional): Filtrar por ID de ciclo

#### Response (200 OK)
```json
[
  {
    "id": 1,
    "ciclo": {
      "id": 1,
      "fecha_inicio": "2025-11-01",
      "fecha_fin": "2025-12-31"
    },
    "usuario": {
      "id": 1,
      "username": "admin"
    },
    "archivo_nombre": "nomina_noviembre_2025.csv",
    "total_registros": 150,
    "creados": 120,
    "actualizados": 25,
    "sin_beneficio": 5,
    "observaciones": "",
    "fecha_carga": "2025-11-01T09:00:00Z"
  }
]
```

---

## Stock (Guardia)

Gestión de inventario de cajas por sucursal.

### Resumen de Stock

**Endpoint:** `GET /api/stock/resumen/`  
**Permisos:** `IsGuardiaOrAdmin` (rol: guardia, admin)  
**Autenticación:** JWT requerido

#### Response (200 OK)
```json
{
  "disponible": 450,
  "entregadas_hoy": 32,
  "reservadas": 18,
  "total_mes": 450,
  "por_tipo": {
    "estandar": 320,
    "premium": 130
  },
  "por_sucursal": [
    {
      "sucursal": "Central",
      "total": 250,
      "estandar": 180,
      "premium": 70
    },
    {
      "sucursal": "Norte",
      "total": 200,
      "estandar": 140,
      "premium": 60
    }
  ]
}
```

---

### Listar Movimientos de Stock

**Endpoint:** `GET /api/stock/movimientos/`  
**Permisos:** `IsGuardiaOrAdmin`  
**Autenticación:** JWT requerido

#### Query Parameters
- `fecha_desde` (date, opcional): Filtro desde fecha (YYYY-MM-DD)
- `fecha_hasta` (date, opcional): Filtro hasta fecha (YYYY-MM-DD)
- `sucursal_id` (int, opcional): Filtro por sucursal
- `tipo_caja` (string, opcional): Filtro por tipo (Estándar, Premium)
- `accion` (string, opcional): Filtro por acción (agregar, retirar)

#### Response (200 OK)
```json
[
  {
    "id": 1,
    "fecha": "2025-11-30",
    "hora": "10:30:00",
    "tipo_caja": "Estándar",
    "accion": "agregar",
    "cantidad": 50,
    "motivo": "Ingreso de stock mensual",
    "usuario": "admin",
    "sucursal": {
      "id": 1,
      "nombre": "Central",
      "codigo": "CENT"
    }
  },
  {
    "id": 2,
    "fecha": "2025-11-30",
    "hora": "11:15:00",
    "tipo_caja": "Premium",
    "accion": "retirar",
    "cantidad": 5,
    "motivo": "Entrega a trabajadores",
    "usuario": "guardia1",
    "sucursal": {
      "id": 1,
      "nombre": "Central",
      "codigo": "CENT"
    }
  }
]
```

---

### Registrar Movimiento de Stock

**Endpoint:** `POST /api/stock/movimiento/`  
**Permisos:** `IsGuardiaOrAdmin`  
**Autenticación:** JWT requerido

#### Request Body
```json
{
  "accion": "agregar",              // REQUERIDO: "agregar" o "retirar"
  "tipo_caja": "Estándar",          // REQUERIDO: "Estándar" o "Premium"
  "cantidad": 50,                   // REQUERIDO: Cantidad (entero positivo)
  "motivo": "Ingreso mensual",      // OPCIONAL: Descripción del movimiento
  "sucursal_codigo": "CENT"         // OPCIONAL: Código de sucursal
}
```

#### Response (201 Created)
```json
{
  "id": 3,
  "fecha": "2025-11-30",
  "hora": "14:20:00",
  "tipo_caja": "Estándar",
  "accion": "agregar",
  "cantidad": 50,
  "motivo": "Ingreso mensual",
  "usuario": "admin",
  "sucursal": {
    "id": 1,
    "nombre": "Central",
    "codigo": "CENT"
  }
}
```

#### Errores
- `400`: Datos inválidos (acción o tipo no válido, cantidad negativa)
- `401`: No autenticado
- `403`: Sin permisos (no es Guardia/Admin)

---

## Guardia

Endpoints para operaciones de portería y validación de tickets.

### Validar Ticket en Portería

**Endpoint:** `POST /api/guardia/tickets/{uuid}/validar/`  
**Permisos:** `IsGuardia` (rol: guardia)  
**Autenticación:** JWT requerido

#### Request Body
```json
{
  "qr_payload": "ABC123:firma_segura",  // REQUERIDO: Datos del QR escaneado
  "codigo_caja": "CAJA001"              // OPCIONAL: Código de caja física asignada
}
```

#### Response (200 OK)
```json
{
  "id": 123,
  "uuid": "ABC123",
  "estado": "entregado",
  "trabajador": {
    "rut": "12345678-9",
    "nombre": "Juan Pérez López"
  },
  "caja_asignada": {
    "codigo": "CAJA001",
    "tipo": "Estándar"
  },
  "validado_por": "guardia1",
  "validado_at": "2025-11-30T10:45:00Z"
}
```

#### Errores
- `400`: QR inválido o formato incorrecto
- `404`: Ticket no encontrado
- `409`: Ticket ya entregado, expirado o anulado
- `410`: Ticket expirado (TTL excedido)

---

### Métricas de Guardia

**Endpoint:** `GET /api/guardia/metricas/`  
**Permisos:** `IsGuardiaOrAdmin`  
**Autenticación:** JWT requerido

#### Response (200 OK)
```json
{
  "tickets_hoy": {
    "total": 85,
    "pendientes": 25,
    "entregados": 55,
    "expirados": 3,
    "anulados": 2
  },
  "tickets_semana": {
    "total": 420,
    "entregados": 380,
    "tasa_entrega": 90.5
  },
  "incidencias_abiertas": 3,
  "tiempo_promedio_entrega_minutos": 12,
  "cajas_disponibles": 45
}
```

---

### Tickets Pendientes

**Endpoint:** `GET /api/guardia/tickets/pendientes/`  
**Permisos:** `IsGuardia`  
**Autenticación:** JWT requerido

#### Response (200 OK)
```json
[
  {
    "id": 123,
    "uuid": "ABC123",
    "trabajador": {
      "rut": "12345678-9",
      "nombre": "Juan Pérez López"
    },
    "created_at": "2025-11-30T10:30:00Z",
    "expires_at": "2025-11-30T11:00:00Z",
    "tiempo_restante_minutos": 15,
    "sucursal": "Central"
  }
]
```

---

## Reportes (RRHH)

Endpoints de análisis y reportería para RRHH.

### Reporte de Retiros por Día

**Endpoint:** `GET /api/rrhh/reportes/retiros-por-dia/`  
**Permisos:** `IsRRHH` (rol: rrhh, admin)  
**Autenticación:** JWT requerido

#### Query Parameters
- `dias` (int, opcional): Número de días hacia atrás (default: 7)

#### Response (200 OK)
```json
{
  "periodo": {
    "desde": "2025-11-24",
    "hasta": "2025-11-30",
    "dias": 7
  },
  "datos": [
    {
      "fecha": "2025-11-30",
      "total": 85,
      "entregados": 70,
      "pendientes": 10,
      "expirados": 3,
      "anulados": 2
    },
    {
      "fecha": "2025-11-29",
      "total": 92,
      "entregados": 85,
      "pendientes": 3,
      "expirados": 2,
      "anulados": 2
    }
  ]
}
```

---

### Reporte de Trabajadores Activos

**Endpoint:** `GET /api/rrhh/reportes/trabajadores-activos/`  
**Permisos:** `IsRRHH`  
**Autenticación:** JWT requerido

#### Query Parameters
- `ciclo_id` (int, opcional): Filtrar por ciclo específico

#### Response (200 OK)
```json
{
  "ciclo": {
    "id": 1,
    "fecha_inicio": "2025-11-01",
    "fecha_fin": "2025-12-31"
  },
  "total_trabajadores": 500,
  "trabajadores_con_retiros": 420,
  "tasa_participacion": 84.0,
  "retiros_totales": 450,
  "promedio_retiros_por_trabajador": 1.07
}
```

---

### Exportar Tickets a CSV

**Endpoint:** `GET /api/rrhh/exportar/tickets/`  
**Permisos:** `IsRRHH`  
**Autenticación:** JWT requerido

#### Query Parameters
- `fecha_desde` (date, opcional): Fecha inicio (YYYY-MM-DD)
- `fecha_hasta` (date, opcional): Fecha fin (YYYY-MM-DD)

#### Response (200 OK)
```
Content-Type: text/csv
Content-Disposition: attachment; filename="tickets_2025-11-30.csv"

uuid,trabajador_rut,trabajador_nombre,estado,sucursal,created_at,entregado_at
ABC123,12345678-9,Juan Pérez,entregado,Central,2025-11-30 10:30:00,2025-11-30 10:45:00
DEF456,87654321-K,María González,pendiente,Norte,2025-11-30 11:00:00,
```

---

## Códigos de Error

### Códigos HTTP Estándar
- `200 OK`: Petición exitosa
- `201 Created`: Recurso creado exitosamente
- `204 No Content`: Operación exitosa sin contenido de respuesta
- `400 Bad Request`: Datos inválidos o faltantes
- `401 Unauthorized`: No autenticado (token faltante o inválido)
- `403 Forbidden`: Sin permisos para esta operación
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto (ej: duplicado)
- `410 Gone`: Recurso expirado
- `429 Too Many Requests`: Límite de peticiones excedido
- `500 Internal Server Error`: Error interno del servidor

### Códigos de Error Personalizados

#### Respuesta de Error Estándar
```json
{
  "detail": "Descripción del error",
  "code": "codigo_error",
  "status": 400
}
```

#### Códigos Específicos del Sistema
- `rut_invalid`: RUT con formato inválido
- `trabajador_not_found`: Trabajador no encontrado
- `ticket_not_found`: Ticket no encontrado
- `ticket_expired`: Ticket expirado (TTL excedido)
- `ticket_already_used`: Ticket ya fue entregado
- `ticket_duplicated`: Ya existe ticket pendiente para este trabajador
- `beneficio_not_available`: Trabajador sin beneficio disponible
- `trabajador_bloqueado`: Trabajador bloqueado temporalmente
- `stock_insuficiente`: Stock insuficiente en sucursal
- `cupo_excedido`: Cupo de agendamientos excedido
- `qr_invalid`: Firma de QR inválida
- `not_authenticated`: Autenticación requerida
- `permission_denied`: Sin permisos para esta operación

---

## Headers de Autenticación

Para endpoints protegidos, incluir header:

```
Authorization: Bearer <access_token>
```

### Ejemplo con curl
```bash
curl -H "Authorization: Bearer eyJhbGci..." \
     -H "Content-Type: application/json" \
     http://localhost:8000/api/trabajadores/
```

### Ejemplo con JavaScript (fetch)
```javascript
fetch('http://localhost:8000/api/trabajadores/', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
})
```

### Ejemplo con Python (requests)
```python
import requests

headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}
response = requests.get('http://localhost:8000/api/trabajadores/', headers=headers)
```

---

## Matriz de Permisos por Rol

| Endpoint | Admin | RRHH | Supervisor | Guardia | Público |
|----------|-------|------|------------|---------|---------|
| **Autenticación** |
| POST /auth/login/ | ✓ | ✓ | ✓ | ✓ | ✓ |
| POST /auth/refresh/ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Tótem** |
| GET /beneficios/{rut}/ | ✓ | ✓ | ✓ | ✓ | ✓ |
| POST /tickets/ | ✓ | ✓ | ✓ | ✓ | ✓ |
| GET /tickets/{uuid}/estado/ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Trabajadores** |
| GET /trabajadores/ | ✓ | ✓ | ✓ | ✗ | ✗ |
| POST /trabajadores/ | ✓ | ✓ | ✓ | ✗ | ✗ |
| PUT /trabajadores/{rut}/ | ✓ | ✓ | ✓ | ✗ | ✗ |
| POST /trabajadores/{rut}/bloquear/ | ✓ | ✓ | ✓ | ✗ | ✗ |
| GET /trabajadores/{rut}/timeline/ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Ciclos** |
| GET /ciclos/ | ✓ | ✓ | ✓ | ✗ | ✗ |
| POST /ciclos/ | ✓ | ✓ | ✓ | ✗ | ✗ |
| POST /ciclos/{id}/cerrar/ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Nómina** |
| POST /nomina/preview/ | ✓ | ✓ | ✓ | ✗ | ✗ |
| POST /nomina/confirmar/ | ✓ | ✓ | ✓ | ✗ | ✗ |
| GET /nomina/historial/ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Stock** |
| GET /stock/resumen/ | ✓ | ✗ | ✗ | ✓ | ✗ |
| GET /stock/movimientos/ | ✓ | ✗ | ✗ | ✓ | ✗ |
| POST /stock/movimiento/ | ✓ | ✗ | ✗ | ✓ | ✗ |
| **Guardia** |
| POST /guardia/tickets/{uuid}/validar/ | ✓ | ✗ | ✗ | ✓ | ✗ |
| GET /guardia/metricas/ | ✓ | ✗ | ✗ | ✓ | ✗ |
| GET /guardia/tickets/pendientes/ | ✓ | ✗ | ✗ | ✓ | ✗ |
| **Reportes** |
| GET /rrhh/reportes/* | ✓ | ✓ | ✗ | ✗ | ✗ |
| GET /rrhh/exportar/* | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Rate Limits

| Endpoint | Límite |
|----------|--------|
| POST /auth/login/ | 5/minuto por IP |
| GET /beneficios/{rut}/ | 30/minuto por IP |
| POST /tickets/ | 10/minuto por IP |
| Endpoints autenticados | 1000/hora por usuario |
| Endpoints públicos | 100/hora por IP |

---

## Notas de Implementación

### Manejo de Errores del Frontend

El frontend debe manejar estos escenarios:

1. **Token Expirado (401)**
   ```javascript
   if (response.status === 401) {
     // Intentar refresh token
     // Si falla, redirigir a login
   }
   ```

2. **Sin Permisos (403)**
   ```javascript
   if (response.status === 403) {
     // Mostrar mensaje de acceso denegado
     // Ocultar funcionalidades según rol
   }
   ```

3. **Validación (400)**
   ```javascript
   if (response.status === 400) {
     const errors = await response.json();
     // Mostrar errores en formulario
   }
   ```

### Paginación

Endpoints de listado incluyen paginación:

```json
{
  "count": 150,
  "next": "http://localhost:8000/api/trabajadores/?page=2",
  "previous": null,
  "results": [...]
}
```

### Filtros y Búsqueda

Los query parameters se pueden combinar:

```
GET /api/trabajadores/?q=juan&seccion=Producción&contrato=Indefinido
```

---

**Última actualización:** 30 de noviembre de 2025  
**Versión de la API:** 1.0.0  
**Mantenedor:** Equipo de Desarrollo Tótem Digital
