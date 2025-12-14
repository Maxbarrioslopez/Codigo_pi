/**
 * Servicio de Beneficios
 * Maneja operaciones relacionadas con BeneficioTrabajador
 */

import { apiClient } from './apiClient';
import { ErrorHandler } from '@/utils/errors/errorHandler';

export interface BeneficioTrabajadorDTO {
    id: number;
    trabajador: {
        id: number;
        rut: string;
        nombre: string;
    };
    ciclo: {
        id: number;
        nombre: string;
        fecha_inicio: string;
        fecha_fin: string;
    };
    tipo_beneficio: {
        id: number;
        nombre: string;
    };
    caja_beneficio?: {
        id: number;
        nombre: string;
    };
    codigo_verificacion: string;
    qr_data?: string;
    qr_payload?: Record<string, any>;
    qr_signature?: string;
    estado: 'pendiente' | 'validado' | 'retirado' | 'cancelado';
    bloqueado: boolean;
    motivo_bloqueo?: string;
    puede_retirarse: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Servicio Singleton para gestión de beneficios
 */
export class BeneficioService {
    private static instance: BeneficioService;

    private constructor() { }

    static getInstance(): BeneficioService {
        if (!BeneficioService.instance) {
            BeneficioService.instance = new BeneficioService();
        }
        return BeneficioService.instance;
    }

    /**
     * Obtener beneficio de trabajador por RUT
     * @param rut - RUT del trabajador
     * @returns Información del beneficio
     */
    async getBeneficioByRUT(rut: string): Promise<BeneficioTrabajadorDTO | null> {
        try {
            const { data } = await apiClient.get<any>(`beneficios/${rut}/`);
            return data || null;
        } catch (error: any) {
            // Si es 404, retorna null (sin beneficio)
            if (error?.response?.status === 404) {
                return null;
            }
            throw ErrorHandler.handle(error, 'BeneficioService.getBeneficioByRUT', false);
        }
    }

    /**
     * Obtener beneficio por ID
     * @param beneficioId - ID del beneficio
     */
    async getBeneficioById(beneficioId: number): Promise<BeneficioTrabajadorDTO> {
        try {
            const { data } = await apiClient.get<BeneficioTrabajadorDTO>(`beneficios/${beneficioId}/`);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'BeneficioService.getBeneficioById', false);
        }
    }

    /**
     * Listar beneficios de un trabajador
     * @param rut - RUT del trabajador
     */
    async getBeneficiosByTrabajador(rut: string): Promise<BeneficioTrabajadorDTO[]> {
        try {
            const { data } = await apiClient.get<BeneficioTrabajadorDTO[]>(`beneficios/trabajador/${rut}/`);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'BeneficioService.getBeneficiosByTrabajador', false);
        }
    }

    /**
     * Asignar beneficio a trabajador
     * @param data - Datos de asignación
     */
    async asignarBeneficio(data: {
        trabajador: number;
        ciclo: number;
        tipo_beneficio: number;
        caja_beneficio?: number;
    }): Promise<BeneficioTrabajadorDTO> {
        try {
            const { data: result } = await apiClient.post<BeneficioTrabajadorDTO>('beneficios-trabajadores/', data);
            return result;
        } catch (error) {
            throw ErrorHandler.handle(error, 'BeneficioService.asignarBeneficio', false);
        }
    }

    /**
     * Bloquear beneficio
     * @param beneficioId - ID del beneficio
     * @param motivo - Motivo del bloqueo
     */
    async bloquearBeneficio(beneficioId: number, motivo: string): Promise<BeneficioTrabajadorDTO> {
        try {
            const { data } = await apiClient.post<BeneficioTrabajadorDTO>(
                `beneficios/${beneficioId}/bloquear/`,
                { motivo }
            );
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'BeneficioService.bloquearBeneficio', false);
        }
    }

    /**
     * Desbloquear beneficio
     * @param beneficioId - ID del beneficio
     */
    async desbloquearBeneficio(beneficioId: number): Promise<BeneficioTrabajadorDTO> {
        try {
            const { data } = await apiClient.post<BeneficioTrabajadorDTO>(
                `beneficios/${beneficioId}/desbloquear/`,
                {}
            );
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'BeneficioService.desbloquearBeneficio', false);
        }
    }
}

export const beneficioService = BeneficioService.getInstance();
