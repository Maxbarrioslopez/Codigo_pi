import { apiClient } from './apiClient';
import { AppError } from '@/utils/errors/errorHandler';

/**
 * Minimal service for scheduling benefit pickup from Totem.
 * Keeps contracts stable and delegates HTTP concerns to apiClient.
 */
export type AgendamientoRequest = {
  trabajador_rut: string;
  fecha_iso: string;
};

export const scheduleService = {
  async crearAgendamiento(trabajadorRut: string, fechaISO: string): Promise<{ ok: boolean; id?: string }>{
    try {
      const res = await apiClient.post('/agendamientos', {
        trabajador_rut: trabajadorRut,
        fecha_iso: fechaISO,
      } as AgendamientoRequest);
      return { ok: true, id: res.data?.id };
    } catch (err) {
      throw AppError.from(err, 'No fue posible agendar el retiro.');
    }
  },
};
