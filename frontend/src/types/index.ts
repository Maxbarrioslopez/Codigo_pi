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
    // Campos opcionales usados por formularios y listados
    contrato?: string;
    sucursal?: string;
    seccion?: string;
    estado?: string;
    beneficio?: string;
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
    // Campos adicionales que algunas vistas consumen
    beneficio?: {
        tipo?: string;
        tipo_contrato?: string;
        sucursal?: string;
    };
    mensaje?: string;
}

// ==================== DTOs de Tipos de Beneficio ====================
export interface TipoBeneficioDTO {
    id: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
    tipos_contrato: string[];
    requiere_validacion_guardia: boolean;
    created_at: string;
}

// ==================== DTOs de Ciclos ====================
export interface CicloDTO {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    activo: boolean;
    beneficios_activos: TipoBeneficioDTO[];
    beneficios_activos_ids?: number[];
    descripcion: string;
    dias_restantes: number;
    duracion_dias: number;
    progreso_porcentaje: number;
    created_at: string;
    updated_at: string;
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
    trabajador_rut?: string | null;
    trabajador_nombre?: string | null;
    tipo: string;
    descripcion: string;
    estado: 'pendiente' | 'en_proceso' | 'resuelta';
    creada_por: string;
    created_at: string;
    resolved_at: string | null;
    resolucion?: string | null;
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
    // Métricas extendidas opcionales
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
