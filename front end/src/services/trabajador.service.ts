/**
 * Servicio de Trabajadores
 * Maneja operaciones relacionadas con trabajadores y sus beneficios
 */

import { apiClient } from './apiClient';
import { BeneficioResponse, TrabajadorDTO } from '@/types';
import { ErrorHandler } from '@/utils/errors/errorHandler';

/**
 * Servicio Singleton para gestión de trabajadores
 */
export class TrabajadorService {
    private static instance: TrabajadorService;

    private constructor() { }

    static getInstance(): TrabajadorService {
        if (!TrabajadorService.instance) {
            TrabajadorService.instance = new TrabajadorService();
        }
        return TrabajadorService.instance;
    }

    /**
     * Obtener beneficio disponible para un trabajador
     * @param rut - RUT del trabajador (formato: 12345678-9)
     * @param cicloId - ID del ciclo (opcional) para obtener beneficio específico de ese ciclo
     * @returns Información del beneficio y trabajador
     */
    async getBeneficio(rut: string, cicloId?: number): Promise<BeneficioResponse> {
        try {
            const url = cicloId
                ? `beneficios/${rut}/?ciclo_id=${cicloId}`
                : `beneficios/${rut}/`;
            const { data } = await apiClient.get<BeneficioResponse>(url);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'TrabajadorService.getBeneficio', false);
        }
    }

    /**
     * Obtener todos los trabajadores (módulo RRHH)
     * @param filters - Filtros opcionales (nombre, rut, etc.)
     */
    async getAll(filters?: Record<string, string>): Promise<TrabajadorDTO[]> {
        try {
            const params = new URLSearchParams(filters);
            const { data } = await apiClient.get<TrabajadorDTO[]>(
                `trabajadores/?${params.toString()}`
            );
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'TrabajadorService.getAll', false);
        }
    }

    /**
     * Obtener trabajador por RUT
     * @param rut - RUT del trabajador
     */
    async getByRUT(rut: string): Promise<TrabajadorDTO> {
        try {
            const { data } = await apiClient.get<TrabajadorDTO>(`trabajadores/${rut}/`);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'TrabajadorService.getByRUT', false);
        }
    }

    /**
     * Bloquear trabajador (módulo RRHH)
     * @param rut - RUT del trabajador
     * @param motivo - Motivo del bloqueo (opcional)
     */
    async bloquear(rut: string, motivo: string = 'Desactivado desde módulo RRHH'): Promise<void> {
        try {
            await apiClient.post(`trabajadores/${rut}/bloquear/`, { motivo });
        } catch (error) {
            throw ErrorHandler.handle(error, 'TrabajadorService.bloquear', false);
        }
    }

    /**
     * Desbloquear trabajador (módulo RRHH)
     * @param rut - RUT del trabajador
     */
    async desbloquear(rut: string): Promise<void> {
        try {
            await apiClient.post(`trabajadores/${rut}/desbloquear/`);
        } catch (error) {
            throw ErrorHandler.handle(error, 'TrabajadorService.desbloquear', false);
        }
    }

    /**
     * Crear nuevo trabajador
     * @param data - Datos del trabajador a crear
     */
    async create(data: Partial<TrabajadorDTO>): Promise<TrabajadorDTO> {
        try {
            const { data: result } = await apiClient.post<TrabajadorDTO>('trabajadores/', data);
            return result;
        } catch (error) {
            throw ErrorHandler.handle(error, 'TrabajadorService.create', false);
        }
    }

    /**
     * Actualizar trabajador existente
     * @param rut - RUT del trabajador
     * @param data - Datos a actualizar
     */
    async update(rut: string, data: Partial<TrabajadorDTO>): Promise<TrabajadorDTO> {
        try {
            const { data: result } = await apiClient.put<TrabajadorDTO>(`trabajadores/${rut}/`, data);
            return result;
        } catch (error) {
            throw ErrorHandler.handle(error, 'TrabajadorService.update', false);
        }
    }

    /**
     * Eliminar trabajador
     * @param rut - RUT del trabajador
     * @param hard - Si es true, elimina permanentemente. Si es false (default), solo desactiva (soft delete)
     */
    async delete(rut: string, hard: boolean = false): Promise<void> {
        try {
            const url = hard ? `trabajadores/${rut}/?hard=true` : `trabajadores/${rut}/`;
            await apiClient.delete(url);
        } catch (error) {
            throw ErrorHandler.handle(error, 'TrabajadorService.delete', false);
        }
    }

    /**
     * Actualizar beneficio de trabajador para un ciclo específico
     * @param rut - RUT del trabajador
     * @param beneficio - Datos del beneficio a actualizar
     */
    async actualizarBeneficio(rut: string, beneficio: any): Promise<TrabajadorDTO> {
        try {
            const { data } = await apiClient.post<TrabajadorDTO>(
                `trabajadores/${rut}/actualizar_beneficio/`,
                { beneficio_disponible: beneficio }
            );
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'TrabajadorService.actualizarBeneficio', false);
        }
    }

    /**
     * Obtener timeline del trabajador
     * @param rut - RUT del trabajador
     */
    async getTimeline(rut: string): Promise<any[]> {
        try {
            const { data } = await apiClient.get<any[]>(`trabajadores/${rut}/timeline/`);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'TrabajadorService.getTimeline', false);
        }
    }
}

// Exportar instancia singleton
export const trabajadorService = TrabajadorService.getInstance();
