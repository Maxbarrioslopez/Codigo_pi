/**
 * Servicio de Incidencias
 */
import { apiClient } from './apiClient';
import { ErrorHandler } from '@/utils/errors/errorHandler';

export type IncidenciaPayload = {
    tipo: string;
    descripcion: string;
    trabajador_rut: string;
    metadata?: Record<string, any>;
};

export class IncidentService {
    private static instance: IncidentService;
    private constructor() { }
    static getInstance(): IncidentService {
        if (!IncidentService.instance) IncidentService.instance = new IncidentService();
        return IncidentService.instance;
    }

    async crearIncidencia(payload: IncidenciaPayload): Promise<void> {
        try {
            await apiClient.post('incidencias/', payload);
        } catch (error) {
            throw ErrorHandler.handle(error, 'IncidentService.crearIncidencia', false);
        }
    }
}

export const incidentService = IncidentService.getInstance();
