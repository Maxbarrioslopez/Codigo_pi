# 🚀 Backend Django + DRF — Sistema Tótem Digital

## 📋 Resumen

Sistema backend robusto para retiro digital de beneficios con:

- **Framework**: Django 4.x + Django REST Framework
- **Base de Datos**: PostgreSQL / SQLite
- **Autenticación**: JWT (djangorestframework-simplejwt) + Session
- **Arquitectura**: Service Layer (OOP) + Permisos por rol
- **Seguridad**: QR firmado con HMAC-SHA256
- **Documentación**: OpenAPI / Swagger (drf-spectacular)

### Apps del Sistema

- **totem**: Núcleo del sistema (tickets, agendamientos, incidencias, ciclos)
- **guardia**: Validación de tickets en portería
- **rrhh**: Reportes y listados para Recursos Humanos

---

## ⚡ Quick Start

### Opción 1: Setup Automatizado (Recomendado)

```bash
# Desde el directorio backend/
python setup_backend.py
```

Este script:
- ✅ Instala dependencias
- ✅ Crea archivo .env con secrets seguros
- ✅ Ejecuta migraciones
- ✅ Carga datos iniciales
- ✅ Te guía para crear superusuario

### Opción 2: Setup Manual

```bash
# 1. Crear y activar virtualenv
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows PowerShell
# source .venv/bin/activate     # Linux/Mac

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 4. Crear directorio de logs
mkdir logs

# 5. Migraciones
python manage.py makemigrations
python manage.py migrate

# 6. Cargar datos iniciales
python manage.py loaddata initial_data

# 7. Crear superusuario
python manage.py createsuperuser

# 8. Ejecutar servidor
python manage.py runserver 0.0.0.0:8000
```

---

## 📚 Documentación API

Una vez corriendo el servidor:

- **Swagger UI**: http://localhost:8000/api/docs/
- **OpenAPI Schema**: http://localhost:8000/api/schema/
- **Admin Django**: http://localhost:8000/admin/

---

## 🔐 Autenticación

### Obtener Token JWT

```bash
POST /api/auth/login/
Content-Type: application/json

{
  "username": "tu_usuario",
  "password": "tu_password"
}

# Respuesta:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Usar Token en Requests

```bash
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Refresh Token

```bash
POST /api/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

## 📡 Endpoints Principales

### Públicos (Tótem - Sin Auth)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/beneficios/{rut}/` | Consultar beneficio disponible |
| POST | `/api/tickets/` | Crear ticket con QR firmado |
| GET | `/api/tickets/{uuid}/estado/` | Estado y timeline del ticket |
| POST | `/api/tickets/{uuid}/reimprimir/` | Reimprimir ticket con TTL renovado |
| POST | `/api/agendamientos/` | Crear agendamiento futuro |
| GET | `/api/agendamientos/{rut}/` | Listar agendamientos |
| POST | `/api/incidencias/` | Reportar incidencia |
| GET | `/api/incidencias/{codigo}/` | Consultar incidencia |

### Guardia (Requiere Auth + Rol Guardia)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/guardia/validar/` | Validar ticket y entregar caja |
| GET | `/api/guardia/metricas/` | Métricas de portería |

### RRHH (Requiere Auth + Rol RRHH)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/rrhh/tickets/` | Listado de tickets con filtros |
| GET | `/api/rrhh/reportes/diarios/` | Resumen diario de retiros |
| GET | `/api/rrhh/incidencias/` | Gestión de incidencias |

### Admin (Requiere Auth + Rol Admin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST | `/api/parametros/` | Gestión de parámetros operativos |
| GET | `/api/ciclo/activo/` | Ciclo bimensual activo |

---

## 🏗️ Arquitectura

### Capas del Sistema

```
Views (API Endpoints)
    ↓
Services (Lógica de Negocio OOP)
    ↓
Validators (Reglas de Negocio)
    ↓
Models (Persistencia)
```

### Servicios Principales

- **TicketService**: Creación, validación, anulación, reimpresión
- **AgendamientoService**: Gestión de agendamientos con validaciones
- **IncidenciaService**: Creación y seguimiento de incidencias

### Seguridad

- **QRSecurity**: Firma y validación HMAC de códigos QR
- **Validators**: Validación de RUT, fechas, cupos, estados
- **Permissions**: Control de acceso por rol

---

## 🛠️ Comandos de Mantenimiento

### Expirar Tickets

```bash
# Ver tickets a expirar (dry-run)
python manage.py expirar_tickets --dry-run

# Marcar como expirados
python manage.py expirar_tickets
```

**Cron recomendado**: Cada 5-10 minutos
```cron
*/5 * * * * cd /path/to/backend && python manage.py expirar_tickets
```

### Marcar Agendamientos Vencidos

```bash
python manage.py marcar_agendamientos_vencidos
```

**Cron recomendado**: Diariamente a las 00:00
```cron
0 0 * * * cd /path/to/backend && python manage.py marcar_agendamientos_vencidos
```

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
pytest

# Con coverage
pytest --cov=totem --cov-report=html

# Tests específicos
pytest totem/tests/test_services.py -v
```

---

## 🔧 Configuración Avanzada

### PostgreSQL

Editar `.env`:
```bash
USE_POSTGRES=1
POSTGRES_DB=totem_db
POSTGRES_USER=totem_user
POSTGRES_PASSWORD=secure_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### CORS

Para permitir frontend en otro puerto:
```bash
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Parámetros Operativos

Ajustar en Admin Django o via API:
- `qr_ttl_min`: TTL del QR en minutos (default: 30)
- `max_agendamientos_dia`: Cupo máximo por día (default: 50)
- `stock_umbral_bajo`: Alerta de stock bajo (default: 10)

---

## 📊 Modelos de Datos

### Core
- **Usuario**: Usuario del sistema con roles
- **Trabajador**: Beneficiario
- **Ticket**: Ticket de retiro con QR
- **TicketEvent**: Timeline de eventos

### Operaciones
- **Ciclo**: Ciclo bimensual
- **Agendamiento**: Retiro programado
- **Incidencia**: Reporte de problemas

### Inventario
- **Sucursal**: Punto de retiro
- **StockSucursal**: Stock disponible
- **CajaFisica**: Caja física individual
- **ParametroOperativo**: Configuración global

---

## 🚨 Troubleshooting

### Error: Import "decouple" could not be resolved

```bash
pip install python-decouple
```

### Error: Table 'auth_user' already exists

Si ya tenías usuarios:
```bash
python manage.py migrate --fake-initial
```

### Error: CORS Policy

Verificar en `.env`:
```bash
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Logs

Revisar archivo de logs:
```bash
tail -f logs/django.log
```

---

## 📦 Dependencias Principales

```
Django>=4.2                      # Framework web
djangorestframework              # API REST
djangorestframework-simplejwt    # Autenticación JWT
django-cors-headers              # CORS
python-decouple                  # Variables de entorno
psycopg2-binary                  # PostgreSQL driver
qrcode                           # Generación de QR
Pillow                           # Procesamiento de imágenes
drf-spectacular                  # Documentación OpenAPI
pytest                           # Testing
pytest-django                    # Testing Django
```

---

## 🎯 Próximos Pasos

1. ✅ Refactorizar views existentes para usar servicios
2. ✅ Implementar rate limiting en endpoints públicos
3. ✅ Expandir tests de cobertura
4. ✅ Configurar Sentry para monitoreo de errores
5. ✅ Implementar health check endpoint

---

## 📄 Licencia

Copyright © 2025 - Sistema Tótem Digital TMLUC

---

## 🆘 Soporte

Para consultas técnicas o reportar issues, revisar `IMPLEMENTATION_GUIDE.md` en la raíz del proyecto.

Notas:
- Validación de RUT en `totem/utils_rut.py`
- Generación de QR con `qrcode` (imagen almacenada en MEDIA_ROOT/tickets/)
