/**
 * Punto de entrada centralizado para todos los servicios
 * Facilita imports y mantiene consistencia
 */

export { ticketService, TicketService } from './ticket.service';
export { trabajadorService, TrabajadorService } from './trabajador.service';
export { apiClient, ApiClientWrapper } from './apiClient';

// Re-exportar tipos comunes
export type { TicketDTO, TrabajadorDTO, BeneficioResponse } from '@/types';
