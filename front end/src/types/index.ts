/**
 * Tipos centralizados para DTOs de la API
 * Sincronizados con el backend Django REST Framework
 */

// ==================== DTOs de Trabajadores ====================
export interface TrabajadorDTO {
    id: number;
    rut: string;
    nombre: string;
    beneficio_disponible: any;
}

export interface BeneficioDTO {
    disponible: boolean;
    tipo_caja: 'Estándar' | 'Premium';
    detalles?: any;
}

export interface BeneficioResponse {
    beneficio: TrabajadorDTO;
}

// ==================== DTOs de Tickets ====================
export interface TicketEventoDTO {
    tipo: string;
    timestamp: string;
    metadata: any;
}

export interface TicketDTO {
    id: number;
    uuid: string;
    trabajador: TrabajadorDTO;
    qr_image: string | null;
    data: any;
    created_at: string;
    estado: 'pendiente' | 'validado' | 'entregado' | 'anulado' | 'expirado';
    ttl_expira_at: string | null;
    ciclo: number | null;
    sucursal: number | null;
    eventos: TicketEventoDTO[];
}

// ==================== DTOs de Ciclos ====================
export interface CicloDTO {
    id: number;
    fecha_inicio: string;
    fecha_fin: string;
    activo: boolean;
    dias_restantes: number;
}

// ==================== DTOs de Agendamientos ====================
export interface AgendamientoDTO {
    id: number;
    trabajador: number;
    ciclo: number;
    fecha_retiro: string;
    estado: 'pendiente' | 'completado' | 'cancelado';
    created_at: string;
}

// ==================== DTOs de Incidencias ====================
export interface IncidenciaDTO {
    id: number;
    codigo: string;
    trabajador: number | null;
    tipo: string;
    descripcion: string;
    estado: 'pendiente' | 'en_proceso' | 'resuelta';
    creada_por: string;
    created_at: string;
    resolved_at: string | null;
    metadata: any;
}

// ==================== DTOs de Parámetros ====================
export interface ParametroOperativoDTO {
    id: number;
    clave: string;
    valor: string;
    descripcion: string;
    updated_at: string;
}

// ==================== DTOs de Métricas ====================
export interface MetricasGuardiaDTO {
    entregados: number;
    pendientes: number;
    incidencias_pendientes: number;
}

export interface RetirosDiaDTO {
    fecha: string;
    entregados: number;
    pendientes: number;
    expirados: number;
}

// ==================== DTOs de Stock ====================
export interface StockResumenDTO {
    disponible: number;
    entregadas_hoy: number;
    reservadas: number;
    total_mes: number;
    por_tipo: {
        estandar: number;
        premium: number;
    };
}

export interface StockMovimientoDTO {
    fecha: string;
    hora: string;
    tipo_caja: 'Estándar' | 'Premium';
    accion: 'Agregado' | 'Retirado';
    cantidad: number;
    motivo: string;
    usuario: string;
}
