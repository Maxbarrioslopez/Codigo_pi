/**
 * Servicio de Reportes RRHH
 * Maneja reportes, estadísticas y alertas del sistema
 */

import { apiClient } from './apiClient';
import { ErrorHandler } from '@/utils/errors/errorHandler';

export interface RetiroPorDia {
    fecha: string;
    cantidad: number;
    monto_total: number;
    beneficios: {
        tipo: string;
        cantidad: number;
    }[];
}

export interface TrabajadorActivo {
    id: number;
    rut: string;
    nombre: string;
    seccion: string;
    contrato: string;
    sucursal: string;
    beneficio_disponible: any;
    ultimo_retiro: string | null;
}

export interface ReporteIncidencia {
    id: number;
    codigo: string;
    tipo: string;
    estado: string;
    trabajador_rut: string;
    trabajador_nombre: string;
    fecha_creacion: string;
    fecha_resolucion: string | null;
}

export interface ReporteStock {
    total_cajas: number;
    stock_bajo: number;
    por_tipo: {
        tipo: string;
        cantidad: number;
        minimo_alerta: number;
    }[];
}

export interface AlertaStock {
    tipo: string;
    cantidad_actual: number;
    minimo_alerta: number;
    estado: 'critico' | 'bajo' | 'normal';
}

export interface TiempoPromedioRetiro {
    periodo: string;
    promedio_minutos: number;
    minimo: number;
    maximo: number;
    total_retiros: number;
}

/**
 * Servicio Singleton para reportes
 */
export class ReportService {
    private static instance: ReportService;

    private constructor() { }

    static getInstance(): ReportService {
        if (!ReportService.instance) {
            ReportService.instance = new ReportService();
        }
        return ReportService.instance;
    }

    /**
     * Obtener retiros por día
     * @param fecha_inicio - Fecha inicio (YYYY-MM-DD)
     * @param fecha_fin - Fecha fin (YYYY-MM-DD)
     */
    async retirosPorDia(fecha_inicio?: string, fecha_fin?: string): Promise<RetiroPorDia[]> {
        try {
            const params = new URLSearchParams();
            if (fecha_inicio) params.append('fecha_inicio', fecha_inicio);
            if (fecha_fin) params.append('fecha_fin', fecha_fin);
            const query = params.toString() ? `?${params.toString()}` : '';
            const { data } = await apiClient.get<RetiroPorDia[]>(`reportes/retiros-por-dia/${query}`);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'ReportService.retirosPorDia', false);
        }
    }

    /**
     * Obtener trabajadores activos
     */
    async trabajadoresActivos(sucursal?: string): Promise<TrabajadorActivo[]> {
        try {
            const params = sucursal ? `?sucursal=${sucursal}` : '';
            const { data } = await apiClient.get<TrabajadorActivo[]>(`reportes/trabajadores-activos/${params}`);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'ReportService.trabajadoresActivos', false);
        }
    }

    /**
     * Obtener reporte de incidencias
     */
    async reporteIncidencias(estado?: string): Promise<ReporteIncidencia[]> {
        try {
            const params = estado ? `?estado=${estado}` : '';
            const { data } = await apiClient.get<ReporteIncidencia[]>(`reportes/incidencias/${params}`);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'ReportService.reporteIncidencias', false);
        }
    }

    /**
     * Obtener reporte de stock
     */
    async reporteStock(): Promise<ReporteStock> {
        try {
            const { data } = await apiClient.get<ReporteStock>('reportes/stock/');
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'ReportService.reporteStock', false);
        }
    }

    /**
     * Obtener alertas de stock bajo
     */
    async alertasStockBajo(): Promise<AlertaStock[]> {
        try {
            const { data } = await apiClient.get<AlertaStock[]>('alertas/stock/');
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'ReportService.alertasStockBajo', false);
        }
    }

    /**
     * Obtener tiempo promedio de retiro
     */
    async tiempoPromedioRetiro(periodo?: 'dia' | 'semana' | 'mes'): Promise<TiempoPromedioRetiro> {
        try {
            const params = periodo ? `?periodo=${periodo}` : '';
            const { data } = await apiClient.get<TiempoPromedioRetiro>(`reportes/tiempo-promedio-retiro/${params}`);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'ReportService.tiempoPromedioRetiro', false);
        }
    }

    /**
     * Exportar tickets a CSV
     */
    async exportarTicketsCSV(fecha_inicio?: string, fecha_fin?: string): Promise<Blob> {
        try {
            const params = new URLSearchParams();
            if (fecha_inicio) params.append('fecha_inicio', fecha_inicio);
            if (fecha_fin) params.append('fecha_fin', fecha_fin);
            const query = params.toString() ? `?${params.toString()}` : '';
            const response = await apiClient.get(`exportar/tickets/${query}`, {
                responseType: 'blob'
            });
            return response.data as Blob;
        } catch (error) {
            throw ErrorHandler.handle(error, 'ReportService.exportarTicketsCSV', false);
        }
    }

    /**
     * Exportar tickets a Excel
     */
    async exportarTicketsExcel(fecha_inicio?: string, fecha_fin?: string): Promise<Blob> {
        try {
            const params = new URLSearchParams();
            if (fecha_inicio) params.append('fecha_inicio', fecha_inicio);
            if (fecha_fin) params.append('fecha_fin', fecha_fin);
            const query = params.toString() ? `?${params.toString()}` : '';
            const response = await apiClient.get(`exportar/tickets/excel/${query}`, {
                responseType: 'blob'
            });
            return response.data as Blob;
        } catch (error) {
            throw ErrorHandler.handle(error, 'ReportService.exportarTicketsExcel', false);
        }
    }
}

// Exportar instancia singleton
export const reportService = ReportService.getInstance();
