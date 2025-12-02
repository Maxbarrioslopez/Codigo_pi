# 🔐 Credenciales de Ingreso - Sistema Tótem Digital

## Cuenta Administrador (Primer Ingreso)

### Credenciales por Defecto

```
Usuario:     admin
Contraseña:  admin123
Email:       admin@totem.local
Rol:         Administrador
```

### Acceso a la Aplicación

**Frontend (Interfaz Web):**
- URL: `http://localhost:5173` (desarrollo) o URL de producción
- Login disponible en la sección de Administrador

**Backend API (Endpoints):**
- Base URL: `http://localhost:8000/api/`
- Documentación: `http://localhost:8000/admin/`

---

## 🚀 Primer Ingreso - Pasos Recomendados

### 1. Cambiar Contraseña del Admin

Es **altamente recomendado** cambiar la contraseña por defecto inmediatamente:

```bash
POST /api/auth/change-password/
Authorization: Bearer {token}

{
  "old_password": "admin123",
  "new_password": "TuContraseñaSegura123!",
  "new_password_confirm": "TuContraseñaSegura123!"
}
```

### 2. Crear Usuarios Adicionales

Crear cuentas para:
- **RRHH**: Personal de Recursos Humanos
- **Guardias**: Personal de portería
- **Supervisores**: Personal de supervisión

Endpoint:
```bash
POST /api/usuarios/
Authorization: Bearer {admin_token}

{
  "username": "guardia.nombre",
  "email": "guardia@tmluc.cl",
  "rol": "guardia",
  "first_name": "Juan",
  "last_name": "García",
  "password": "TempPassword123!"
}
```

### 3. Activar Ciclo Bimensual

Crear el primer ciclo de beneficios:

```bash
POST /api/ciclos/
Authorization: Bearer {admin_token}

{
  "fecha_inicio": "2025-01-01",
  "fecha_fin": "2025-02-28"
}
```

### 4. Cargar Trabajadores

Importar o registrar trabajadores en el sistema:

```bash
POST /api/trabajadores/
Authorization: Bearer {token}

{
  "rut": "12.345.678-9",
  "nombre": "María González",
  "seccion": "Producción",
  "contrato": "Indefinido",
  "sucursal": "Santiago"
}
```

---

## 📋 Roles del Sistema

| Rol | Permisos | Funciones |
|-----|----------|-----------|
| **Admin** | Completo | Crear usuarios, gestionar ciclos, supervisar todo |
| **RRHH** | Gestión de trabajadores | Crear/editar trabajadores, asignar beneficios |
| **Guardia** | Validación de tickets | Validar retiros en portería, generar reportes |
| **Supervisor** | Supervisión | Ver reportes, validar tickets, gestionar incidencias |

---

## 🔑 Endpoints de Autenticación

### Login (obtener JWT token)

```bash
POST /api/token/
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

# Respuesta:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Obtener Información del Usuario Actual

```bash
GET /api/auth/me/
Authorization: Bearer {access_token}

# Respuesta:
{
  "id": 1,
  "username": "admin",
  "email": "admin@totem.local",
  "first_name": "",
  "last_name": "",
  "rol": "admin",
  "debe_cambiar_contraseña": false
}
```

### Cambiar Contraseña

```bash
POST /api/auth/change-password/
Authorization: Bearer {access_token}

{
  "old_password": "contraseña_actual",
  "new_password": "nueva_contraseña",
  "new_password_confirm": "nueva_contraseña"
}
```

### Resetear Contraseña de Otro Usuario (Admin)

```bash
POST /api/usuarios/reset-password/
Authorization: Bearer {admin_token}

{
  "username": "usuario.a.resetear",
  "new_password": "NuevaPassword123!"
}

# Si no se proporciona new_password, se genera automáticamente
```

---

## 🛠️ Instalación y Primer Levantamiento

### Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python scripts/setup_admin.py
python manage.py runserver
```

### Frontend

```bash
cd "front end"
npm install
npm run dev
```

---

## ✅ Verificación de Configuración

### Health Checks

```bash
# Verificar que el backend está activo
GET /api/health/

# Respuesta:
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### Listar Usuarios

```bash
GET /api/usuarios/
Authorization: Bearer {admin_token}

# Respuesta: Array de usuarios del sistema
```

---

## 🔒 Seguridad

**Cambiar inmediatamente:**
- ✅ Contraseña del admin
- ✅ Claves API (si están habilitadas)
- ✅ Variables de entorno sensibles

**Configurar:**
- ✅ HTTPS en producción
- ✅ CORS restrictivo
- ✅ Rate limiting
- ✅ Logging y monitoreo

---

## 📞 Soporte

Para reportar problemas o solicitar ayuda:

1. Revisar logs en `backend/logs/`
2. Ejecutar tests: `pytest -v`
3. Contactar al equipo de desarrollo

---

**Última actualización:** 2 de diciembre de 2025
**Versión Sistema:** 1.0.0 (Producción)
