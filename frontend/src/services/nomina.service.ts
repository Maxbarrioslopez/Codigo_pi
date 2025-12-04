/**
 * Servicio de Nómina Cíclica
 * Maneja operaciones relacionadas con nómina y distribución de beneficios
 */

import { apiClient } from './apiClient';
import { ErrorHandler } from '@/utils/errors/errorHandler';

export interface NominaPreviewRequest {
    ciclo_id: number;
    trabajadores_ruts?: string[];
}

export interface NominaPreviewResponse {
    ciclo_id: number;
    total_trabajadores: number;
    total_beneficios: number;
    detalles: Array<{
        rut: string;
        nombre: string;
        beneficio_asignado: number;
        estado: string;
    }>;
}

export interface NominaConfirmRequest {
    ciclo_id: number;
    confirmado_por: string;
}

export interface NominaHistorial {
    id: number;
    ciclo_id: number;
    fecha: string;
    total_beneficios: number;
    total_trabajadores: number;
    estado: string;
    confirmado_por: string;
}

/**
 * Servicio Singleton para gestión de nómina
 */
export class NominaService {
    private static instance: NominaService;

    private constructor() { }

    static getInstance(): NominaService {
        if (!NominaService.instance) {
            NominaService.instance = new NominaService();
        }
        return NominaService.instance;
    }

    /**
     * Obtener preview de nómina antes de confirmar
     * @param request - Datos para el preview
     */
    async preview(request: NominaPreviewRequest): Promise<NominaPreviewResponse> {
        try {
            const { data } = await apiClient.post<NominaPreviewResponse>(
                '/nomina/preview/',
                request
            );
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'NominaService.preview', false);
        }
    }

    /**
     * Confirmar nómina y aplicar cambios
     * @param request - Datos de confirmación
     */
    async confirmar(request: NominaConfirmRequest): Promise<NominaHistorial> {
        try {
            const { data } = await apiClient.post<NominaHistorial>(
                '/nomina/confirmar/',
                request
            );
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'NominaService.confirmar', false);
        }
    }

    /**
     * Vista previa basada en archivo (CSV/XLSX)
     * Envía FormData con archivo y opcionalmente ciclo_id
     */
    async previewFile(file: File, ciclo_id?: number): Promise<any> {
        try {
            const form = new FormData();
            // Backend espera el campo 'archivo'
            form.append('archivo', file);
            if (typeof ciclo_id === 'number') form.append('ciclo_id', String(ciclo_id));
            const { data } = await apiClient.post<any>('/nomina/preview/', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'NominaService.previewFile', false);
        }
    }

    /**
     * Confirmación basada en archivo (CSV/XLSX)
     * Envía FormData con archivo y opcionalmente ciclo_id
     */
    async confirmarFile(file: File, ciclo_id?: number): Promise<any> {
        try {
            const form = new FormData();
            // Backend espera el campo 'archivo'
            form.append('archivo', file);
            if (typeof ciclo_id === 'number') form.append('ciclo_id', String(ciclo_id));
            const { data } = await apiClient.post<any>('/nomina/confirmar/', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'NominaService.confirmarFile', false);
        }
    }

    /**
     * Obtener historial de nóminas procesadas
     * @param filtros - Filtros opcionales
     */
    async getHistorial(filtros?: Record<string, string>): Promise<NominaHistorial[]> {
        try {
            const params = new URLSearchParams(filtros);
            const { data } = await apiClient.get<NominaHistorial[]>(
                `/nomina/historial/?${params.toString()}`
            );
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'NominaService.getHistorial', false);
        }
    }
}

// Exportar instancia singleton
export const nominaService = NominaService.getInstance();
