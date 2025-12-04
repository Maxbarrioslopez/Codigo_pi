# Flujo de Autenticación JWT - Frontend

## 📋 Resumen

Este proyecto usa **un único cliente HTTP basado en Axios** (`apiClient.ts`) con autenticación JWT automática mediante interceptors.

### Tokens
- **`access_token`**: Token de acceso JWT (corta duración ~8h)
- **`refresh_token`**: Token de refresco JWT (larga duración ~7 días)
- **Almacenamiento**: `localStorage` con claves `access_token` y `refresh_token`

### Cliente HTTP
- **Único cliente**: `src/services/apiClient.ts` (Axios)
- **Base URL**: Configurada via `VITE_API_URL` en `.env`
- **Interceptors**: Automáticos para autenticación y refresh

---

## 🔑 Configuración

### Variables de entorno (`.env`)
```env
VITE_API_URL=http://localhost:8000/api
```

### Cliente Axios (`apiClient.ts`)
- Interceptor de **Request**: Agrega `Authorization: Bearer <access_token>` automáticamente
- Interceptor de **Response**: Maneja 401 y refresca tokens automáticamente
- Si el refresh falla, limpia tokens y redirige a `/login`

---

## 🔐 Flujo de Login

1. **Usuario ingresa credenciales** en `/login`
2. **POST** `/api/auth/login/` con `{ username, password }`
3. **Backend responde**:
   ```json
   {
     "access": "eyJ0eXAiOiJKV1...",
     "refresh": "eyJ0eXAiOiJKV1..."
   }
   ```
4. **Frontend guarda**:
   ```typescript
   localStorage.setItem('access_token', data.access);
   localStorage.setItem('refresh_token', data.refresh);
   ApiClientWrapper.setAuthTokens(data.access, data.refresh);
   ```
5. **Decodifica el token** para obtener datos del usuario (id, username, rol, email)
6. **Guarda el usuario** en `localStorage` y estado de React

---

## 🔄 Flujo de Refresh Automático

1. **Request falla con 401** (token expirado)
2. **Interceptor detecta 401** y verifica que no sea reintento
3. **Si hay múltiples 401 simultáneos**, los encola
4. **POST** `/api/auth/refresh/` con `{ refresh: refresh_token }`
5. **Backend responde**:
   ```json
   {
     "access": "eyJ0eXAiOiJKV1..."
   }
   ```
6. **Frontend actualiza**:
   ```typescript
   localStorage.setItem('access_token', newAccess);
   ```
7. **Reintenta la request original** con el nuevo token
8. **Procesa la cola** de requests que esperaban

### Si el refresh falla:
- Limpia `access_token`, `refresh_token` y `user` de localStorage
- Redirige a `/login`

---

## 🛡️ Llamadas Protegidas

### Ejemplo GET
```typescript
import { apiClient } from '@/services/apiClient';

// Obtener usuario actual
const { data } = await apiClient.get('/auth/me/');
console.log(data); // { id, username, email, rol, ... }

// Listar usuarios (requiere admin)
const { data: usuarios } = await apiClient.get('/usuarios/');
```

### Ejemplo POST
```typescript
// Crear incidencia
const { data } = await apiClient.post('/incidencias/', {
  tipo: 'hardware',
  descripcion: 'Falla en tótem',
  origen: 'guardia'
});
```

### Ejemplo usando AuthService
```typescript
import AuthService from '@/services/authService';

// Login
const { access, refresh } = await AuthService.login('admin', 'password');

// Obtener info del usuario actual
const me = await AuthService.me();

// Logout
AuthService.logout(); // Limpia tokens y redirige a /login
```

---

## 🏥 Monitoreo de Salud del Backend

### Hook `useBackendHealth`
```typescript
import { useBackendHealth } from '@/hooks/useBackendHealth';

function MyComponent() {
  const { isBackendUp, isChecking, error, recheckNow } = useBackendHealth();
  
  if (!isBackendUp) {
    return <div>Backend no disponible: {error}</div>;
  }
  
  return <div>Todo OK</div>;
}
```

### Banner de Estado
```typescript
import { BackendStatusBanner } from '@/components/BackendStatusBanner';

function App() {
  return (
    <>
      <BackendStatusBanner /> {/* Se muestra solo si backend está caído */}
      {/* resto de la app */}
    </>
  );
}
```

**Características**:
- Check inicial al cargar la app (1 segundo de delay)
- Checks periódicos cada 30 segundos
- Llama a `/api/health/readiness/` (sin autenticación)
- Banner rojo en la parte superior cuando backend está caído
- Botón para reintentar manualmente

---

## 🧪 Modo Mock (Solo Desarrollo)

**Importante**: El modo mock **NO se activa automáticamente** en errores de red.

Para activarlo manualmente:
```typescript
// En consola del navegador
localStorage.setItem('explicit_mock_mode', 'true');
```

O configurar en `.env`:
```env
VITE_MOCK_MODE=true
```

Para desactivar:
```typescript
localStorage.removeItem('explicit_mock_mode');
```

---

## 🔍 Debugging

### Ver tokens en consola
```typescript
console.log('Access:', localStorage.getItem('access_token'));
console.log('Refresh:', localStorage.getItem('refresh_token'));
console.log('User:', JSON.parse(localStorage.getItem('user') || '{}'));
```

### Verificar sesión activa
```typescript
import AuthService from '@/services/authService';

try {
  const me = await AuthService.me();
  console.log('Sesión activa:', me);
} catch (error) {
  console.error('Sin sesión o token inválido:', error);
}
```

### Simular expiración de token
```typescript
// Invalida el access token
localStorage.setItem('access_token', 'token.invalido.aqui');

// El siguiente request dará 401 y el interceptor intentará refresh automático
const { data } = await apiClient.get('/auth/me/');
```

---

## 📝 Archivos Clave

### Frontend
- **`src/services/apiClient.ts`**: Cliente Axios único con interceptors
- **`src/services/authService.ts`**: Helpers para login/refresh/logout/me
- **`src/services/api.ts`**: Funciones legacy que ahora delegan a apiClient
- **`src/contexts/AuthContext.tsx`**: Context de autenticación React
- **`src/hooks/useBackendHealth.ts`**: Hook para monitorear backend
- **`src/components/BackendStatusBanner.tsx`**: Banner de estado del backend

### Backend
- **`backend_project/urls.py`**:
  - `POST /api/auth/login/` → CustomTokenObtainPairView (incluye rol en JWT)
  - `POST /api/auth/refresh/` → TokenRefreshView
  - `GET /api/auth/me/` → Obtener info del usuario actual
- **`totem/serializers.py`**: CustomTokenObtainPairSerializer (agrega rol, email)
- **`backend_project/settings.py`**: Configuración de SimpleJWT

---

## ✅ Testing del Flujo

### 1. Login
```bash
# Terminal 1: Backend
cd backend
python manage.py runserver 0.0.0.0:8000

# Terminal 2: Frontend
cd "front end"
npm run dev
```

Navegar a `http://localhost:5173/login` e ingresar:
- **Usuario**: `admin`
- **Contraseña**: (tu contraseña configurada)

### 2. Verificar sesión activa
En consola del navegador:
```typescript
const res = await fetch('http://localhost:8000/api/auth/me/', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('access_token')
  }
});
const data = await res.json();
console.log(data);
```

### 3. Llamar endpoint protegido
```typescript
const res = await fetch('http://localhost:8000/api/usuarios/', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('access_token')
  }
});
console.log(await res.json());
```

### 4. Simular refresh
```typescript
// Corrompe el access token
localStorage.setItem('access_token', 'invalid');

// El interceptor detectará 401 y refrescará automáticamente
import { apiClient } from '@/services/apiClient';
const { data } = await apiClient.get('/auth/me/');
console.log(data); // Debería funcionar después del refresh
```

---

## 🚨 Errores Comunes

### "Bearer undefined" o "Bearer null"
**Causa**: Token no guardado o clave incorrecta en localStorage  
**Solución**: Verificar que el login guarde correctamente los tokens con claves `access_token` y `refresh_token`

### 401 authentication_failed
**Causa**: Usuario con `is_active=False` en backend  
**Solución**: 
```bash
cd backend
python manage.py activate_all_users
```

### 401 token_not_valid
**Causa**: Token expirado o refresh token inválido/rotado  
**Solución**: Logout y login de nuevo

### Network error sin redirigir
**Causa**: Backend no está ejecutándose  
**Solución**: 
1. Verificar que `python manage.py runserver` esté activo
2. El banner de estado debería aparecer automáticamente
3. No se activa mock mode automáticamente

---

## 🔒 Buenas Prácticas de Seguridad

### Desarrollo
- ✅ `CORS_ALLOW_ALL_ORIGINS=True` (solo en dev)
- ✅ Tokens en `localStorage` (OK para dev)
- ✅ `SIMPLE_JWT.ROTATE_REFRESH_TOKENS=True`

### Producción
- ❌ Cambiar `CORS_ALLOW_ALL_ORIGINS=False`
- ✅ Configurar `CORS_ALLOWED_ORIGINS` con dominio específico
- ✅ Usar `httpOnly` cookies en vez de `localStorage` (más seguro contra XSS)
- ✅ Habilitar `SIMPLE_JWT.BLACKLIST_AFTER_ROTATION=True`
- ✅ Instalar `rest_framework_simplejwt.token_blacklist`
- ✅ `JWT_SECRET_KEY` único por ambiente
- ✅ HTTPS obligatorio

---

## 📚 Referencias

- [Django REST Framework SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Axios Interceptors](https://axios-http.com/docs/interceptors)
- [JWT.io](https://jwt.io/) - Para decodificar/inspeccionar tokens

---

**Última actualización**: 3 de diciembre de 2025
