/**
 * Servicio de Tickets
 * Maneja operaciones relacionadas con tickets de retiro de beneficios
 */

import { apiClient } from './apiClient';
import { TicketDTO } from '@/types';
import { ErrorHandler } from '@/utils/errors/errorHandler';
import { RUTValidator } from '@/utils/rut/RUTValidator';

/**
 * Servicio Singleton para gestión de tickets
 */
export class TicketService {
    private static instance: TicketService;

    private constructor() { }

    static getInstance(): TicketService {
        if (!TicketService.instance) {
            TicketService.instance = new TicketService();
        }
        return TicketService.instance;
    }

    /**
     * Crear un nuevo ticket de retiro
     * @param trabajadorRut - RUT del trabajador (formato: 12345678-9)
     * @param sucursal - Sucursal de retiro (opcional, default: 'Central')
     */
    async create(trabajadorRut: string, sucursal?: string): Promise<TicketDTO> {
        try {
            // Validación temprana del RUT para evitar roundtrips innecesarios
            if (!RUTValidator.validate(trabajadorRut)) {
                throw new Error('RUT inválido');
            }
            // Idempotency-Key para evitar duplicados ante reintentos
            const idempotencyKey = `tk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
            const { data } = await apiClient.post<TicketDTO>('tickets/', {
                trabajador_rut: trabajadorRut,
                data: { sucursal: sucursal || 'Central' },
            }, { headers: { 'Idempotency-Key': idempotencyKey } });
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'TicketService.create', false);
        }
    }

    /**
     * Obtener estado actual de un ticket
     * @param uuid - UUID del ticket
     */
    async getEstado(uuid: string): Promise<TicketDTO> {
        try {
            const { data } = await apiClient.get<TicketDTO>(`tickets/${uuid}/estado/`);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'TicketService.getEstado', false);
        }
    }

    /**
     * Validar ticket en portería (módulo guardia)
     * @param uuid - UUID del ticket
     * @param codigoCaja - Código de la caja entregada (opcional)
     */
    async validarGuardia(uuid: string, codigoCaja?: string): Promise<TicketDTO> {
        try {
            const { data } = await apiClient.post<TicketDTO>(
                `tickets/${uuid}/validar_guardia/`,
                { codigo_caja: codigoCaja }
            );
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'TicketService.validarGuardia', false);
        }
    }

    /**
     * Anular un ticket
     * @param uuid - UUID del ticket
     * @param motivo - Motivo de anulación
     */
    async anular(uuid: string, motivo?: string): Promise<TicketDTO> {
        try {
            const { data } = await apiClient.post<TicketDTO>(
                `tickets/${uuid}/anular/`,
                { motivo }
            );
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'TicketService.anular', false);
        }
    }

    /**
     * Reimprimir un ticket
     * @param uuid - UUID del ticket
     */
    async reimprimir(uuid: string): Promise<TicketDTO> {
        try {
            const { data } = await apiClient.post<TicketDTO>(`tickets/${uuid}/reimprimir/`);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'TicketService.reimprimir', false);
        }
    }

    /**
     * Listar tickets (módulo RRHH)
     * @param rut - Filtrar por RUT (opcional)
     */
    async listar(rut?: string): Promise<TicketDTO[]> {
        try {
            const url = rut ? `tickets/listar/?rut=${encodeURIComponent(rut)}` : 'tickets/listar/';
            const { data } = await apiClient.get<TicketDTO[]>(url);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'TicketService.listar', false);
        }
    }
}

// Exportar instancia singleton
export const ticketService = TicketService.getInstance();
