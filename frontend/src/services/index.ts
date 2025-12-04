/**
 * Punto de entrada centralizado para todos los servicios
 * Facilita imports y mantiene consistencia
 */

export { ticketService, TicketService } from './ticket.service';
export { trabajadorService, TrabajadorService } from './trabajador.service';
export { apiClient, ApiClientWrapper } from './apiClient';
export { incidentService, IncidentService } from './incident.service';
export { stockService, StockService } from './stock.service';
export { ticketsQueryService, TicketsQueryService } from './tickets.query.service';
export { scheduleService } from './schedule.service';

// Re-exportar tipos comunes
export type { TicketDTO, TrabajadorDTO, BeneficioResponse } from '@/types';
