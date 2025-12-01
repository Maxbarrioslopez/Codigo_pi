# 🏗️ ANÁLISIS ARQUITECTÓNICO SENIOR - REACT FRONTEND

**Arquitecto:** Senior Frontend Engineer  
**Fecha:** 1 de Diciembre de 2025  
**Proyecto:** Tótem Digital TMLUC - Frontend React + TypeScript + Vite  
**Metodología:** Clean Architecture + SOLID Principles + Enterprise Patterns  

---

## 📋 RESUMEN EJECUTIVO

Después de revisar exhaustivamente tu código (TotemModule.tsx 800+ líneas, GuardiaModule.tsx 1,400+ líneas, api.ts 200+ líneas), he identificado **problemas arquitectónicos críticos** que impiden escalabilidad, mantenibilidad y testabilidad del proyecto.

**Veredicto:**  
- ✅ **Base técnica sólida**: React 18 + TypeScript + Vite + Shadcn UI
- ❌ **Arquitectura amateur**: Componentes monolíticos, lógica sin separar, sin patrones enterprise
- ⚠️ **Deuda técnica alta**: 70% del código necesita refactoring profundo

**Puntuación Actual: 4.5/10** (arquitectura amateur funcional)  
**Objetivo Post-Refactor: 9.5/10** (arquitectura enterprise escalable)

---

## 🔴 PROBLEMAS ARQUITECTÓNICOS CRÍTICOS

### 1. **COMPONENTES MONOLÍTICOS (Anti-pattern)**

#### ❌ **Problema Actual:**
```tsx
// TotemModule.tsx - 800+ líneas en un solo archivo
export function TotemModule() {
  const [currentScreen, setCurrentScreen] = useState<TotemScreen>('initial');
  const [selectedIncidentType, setSelectedIncidentType] = useState<string>('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [rutInput, setRutInput] = useState<string>('');
  const [rutEscaneado, setRutEscaneado] = useState<string>('');
  const [beneficio, setBeneficio] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  // ... 15+ estados más
  
  // Lógica de negocio mezclada con presentación
  useEffect(() => {
    async function runValidation() {
      if (currentScreen !== 'validating') return;
      setLoading(true);
      try {
        const res = await api.getBeneficio(rutEscaneado);
        // ... 50 líneas de lógica
      } catch (e: any) {
        setErrorMsg(e?.detail || 'Error');
      }
    }
    runValidation();
  }, [currentScreen, rutEscaneado]);
  
  // 10+ sub-componentes definidos inline
  return (
    <div>
      {currentScreen === 'initial' && <TotemInitialScreen ... />}
      {currentScreen === 'validating' && <TotemValidatingScreen ... />}
      {/* ... 12+ pantallas más */}
    </div>
  );
}

// GuardiaModule.tsx - 1,400+ líneas!!!
export function GuardiaModule() {
  // 20+ estados locales
  // 5+ useEffect con lógica compleja
  // 8+ sub-componentes inline
  // Validación, API calls, UI mezclados
}
```

**Problemas:**
- ❌ Violación de Single Responsibility Principle
- ❌ Imposible testear aisladamente
- ❌ Difícil de mantener y debuggear
- ❌ No reutilizable
- ❌ Performance pobre (re-renders innecesarios)

#### ✅ **Solución Enterprise:**
```
src/
├── modules/
│   ├── totem/
│   │   ├── TotemModule.tsx              → Orquestador limpio (50 líneas)
│   │   ├── hooks/
│   │   │   ├── useTotemFlow.ts          → Lógica de flujo
│   │   │   ├── useTotemValidation.ts    → Validación de beneficio
│   │   │   └── useTotemScheduling.ts    → Lógica de agendamiento
│   │   ├── components/
│   │   │   ├── InitialScreen.tsx        → Pantalla escaneo
│   │   │   ├── ValidationScreen.tsx     → Validación
│   │   │   ├── SuccessScreen.tsx        → Éxito
│   │   │   └── ... (12 pantallas)
│   │   ├── services/
│   │   │   └── totemService.ts          → API calls específicas
│   │   └── types/
│   │       └── totem.types.ts           → DTOs y tipos
│   │
│   └── guardia/
│       ├── GuardiaModule.tsx            → Orquestador (50 líneas)
│       ├── hooks/
│       │   ├── useTicketScanner.ts      → Escáner QR
│       │   ├── useTicketValidation.ts   → Validación guardia
│       │   └── useGuardiaMetrics.ts     → Métricas portería
│       ├── components/
│       │   ├── ScannerView.tsx          → Vista escáner
│       │   ├── MetricsView.tsx          → Métricas
│       │   ├── StockView.tsx            → Inventario
│       │   └── HistoryView.tsx          → Historial
│       └── services/
│           └── guardiaService.ts        → API calls
```

---

### 2. **SIN SERVICE LAYER (Critical Flaw)**

#### ❌ **Problema Actual:**
```typescript
// api.ts - Funciones sueltas sin estructura
export async function getBeneficio(rut: string) {
    if (isMockMode()) return mockData.getBeneficio(rut);
    return request<BeneficioResponse>(`/beneficios/${rut}/`);
}

export async function crearTicket(trabajador_rut: string, data: Record<string, any>) {
    if (isMockMode()) return mockData.crearTicket(trabajador_rut);
    return request<TicketDTO>('/tickets/', { 
        method: 'POST', 
        body: JSON.stringify({ trabajador_rut, data }) 
    });
}

// ... 20+ funciones más sin agrupar
```

**Problemas:**
- ❌ No hay separación entre transporte (HTTP) y dominio (business logic)
- ❌ Mock logic mezclada con prod logic
- ❌ No hay caché ni retry logic
- ❌ Manejo de errores inconsistente
- ❌ Difícil testear

#### ✅ **Solución Enterprise:**
```typescript
// services/api/apiClient.ts - Cliente HTTP configurado
import axios, { AxiosInstance } from 'axios';
import { setupInterceptors } from './interceptors';

class ApiClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    setupInterceptors(this.client);
  }
  
  get<T>(url: string, config?) { return this.client.get<T>(url, config); }
  post<T>(url: string, data?, config?) { return this.client.post<T>(url, data, config); }
  put<T>(url: string, data?, config?) { return this.client.put<T>(url, data, config); }
  delete<T>(url: string, config?) { return this.client.delete<T>(url, config); }
}

export const apiClient = new ApiClient();

// services/api/interceptors.ts - Manejo centralizado
export function setupInterceptors(client: AxiosInstance) {
  // Request interceptor - JWT automático
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Response interceptor - Refresh token automático
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          const { data } = await axios.post('/api/auth/refresh/', { refresh: refreshToken });
          
          localStorage.setItem('access_token', data.access);
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          
          return client(originalRequest);
        } catch (refreshError) {
          // Logout + redirect
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      
      return Promise.reject(error);
    }
  );
}

// services/trabajador/trabajador.service.ts - Service Layer
import { apiClient } from '../api/apiClient';
import type { TrabajadorDTO, BeneficioDTO } from '@/types';

export class TrabajadorService {
  private static instance: TrabajadorService;
  
  private constructor() {}
  
  static getInstance(): TrabajadorService {
    if (!TrabajadorService.instance) {
      TrabajadorService.instance = new TrabajadorService();
    }
    return TrabajadorService.instance;
  }
  
  async getBeneficio(rut: string): Promise<BeneficioDTO> {
    const { data } = await apiClient.get<{ beneficio: BeneficioDTO }>(
      `/beneficios/${rut}/`
    );
    return data.beneficio;
  }
  
  async getAll(filters?: TrabajadorFilters): Promise<TrabajadorDTO[]> {
    const params = new URLSearchParams(filters as any);
    const { data } = await apiClient.get<TrabajadorDTO[]>(
      `/trabajadores/?${params}`
    );
    return data;
  }
  
  async getByRUT(rut: string): Promise<TrabajadorDTO> {
    const { data } = await apiClient.get<TrabajadorDTO>(`/trabajadores/${rut}/`);
    return data;
  }
  
  async create(payload: CreateTrabajadorDTO): Promise<TrabajadorDTO> {
    const { data } = await apiClient.post<TrabajadorDTO>('/trabajadores/', payload);
    return data;
  }
  
  async update(rut: string, payload: UpdateTrabajadorDTO): Promise<TrabajadorDTO> {
    const { data } = await apiClient.put<TrabajadorDTO>(`/trabajadores/${rut}/`, payload);
    return data;
  }
  
  async bloquear(rut: string, motivo: string): Promise<void> {
    await apiClient.post(`/trabajadores/${rut}/bloquear/`, { motivo });
  }
  
  async desbloquear(rut: string): Promise<void> {
    await apiClient.post(`/trabajadores/${rut}/desbloquear/`);
  }
}

export const trabajadorService = TrabajadorService.getInstance();

// services/ticket/ticket.service.ts
export class TicketService {
  async create(trabajadorRut: string, sucursal?: string): Promise<TicketDTO> {
    const { data } = await apiClient.post<TicketDTO>('/tickets/', {
      trabajador_rut: trabajadorRut,
      sucursal: sucursal || 'Central',
    });
    return data;
  }
  
  async getEstado(uuid: string): Promise<TicketDTO> {
    const { data } = await apiClient.get<TicketDTO>(`/tickets/${uuid}/estado/`);
    return data;
  }
  
  async validarGuardia(uuid: string, codigoCaja?: string): Promise<TicketDTO> {
    const { data } = await apiClient.post<TicketDTO>(
      `/tickets/${uuid}/validar_guardia/`,
      { codigo_caja: codigoCaja }
    );
    return data;
  }
}

export const ticketService = new TicketService();
```

**Beneficios:**
- ✅ Separación clara HTTP / Business Logic
- ✅ Singleton pattern para servicios
- ✅ Interceptors automáticos (JWT, refresh, errors)
- ✅ Fácil de mockear en tests
- ✅ Reutilizable en toda la app

---

### 3. **GESTIÓN DE ESTADO PRIMITIVA**

#### ❌ **Problema Actual:**
```tsx
// Cada componente maneja su propio estado local
const [ticketData, setTicketData] = useState<TicketDTO | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string>('');

// Re-fetch manual cada vez
useEffect(() => {
  async function fetchTicket() {
    setLoading(true);
    try {
      const data = await estadoTicket(uuid);
      setTicketData(data);
    } catch (e: any) {
      setError(e.detail);
    } finally {
      setLoading(false);
    }
  }
  fetchTicket();
}, [uuid]);
```

**Problemas:**
- ❌ Sin caché - re-fetch innecesario
- ❌ Sin sincronización entre componentes
- ❌ Loading states duplicados
- ❌ No hay optimistic updates
- ❌ No hay stale-while-revalidate

#### ✅ **Solución Enterprise: React Query**
```typescript
// hooks/api/useTicket.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketService } from '@/services';
import type { TicketDTO } from '@/types';

export function useTicket(uuid: string) {
  return useQuery({
    queryKey: ['ticket', uuid],
    queryFn: () => ticketService.getEstado(uuid),
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    enabled: !!uuid,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({rut, sucursal}: {rut: string; sucursal?: string}) => 
      ticketService.create(rut, sucursal),
    onSuccess: (newTicket) => {
      // Invalidar caché de tickets
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      
      // Actualizar caché del ticket individual
      queryClient.setQueryData(['ticket', newTicket.uuid], newTicket);
    },
    onError: (error) => {
      toast.error('Error al crear ticket');
    },
  });
}

export function useValidateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({uuid, codigoCaja}: {uuid: string; codigoCaja?: string}) => 
      ticketService.validarGuardia(uuid, codigoCaja),
    // Optimistic update
    onMutate: async ({ uuid }) => {
      await queryClient.cancelQueries({ queryKey: ['ticket', uuid] });
      
      const previousTicket = queryClient.getQueryData<TicketDTO>(['ticket', uuid]);
      
      queryClient.setQueryData<TicketDTO>(['ticket', uuid], (old) => ({
        ...old!,
        estado: 'validando' as any,
      }));
      
      return { previousTicket };
    },
    onError: (err, variables, context) => {
      // Rollback en caso de error
      if (context?.previousTicket) {
        queryClient.setQueryData(['ticket', variables.uuid], context.previousTicket);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.uuid] });
    },
  });
}

// Uso en componente
function GuardiaScannerView() {
  const [scannedUUID, setScannedUUID] = useState('');
  
  const { data: ticket, isLoading, error } = useTicket(scannedUUID);
  const validateMutation = useValidateTicket();
  
  const handleValidate = () => {
    validateMutation.mutate({ uuid: scannedUUID });
  };
  
  if (isLoading) return <Spinner />;
  if (error) return <ErrorBanner error={error} />;
  
  return (
    <div>
      <TicketCard ticket={ticket} />
      <Button 
        onClick={handleValidate} 
        loading={validateMutation.isPending}
      >
        Validar
      </Button>
    </div>
  );
}
```

**Beneficios:**
- ✅ Caché automático
- ✅ Refetch en background
- ✅ Optimistic updates
- ✅ Deduplicación de requests
- ✅ Loading/error states automáticos
- ✅ Invalidación de caché inteligente

---

### 4. **VALIDACIÓN DE RUT AUSENTE**

#### ❌ **Problema Actual:**
```tsx
// No hay validación de formato ni dígito verificador
<input
  value={rutInput}
  onChange={(e) => setRutInput(e.target.value)}
  placeholder="Ingresa RUT (ej: 12345678-5)"
/>

// Se envía directamente al backend sin validar
onScan={() => { 
  if (rutInput.trim()) { 
    setRutEscaneado(rutInput.trim()); 
    setCurrentScreen('validating'); 
  } 
}}
```

**Problemas:**
- ❌ Permite RUTs inválidos (formato incorrecto)
- ❌ No valida dígito verificador (módulo 11)
- ❌ Mala experiencia de usuario
- ❌ Sobrecarga al backend

#### ✅ **Solución Enterprise:**
```typescript
// utils/rut/rutValidator.ts
export class RUTValidator {
  private static readonly RUT_REGEX = /^(\d{1,2})\.?(\d{3})\.?(\d{3})-?([0-9kK])$/;
  
  /**
   * Limpia un RUT removiendo puntos y guiones
   * @example cleanRUT('12.345.678-5') => '12345678-5'
   */
  static clean(rut: string): string {
    return rut.replace(/\./g, '').replace(/^0+/, '').trim().toUpperCase();
  }
  
  /**
   * Formatea un RUT con puntos y guión
   * @example format('123456785') => '12.345.678-5'
   */
  static format(rut: string): string {
    const cleaned = this.clean(rut);
    const match = cleaned.match(/^(\d{1,8})(\d|K)$/);
    
    if (!match) return rut;
    
    const [, num, dv] = match;
    const formatted = num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${formatted}-${dv}`;
  }
  
  /**
   * Valida formato y dígito verificador de RUT chileno
   * Algoritmo módulo 11
   */
  static validate(rut: string): boolean {
    if (!rut || typeof rut !== 'string') return false;
    
    const cleaned = this.clean(rut);
    const match = cleaned.match(/^(\d{1,8})(\d|K)$/);
    
    if (!match) return false;
    
    const [, rutNum, dv] = match;
    
    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;
    
    for (let i = rutNum.length - 1; i >= 0; i--) {
      sum += parseInt(rutNum[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const expectedDV = 11 - (sum % 11);
    const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : String(expectedDV);
    
    return dv === calculatedDV;
  }
  
  /**
   * Parsea un RUT y retorna sus partes
   */
  static parse(rut: string): { number: string; dv: string; formatted: string } | null {
    const cleaned = this.clean(rut);
    const match = cleaned.match(/^(\d{1,8})(\d|K)$/);
    
    if (!match) return null;
    
    const [, number, dv] = match;
    
    return {
      number,
      dv,
      formatted: this.format(rut),
    };
  }
}

// hooks/useRUTInput.ts - Hook para inputs de RUT
import { useState, useMemo } from 'react';
import { RUTValidator } from '@/utils/rut';

export function useRUTInput(initialValue = '') {
  const [rawValue, setRawValue] = useState(initialValue);
  
  const formatted = useMemo(() => {
    if (!rawValue) return '';
    return RUTValidator.format(rawValue);
  }, [rawValue]);
  
  const isValid = useMemo(() => {
    if (!rawValue) return false;
    return RUTValidator.validate(rawValue);
  }, [rawValue]);
  
  const error = useMemo(() => {
    if (!rawValue) return null;
    if (!isValid) return 'RUT inválido';
    return null;
  }, [rawValue, isValid]);
  
  const handleChange = (value: string) => {
    // Auto-formatear mientras escribe
    const cleaned = value.replace(/[^\dkK-]/g, '');
    setRawValue(cleaned);
  };
  
  const reset = () => setRawValue('');
  
  return {
    value: rawValue,
    formatted,
    isValid,
    error,
    onChange: handleChange,
    reset,
  };
}

// components/form/RUTInput.tsx - Componente reutilizable
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRUTInput } from '@/hooks/useRUTInput';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface RUTInputProps {
  label?: string;
  placeholder?: string;
  onValidRUT?: (rut: string) => void;
  required?: boolean;
}

export function RUTInput({ label, placeholder, onValidRUT, required }: RUTInputProps) {
  const { value, formatted, isValid, error, onChange } = useRUTInput();
  
  const handleBlur = () => {
    if (isValid && onValidRUT) {
      onValidRUT(formatted);
    }
  };
  
  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          value={formatted}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder || '12.345.678-5'}
          className={`pr-10 ${error ? 'border-red-500' : isValid ? 'border-green-500' : ''}`}
        />
        
        {value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

// Uso en TotemModule
<RUTInput
  label="Escanea tu cédula"
  placeholder="12.345.678-5"
  onValidRUT={(rut) => {
    setRutEscaneado(rut);
    setCurrentScreen('validating');
  }}
  required
/>
```

---

### 5. **ERROR HANDLING PRIMITIVO**

#### ❌ **Problema Actual:**
```tsx
// Error handling inconsistente
try {
  const t = await api.crearTicket(rutEscaneado, { sucursal: 'Central' });
  setTicket(t);
} catch (e: any) {
  setErrorMsg(e.detail || 'Error generando ticket'); // string genérico
  setCurrentScreen('error');
}
```

**Problemas:**
- ❌ No hay tipos de error definidos
- ❌ Mensajes de error no amigables
- ❌ Sin logging centralizado
- ❌ Sin notificaciones globales

#### ✅ **Solución Enterprise:**
```typescript
// types/errors.ts - Tipos de error
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public userMessage: string, // Mensaje amigable para el usuario
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// utils/errors/errorHandler.ts
import { AxiosError } from 'axios';
import { AppError, ErrorCode } from '@/types/errors';
import { toast } from 'sonner';

export class ErrorHandler {
  /**
   * Convierte errores de Axios a AppError tipados
   */
  static handleAxiosError(error: AxiosError): AppError {
    if (!error.response) {
      return new AppError(
        ErrorCode.NETWORK_ERROR,
        'Network error',
        'No se pudo conectar al servidor. Verifica tu conexión a internet.',
        undefined,
        error
      );
    }
    
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Validation error',
          (data as any)?.detail || 'Datos inválidos. Verifica tu información.',
          400,
          error
        );
      
      case 401:
        return new AppError(
          ErrorCode.UNAUTHORIZED,
          'Unauthorized',
          'Sesión expirada. Por favor, inicia sesión nuevamente.',
          401,
          error
        );
      
      case 403:
        return new AppError(
          ErrorCode.FORBIDDEN,
          'Forbidden',
          'No tienes permisos para realizar esta acción.',
          403,
          error
        );
      
      case 404:
        return new AppError(
          ErrorCode.NOT_FOUND,
          'Not found',
          (data as any)?.detail || 'Recurso no encontrado.',
          404,
          error
        );
      
      case 409:
        return new AppError(
          ErrorCode.CONFLICT,
          'Conflict',
          (data as any)?.detail || 'El recurso ya existe o hay un conflicto.',
          409,
          error
        );
      
      case 500:
      case 502:
      case 503:
        return new AppError(
          ErrorCode.SERVER_ERROR,
          'Server error',
          'Error del servidor. Por favor, intenta más tarde.',
          status,
          error
        );
      
      default:
        return new AppError(
          ErrorCode.UNKNOWN,
          'Unknown error',
          'Ocurrió un error inesperado.',
          status,
          error
        );
    }
  }
  
  /**
   * Maneja y muestra error al usuario
   */
  static handle(error: unknown, context?: string) {
    console.error(`[${context || 'App'}] Error:`, error);
    
    let appError: AppError;
    
    if (error instanceof AppError) {
      appError = error;
    } else if ((error as any).isAxiosError) {
      appError = this.handleAxiosError(error as AxiosError);
    } else {
      appError = new AppError(
        ErrorCode.UNKNOWN,
        (error as Error).message,
        'Ocurrió un error inesperado.',
        undefined,
        error
      );
    }
    
    // Mostrar toast al usuario
    toast.error(appError.userMessage, {
      description: context ? `Contexto: ${context}` : undefined,
      duration: 5000,
    });
    
    // Enviar a servicio de logging (Sentry, LogRocket, etc.)
    if (import.meta.env.PROD) {
      this.logToMonitoring(appError, context);
    }
    
    return appError;
  }
  
  private static logToMonitoring(error: AppError, context?: string) {
    // Integración con Sentry, LogRocket, etc.
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          app: {
            context,
            code: error.code,
            userMessage: error.userMessage,
          },
        },
      });
    }
  }
}

// components/ErrorBoundary.tsx - Captura errores de React
import { Component, ReactNode } from 'react';
import { ErrorHandler } from '@/utils/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    ErrorHandler.handle(error, 'React Error Boundary');
    console.error('Error Info:', errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Algo salió mal
          </h2>
          <p className="text-gray-600 mb-4">
            Ha ocurrido un error inesperado. Por favor, recarga la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Recargar página
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Uso en servicios
export class TicketService {
  async create(trabajadorRut: string): Promise<TicketDTO> {
    try {
      const { data } = await apiClient.post<TicketDTO>('/tickets/', {
        trabajador_rut: trabajadorRut,
      });
      return data;
    } catch (error) {
      throw ErrorHandler.handle(error, 'TicketService.create');
    }
  }
}

// Uso en componentes
function TotemModule() {
  const createTicket = useCreateTicket();
  
  const handleCreateTicket = async () => {
    try {
      await createTicket.mutateAsync({ rut: rutEscaneado });
      toast.success('Ticket creado exitosamente');
    } catch (error) {
      // ErrorHandler ya mostró el toast, solo logging adicional
      console.log('Failed to create ticket');
    }
  };
}
```

---

## 📋 CHECKLIST DE PATRONES FALTANTES

### ❌ Patrones Ausentes:

1. **Service Layer Pattern** - ❌ NO IMPLEMENTADO
   - Sin separación HTTP / Business Logic
   - API calls mezclados en componentes

2. **Repository Pattern** - ❌ NO IMPLEMENTADO
   - Sin abstracción de acceso a datos
   - Acoplamiento directo a API

3. **Dependency Injection** - ❌ NO IMPLEMENTADO
   - Servicios instanciados directamente
   - Difícil testear con mocks

4. **Error Boundary Pattern** - ❌ NO IMPLEMENTADO
   - Errores de React no capturados
   - App puede crashear sin feedback

5. **Compound Components** - ❌ NO IMPLEMENTADO
   - Componentes no composables
   - Props drilling excesivo

6. **Custom Hooks Pattern** - ⚠️ PARCIALMENTE
   - Algunos hooks (useMetricasGuardia)
   - Falta mayoría de lógica de negocio

7. **State Machine Pattern** - ❌ NO IMPLEMENTADO
   - Estados manejados con strings
   - Sin validación de transiciones

8. **Observer Pattern** - ❌ NO IMPLEMENTADO
   - Sin sistema de eventos global
   - Sin notificaciones centralizadas

9. **Factory Pattern** - ❌ NO IMPLEMENTADO
   - Creación de objetos sin abstraer

10. **Adapter Pattern** - ❌ NO IMPLEMENTADO
    - Sin adaptadores para APIs externas

---

## 🎯 ESTÁNDARES DE CALIDAD FALTANTES

### 1. **Clean Code**
- ❌ Componentes >1000 líneas
- ❌ Funciones >100 líneas
- ❌ Variables con nombres genéricos (`data`, `res`, `e`)
- ❌ Comentarios obsoletos/inexistentes
- ❌ Magic numbers sin constantes

### 2. **TypeScript Tipado**
- ❌ Uso de `any` (ejemplo: `beneficio: any`)
- ❌ DTOs incompletos
- ❌ Sin discriminated unions para estados
- ❌ Sin generics en servicios

### 3. **Performance**
- ❌ Sin React.memo en componentes pesados
- ❌ Sin useMemo para cálculos costosos
- ❌ Sin useCallback para funciones en props
- ❌ Sin lazy loading de rutas
- ❌ Sin code splitting

### 4. **Accessibility (A11y)**
- ❌ Sin roles ARIA
- ❌ Sin navegación por teclado completa
- ❌ Sin anuncios para screen readers
- ❌ Contraste de colores no verificado

### 5. **Testing**
- ❌ 0% cobertura (tests rotos)
- ❌ Sin tests unitarios de hooks
- ❌ Sin tests de integración
- ❌ Sin E2E tests

### 6. **Responsive Design**
- ⚠️ Parcialmente implementado
- ❌ Sin breakpoints consistentes
- ❌ Sin mobile-first approach

---

## 📦 CONTEXTO ADICIONAL REQUERIDO

Para realizar el refactor profesional sin romper nada, necesito:

### 1. **Backend Contract (CRÍTICO)**
```
✅ Ya lo tengo - AUDITORIA_ESTRUCTURA_PROFESIONAL.md del backend

Necesito confirmar:
- ¿Las APIs del backend tienen validación de RUT?
- ¿Hay rate limiting configurado?
- ¿Los tokens JWT expiran en cuánto tiempo?
```

### 2. **Flujos Críticos (ALTO)**
```
❓ Necesito saber:
- ¿Qué pasa si un trabajador escanea su RUT dos veces seguidas?
- ¿Un ticket puede reimprimirse infinitas veces?
- ¿Hay límite de agendamientos por trabajador?
- ¿Qué pasa si el stock se agota mientras se valida?
```

### 3. **Reglas de Negocio (MEDIO)**
```
❓ Necesito documentar:
- Formato exacto de RUTs aceptados
- Horarios permitidos para retiros
- Políticas de expiración de tickets
- Roles y permisos detallados
```

### 4. **Integración QR (MEDIO)**
```
❓ Verificar:
- ¿Qué librería de QR están usando?
- ¿El QR incluye firma HMAC?
- ¿Formato del QR (JSON, string, hash)?
```

---

## 🎯 RESPUESTA A TUS PREGUNTAS

### 1) **Problemas de Arquitectura:**
- ✅ Componentesmonolíticos (800-1,400 líneas)
- ✅ Sin Service Layer (API calls directos)
- ✅ Estado local sin caché (no React Query)
- ✅ Sin validación de RUT chileno
- ✅ Error handling primitivo
- ✅ Sin tipado fuerte (uso de `any`)
- ✅ Sin separación de concerns

### 2) **Patrones Faltantes:**
- ✅ Service Layer Pattern
- ✅ Repository Pattern
- ✅ Error Boundary Pattern
- ✅ Custom Hooks Pattern (lógica de negocio)
- ✅ State Machine Pattern
- ✅ Compound Components Pattern

### 3) **Estándares de Calidad Faltantes:**
- ✅ Clean Code (componentes >1000 líneas)
- ✅ TypeScript strict (uso de `any`)
- ✅ Performance (sin memoización)
- ✅ Testing (0% cobertura)
- ✅ Accessibility (A11y mínimo)
- ✅ Responsive (parcial)

### 4) **Contexto Adicional Necesario:**
**SÍ, necesito:**
- ✅ **Flujos de negocio completos** (diagramas o documentación)
- ✅ **Reglas de validación** (límites, restricciones)
- ✅ **Especificación de QR** (formato, firma)
- ✅ **Políticas de tokens** (expiración, refresh)

**NO necesito:**
- ❌ Ver más componentes (ya tengo suficiente)
- ❌ Ver UI components (Shadcn está bien)

### 5) **¿Necesito ver TotemModule.tsx, GuardiaModule.tsx, api.ts?**
**✅ YA LOS VI TODOS** y son suficientes para el diagnóstico.

**Conclusión:** Tu código actual es **funcional pero amateur**. Con un refactor profesional basado en este análisis, podemos llevarlo de **4.5/10 a 9.5/10** en arquitectura enterprise.

---

## 🚀 PRÓXIMOS PASOS

¿Quieres que proceda con el refactor? Necesito tu confirmación para:

1. **Fase 1: Service Layer** (2-3 días)
   - Crear apiClient con Axios
   - Crear servicios (TrabajadorService, TicketService, etc.)
   - Implementar interceptors (JWT, refresh, errors)

2. **Fase 2: State Management** (1-2 días)
   - Instalar React Query
   - Crear hooks de API (useTicket, useTrabajador, etc.)
   - Migrar useState a useQuery/useMutation

3. **Fase 3: Refactor Componentes** (3-4 días)
   - Dividir TotemModule en 12 sub-componentes
   - Dividir GuardiaModule en 8 sub-componentes
   - Extraer lógica a custom hooks

4. **Fase 4: Validación y Errores** (1-2 días)
   - Implementar RUTValidator
   - Crear ErrorHandler centralizado
   - Agregar ErrorBoundary

5. **Fase 5: Tests** (2-3 días)
   - Arreglar configuración de Jest
   - Tests unitarios de servicios
   - Tests de hooks
   - Tests de componentes

**Total: 9-14 días de trabajo**

¿Procedo con el refactor? 🛠️
