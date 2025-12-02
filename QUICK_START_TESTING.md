# 🚀 QUICK START - TESTING AUTENTICACIÓN

## Pre-requisitos

```bash
# Backend debe estar ejecutándose
cd backend
python manage.py runserver

# Frontend debe estar ejecutándose
cd "front end"
npm run dev
```

Frontend estará en: http://localhost:3000/
Backend estará en: http://localhost:8000/

---

## Escenario 1: Login Normal (Admin)

**Precondiciones:**
- Existe usuario admin en la BD (creado en fixtures o manual)

**Pasos:**
1. Ir a http://localhost:3000/login
2. Ingresa username: `admin` (o RUT si existe)
3. Ingresa password: (admin password)
4. Click "Iniciar Sesión"

**Resultado esperado:**
- ✅ Redirección a /dashboard
- ✅ Panel de Administración visible
- ✅ Usuario muestra en header
- ✅ Botón "Salir" funcional

---

## Escenario 2: Login con RUT Validation

**Pasos:**
1. Ir a http://localhost:3000/login
2. Ingresa: `12.345.678-9` (RUT formato con puntos)
3. Verifica que aparezca CheckCircle ✅ verde
4. Ingresa password
5. Click "Iniciar Sesión"

**Resultado esperado:**
- ✅ Validación de formato RUT en tiempo real
- ✅ Normalización a `123456789` para request
- ✅ Login exitoso si existe usuario

---

## Escenario 3: Cambio de Contraseña Forzado (Guardia)

**Precondiciones:**
- Crear usuario guardia con contraseña temporal

**Pasos:**
1. Ir a http://localhost:3000/login
2. Login como usuario guardia
3. Sistema muestra ChangePasswordModal
4. Ingresa current password (la temporal)
5. Ingresa nueva: `NewPass123` (8+ chars, upper, lower, number)
6. Confirma: `NewPass123`
7. Click "Cambiar Contraseña"

**Resultado esperado:**
- ✅ Modal NO puede cerrarse sin cambiar
- ✅ Validación de password strength
- ✅ Success message
- ✅ Modal cierra automáticamente
- ✅ Acceso al dashboard

---

## Escenario 4: Crear Usuario (Admin)

**Pasos:**
1. Login como admin
2. Ir a Admin → Usuarios
3. Click "Nuevo Usuario"
4. Llena formulario:
   - Username: `juan_guardia`
   - Email: `juan@tml.cl`
   - Nombre: `Juan`
   - Apellido: `García`
   - Rol: `Guardia`
5. Click "Crear Usuario"

**Resultado esperado:**
- ✅ UserManagementDialog se abre
- ✅ Valida email format
- ✅ Auto-genera password (o muestra si backend genera)
- ✅ Password visible con show/hide toggle
- ✅ Botón "Copiar al portapapeles" funciona
- ✅ Success message con instrucciones

---

## Escenario 5: Reset Password (Admin)

**Pasos:**
1. Login como admin
2. Ir a Admin → Usuarios
3. En tabla de usuarios, click botón 🔐 (reset) en fila del usuario
4. UserManagementDialog se abre en modo reset
5. Username se auto-completa
6. Click "Generar Contraseña" o ingresa una
7. Click "Resetear"

**Resultado esperado:**
- ✅ Nueva password generada o validada
- ✅ Password mostrado con toggle
- ✅ Copy button funcional
- ✅ Instrucción: "Usuario debe cambiar password al próximo login"

---

## Escenario 6: Logout

**Pasos:**
1. Estando en dashboard
2. Click botón "Salir" (header o sidebar)
3. Verifica redirección

**Resultado esperado:**
- ✅ Redirección a /login
- ✅ localStorage limpio (sin token)
- ✅ Intentar acceder /dashboard → Redirección a /login

---

## Debugging

### Ver JWT Payload
```javascript
// En navegador console
const token = localStorage.getItem('access_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);

// Verifica campo debe_cambiar_contraseña
console.log(payload.debe_cambiar_contraseña);
```

### Ver Usuario en AuthContext
```javascript
// En cualquier componente
import { useAuth } from '@/contexts/AuthContext';
const { user } = useAuth();
console.log(user);
```

### Backend Logs
```bash
cd backend
python manage.py runserver --verbosity=2

# O ver logs de migration
python manage.py migrate --plan
```

---

## API Testing con cURL

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Change Password
```bash
curl -X POST http://localhost:8000/api/auth/change-password/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "oldpass",
    "new_password": "NewPass123"
  }'
```

### Create User
```bash
curl -X POST http://localhost:8000/api/usuarios/ \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testguardia",
    "email": "test@tml.cl",
    "rol": "guardia",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### Reset Password
```bash
curl -X POST http://localhost:8000/api/usuarios/reset-password/ \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testguardia",
    "new_password": "NewTempPass123!"
  }'
```

### Logout
```bash
curl -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### Issue: "Usuario debe cambiar contraseña" no aparece

**Solución:**
1. Verificar en BD: `SELECT debe_cambiar_contraseña FROM usuario WHERE username='usuario';`
2. Si es False, actualizar: `UPDATE usuario SET debe_cambiar_contraseña=true WHERE username='usuario';`
3. Logout y login nuevamente

### Issue: "Password no válido"

**Validación requerida:**
- Mínimo 8 caracteres
- Al menos 1 mayúscula (A-Z)
- Al menos 1 minúscula (a-z)
- Al menos 1 número (0-9)

Ejemplo válido: `MyPassword123`

### Issue: "No puedo cerrar el modal de cambio"

**Esperado:** Si el modal tiene `requireChange={true}`, no puede cerrarse.
**Solución:** Cambiar contraseña correctamente

### Issue: "Copy to clipboard no funciona"

**Verificar:**
- Navegador soporta Clipboard API (Chrome, Firefox, Safari modernos)
- Sitio está en HTTPS o localhost
- Verificar console para errores

---

## Quick Reference

| Acción | URL | Usuario | Resultado |
|--------|-----|---------|-----------|
| Login | /login | cualquiera | JWT + redirect |
| Dashboard | /dashboard | autenticado | Panel según rol |
| Admin | /admin | admin | Gestión usuarios/ciclos |
| Logout | Botón header | cualquiera | localStorage limpio |
| Change Password | Modal | autenticado | Update password |
| Create User | Admin → Usuarios | admin | New user + temp password |
| Reset Password | Admin → Usuarios (🔐) | admin | New temp password |

---

## Notas

- Todos los campos en el admin requieren validación
- Las contraseñas temporales se generan solo en creación/reset
- El usuario debe cambiar password en primer login (guardia/rrhh)
- Los tokens JWT expiran (verificar backend JWT_EXPIRATION_DELTA)
- Las sesiones se cierran completamente al logout

---

**¡Listo para testear!** 🚀

