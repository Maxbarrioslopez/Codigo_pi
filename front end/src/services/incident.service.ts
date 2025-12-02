/**
 * Servicio de Incidencias
 */
import { apiClient } from './apiClient';
import { ErrorHandler } from '@/utils/errors/errorHandler';
import { IncidenciaDTO } from '@/types';

export type IncidenciaPayload = {
    tipo: string;
    descripcion: string;
    trabajador_rut?: string;
    origen?: string;
    metadata?: Record<string, any>;
};

export class IncidentService {
    private static instance: IncidentService;
    private constructor() { }
    static getInstance(): IncidentService {
        if (!IncidentService.instance) IncidentService.instance = new IncidentService();
        return IncidentService.instance;
    }

    async crearIncidencia(payload: IncidenciaPayload): Promise<IncidenciaDTO> {
        try {
            const { data } = await apiClient.post<IncidenciaDTO>('incidencias/', payload);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'IncidentService.crearIncidencia', false);
        }
    }

    async listarIncidencias(
        trabajador_rut?: string,
        estado?: string,
        tipo?: string
    ): Promise<IncidenciaDTO[]> {
        try {
            const params = new URLSearchParams();
            if (trabajador_rut) params.append('trabajador_rut', trabajador_rut);
            if (estado) params.append('estado', estado);
            if (tipo) params.append('tipo', tipo);
            const url = `incidencias/${params.toString() ? '?' + params.toString() : ''}`;
            const { data } = await apiClient.get<IncidenciaDTO[]>(url);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'IncidentService.listarIncidencias', false);
        }
    }

    async obtenerIncidencia(codigo: string): Promise<IncidenciaDTO> {
        try {
            const { data } = await apiClient.get<IncidenciaDTO>(`incidencias/${codigo}/`);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'IncidentService.obtenerIncidencia', false);
        }
    }

    async resolverIncidencia(codigo: string, resolucion: string): Promise<IncidenciaDTO> {
        try {
            const { data } = await apiClient.post<IncidenciaDTO>(
                `incidencias/${codigo}/resolver/`,
                { resolucion }
            );
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'IncidentService.resolverIncidencia', false);
        }
    }

    async cambiarEstadoIncidencia(codigo: string, estado: string): Promise<IncidenciaDTO> {
        try {
            const { data } = await apiClient.patch<IncidenciaDTO>(
                `incidencias/${codigo}/estado/`,
                { estado }
            );
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'IncidentService.cambiarEstadoIncidencia', false);
        }
    }
}

export const incidentService = IncidentService.getInstance();
