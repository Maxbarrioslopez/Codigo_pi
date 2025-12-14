/**
 * Servicio de Ciclo Bimensual
 * Maneja operaciones relacionadas con ciclos de distribución de beneficios
 */

import { apiClient } from './apiClient';
import { CicloDTO, TipoBeneficioDTO } from '@/types';
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
                `ciclos/?${params.toString()}`
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
            const { data } = await apiClient.get<CicloDTO>(`ciclos/${cicloId}/`);
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
            const { data: result } = await apiClient.post<CicloDTO>('ciclos/', data);
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
            const { data: result } = await apiClient.put<CicloDTO>(`ciclos/${cicloId}/`, data);
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
            const { data } = await apiClient.delete<any>(`ciclos/${cicloId}/`);
            return data.ciclo;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.cerrar', false);
        }
    }

    /**
     * Asignar beneficios masivamente a todos los trabajadores de un ciclo
     * @param cicloId - ID del ciclo
     * @param options - Opciones de asignación
     */
    async asignarBeneficiosMasivo(cicloId: number, options: { tipo_beneficio_id?: number; solo_sin_beneficio?: boolean }): Promise<any> {
        try {
            const { data } = await apiClient.post<any>(`ciclos/${cicloId}/asignar-beneficios-pendientes/`, options);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.asignarBeneficiosMasivo', false);
        }
    }

    /**
     * Obtener estadísticas del ciclo
     * @param cicloId - ID del ciclo
     */
    async getEstadisticas(cicloId: number): Promise<any> {
        try {
            const { data } = await apiClient.get<any>(`ciclos/${cicloId}/estadisticas/`);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.getEstadisticas', false);
        }
    }

    // ==================== TIPOS DE BENEFICIOS ====================

    /**
     * Listar todos los tipos de beneficios
     */
    async getAllTipos(): Promise<TipoBeneficioDTO[]> {
        try {
            const { data } = await apiClient.get<TipoBeneficioDTO[]>('tipos-beneficio/');
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.getAllTipos', false);
        }
    }

    /**
     * Obtener tipo de beneficio por ID
     * @param tipoId - ID del tipo de beneficio
     */
    async getTipoById(tipoId: number): Promise<TipoBeneficioDTO> {
        try {
            const { data } = await apiClient.get<TipoBeneficioDTO>(`tipos-beneficio/${tipoId}/`);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.getTipoById', false);
        }
    }

    /**
     * Crear nuevo tipo de beneficio
     * @param data - Datos del tipo de beneficio
     */
    async createTipo(data: Partial<TipoBeneficioDTO>): Promise<TipoBeneficioDTO> {
        try {
            const { data: result } = await apiClient.post<TipoBeneficioDTO>('tipos-beneficio/', data);
            return result;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.createTipo', false);
        }
    }

    /**
     * Actualizar tipo de beneficio
     * @param tipoId - ID del tipo de beneficio
     * @param data - Datos a actualizar
     */
    async updateTipo(tipoId: number, data: Partial<TipoBeneficioDTO>): Promise<TipoBeneficioDTO> {
        try {
            const { data: result } = await apiClient.put<TipoBeneficioDTO>(`tipos-beneficio/${tipoId}/`, data);
            return result;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.updateTipo', false);
        }
    }

    /**
     * Eliminar tipo de beneficio
     * @param tipoId - ID del tipo de beneficio
     */
    async deleteTipo(tipoId: number): Promise<void> {
        try {
            await apiClient.delete(`tipos-beneficio/${tipoId}/`);
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.deleteTipo', false);
        }
    }

    // ==================== CAJAS DE BENEFICIOS ====================

    /**
     * Obtener cajas de un tipo de beneficio
     * @param tipoBeneficioId - ID del tipo de beneficio
     * @param incluirInactivas - Incluir cajas inactivas (default: false)
     */
    async getCajas(tipoBeneficioId: number, incluirInactivas: boolean = false): Promise<any[]> {
        try {
            const params = new URLSearchParams();
            if (incluirInactivas) {
                params.append('incluir_inactivas', 'true');
            }
            const { data } = await apiClient.get<any[]>(
                `cajas-beneficio/por-tipo/${tipoBeneficioId}/?${params.toString()}`
            );
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.getCajas', false);
        }
    }

    /**
     * Crear caja para un tipo de beneficio
     * @param tipoBeneficioId - ID del tipo de beneficio
     * @param data - Datos de la caja
     */
    async createCaja(tipoBeneficioId: number, data: {
        nombre: string;
        descripcion?: string;
        codigo_tipo: string;
        activo?: boolean;
    }): Promise<any> {
        try {
            const { data: result } = await apiClient.post<any>(
                `cajas-beneficio/por-tipo/${tipoBeneficioId}/`,
                data
            );
            return result;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.createCaja', false);
        }
    }

    /**
     * Actualizar caja de beneficio
     * @param cajaId - ID de la caja
     * @param data - Datos a actualizar
     */
    async updateCaja(cajaId: number, data: {
        nombre?: string;
        descripcion?: string;
        activo?: boolean;
    }): Promise<any> {
        try {
            const { data: result } = await apiClient.put<any>(
                `cajas-beneficio/${cajaId}/`,
                data
            );
            return result;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.updateCaja', false);
        }
    }

    /**
     * Alternar estado activo de una caja
     * @param cajaId - ID de la caja
     * @param activo - Nuevo estado (opcional, si no se proporciona invierte el actual)
     */
    async toggleCajaActivo(cajaId: number, activo?: boolean): Promise<any> {
        try {
            const body = activo !== undefined ? { activo } : {};
            const { data } = await apiClient.patch<any>(
                `cajas-beneficio/${cajaId}/toggle-activo/`,
                body
            );
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.toggleCajaActivo', false);
        }
    }

    /**
     * Eliminar caja de beneficio
     * @param cajaId - ID de la caja
     */
    async deleteCaja(cajaId: number): Promise<void> {
        try {
            await apiClient.delete(`cajas-beneficio/${cajaId}/`);
        } catch (error) {
            throw ErrorHandler.handle(error, 'CicloService.deleteCaja', false);
        }
    }
}

// Exportar instancia singleton
export const cicloService = CicloService.getInstance();
