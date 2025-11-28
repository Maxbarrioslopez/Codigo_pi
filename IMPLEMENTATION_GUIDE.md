# 🚀 IMPLEMENTACIÓN COMPLETA - SISTEMA TÓTEM DIGITAL

## 📋 RESUMEN EJECUTIVO

Este documento detalla la implementación **exhaustiva, modularizada y orientada a objetos** del sistema Tótem Digital para retiro de beneficios. Se han implementado las capas críticas de seguridad, autenticación, servicios de negocio y validaciones necesarias para un entorno de producción.

---

## ✅ IMPLEMENTACIONES COMPLETADAS

### 1. 🔐 SEGURIDAD Y AUTENTICACIÓN

#### **Modelo de Usuario Personalizado con Roles**
- **Archivo**: `backend/totem/models.py`
- **Clase**: `Usuario(AbstractUser)`
- **Roles implementados**:
  - `ADMIN`: Administrador del sistema
  - `RRHH`: Recursos Humanos
  - `GUARDIA`: Personal de portería
  - `SUPERVISOR`: Supervisor de operaciones
- **Métodos de ayuda**:
  ```python
  usuario.es_admin()      # True si es admin o superuser
  usuario.es_rrhh()       # True si RRHH o Admin
  usuario.es_guardia()    # True si Guardia
  usuario.es_supervisor() # True si Supervisor o Admin
  ```

#### **Sistema de Permisos DRF**
- **Archivo**: `backend/totem/permissions.py`
- **Clases implementadas**:
  - `IsAdmin` - Solo administradores
  - `IsRRHH` - RRHH y admins
  - `IsGuardia` - Personal de guardia
  - `IsSupervisor` - Supervisores y admins
  - `IsGuardiaOrAdmin` - Guardia o admin
  - `IsRRHHOrSupervisor` - RRHH, Supervisor o Admin
  - `AllowTotem` - Acceso público (endpoints del tótem)

#### **Autenticación JWT + Session**
- **Paquetes instalados**:
  - `djangorestframework-simplejwt`
  - Configurado en `settings.py`
- **Endpoints**:
  - `POST /api/auth/login/` - Obtener tokens JWT
  - `POST /api/auth/refresh/` - Refrescar token
- **Configuración**:
  ```python
  ACCESS_TOKEN_LIFETIME: 8 horas
  REFRESH_TOKEN_LIFETIME: 7 días
  ROTATE_REFRESH_TOKENS: True
  ```

#### **Seguridad de Códigos QR**
- **Archivo**: `backend/totem/security.py`
- **Clase**: `QRSecurity`
- **Funcionalidad**:
  - Firma HMAC-SHA256 de cada UUID de ticket
  - Formato del payload: `{uuid}:{firma}`
  - Validación con `hmac.compare_digest()` para prevenir timing attacks
  - Detección de QRs falsificados
- **Métodos principales**:
  ```python
  QRSecurity.crear_payload_firmado(uuid)     # Genera QR firmado
  QRSecurity.validar_payload(payload)        # Valida y extrae UUID
  ```

---

### 2. 📦 CAPA DE SERVICIOS (ARQUITECTURA OOP)

#### **TicketService** - Gestión de Tickets
- **Archivo**: `backend/totem/services/ticket_service.py`
- **Responsabilidades**:
  - Crear tickets con QR firmado
  - Validación en guardia con locks transaccionales
  - Anulación y reimpresión
  - Obtención de estado y timeline
- **Métodos principales**:
  ```python
  crear_ticket(trabajador_rut, sucursal_nombre, ciclo_id)
  validar_ticket_guardia(qr_payload, caja_codigo, guardia_username)
  anular_ticket(ticket_uuid, razon)
  reimprimir_ticket(ticket_uuid)
  obtener_estado_ticket(ticket_uuid)
  ```
- **Características**:
  - `@transaction.atomic` en operaciones críticas
  - `select_for_update()` para prevenir condiciones de carrera
  - Validación de TTL y estados
  - Logging estructurado
  - Manejo de excepciones personalizadas

#### **AgendamientoService** - Gestión de Agendamientos
- **Archivo**: `backend/totem/services/agendamiento_service.py`
- **Responsabilidades**:
  - Crear agendamientos con validaciones completas
  - Listar agendamientos por trabajador
  - Cancelar y marcar como efectuado
  - Marcar vencidos automáticamente
  - Estadísticas por fecha
- **Métodos principales**:
  ```python
  crear_agendamiento(trabajador_rut, fecha_retiro, ciclo_id)
  listar_agendamientos_trabajador(trabajador_rut)
  cancelar_agendamiento(agendamiento_id)
  marcar_efectuado(agendamiento_id)
  marcar_vencidos()
  obtener_estadisticas_fecha(fecha)
  ```

#### **IncidenciaService** - Gestión de Incidencias
- **Archivo**: `backend/totem/services/incidencia_service.py`
- **Responsabilidades**:
  - Crear incidencias con código único
  - Listar con filtros
  - Actualizar estado con historial
  - Estadísticas generales
- **Métodos principales**:
  ```python
  crear_incidencia(trabajador_rut, tipo, descripcion, origen, metadata)
  obtener_incidencia(codigo)
  listar_incidencias(trabajador_rut, estado, tipo, limit)
  actualizar_estado(codigo, nuevo_estado, notas)
  obtener_estadisticas()
  ```

---

### 3. ✅ VALIDADORES DE NEGOCIO

#### **AgendamientoValidator**
- **Archivo**: `backend/totem/validators.py`
- **Validaciones**:
  - ❌ No fecha pasada
  - ❌ No mismo día (usar retiro inmediato)
  - ❌ No fines de semana
  - ❌ No más de 30 días anticipación
  - ✅ Verificación de cupos disponibles
  - ✅ No duplicados por trabajador

#### **TicketValidator**
- **Validaciones**:
  - ✅ TTL no expirado
  - ✅ Estado correcto para operación
  - ✅ Unicidad de retiro por ciclo

#### **RUTValidator**
- **Validaciones**:
  - ✅ Formato correcto
  - ✅ Dígito verificador
  - 🔧 Limpieza automática de formato

---

### 4. 🚨 EXCEPCIONES PERSONALIZADAS

**Archivo**: `backend/totem/exceptions.py`

**Jerarquía**:
```
TotemBaseException (APIException)
├── TicketNotFoundException
├── TicketExpiredException
├── TicketInvalidStateException
├── TrabajadorNotFoundException
├── NoBeneficioException
├── NoStockException
├── AgendamientoInvalidException
├── CupoExcedidoException
├── QRInvalidException
├── RUTInvalidException
└── ConcurrencyException
```

**Handler Personalizado**:
- `custom_exception_handler(exc, context)`
- Respuestas consistentes en formato:
  ```json
  {
    "detail": "mensaje de error",
    "code": "codigo_error",
    "status": 400
  }
  ```
- Logging automático según severidad

---

### 5. ⚙️ CONFIGURACIÓN DE ENTORNO

#### **Variables de Entorno**
- **Archivo**: `backend/.env.example`
- **Paquete**: `python-decouple`
- **Configuración incluida**:
  ```bash
  # Django
  DJANGO_SECRET_KEY=...
  DJANGO_DEBUG=1
  
  # Database
  USE_POSTGRES=0
  POSTGRES_DB=totem_db
  POSTGRES_USER=...
  POSTGRES_PASSWORD=...
  
  # CORS
  CORS_ALLOWED_ORIGINS=http://localhost:5173
  
  # Security
  JWT_SECRET_KEY=...
  QR_HMAC_SECRET=...
  
  # Operational
  MAX_AGENDAMIENTOS_PER_DAY=50
  MAX_AGENDAMIENTOS_PER_WORKER=1
  QR_TTL_MINUTES=30
  ```

#### **Settings.py Refactorizado**
- **CORS configurado**: `django-cors-headers`
- **JWT configurado**: `djangorestframework-simplejwt`
- **Logging estructurado**:
  - Console handler
  - File handler (`logs/django.log`)
  - Formatters verbose
  - Loggers por app
- **DRF con autenticación por defecto**
- **Spectacular (OpenAPI) para documentación**

---

### 6. 🗄️ ADMIN DJANGO COMPLETO

**Archivo**: `backend/totem/admin.py`

**Modelos registrados**:
- ✅ Usuario (con UserAdmin extendido)
- ✅ Trabajador
- ✅ StockSucursal
- ✅ Ticket
- ✅ Sucursal
- ✅ Ciclo
- ✅ CajaFisica
- ✅ Agendamiento
- ✅ Incidencia
- ✅ TicketEvent
- ✅ ParametroOperativo

**Características**:
- List displays personalizados
- Filtros por campos relevantes
- Search fields
- Date hierarchies
- Campos readonly apropiados
- Boolean icons

---

### 7. 🔄 COMANDOS DJANGO

#### **Expirar Tickets**
- **Archivo**: `backend/totem/management/commands/expirar_tickets.py`
- **Uso**: `python manage.py expirar_tickets [--dry-run]`
- **Funcionalidad**:
  - Marca tickets pendientes con TTL expirado
  - Crea TicketEvent de expiración
  - Soporta dry-run para preview
  - Logging completo
- **Cron sugerido**: Cada 5-10 minutos

#### **Marcar Agendamientos Vencidos**
- **Archivo**: `backend/totem/management/commands/marcar_agendamientos_vencidos.py`
- **Uso**: `python manage.py marcar_agendamientos_vencidos`
- **Funcionalidad**:
  - Marca agendamientos pendientes con fecha pasada
  - Usa `AgendamientoService`
- **Cron sugerido**: Diariamente a las 00:00

---

### 8. 📚 FIXTURES Y DATOS INICIALES

**Archivo**: `backend/totem/fixtures/initial_data.json`

**Incluye**:
- ✅ Parámetros operativos (TTL, duración ciclo, umbral stock, max agendamientos)
- ✅ Sucursales (Central, Norte, Sur)
- ✅ Stock inicial (Cajas Premium y Estándar)
- ✅ Ciclo activo (Nov-Dic 2025)

**Cargar datos**:
```bash
python manage.py loaddata initial_data
```

---

### 9. 📖 DOCUMENTACIÓN API

**Configurado**: `drf-spectacular`

**Endpoints**:
- `GET /api/schema/` - Schema OpenAPI JSON
- `GET /api/docs/` - Swagger UI interactiva

**Características**:
- Auto-generación desde DRF views
- Documentación de permisos
- Schemas de request/response
- Ejemplos de uso

---

### 10. 📦 REQUIREMENTS ACTUALIZADOS

**Archivo**: `backend/requirements.txt`

**Nuevas dependencias**:
```
djangorestframework-simplejwt  # JWT authentication
django-cors-headers            # CORS
python-decouple                # Environment variables
drf-spectacular                # OpenAPI documentation
```

---

## 🔧 PRÓXIMOS PASOS - INTEGRACIÓN

### A. **Refactorizar Views Existentes**

Las vistas actuales en `totem/views.py`, `guardia/views.py` y `rrhh/views.py` necesitan:

1. **Usar servicios OOP** en lugar de lógica en views
2. **Aplicar permisos** según rol
3. **Manejar excepciones** personalizadas

**Ejemplo de refactorización**:

```python
# ANTES (function-based)
@api_view(['POST'])
def crear_ticket(request):
    rut = request.data.get('trabajador_rut')
    # ... lógica directa con modelos ...
    ticket = Ticket.objects.create(...)
    return Response(...)

# DESPUÉS (usando servicio + permisos)
from rest_framework.views import APIView
from totem.services.ticket_service import TicketService
from totem.permissions import AllowTotem
from totem.exceptions import *

class CrearTicketView(APIView):
    permission_classes = [AllowTotem]  # Público para tótem
    
    def post(self, request):
        rut = request.data.get('trabajador_rut')
        sucursal = request.data.get('sucursal', 'Central')
        
        service = TicketService()
        try:
            ticket = service.crear_ticket(rut, sucursal)
            serializer = TicketSerializer(ticket)
            return Response(serializer.data, status=201)
        except TrabajadorNotFoundException as e:
            return Response({'detail': str(e)}, status=404)
        except (NoBeneficioException, NoStockException) as e:
            return Response({'detail': str(e)}, status=400)
```

### B. **Crear URLConfs Modulares**

**Crear**: `backend/guardia/urls.py`
```python
from django.urls import path
from . import views

urlpatterns = [
    path('validar/', views.ValidarTicketView.as_view(), name='guardia-validar'),
    path('metricas/', views.MetricasView.as_view(), name='guardia-metricas'),
]
```

**Crear**: `backend/rrhh/urls.py`
```python
from django.urls import path
from . import views

urlpatterns = [
    path('tickets/', views.ListarTicketsView.as_view(), name='rrhh-tickets'),
    path('reportes/diarios/', views.ReportesDiariosView.as_view(), name='rrhh-reportes'),
    path('incidencias/', views.IncidenciasView.as_view(), name='rrhh-incidencias'),
]
```

### C. **Migraciones de Base de Datos**

```bash
# 1. Crear migraciones para el nuevo modelo Usuario
python manage.py makemigrations

# 2. Aplicar migraciones
python manage.py migrate

# 3. Cargar datos iniciales
python manage.py loaddata initial_data

# 4. Crear superusuario
python manage.py createsuperuser
```

⚠️ **IMPORTANTE**: El modelo `Usuario` ahora es el `AUTH_USER_MODEL`. Si ya tienes datos:
- Considera migración de datos existentes
- O usa `python manage.py migrate --fake-initial` con precaución

### D. **Testing Exhaustivo**

**Crear**: `backend/totem/tests/test_services.py`

```python
import pytest
from totem.services.ticket_service import TicketService
from totem.exceptions import *

@pytest.mark.django_db
class TestTicketService:
    def test_crear_ticket_valido(self):
        service = TicketService()
        ticket = service.crear_ticket('12345678-5', 'Central')
        assert ticket.estado == 'pendiente'
        assert ticket.qr_image  # QR debe generarse
    
    def test_validar_qr_falsificado(self):
        service = TicketService()
        with pytest.raises(QRInvalidException):
            service.validar_ticket_guardia('uuid-falso:firma-falsa', 'CAJA001')
    
    def test_concurrencia_validacion(self):
        # Test con threading para simular concurrencia
        pass
```

**Ejecutar tests**:
```bash
pytest backend/totem/tests/ -v
```

---

## 🎨 FRONTEND - IMPLEMENTACIONES PENDIENTES

### 1. **Autenticación**

**Crear**: `front end/src/contexts/AuthContext.tsx`

```typescript
import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  username: string;
  rol: 'admin' | 'rrhh' | 'guardia' | 'supervisor';
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar token al cargar
    const token = localStorage.getItem('access_token');
    if (token) {
      // Validar token y obtener usuario
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await api.get('/auth/me/');
      setUser(userData);
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await api.post('/auth/login/', { username, password });
    localStorage.setItem('access_token', response.access);
    localStorage.setItem('refresh_token', response.refresh);
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### 2. **API Service con Interceptores**

**Actualizar**: `front end/src/services/api.ts`

```typescript
// Agregar interceptor para JWT
const getAuthHeader = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// En cada llamada
export const api = {
  async get(url: string) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      // Token expirado, intentar refresh
      await refreshToken();
      // Reintentar request
    }
    
    if (!response.ok) throw await response.json();
    return response.json();
  },
  
  // ... post, put, delete similar
};

async function refreshToken() {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) {
    window.location.href = '/login';
    return;
  }
  
  const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  
  if (response.ok) {
    const { access } = await response.json();
    localStorage.setItem('access_token', access);
  } else {
    localStorage.clear();
    window.location.href = '/login';
  }
}
```

### 3. **Protected Routes**

**Crear**: `front end/src/components/ProtectedRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
};
```

### 4. **QR Scanner**

```bash
npm install @zxing/browser
```

**Crear**: `front end/src/hooks/useQRScanner.ts`

```typescript
import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';

export const useQRScanner = (onScan: (code: string) => void) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isScanning || !videoRef.current) return;

    const codeReader = new BrowserQRCodeReader();
    
    codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
      if (result) {
        onScan(result.getText());
      }
      if (err && !(err instanceof NotFoundException)) {
        setError(err.message);
      }
    });

    return () => {
      codeReader.reset();
    };
  }, [isScanning, onScan]);

  return { videoRef, isScanning, setIsScanning, error };
};
```

### 5. **Code Splitting**

**Actualizar**: `front end/vite.config.ts`

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', /* otros */],
          'charts': ['recharts'],
          'icons': ['lucide-react'],
        },
      },
    },
  },
});
```

---

## 📋 CHECKLIST DE INSTALACIÓN

### Backend

```bash
cd backend

# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Copiar y configurar .env
cp .env.example .env
# Editar .env con valores reales

# 3. Crear logs directory
mkdir -p logs

# 4. Migraciones
python manage.py makemigrations
python manage.py migrate

# 5. Cargar datos iniciales
python manage.py loaddata initial_data

# 6. Crear superusuario
python manage.py createsuperuser

# 7. Ejecutar servidor
python manage.py runserver 0.0.0.0:8000
```

### Frontend

```bash
cd "front end"

# 1. Instalar dependencias nuevas
npm install @zxing/browser

# 2. Configurar base URL del API
# Editar src/services/api.ts con URL correcta

# 3. Build
npm run build

# 4. Preview
npm run preview
```

---

## 🔒 SEGURIDAD - RECOMENDACIONES PRODUCCIÓN

1. ✅ **HTTPS obligatorio** en producción
2. ✅ **SECRET_KEY** y **JWT_SECRET_KEY** aleatorios de 50+ caracteres
3. ✅ **QR_HMAC_SECRET** único y seguro
4. ✅ **DEBUG=False** en producción
5. ✅ **ALLOWED_HOSTS** configurado correctamente
6. ✅ **CORS_ALLOWED_ORIGINS** solo dominios permitidos
7. ✅ Rate limiting en endpoints públicos (usar `django-ratelimit`)
8. ✅ Backups automáticos de PostgreSQL
9. ✅ Monitoring de logs (Sentry, CloudWatch, etc.)
10. ✅ SSL certificate válido

---

## 🎯 ARQUITECTURA FINAL

```
backend/
├── totem/                          # App principal
│   ├── models.py                   # Usuario, Trabajador, Ticket, etc.
│   ├── serializers.py              # DTOs DRF
│   ├── permissions.py              # Permisos por rol
│   ├── security.py                 # QR HMAC signing
│   ├── validators.py               # Validadores de negocio
│   ├── exceptions.py               # Excepciones custom
│   ├── services/                   # ⭐ CAPA DE SERVICIOS OOP
│   │   ├── ticket_service.py       # Lógica de tickets
│   │   ├── agendamiento_service.py # Lógica de agendamientos
│   │   └── incidencia_service.py   # Lógica de incidencias
│   ├── management/commands/        # Comandos Django
│   │   ├── expirar_tickets.py
│   │   └── marcar_agendamientos_vencidos.py
│   ├── fixtures/                   # Datos iniciales
│   │   └── initial_data.json
│   └── admin.py                    # Admin completo
├── guardia/                        # App de Guardia
│   ├── views.py                    # Validación tickets
│   └── urls.py
├── rrhh/                           # App de RRHH
│   ├── views.py                    # Reportes y listados
│   └── urls.py
├── backend_project/
│   ├── settings.py                 # ⭐ JWT, CORS, Logging, Spectacular
│   └── urls.py                     # Rutas auth + docs
├── logs/                           # Logs de aplicación
├── requirements.txt                # ⭐ Dependencias actualizadas
└── .env.example                    # Template de variables

frontend/
├── src/
│   ├── contexts/                   # AuthContext (pendiente)
│   ├── services/
│   │   └── api.ts                  # Service con JWT interceptor (pendiente)
│   ├── hooks/
│   │   └── useQRScanner.ts         # QR scanner hook (pendiente)
│   └── components/
│       ├── LoginModule.tsx         # Login UI (pendiente)
│       ├── ProtectedRoute.tsx      # Route guard (pendiente)
│       └── ... (módulos existentes)
└── vite.config.ts                  # Code splitting (pendiente)
```

---

## 📞 SOPORTE Y MANTENIMIENTO

### Cron Jobs Recomendados

```cron
# Expirar tickets cada 5 minutos
*/5 * * * * cd /path/to/backend && python manage.py expirar_tickets

# Marcar agendamientos vencidos diariamente
0 0 * * * cd /path/to/backend && python manage.py marcar_agendamientos_vencidos

# Limpiar logs antiguos semanalmente
0 2 * * 0 find /path/to/backend/logs -name "*.log" -mtime +30 -delete
```

### Monitoreo

- **Health Check**: `GET /api/health/` (crear view simple)
- **Métricas**: Integrar Django Debug Toolbar en dev
- **Errores**: Sentry en producción
- **Logs**: Rotar con `logrotate`

---

## ✨ CONCLUSIÓN

Se ha implementado una **arquitectura robusta, segura y escalable** con:

- ✅ **Autenticación JWT** y sistema de roles
- ✅ **Capa de servicios OOP** separando lógica de negocio
- ✅ **Validadores exhaustivos** de reglas de negocio
- ✅ **Seguridad QR** con firma HMAC
- ✅ **Excepciones personalizadas** y respuestas consistentes
- ✅ **Transacciones atómicas** y locks para concurrencia
- ✅ **Comandos automatizables** para mantenimiento
- ✅ **Logging estructurado** para debugging
- ✅ **Admin completo** para gestión
- ✅ **Documentación API** auto-generada

El sistema está **listo para integración** siguiendo los pasos de refactorización de views y completando la implementación del frontend con autenticación y scanning.

---

**Fecha**: 25 de Noviembre, 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Backend core completo | ⏳ Integración de views pendiente | ⏳ Frontend auth pendiente
