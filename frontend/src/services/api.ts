/**
 * Capa de servicios centralizada para consumir la API DRF.
 * DEPRECADO: Este archivo está siendo migrado a usar apiClient (Axios).
 * Las funciones aquí delegan a apiClient para mantener compatibilidad.
 * Modo mock solo se activa explícitamente, NUNCA por errores de red.
 */

import { apiClient } from './apiClient';
import { mockData } from './mockData';

// ===================== Tipos de datos (interfaces) =====================
export interface TrabajadorDTO { id: number; rut: string; nombre: string; beneficio_disponible: any; }
export interface TicketEventoDTO { tipo: string; timestamp: string; metadata: any; }
export interface TicketDTO {
    id: number; uuid: string; trabajador: TrabajadorDTO; qr_image: string | null; data: any; created_at: string;
    estado: string; ttl_expira_at: string | null; ciclo: number | null; sucursal: number | null; eventos: TicketEventoDTO[];
}
export interface CicloDTO { id: number; fecha_inicio: string; fecha_fin: string; activo: boolean; dias_restantes: number; }
export interface AgendamientoDTO { id: number; trabajador: number; ciclo: number; fecha_retiro: string; estado: string; created_at: string; }
export interface IncidenciaDTO {
    id: number;
    codigo: string;
    trabajador: number | null;
    trabajador_rut?: string | null;
    trabajador_nombre?: string | null;
    tipo: string;
    descripcion: string;
    estado: string;
    creada_por: string;
    created_at: string;
    resolved_at: string | null;
    resolucion?: string | null;
    metadata: any;
}
export interface ParametroOperativoDTO { id: number; clave: string; valor: string; descripcion: string; updated_at: string; }
export interface BeneficioResponse { beneficio: TrabajadorDTO; }
export interface MetricasGuardiaDTO { 
    entregados: number; 
    pendientes: number; 
    incidencias_pendientes: number;
    tickets_pendientes?: number;
    entregas_hoy?: number;
    stock_disponible?: number;
    tasa_eficiencia?: number;
    tickets_generados?: number;
    tickets_entregados?: number;
    tickets_expirados?: number;
    ciclo_actual?: {
        fecha_inicio: string;
        fecha_fin: string;
        dias_restantes?: number;
    };
}
// Stock
export interface StockResumenDTO { disponible: number; entregadas_hoy: number; reservadas: number; total_mes: number; por_tipo: { estandar: number; premium: number }; }
export interface StockMovimientoDTO { fecha: string; hora: string; tipo_caja: string; accion: 'Agregado' | 'Retirado'; cantidad: number; motivo: string; usuario: string; }

export interface ApiError {
    status: number;
    detail: string;
}

// Detectar si estamos en modo mock (solo por flag explícito en dev)
function isMockMode(): boolean {
    return import.meta.env.VITE_MOCK_MODE === 'true' || localStorage.getItem('explicit_mock_mode') === 'true';
}

/**
 * Wrapper interno que delega a apiClient (Axios) en vez de fetch
 */
async function request<T>(path: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', body?: any): Promise<T> {
    if (isMockMode()) {
        await new Promise(resolve => setTimeout(resolve, 300));
        throw { status: 503, detail: 'Mock mode active - use mock functions' } as ApiError;
    }

    try {
        let response;

        switch (method) {
            case 'POST':
                response = await apiClient.post<T>(path, body);
                break;
            case 'PATCH':
                response = await apiClient.patch<T>(path, body);
                break;
            case 'DELETE':
                response = await apiClient.delete<T>(path);
                break;
            default:
                response = await apiClient.get<T>(path);
        }

        return response.data;
    } catch (error: any) {
        // Transformar error de Axios a formato ApiError
        const status = error.response?.status || 500;
        const detail = error.response?.data?.detail || error.message || 'Error desconocido';
        throw { status, detail } as ApiError;
    }
}

// Beneficio
export async function getBeneficio(rut: string) {
    if (isMockMode()) return mockData.getBeneficio(rut);
    return request<BeneficioResponse>(`/beneficios/${rut}/`, 'GET');
}

// Tickets
export async function crearTicket(trabajador_rut: string, data: Record<string, any>) {
    if (isMockMode()) return mockData.crearTicket(trabajador_rut);
    return request<TicketDTO>('/tickets/', 'POST', { trabajador_rut, data });
}

export async function estadoTicket(uuid: string) {
    if (isMockMode()) return mockData.estadoTicket(uuid);
    return request<TicketDTO>(`/tickets/${uuid}/estado/`, 'GET');
}

export async function validarTicketGuardia(uuid: string, codigo_caja?: string) {
    if (isMockMode()) return mockData.validarTicketGuardia(uuid);
    return request<TicketDTO>(`/tickets/${uuid}/validar_guardia/`, 'POST', { codigo_caja });
}

export async function anularTicket(uuid: string, motivo?: string) {
    if (isMockMode()) return mockData.estadoTicket(uuid);
    return request<TicketDTO>(`/tickets/${uuid}/anular/`, 'POST', { motivo });
}

export async function reimprimirTicket(uuid: string) {
    if (isMockMode()) return mockData.estadoTicket(uuid);
    return request<TicketDTO>(`/tickets/${uuid}/reimprimir/`, 'POST');
}

// Listar tickets (RRHH) opcional filtro por rut
export async function listarTickets(rut?: string) {
    if (isMockMode()) return mockData.listarTickets(rut);
    const q = rut ? `?rut=${encodeURIComponent(rut)}` : '';
    return request<TicketDTO[]>(`/tickets/listar/${q}`, 'GET');
}

// Agendamientos
export async function crearAgendamiento(trabajador_rut: string, fecha_retiro: string) {
    if (isMockMode()) return mockData.crearAgendamiento(trabajador_rut, fecha_retiro);
    return request<AgendamientoDTO>('/agendamientos/', 'POST', { trabajador_rut, fecha_retiro });
}

export async function listarAgendamientos(rut: string) {
    if (isMockMode()) return mockData.listarAgendamientos(rut);
    return request<AgendamientoDTO[]>(`/agendamientos/${rut}/`, 'GET');
}

// Alias explícito para semántica RRHH
export const listarAgendamientosPorRut = listarAgendamientos;

// Incidencias
export async function crearIncidencia(payload: { trabajador_rut?: string; tipo: string; descripcion?: string; origen?: string }) {
    if (isMockMode()) return mockData.crearIncidencia(payload);
    return request<IncidenciaDTO>('/incidencias/', 'POST', payload);
}

export async function obtenerIncidencia(codigo: string) {
    if (isMockMode()) return mockData.obtenerIncidencia(codigo);
    return request<IncidenciaDTO>(`/incidencias/${codigo}/`, 'GET');
}
export async function listarIncidencias(estado?: string) {
    if (isMockMode()) return mockData.listarIncidencias(estado);
    const q = estado ? `?estado=${encodeURIComponent(estado)}` : '';
    return request<IncidenciaDTO[]>(`/incidencias/listar/${q}`, 'GET');
}

export async function resolverIncidencia(codigo: string, resolucion: string) {
    if (isMockMode()) return mockData.resolverIncidencia(codigo, resolucion);
    return request<IncidenciaDTO>(`/incidencias/${codigo}/resolver/`, 'POST', { resolucion });
}

export async function cambiarEstadoIncidencia(codigo: string, estado: 'pendiente' | 'en_proceso' | 'resuelta') {
    if (isMockMode()) return mockData.cambiarEstadoIncidencia(codigo, estado);
    return request<IncidenciaDTO>(`/incidencias/${codigo}/estado/`, 'PATCH', { estado });
}

// Ciclo y métricas
export async function cicloActivo() {
    if (isMockMode()) return mockData.cicloActivo();
    return request<CicloDTO>('/ciclo/activo/', 'GET');
}

export async function metricasGuardia() {
    if (isMockMode()) return mockData.metricasGuardia();
    return request<MetricasGuardiaDTO>('/metricas/guardia/', 'GET');
}

export async function listarParametros() {
    if (isMockMode()) return mockData.listarParametros();
    return request<ParametroOperativoDTO[]>('/parametros/', 'GET');
}

export async function upsertParametro(clave: string, valor: string, descripcion?: string) {
    if (isMockMode()) return mockData.upsertParametro(clave, valor, descripcion);
    return request<ParametroOperativoDTO>('/parametros/', 'POST', { clave, valor, descripcion });
}

// Reportes RRHH
export interface RetirosDiaDTO { fecha: string; entregados: number; pendientes: number; expirados: number; }

export async function reportesRetirosPorDia(dias: number = 7) {
    if (isMockMode()) return mockData.reportesRetirosPorDia(dias);
    return request<RetirosDiaDTO[]>(`/reportes/retiros_por_dia/?dias=${dias}`, 'GET');
}

// Stock endpoints
export async function stockResumen() {
    if (isMockMode()) return mockData.stockResumen();
    return request<StockResumenDTO>('/stock/resumen/', 'GET');
}

export async function stockMovimientos() {
    if (isMockMode()) return mockData.stockMovimientos();
    return request<StockMovimientoDTO[]>('/stock/movimientos/', 'GET');
}

export async function registrarMovimientoStock(accion: 'agregar' | 'retirar', tipo_caja: 'Estándar' | 'Premium', cantidad: number, motivo: string) {
    if (isMockMode()) return { success: true };
    return request<any>('/stock/movimiento/', 'POST', { accion, tipo_caja, cantidad, motivo });
}

// Exportar API object para compatibilidad con código existente
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
};
