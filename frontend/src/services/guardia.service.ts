/**
 * Servicio de Guardia
 * Maneja operaciones de validación y entrega de beneficios
 */

import { apiClient } from './apiClient';
import { ErrorHandler } from '@/utils/errors/errorHandler';
import { BeneficioTrabajadorDTO } from './beneficio.service';

export interface ValidacionResponse {
    exitoso: boolean;
    beneficio_id: number;
    estado?: string;
    trabajador?: {
        rut: string;
        nombre: string;
    };
    tipo_beneficio?: string;
    ciclo?: string;
    message?: string;
    razones?: string[];
}

export interface EntregaResponse {
    exitoso: boolean;
    beneficio_id: number;
    estado_anterior?: string;
    estado_final?: string;
    trabajador?: {
        rut: string;
        nombre: string;
    };
    tipo_beneficio?: string;
    ciclo?: string;
    caja_entregada?: string;
    message?: string;
    razones?: string[];
}

/**
 * Servicio Singleton para operaciones de guardia
 */
export class GuardiaService {
    private static instance: GuardiaService;

    private constructor() { }

    static getInstance(): GuardiaService {
        if (!GuardiaService.instance) {
            GuardiaService.instance = new GuardiaService();
        }
        return GuardiaService.instance;
    }

    /**
     * Validar beneficio mediante escaneo de código
     * @param beneficioId - ID del beneficio
     * @param codigoEscaneado - Código escaneado del QR
     * @returns Resultado de validación
     */
    async validarBeneficio(beneficioId: number, codigoEscaneado: string): Promise<ValidacionResponse> {
        try {
            const { data } = await apiClient.post<ValidacionResponse>(
                `guardia/beneficios/${beneficioId}/validar/`,
                { codigo_escaneado: codigoEscaneado }
            );
            return data;
        } catch (error: any) {
            // Si es un error HTTP con respuesta, retornar el objeto de error del servidor
            if (error?.response?.data) {
                return error.response.data as ValidacionResponse;
            }
            throw ErrorHandler.handle(error, 'GuardiaService.validarBeneficio', false);
        }
    }

    /**
     * Confirmar entrega física del beneficio
     * @param beneficioId - ID del beneficio
     * @param cajaFisicaCodigo - Código de la caja física entregada (opcional)
     * @returns Resultado de entrega
     */
    async confirmarEntrega(beneficioId: number, cajaFisicaCodigo?: string): Promise<EntregaResponse> {
        try {
            const { data } = await apiClient.post<EntregaResponse>(
                `guardia/beneficios/${beneficioId}/confirmar-entrega/`,
                cajaFisicaCodigo ? { caja_fisica_codigo: cajaFisicaCodigo } : {}
            );
            return data;
        } catch (error: any) {
            // Si es un error HTTP con respuesta, retornar el objeto de error del servidor
            if (error?.response?.data) {
                return error.response.data as EntregaResponse;
            }
            throw ErrorHandler.handle(error, 'GuardiaService.confirmarEntrega', false);
        }
    }

    /**
     * Obtener beneficios pendientes de validación
     * @returns Lista de beneficios pendientes
     */
    async getBeneficiosPendientes(): Promise<BeneficioTrabajadorDTO[]> {
        try {
            const { data } = await apiClient.get<BeneficioTrabajadorDTO[]>('guardia/beneficios/pendientes/');
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'GuardiaService.getBeneficiosPendientes', false);
        }
    }

    /**
     * Obtener beneficios validados (listos para confirmar entrega)
     * @returns Lista de beneficios validados
     */
    async getBeneficiosValidados(): Promise<BeneficioTrabajadorDTO[]> {
        try {
            const { data } = await apiClient.get<BeneficioTrabajadorDTO[]>('guardia/beneficios/validados/');
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'GuardiaService.getBeneficiosValidados', false);
        }
    }
}

export const guardiaService = GuardiaService.getInstance();
