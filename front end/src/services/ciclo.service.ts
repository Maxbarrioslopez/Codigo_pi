/**
 * Servicio de Ciclo Bimensual
 * Maneja operaciones relacionadas con ciclos de distribución de beneficios
 */

import { apiClient } from './apiClient';
import { CicloDTO } from '@/types';
import { ErrorHandler } from '@/utils/errors/errorHandler';

/**
 * Servicio Singleton para gestión de ciclos
 */
export class CicloService {
    private static instance: CicloService;

    private constructor() { }

    static getInstance(): CicloService {
        if (!CicloService.instance) {
            CicloService.instance = new CicloService();
        }
        return CicloService.instance;
    }

    /**
     * Listar todos los ciclos
     * @param filters - Filtros opcionales
     */
    async getAll(filters?: Record<string, string>): Promise<CicloDTO[]> {
        try {
            const params = new URLSearchParams(filters);
            const { data } = await apiClient.get<CicloDTO[]>(
                `/ciclos/?${params.toString()}`
            );
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.getAll', false);
        }
    }

    /**
     * Obtener ciclo por ID
     * @param cicloId - ID del ciclo
     */
    async getById(cicloId: number): Promise<CicloDTO> {
        try {
            const { data } = await apiClient.get<CicloDTO>(`/ciclos/${cicloId}/`);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.getById', false);
        }
    }

    /**
     * Crear nuevo ciclo
     * @param data - Datos del ciclo
     */
    async create(data: Partial<CicloDTO>): Promise<CicloDTO> {
        try {
            const { data: result } = await apiClient.post<CicloDTO>('/ciclos/', data);
            return result;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.create', false);
        }
    }

    /**
     * Actualizar ciclo existente
     * @param cicloId - ID del ciclo
     * @param data - Datos a actualizar
     */
    async update(cicloId: number, data: Partial<CicloDTO>): Promise<CicloDTO> {
        try {
            const { data: result } = await apiClient.put<CicloDTO>(`/ciclos/${cicloId}/`, data);
            return result;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.update', false);
        }
    }

    /**
     * Cerrar ciclo
     * @param cicloId - ID del ciclo a cerrar
     */
    async cerrar(cicloId: number): Promise<CicloDTO> {
        try {
            const { data } = await apiClient.post<CicloDTO>(`/ciclos/${cicloId}/cerrar/`, {});
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.cerrar', false);
        }
    }

    /**
     * Obtener estadísticas del ciclo
     * @param cicloId - ID del ciclo
     */
    async getEstadisticas(cicloId: number): Promise<any> {
        try {
            const { data } = await apiClient.get<any>(`/ciclos/${cicloId}/estadisticas/`);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.getEstadisticas', false);
        }
    }
}

// Exportar instancia singleton
export const cicloService = CicloService.getInstance();
