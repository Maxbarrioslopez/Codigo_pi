/**
 * Capa de servicios centralizada para consumir la API DRF.
 * Incluye stub de autenticación con token en memoria/localStorage.
 * TODO futuro: refresh tokens, manejo 401, cola de reintentos.
 */

// ===================== Tipos de datos (interfaces) =====================
export interface TrabajadorDTO { id: number; rut: string; nombre: string; beneficio_disponible: any; }
export interface TicketEventoDTO { tipo: string; timestamp: string; metadata: any; }
export interface TicketDTO {
    id: number; uuid: string; trabajador: TrabajadorDTO; qr_image: string | null; data: any; created_at: string;
    estado: string; ttl_expira_at: string | null; ciclo: number | null; sucursal: number | null; eventos: TicketEventoDTO[];
}
export interface CicloDTO { id: number; fecha_inicio: string; fecha_fin: string; activo: boolean; dias_restantes: number; }
export interface AgendamientoDTO { id: number; trabajador: number; ciclo: number; fecha_retiro: string; estado: string; created_at: string; }
export interface IncidenciaDTO { id: number; codigo: string; trabajador: number | null; tipo: string; descripcion: string; estado: string; creada_por: string; created_at: string; resolved_at: string | null; metadata: any; }
export interface ParametroOperativoDTO { id: number; clave: string; valor: string; descripcion: string; updated_at: string; }
export interface BeneficioResponse { beneficio: TrabajadorDTO; }
export interface MetricasGuardiaDTO { entregados: number; pendientes: number; incidencias_pendientes: number; }
// Stock
export interface StockResumenDTO { disponible: number; entregadas_hoy: number; reservadas: number; total_mes: number; por_tipo: { estandar: number; premium: number }; }
export interface StockMovimientoDTO { fecha: string; hora: string; tipo_caja: string; accion: 'Agregado' | 'Retirado'; cantidad: number; motivo: string; usuario: string; }

export interface ApiError {
    status: number;
    detail: string;
}

// Prefijo/base para la API. Usar VITE_API_URL si apunta a host completo o VITE_API_PREFIX si es relativo (e.g. "/api").
const API_BASE =
    (import.meta as any)?.env?.VITE_API_URL?.replace(/\/$/, '') ||
    (import.meta as any)?.env?.VITE_API_PREFIX?.replace(/\/$/, '') ||
    '/api';

let authToken: string | null = null; // token en memoria

export function setAuthToken(token: string | null) {
    authToken = token;
    if (token) {
        try { localStorage.setItem('authToken', token); } catch { /* ignore */ }
    } else {
        try { localStorage.removeItem('authToken'); } catch { /* ignore */ }
    }
}

function getStoredToken(): string | null {
    if (authToken) return authToken;
    try { return localStorage.getItem('authToken'); } catch { return null; }
}

async function refreshAccessToken(): Promise<string | null> {
    try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return null;
        const resp = await fetch(`${API_BASE}/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken })
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        setAuthToken(data.access);
        return data.access;
    } catch {
        return null;
    }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    // Normalizar path para evitar duplicar "/api" si viene incluido por error.
    const normalizedPath = path.startsWith('/api/') ? path.slice(4) : path;
    const token = getStoredToken();
    const resp = await fetch(`${API_BASE}${normalizedPath}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {})
        },
        ...options,
    });
    if (!resp.ok) {
        // Auto-refresh en caso de 401 Unauthorized
        if (resp.status === 401 && !path.includes('/auth/')) {
            const newToken = await refreshAccessToken();
            if (newToken) {
                // Reintentar request con nuevo token
                return request<T>(path, options);
            }
        }
        let detail = 'Error desconocido';
        try { const js = await resp.json(); detail = js.detail || JSON.stringify(js); } catch { }
        throw { status: resp.status, detail } as ApiError;
    }
    if (resp.status === 204) return {} as T;
    return resp.json() as Promise<T>;
}

// Beneficio
export async function getBeneficio(rut: string) {
    return request<BeneficioResponse>(`/beneficios/${rut}/`);
}

// Tickets
export async function crearTicket(trabajador_rut: string, data: Record<string, any>) {
    return request<TicketDTO>('/tickets/', { method: 'POST', body: JSON.stringify({ trabajador_rut, data }) });
}
export async function estadoTicket(uuid: string) { return request<TicketDTO>(`/tickets/${uuid}/estado/`); }
export async function validarTicketGuardia(uuid: string, codigo_caja?: string) {
    return request<TicketDTO>(`/tickets/${uuid}/validar_guardia/`, { method: 'POST', body: JSON.stringify({ codigo_caja }) });
}
export async function anularTicket(uuid: string, motivo?: string) {
    return request<TicketDTO>(`/tickets/${uuid}/anular/`, { method: 'POST', body: JSON.stringify({ motivo }) });
}
export async function reimprimirTicket(uuid: string) {
    return request<TicketDTO>(`/tickets/${uuid}/reimprimir/`, { method: 'POST' });
}

// Listar tickets (RRHH) opcional filtro por rut
export async function listarTickets(rut?: string) {
    const q = rut ? `?rut=${encodeURIComponent(rut)}` : '';
    return request<TicketDTO[]>(`/tickets/listar/${q}`);
}

// Agendamientos
export async function crearAgendamiento(trabajador_rut: string, fecha_retiro: string) {
    return request<AgendamientoDTO>('/agendamientos/', { method: 'POST', body: JSON.stringify({ trabajador_rut, fecha_retiro }) });
}
export async function listarAgendamientos(rut: string) {
    return request<AgendamientoDTO[]>(`/agendamientos/${rut}/`);
}
// Alias explícito para semántica RRHH
export const listarAgendamientosPorRut = listarAgendamientos;

// Incidencias
export async function crearIncidencia(payload: { trabajador_rut?: string; tipo: string; descripcion?: string; origen?: string }) {
    return request<IncidenciaDTO>('/incidencias/', { method: 'POST', body: JSON.stringify(payload) });
}
export async function obtenerIncidencia(codigo: string) { return request<IncidenciaDTO>(`/incidencias/${codigo}/`); }
export async function listarIncidencias(estado?: string) {
    const q = estado ? `?estado=${encodeURIComponent(estado)}` : '';
    return request<IncidenciaDTO[]>(`/incidencias/listar/${q}`);
}
export async function resolverIncidencia(codigo: string, resolucion: string) {
    return request<IncidenciaDTO>(`/incidencias/${codigo}/resolver/`, { method: 'POST', body: JSON.stringify({ resolucion }) });
}
export async function cambiarEstadoIncidencia(codigo: string, estado: 'pendiente' | 'en_proceso' | 'resuelta') {
    return request<IncidenciaDTO>(`/incidencias/${codigo}/estado/`, { method: 'PATCH', body: JSON.stringify({ estado }) });
}

// Ciclo y métricas
export async function cicloActivo() { return request<CicloDTO>('/ciclo/activo/'); }
export async function metricasGuardia() { return request<MetricasGuardiaDTO>('/metricas/guardia/'); }
export async function listarParametros() { return request<ParametroOperativoDTO[]>('/parametros/'); }
export async function upsertParametro(clave: string, valor: string, descripcion?: string) {
    return request<ParametroOperativoDTO>('/parametros/', { method: 'POST', body: JSON.stringify({ clave, valor, descripcion }) });
}

// Reportes RRHH
export interface RetirosDiaDTO { fecha: string; entregados: number; pendientes: number; expirados: number; }
export async function reportesRetirosPorDia(dias: number = 7) {
    return request<RetirosDiaDTO[]>(`/reportes/retiros_por_dia/?dias=${dias}`);
}

// Stock endpoints (si backend los soporta)
export async function stockResumen() { return request<StockResumenDTO>('/stock/resumen/'); }
export async function stockMovimientos() { return request<StockMovimientoDTO[]>('/stock/movimientos/'); }
export async function registrarMovimientoStock(accion: 'agregar' | 'retirar', tipo_caja: 'Estándar' | 'Premium', cantidad: number, motivo: string) {
    return request<any>('/stock/movimiento/', { method: 'POST', body: JSON.stringify({ accion, tipo_caja, cantidad, motivo }) });
}

export const api = {
    getBeneficio,
    crearTicket,
    estadoTicket,
    validarTicketGuardia,
    anularTicket,
    reimprimirTicket,
    listarTickets,
    crearAgendamiento,
    listarAgendamientos,
    listarAgendamientosPorRut,
    crearIncidencia,
    obtenerIncidencia,
    listarIncidencias,
    resolverIncidencia,
    cambiarEstadoIncidencia,
    cicloActivo,
    metricasGuardia,
    listarParametros,
    upsertParametro,
    reportesRetirosPorDia,
    stockResumen,
    stockMovimientos,
    registrarMovimientoStock,
    setAuthToken,
};
