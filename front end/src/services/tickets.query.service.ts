import { apiClient } from './apiClient';
import { ErrorHandler } from '@/utils/errors/errorHandler';
import { TicketDTO } from '@/types';

export class TicketsQueryService {
    private static instance: TicketsQueryService;
    private constructor() { }
    static getInstance(): TicketsQueryService {
        if (!TicketsQueryService.instance) TicketsQueryService.instance = new TicketsQueryService();
        return TicketsQueryService.instance;
    }

    async listar(rut?: string): Promise<TicketDTO[]> {
        try {
            const url = rut ? `/tickets/listar/?rut=${encodeURIComponent(rut)}` : '/tickets/listar/';
            const { data } = await apiClient.get<TicketDTO[]>(url);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'TicketsQueryService.listar', false);
        }
    }
}

export const ticketsQueryService = TicketsQueryService.getInstance();
