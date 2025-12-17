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
    * @param sucursal - Sucursal de retiro (opcional, usa canónicas: Casablanca, Valparaiso Planta BIF, Valparaiso Planta BIC)
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
                data: { sucursal },
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
     * Resolver código de beneficio a UUID de ticket
     * @param codigo - Código de verificación del beneficio (ej: BEN-0020-000018-778BEB33)
     */
    async resolverCodigoATicket(codigo: string): Promise<string> {
        try {
            const { data } = await apiClient.get<{ uuid: string; encontrado: boolean }>(`tickets/por-codigo/${codigo}/`);
            if (!data.encontrado) {
                throw new Error('Código de beneficio no encontrado');
            }
            return data.uuid;
        } catch (error) {
            throw ErrorHandler.handle(error, 'TicketService.resolverCodigoATicket', false);
        }
    }

    /**
     * Validar ticket en portería (módulo guardia)
     * @param uuid - UUID del ticket
     * @param codigoCaja - Código de la caja entregada (opcional)
     */
    async validarGuardia(uuid: string, codigoCaja?: string): Promise<TicketDTO> {
        try {
            // Si viene un código de beneficio (BEN-...), usar el endpoint de código
            if (uuid.startsWith('BEN-')) {
                const { data } = await apiClient.post<any>(
                    `tickets/por-codigo/${uuid}/validar_guardia/`,
                    { codigo_caja: codigoCaja }
                );
                return data as unknown as TicketDTO;
            }
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

    // Generación de QR (placeholder mientras se integra backend)
    async generateQR(payload: { box_id: string; benefit_type: string }): Promise<any> {
        // Simulación local para no bloquear la UI; reemplazar por endpoint real cuando exista
        return {
            id: Date.now(),
            qrCode: payload.box_id,
            boxId: payload.box_id,
            workerName: '',
            workerRut: '',
            guardName: '',
            generatedDate: new Date().toISOString(),
            deliveredDate: null,
            status: 'Pendiente',
        };
    }

    async generateBatchQR(payload: { quantity: number }): Promise<any[]> {
        const now = Date.now();
        return Array.from({ length: payload.quantity }, (_, idx) => ({
            id: now + idx,
            qrCode: `QR-${now + idx}`,
            boxId: `BOX-${now + idx}`,
            workerName: '',
            workerRut: '',
            guardName: '',
            generatedDate: new Date().toISOString(),
            deliveredDate: null,
            status: 'Pendiente',
        }));
    }
}

// Exportar instancia singleton
export const ticketService = TicketService.getInstance();
