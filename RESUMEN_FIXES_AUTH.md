# 🔧 RESUMEN DE CORRECCIONES - Sistema de Autenticación JWT

## 📋 ARCHIVOS MODIFICADOS

### Frontend
1. **`src/services/apiClient.ts`** ✓ (Ya estaba correcto)
   - Interceptor Axios con refresh automático
   - Validación de tokens en headers
   - Manejo de cola de requests durante refresh

2. **`src/services/api.ts`** ✓ (Migrado a Axios)
   - Eliminado fetch duplicado
   - Ahora delega todas las llamadas a `apiClient`
   - Mock mode solo explícito (no automático)
   - Eliminado `authToken` y su lógica

3. **`src/services/authService.ts`** ✓ (Nuevo)
   - Helpers limpios: `login()`, `refresh()`, `me()`, `logout()`
   - Validación de tokens antes de guardar

4. **`src/contexts/AuthContext.tsx`** ✓
   - Eliminado fallback a mock users
   - Login directo contra backend
   - Solo usa `access_token` y `refresh_token`

5. **`src/hooks/useBackendHealth.ts`** ✓ (Nuevo)
   - Monitoreo periódico de `/api/health/readiness/`
   - Check inicial + checks cada 30s
   - Estado `isBackendUp`

6. **`src/components/BackendStatusBanner.tsx`** ✓ (Nuevo)
   - Banner rojo cuando backend está caído
   - Botón para reintentar manualmente

7. **`src/components/LoginModule.tsx`** ✓
   - **FIX CRÍTICO**: Cambió `toUpperCase()` a `toLowerCase()` en normalización de username
   - Ahora envía "admin" en vez de "ADMIN"

8. **`src/App.tsx`** ✓
   - Integrado `<BackendStatusBanner />` en la raíz

9. **`AUTH_FLOW.md`** ✓ (Nueva documentación)
   - Flujo completo de autenticación
   - Ejemplos de uso
   - Debugging y troubleshooting

10. **`src/examples/api-usage-examples.ts`** ✓ (Nuevo)
    - 17 ejemplos completos de uso del cliente Axios
    - Login, refresh, endpoints protegidos, manejo de errores

### Backend
11. **`backend/reset_passwords.py`** ✓ (Nuevo)
    - Script para resetear contraseñas de usuarios
    - Asegura `is_active=True` y `activo=True`

12. **`backend/totem/management/commands/activate_all_users.py`** ✓ (Ya existía)
    - Comando Django para activar usuarios

---

## 🐛 PROBLEMAS ENCONTRADOS

### 1. **Dualidad de clientes HTTP** (CRÍTICO)
**Síntoma**: Bearer undefined/null, tokens inconsistentes, mock_mode automático
**Causa**: Dos clientes (fetch en `api.ts` + Axios en `apiClient.ts`) con diferentes claves de localStorage
- `api.ts` usaba `authToken` (memoria + localStorage)
- `apiClient.ts` usaba `access_token` y `refresh_token`
**Fix**: Migrar `api.ts` para que delegue a `apiClient` internamente

### 2. **Mock mode automático** (BLOQUEANTE)
**Síntoma**: Network error activaba mock_mode, ocultando problemas reales
**Causa**: En `api.ts`, catch de errores de red activaba `localStorage.setItem('mock_mode', 'true')`
**Fix**: Eliminado comportamiento automático, solo modo explícito via `VITE_MOCK_MODE` o `explicit_mock_mode`

### 3. **Username normalization incorrecta** (CRÍTICO) ⭐
**Síntoma**: Login fallaba con "No se encontró cuenta activa" aunque usuario existía
**Causa**: `normalizeUsername()` convertía "admin" → "ADMIN" (mayúsculas), pero en BD está en minúsculas
**Fix**: Cambiado `.toUpperCase()` a `.toLowerCase()` en `LoginModule.tsx`

### 4. **Contraseñas no configuradas** (BLOQUEANTE)
**Síntoma**: 401 authentication_failed
**Causa**: Usuarios creados sin contraseña válida
**Fix**: Script `reset_passwords.py` para establecer contraseñas conocidas

### 5. **Tokens undefined en headers**
**Síntoma**: `Authorization: Bearer undefined`
**Causa**: Validación insuficiente antes de agregar header
**Fix**: Interceptor ahora valida `token !== 'undefined' && token !== 'null' && token.trim() !== ''`

---

## ✅ CAMBIOS APLICADOS

### Frontend - Unificación de Cliente HTTP

#### Antes:
```typescript
// api.ts usaba fetch con authToken
let authToken: string | null = null;
localStorage.getItem('authToken');

// apiClient.ts usaba Axios
localStorage.getItem('access_token');
localStorage.getItem('refresh_token');
```

#### Ahora:
```typescript
// api.ts delega a apiClient (Axios)
async function request<T>(path: string, method: 'GET' | 'POST' | ..., body?: any): Promise<T> {
  const response = await apiClient.post<T>(path, body);
  return response.data;
}

// Solo una fuente de verdad: access_token y refresh_token
```

### Interceptor Axios (apiClient.ts)

```typescript
// Request interceptor
apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('access_token');
  
  if (accessToken && accessToken !== 'undefined' && accessToken !== 'null' && accessToken.trim() !== '') {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  
  return config;
});

// Response interceptor con refresh automático
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Queue concurrent requests
      if (isRefreshing) { /* add to queue */ }
      
      // Refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      const { access } = await axios.post('/auth/refresh/', { refresh: refreshToken });
      
      // Validate and save
      if (access && access !== 'undefined') {
        localStorage.setItem('access_token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest); // Retry
      }
    }
    
    // On refresh failure: clear tokens and redirect to login
    if (refreshError) {
      localStorage.clear();
      window.location.href = '/login';
    }
  }
);
```

### AuthContext (sin mock fallback)

```typescript
const login = async (username: string, password: string) => {
  // Solo backend real, sin fallback a mock
  const { data } = await apiClient.post('/auth/login/', { username, password });
  
  // Decodificar token JWT
  const tokenPayload = JSON.parse(atob(data.access.split('.')[1]));
  
  // Guardar usuario y tokens
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  
  ApiClientWrapper.setAuthTokens(data.access, data.refresh);
};
```

### Hook de Salud del Backend

```typescript
export function useBackendHealth() {
  const [health, setHealth] = useState({ isBackendUp: true, ... });
  
  const checkHealth = async () => {
    try {
      await apiClient.get('/health/readiness/', { timeout: 5000 });
      setHealth({ isBackendUp: true, ... });
    } catch {
      setHealth({ isBackendUp: false, error: '...' });
    }
  };
  
  useEffect(() => {
    // Check inicial + periódico cada 30s
    setTimeout(checkHealth, 1000);
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);
  
  return health;
}
```

### Banner de Estado

```typescript
export function BackendStatusBanner() {
  const { isBackendUp, error, recheckNow } = useBackendHealth();
  
  if (isBackendUp) return null;
  
  return (
    <div className="bg-red-600 text-white">
      Backend no disponible: {error}
      <button onClick={recheckNow}>Reintentar</button>
    </div>
  );
}
```

---

## 🧪 CÓMO PROBAR

### 1. Login Exitoso

```bash
# Backend debe estar corriendo
cd backend
python manage.py runserver 0.0.0.0:8000

# Frontend
cd "front end"
npm run dev
```

Abrir `http://localhost:5173/login` y probar:
- **Usuario**: `admin`
- **Contraseña**: `admin123`

**Verificar**:
- ✅ Login exitoso (200)
- ✅ Redirige a `/admin`
- ✅ Tokens guardados en localStorage:
  ```javascript
  localStorage.getItem('access_token'); // JWT válido
  localStorage.getItem('refresh_token'); // JWT válido
  localStorage.getItem('user'); // {"id":1,"username":"admin","rol":"admin",...}
  ```

### 2. Verificar Sesión Activa

```javascript
// En consola del navegador
import { apiClient } from '@/services/apiClient';

const { data } = await apiClient.get('/auth/me/');
console.log(data);
// Espera: { id: 1, username: "admin", rol: "admin", email: "...", ... }
```

### 3. Endpoint Protegido (Requiere Admin)

```javascript
const { data } = await apiClient.get('/usuarios/');
console.log(data);
// Espera: [{ id: 1, username: "admin", ... }, { id: 2, username: "guardia", ... }]
```

**Si no eres admin**:
- ❌ 403 Forbidden (no 401)

### 4. Simular Expiración de Token

```javascript
// Corromper el access token
localStorage.setItem('access_token', 'token.invalido.aqui');

// Hacer una llamada protegida
const { data } = await apiClient.get('/auth/me/');

// Espera:
// 1. Interceptor detecta 401
// 2. Llama a POST /auth/refresh/ con refresh_token
// 3. Guarda nuevo access_token
// 4. Reintenta GET /auth/me/
// 5. Retorna datos del usuario ✅
```

**Verificar en DevTools → Network**:
1. `GET /auth/me/` → 401
2. `POST /auth/refresh/` → 200 (con nuevo access)
3. `GET /auth/me/` → 200 (retry exitoso)

### 5. Refresh Token Inválido

```javascript
// Corromper ambos tokens
localStorage.setItem('access_token', 'invalid');
localStorage.setItem('refresh_token', 'invalid');

// Hacer llamada
try {
  await apiClient.get('/auth/me/');
} catch (error) {
  // Espera:
  // 1. 401 en /auth/me/
  // 2. 401 en /auth/refresh/ (token_not_valid)
  // 3. localStorage limpiado
  // 4. Redirige a /login ✅
}
```

---

## 📊 FLUJO COMPLETO

```
Usuario ingresa credenciales
         ↓
[LoginModule] normalizeUsername(username).toLowerCase()
         ↓
AuthContext.login(username, password)
         ↓
apiClient.post('/auth/login/', { username, password })
         ↓
Backend valida credenciales
         ↓
✅ 200 { access: "jwt...", refresh: "jwt..." }
         ↓
Frontend guarda tokens en localStorage
         ↓
Decodifica access token → userData
         ↓
Redirige según rol (/admin, /guardia, /rrhh)
         ↓
─────────────────────────────────────────
Usuario hace request a endpoint protegido
         ↓
apiClient interceptor agrega: Authorization: Bearer <access_token>
         ↓
Backend valida JWT
         ↓
✅ 200 con datos
         ↓
─────────────────────────────────────────
Si access token expira:
         ↓
Backend retorna 401
         ↓
Interceptor detecta 401
         ↓
POST /auth/refresh/ con refresh_token
         ↓
✅ 200 { access: "nuevo_jwt..." }
         ↓
Guarda nuevo access_token
         ↓
Reintenta request original con nuevo token
         ↓
✅ 200 con datos
         ↓
─────────────────────────────────────────
Si refresh también falla:
         ↓
❌ 401 token_not_valid
         ↓
localStorage.clear()
         ↓
window.location.href = '/login'
```

---

## 🔐 CREDENCIALES CONFIGURADAS

Después de ejecutar `python reset_passwords.py`:

| Usuario   | Contraseña    | Rol        |
|-----------|---------------|------------|
| admin     | admin123      | admin      |
| guardia   | guardia123    | guardia    |
| rrhh      | rrhh123       | rrhh       |

Todos tienen `is_active=True` y `activo=True`.

---

## 🚀 COMANDOS ÚTILES

### Backend
```bash
# Resetear contraseñas
cd backend
python reset_passwords.py

# Activar usuarios inactivos
python manage.py activate_all_users

# Ver usuarios en Django shell
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> list(User.objects.values('username', 'is_active', 'rol'))

# Correr servidor
python manage.py runserver 0.0.0.0:8000
```

### Frontend
```bash
cd "front end"

# Instalar dependencias
npm install

# Dev server
npm run dev

# Build
npm run build
```

### Debug en Navegador
```javascript
// Ver tokens
console.log('Access:', localStorage.getItem('access_token'));
console.log('Refresh:', localStorage.getItem('refresh_token'));
console.log('User:', JSON.parse(localStorage.getItem('user') || '{}'));

// Decodificar token
const token = localStorage.getItem('access_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Payload:', payload);
console.log('Expira:', new Date(payload.exp * 1000));

// Limpiar sesión
localStorage.clear();

// Probar login desde consola
import AuthService from '@/services/authService';
await AuthService.login('admin', 'admin123');
```

---

## ✨ MEJORAS APLICADAS

1. ✅ **Cliente HTTP único**: Solo Axios, sin fetch duplicado
2. ✅ **Tokens consistentes**: Solo `access_token` y `refresh_token`
3. ✅ **Refresh automático**: Interceptor maneja 401 sin intervención manual
4. ✅ **Mock mode explícito**: Solo via flag, nunca automático
5. ✅ **Monitoreo de backend**: Banner cuando backend está caído
6. ✅ **Validación robusta**: Tokens validados antes de usar
7. ✅ **Normalización correcta**: Username en lowercase para login
8. ✅ **Contraseñas configuradas**: Script de reset para desarrollo
9. ✅ **Documentación completa**: AUTH_FLOW.md con ejemplos
10. ✅ **Código de ejemplo**: 17 casos de uso documentados

---

## 🎯 RESULTADO FINAL

- ✅ Login funciona consistentemente (200)
- ✅ Tokens se guardan correctamente
- ✅ Headers Authorization se envían bien
- ✅ Refresh automático funciona en 401
- ✅ Endpoints protegidos accesibles con token válido
- ✅ Banner muestra cuando backend está caído
- ✅ No más "Bearer undefined/null"
- ✅ No más mock_mode automático
- ✅ Flujo de autenticación robusto y modular

---

**Última actualización**: 3 de diciembre de 2025, 14:05
**Estado**: ✅ SISTEMA COMPLETAMENTE FUNCIONAL
