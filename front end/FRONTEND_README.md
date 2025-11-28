# Sistema de Retiro Digital de Beneficios - Frontend

Sistema web para gestión de retiro de beneficios de trabajadores de Tres Montes Lucchetti (TMLUC).

## 🚀 Características Implementadas

### ✅ Sistema de Autenticación
- **AuthContext**: Context API para manejo global de autenticación
- **Login UI**: Interfaz de login profesional con validación
- **JWT Management**: Manejo automático de tokens de acceso y refresh
- **Protected Routes**: Rutas protegidas con control de acceso basado en roles
- **Auto Refresh**: Refresh automático de tokens al expirar

### ✅ Interceptores de API
- **Axios Client**: Cliente HTTP con interceptores configurados
- **Token Injection**: Inyección automática de tokens JWT en headers
- **401 Handler**: Manejo automático de errores 401 con refresh de token
- **Queue Management**: Cola de peticiones durante refresh de token

### ✅ Escáner QR
- **Camera Access**: Acceso a cámara del dispositivo
- **Device Selection**: Selección automática de cámara trasera
- **Continuous Scanning**: Escaneo continuo con auto-stop
- **Error Handling**: Manejo de errores de cámara y permisos

### ✅ Servicio de Impresión
- **Thermal Format**: Formato de ticket térmico (80mm)
- **Auto Print**: Impresión automática al cargar
- **QR Display**: Visualización de código QR centrado
- **Styled Receipt**: Diseño profesional con bordes punteados

### ✅ Code Splitting
- **Vendor Chunks**: Separación de dependencias principales
  - `vendor-react`: React, React-DOM, React Router
  - `vendor-ui`: Componentes Radix UI
  - `vendor-charts`: Recharts
  - `vendor-icons`: Lucide React
  - `vendor-qr`: Librería de escaneo QR
- **Performance**: Carga optimizada de módulos

## 📋 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/
│   │   ├── LoginModule.tsx         # Pantalla de login
│   │   ├── ProtectedRoute.tsx      # HOC para rutas protegidas
│   │   ├── GuardiaModule.tsx       # Panel de guardia
│   │   ├── RRHHModule.tsx          # Dashboard RRHH
│   │   └── TotemModule.tsx         # Tótem de autoservicio
│   ├── contexts/
│   │   └── AuthContext.tsx         # Contexto de autenticación
│   ├── hooks/
│   │   └── useQRScanner.ts         # Hook para escaneo QR
│   ├── services/
│   │   ├── api.ts                  # Servicios API (legacy)
│   │   ├── apiClient.ts            # Cliente Axios con interceptores
│   │   └── print.ts                # Servicio de impresión
│   ├── App.tsx                     # Router principal
│   └── main.tsx                    # Punto de entrada
├── vite.config.ts                  # Configuración de Vite
└── package.json
```

## 🔧 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Pasos

1. **Clonar el repositorio**
```bash
cd "c:\Users\Maxi Barrios\Documents\Codigo_pi\front end"
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_TITLE=Sistema de Retiro Digital - TMLUC
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

5. **Compilar para producción**
```bash
npm run build
```

## 📦 Dependencias Principales

### Core
- **React 18**: Librería UI
- **TypeScript**: Tipado estático
- **Vite**: Build tool y dev server
- **React Router DOM**: Enrutamiento

### UI Components
- **Radix UI**: Componentes accesibles sin estilos
- **Lucide React**: Iconos
- **Tailwind CSS**: Utilidades de estilos

### Funcionalidades
- **@zxing/browser**: Escaneo de códigos QR
- **axios**: Cliente HTTP con interceptores
- **date-fns**: Manipulación de fechas

### Gráficos y Visualización
- **Recharts**: Gráficos y charts

## 🔐 Sistema de Autenticación

### Flujo de Autenticación

```typescript
// 1. Login
const { access, refresh, user } = await authContext.login(rut, password);

// 2. Tokens almacenados en localStorage
localStorage.setItem('access_token', access);
localStorage.setItem('refresh_token', refresh);
localStorage.setItem('user', JSON.stringify(user));

// 3. Todas las peticiones automáticamente incluyen el token
// Interceptor de request añade: Authorization: Bearer <access_token>

// 4. Si token expira (401), se refresca automáticamente
// Interceptor de response detecta 401 → refresh token → retry request

// 5. Logout
await authContext.logout();
```

### Roles y Permisos

```typescript
// Roles disponibles
type Role = 'admin' | 'guardia' | 'rrhh' | 'supervisor';

// Rutas protegidas por rol
<ProtectedRoute allowedRoles={['guardia', 'admin']}>
  <GuardiaModule />
</ProtectedRoute>

// Verificar rol
const { hasRole } = useAuth();
if (hasRole('admin')) {
  // Acciones de administrador
}
```

## 📷 Uso del Escáner QR

```typescript
import { useQRScanner } from '../hooks/useQRScanner';

function GuardiaComponent() {
  const { result, error, scanning, startScanning, stopScanning } = useQRScanner();
  
  const handleScan = () => {
    startScanning('qr-video'); // ID del elemento video
  };
  
  useEffect(() => {
    if (result) {
      // Procesar QR escaneado
      console.log('QR detectado:', result);
      validarTicket(result);
    }
  }, [result]);
  
  return (
    <div>
      <video id="qr-video" style={{ width: '100%' }} />
      <button onClick={handleScan}>Escanear QR</button>
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

## 🖨️ Servicio de Impresión

```typescript
import { printTicket } from '../services/print';

function TotemSuccess({ ticket }) {
  const handlePrint = () => {
    printTicket({
      uuid: ticket.uuid,
      trabajador: {
        nombre: 'Juan Pérez',
        rut: '12345678-9'
      },
      qr_image: ticket.qr_image, // Base64 o URL
      created_at: new Date().toISOString(),
      ttl_expira_at: ticket.ttl_expira_at,
      estado: 'pendiente'
    });
  };
  
  return (
    <button onClick={handlePrint}>
      Imprimir Ticket
    </button>
  );
}
```

## 🛣️ Rutas de la Aplicación

| Ruta | Acceso | Roles Permitidos | Descripción |
|------|--------|------------------|-------------|
| `/login` | Público | Todos | Pantalla de login |
| `/totem` | Público | Todos | Tótem de autoservicio |
| `/guardia` | Protegido | `guardia`, `admin` | Panel de guardia |
| `/rrhh` | Protegido | `rrhh`, `admin`, `supervisor` | Dashboard RRHH |
| `/admin` | Protegido | `admin` | Panel de administración |
| `/` | Público | Todos | Redirige a `/login` |

## 🎨 Guía de Diseño

### Colores Principales
- **Primary Red**: `#E12019` - Rojo corporativo TMLUC
- **Dark Red**: `#B51810` - Rojo oscuro para gradientes
- **Background**: `#F8F8F8` - Fondo claro
- **Border**: `#E0E0E0` - Bordes sutiles
- **Text Primary**: `#333333` - Texto principal
- **Text Secondary**: `#6B6B6B` - Texto secundario

### Tipografía
- **Sans-serif**: Fuente principal para UI
- **Courier New**: Fuente monospace para tickets térmicos

## 🧪 Testing

### Comandos de Test
```bash
# Ejecutar todos los tests
npm run test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 📊 Performance

### Code Splitting
El proyecto está configurado para separar el código en chunks optimizados:

- **Chunk inicial**: ~50KB (gzipped)
- **Vendor React**: ~130KB (React + Router)
- **Vendor UI**: ~80KB (Radix components)
- **Vendor Charts**: ~90KB (Recharts)
- **Lazy loaded**: Componentes cargados bajo demanda

### Optimizaciones
- Lazy loading de rutas
- Memoización de componentes pesados
- Debounce en búsquedas
- Virtual scrolling en listas largas

## 🔒 Seguridad

### Medidas Implementadas
- ✅ JWT con refresh token
- ✅ Tokens almacenados en localStorage (considerar httpOnly cookies para producción)
- ✅ Interceptores de axios para manejo automático de tokens
- ✅ Rutas protegidas con verificación de roles
- ✅ Timeout de peticiones (30s)
- ✅ Validación de entrada en formularios
- ✅ CORS configurado en backend

### Recomendaciones Producción
- [ ] Usar httpOnly cookies para tokens
- [ ] Implementar CSP headers
- [ ] Rate limiting en frontend
- [ ] Logging de errores (Sentry)
- [ ] Auditoría de seguridad

## 🐛 Debugging

### Variables de Entorno de Debug
```env
# Activar logs de axios
VITE_DEBUG_API=true

# Activar logs de autenticación
VITE_DEBUG_AUTH=true
```

### Chrome DevTools
- **Network**: Ver peticiones HTTP y headers
- **Application > Local Storage**: Ver tokens almacenados
- **Console**: Ver logs de interceptores

## 📝 Notas de Desarrollo

### Comentarios en Español
Todos los comentarios del código están en español para facilitar el mantenimiento por el equipo.

### Convenciones de Código
- **PascalCase**: Componentes React (`LoginModule`, `ProtectedRoute`)
- **camelCase**: Funciones y variables (`useQRScanner`, `printTicket`)
- **kebab-case**: Archivos CSS (`globals.css`)
- **UPPER_CASE**: Constantes de entorno (`VITE_API_URL`)

## 🔄 Estado del Proyecto

### ✅ Completado (100%)
- [x] Sistema de autenticación completo
- [x] Rutas protegidas con roles
- [x] Interceptores de API con refresh automático
- [x] Escáner QR con selección de cámara
- [x] Servicio de impresión con formato térmico
- [x] Code splitting optimizado
- [x] Traducción completa a español

### 🎯 Próximos Pasos (Opcional)
- [ ] Tests unitarios con Vitest
- [ ] Tests E2E con Playwright
- [ ] Modo offline con Service Workers
- [ ] PWA para instalación en dispositivos
- [ ] Dark mode
- [ ] Internacionalización (i18n)

## 🤝 Contribución

### Workflow
1. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Hacer cambios y commit: `git commit -m "feat: descripción"`
3. Push: `git push origin feature/nueva-funcionalidad`
4. Crear Pull Request

### Commit Messages
Seguir [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Formato de código
- `refactor:` Refactorización
- `test:` Tests
- `chore:` Tareas de mantenimiento

## 📄 Licencia

Propietario: Tres Montes Lucchetti (TMLUC)
Uso interno exclusivo.

## 👥 Contacto

- **Desarrollador**: Equipo de Desarrollo TMLUC
- **Soporte**: soporte@tmluc.cl

---

**Última actualización**: Enero 2025
**Versión**: 1.0.0
