import { apiClient } from './apiClient';
import { ErrorHandler } from '@/utils/errors/errorHandler';

/**
 * Minimal service for scheduling benefit pickup from Totem.
 * Keeps contracts stable and delegates HTTP concerns to apiClient.
 */
export type AgendamientoRequest = {
    trabajador_rut: string;
    fecha_iso: string;
};

export const scheduleService = {
    /**
     * Crea un agendamiento de retiro para un trabajador.
     * No cambia contratos ni rutas; delega a DRF.
     */
    async crearAgendamiento(trabajadorRut: string, fechaISO: string): Promise<{ ok: boolean; id?: string }> {
        try {
            const res = await apiClient.post('/agendamientos/', {
                trabajador_rut: trabajadorRut,
                fecha_iso: fechaISO,
            } as AgendamientoRequest);
            return { ok: true, id: (res as any).data?.id };
        } catch (error) {
            throw ErrorHandler.handle(error, 'ScheduleService.crearAgendamiento', false);
        }
    },
};
