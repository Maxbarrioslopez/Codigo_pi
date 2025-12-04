# API Endpoints - Sistema de Cajas y Validaciones

## Overview
Nuevos endpoints para gestionar cajas de beneficio, asignar beneficios a trabajadores y registrar validaciones del guardia.

## Requiere Autenticación
Todos los endpoints requieren header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. CAJAS DE BENEFICIO (RRHH)

### GET /api/cajas-beneficio/
Listar todas las cajas de beneficio

**Respuesta:**
```json
[
  {
    "id": 1,
    "beneficio": 2,
    "nombre": "Premium",
    "descripcion": "Caja de calidad premium",
    "codigo_tipo": "NAV-PREM",
    "activo": true,
    "created_at": "2025-12-04T14:00:00Z"
  }
]
```

### POST /api/cajas-beneficio/
Crear nueva caja de beneficio

**Body:**
```json
{
  "beneficio": 2,
  "nombre": "Estándar",
  "descripcion": "Caja estándar",
  "codigo_tipo": "NAV-STD",
  "activo": true
}
```

### GET /api/cajas-beneficio/<caja_id>/
Obtener detalles de una caja

### PUT /api/cajas-beneficio/<caja_id>/
Actualizar caja

### DELETE /api/cajas-beneficio/<caja_id>/
Desactivar caja (soft delete)

---

## 2. BENEFICIOS A TRABAJADORES (RRHH)

### GET /api/beneficios-trabajadores/
Listar asignaciones de beneficios

**Filtros disponibles:**
- `ciclo_id`: Filtrar por ciclo
- `trabajador_rut`: Filtrar por RUT del trabajador
- `tipo_beneficio_id`: Filtrar por tipo de beneficio
- `estado`: Filtrar por estado (pendiente, validado, retirado, cancelado)

**Ejemplo:**
```
GET /api/beneficios-trabajadores/?ciclo_id=13&estado=pendiente
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "trabajador": {
      "id": 1,
      "rut": "12345678-9",
      "nombre": "Juan Pérez"
    },
    "ciclo": 13,
    "tipo_beneficio": 2,
    "caja_beneficio": 1,
    "codigo_verificacion": "BEN-0013-000001-abc1d2e3",
    "estado": "pendiente",
    "bloqueado": false,
    "motivo_bloqueo": null,
    "qr_data": "BEN-0013-000001-abc1d2e3|12345678-9|Navidad 2025|Premium",
    "created_at": "2025-12-04T14:00:00Z",
    "updated_at": "2025-12-04T14:00:00Z"
  }
]
```

### POST /api/beneficios-trabajadores/
Asignar beneficio a trabajador (individual)

**Body:**
```json
{
  "trabajador": 1,
  "ciclo": 13,
  "tipo_beneficio": 2,
  "caja_beneficio": 1
}
```

Nota: El `codigo_verificacion` y `qr_data` se generan automáticamente via signal.

### POST /api/beneficios-trabajadores/ (Bulk)
Asignar múltiples beneficios de una vez

**Body:**
```json
[
  {
    "trabajador": 1,
    "ciclo": 13,
    "tipo_beneficio": 2,
    "caja_beneficio": 1
  },
  {
    "trabajador": 2,
    "ciclo": 13,
    "tipo_beneficio": 2,
    "caja_beneficio": 2
  }
]
```

### GET /api/beneficios-trabajadores/por-codigo/<codigo_verificacion>/
Obtener beneficio por código (para escanear QR)

**Respuesta:** Idem a GET /api/beneficios-trabajadores/

**Errores posibles:**
- 404: Código no encontrado
- 403: Beneficio bloqueado
- 400: Beneficio no está en estado "pendiente"

### PUT /api/beneficios-trabajadores/<beneficio_id>/
Actualizar beneficio (ej: cambiar caja)

**Body:**
```json
{
  "caja_beneficio": 2
}
```

### DELETE /api/beneficios-trabajadores/<beneficio_id>/
Cancelar beneficio (cambia estado a "cancelado")

### POST /api/beneficios-trabajadores/<beneficio_id>/bloquear/
Bloquear beneficio por sospecha de fraude

**Body:**
```json
{
  "motivo": "Solicitud duplicada detectada"
}
```

---

## 3. VALIDACIONES DE CAJA (GUARDIA)

### POST /api/validaciones-caja/
Registrar validación de caja (guardia verifica entrega)

**Body:**
```json
{
  "beneficio_trabajador_id": 1,
  "codigo_escaneado": "BEN-0013-000001-abc1d2e3",
  "resultado": "exitoso",
  "caja_validada": "CAJA-FIS-12345",
  "notas": "Entregado correctamente"
}
```

**Parámetros:**
- `beneficio_trabajador_id`: ID del beneficio asignado (requerido)
- `codigo_escaneado`: Código QR escaneado (requerido)
- `resultado`: `exitoso | rechazado | error` (default: exitoso)
- `caja_validada`: Código físico de la caja entregada
- `notas`: Observaciones del guardia

**Respuesta:**
```json
{
  "id": 1,
  "beneficio_trabajador": 1,
  "guardia": "usuario_guardia",
  "codigo_escaneado": "BEN-0013-000001-abc1d2e3",
  "resultado": "exitoso",
  "caja_validada": "CAJA-FIS-12345",
  "caja_coincide": true,
  "notas": "Entregado correctamente",
  "fecha_validacion": "2025-12-04T14:05:30Z"
}
```

**Lógica:**
- Si resultado = "exitoso" y caja_coincide = true → beneficio pasa a estado "validado"
- Si resultado = "rechazado" → beneficio pasa a estado "cancelado"
- Si el beneficio requiere validación guardia pero no lo tiene → ERROR 400

### GET /api/validaciones-caja/listar/
Listar validaciones de cajas (filtros opcionales)

**Filtros:**
- `ciclo_id`: Filtrar por ciclo
- `resultado`: Filtrar por resultado (exitoso, rechazado, error)
- `fecha_desde`: Fecha mínima (YYYY-MM-DD)
- `fecha_hasta`: Fecha máxima (YYYY-MM-DD)

**Ejemplo:**
```
GET /api/validaciones-caja/listar/?ciclo_id=13&resultado=exitoso
```

### GET /api/validaciones-caja/estadisticas/
Obtener estadísticas de validaciones

**Parámetros opcionales:**
- `ciclo_id`: Para estadísticas de un ciclo específico

**Respuesta:**
```json
{
  "total": 150,
  "exitosos": 145,
  "rechazados": 3,
  "errores": 2,
  "cajas_coinciden": 145
}
```

---

## Flujos de Uso

### Flujo 1: Crear e Implementación de Beneficios
```
1. RRHH: Crear TipoBeneficio con requiere_validacion_guardia=true
   POST /api/tipos-beneficio/

2. RRHH: Crear CajaBeneficio (variantes)
   POST /api/cajas-beneficio/

3. RRHH: Crear Ciclo
   POST /api/ciclos/

4. RRHH: Asignar Ciclo con TipoBeneficio
   PUT /api/ciclos/<id>/ { beneficios_activos: [2] }

5. RRHH: Cargar nómina y asignar beneficios a trabajadores
   POST /api/beneficios-trabajadores/ (bulk)
   → Sistema genera: codigo_verificacion y qr_data automáticamente
```

### Flujo 2: Entrega y Validación (Guardia)
```
1. Trabajador llega al guardia con QR en el TOTEM

2. Guardia escanea QR (o ingresa código)
   GET /api/beneficios-trabajadores/por-codigo/<codigo>/
   → Obtiene detalles del beneficio

3. Guardia verifica datos con trabajador
   - ¿RUT coincide?
   - ¿Tipo de beneficio es correcto?
   - ¿Caja de físico es correcta?

4. Guardia entrega la caja y registra validación
   POST /api/validaciones-caja/
   {
     "beneficio_trabajador_id": 1,
     "codigo_escaneado": "BEN-0013-000001-abc1d2e3",
     "resultado": "exitoso",
     "caja_validada": "CAJA-FIS-12345"
   }

5. Sistema actualiza estado a "validado"
```

### Flujo 3: Reporte de Anomalías
```
1. Si hay sospecha de fraude:
   POST /api/beneficios-trabajadores/<id>/bloquear/
   { "motivo": "RUT no coincide" }

2. Guardia puede consultar:
   GET /api/validaciones-caja/estadisticas/?ciclo_id=13
```

---

## Nuevos Campos en TipoBeneficio

Ahora TipoBeneficio tiene:
- `requiere_validacion_guardia` (boolean): Si es true, guardia DEBE validar la entrega

**Actualizar tipo de beneficio:**
```
PUT /api/tipos-beneficio/<id>/
{
  "requiere_validacion_guardia": true
}
```

---

## Errores Comunes

| Código | Mensaje | Causa |
|--------|---------|-------|
| 400 | RUT inválido | Formato de RUT incorrecto |
| 400 | Este beneficio no requiere validación del guardia | Intentando validar un beneficio que no lo necesita |
| 400 | Beneficio en estado {estado} | Beneficio ya validado/cancelado |
| 403 | Beneficio bloqueado | Beneficio sospechoso de fraude |
| 404 | No encontrado | Recurso no existe |

---

## Notas de Implementación

1. **Generación automática de código QR:**
   - El signal `beneficio_trabajador_post_save_handler` genera automáticamente:
   - `codigo_verificacion`: BEN-{ciclo:04d}-{trabajador:06d}-{uuid[:8]}
   - `qr_data`: JSON format para codificar en QR

2. **Validación de doble autenticación:**
   - Solo se valida si `tipo_beneficio.requiere_validacion_guardia = true`
   - El guardia debe verificar que `codigo_escaneado == codigo_verificacion`

3. **Soft delete:**
   - DELETE en cajas y beneficios cambia solo el estado, no elimina datos
   - Permite auditoría completa

4. **Permisos:**
   - Endpoints con `cajas-beneficio/` y `beneficios-trabajadores/`: Solo RRHH
   - Endpoints con `validaciones-caja/`: Solo Guardia
