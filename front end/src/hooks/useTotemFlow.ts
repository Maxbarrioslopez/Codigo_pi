import { useState } from 'react';
import { trabajadorService } from '@/services/trabajador.service';
import { ticketService } from '@/services/ticket.service';
import { incidentService } from '@/services/incident.service';
import { scheduleService } from '@/services/schedule.service';
import { formatRut } from '@/utils/rut';

export type TotemState =
    | 'initial'
    | 'validating'
    | 'success-choice'
    | 'success'
    | 'no-stock'
    | 'schedule-select'
    | 'schedule-confirm'
    | 'no-benefit'
    | 'incident-form'
    | 'incident-sent'
    | 'error';

export function useTotemFlow() {
    const [state, setState] = useState<TotemState>('initial');
    const [rut, setRut] = useState('');
    const [beneficio, setBeneficio] = useState<any>(null);
    const [ticket, setTicket] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    async function scanRut(rutInput: string) {
        setRut(rutInput);
        setLoading(true);
        setError('');
        setState('validating');
        try {
            const formattedRut = formatRut(rutInput);
            const res = await trabajadorService.getBeneficio(formattedRut);
            setBeneficio(res.beneficio);
            const stock = res.beneficio?.beneficio_disponible?.stock ?? 0;
            if (!res.beneficio) {
                setState('no-benefit');
            } else if (stock <= 0) {
                setState('no-stock');
            } else {
                setState('success-choice');
            }
        } catch (e: any) {
            setError(e?.detail || e?.message || 'Error validando beneficio');
            setState('error');
        } finally {
            setLoading(false);
        }
    }

    async function generarTicket() {
        if (!rut) return;
        setLoading(true);
        setError('');
        try {
            const t = await ticketService.create(rut, 'Central');
            setTicket(t);
            setState('success');
        } catch (e: any) {
            const code = e?.code;
            if (code === 'no_stock') setState('no-stock');
            else {
                setError(e?.detail || e?.message || 'Error generando ticket');
                setState('error');
            }
        } finally {
            setLoading(false);
        }
    }

    async function agendarRetiro(fechaISO: string) {
        setLoading(true);
        setError('');
        try {
            await scheduleService.crearAgendamiento(rut, fechaISO);
            setState('schedule-confirm');
        } catch (e: any) {
            setError(e?.detail || e?.message || 'Error agendando');
            setState('error');
        } finally {
            setLoading(false);
        }
    }

    async function reportarIncidencia(tipo: string, descripcion: string) {
        setLoading(true);
        setError('');
        try {
            await incidentService.crearIncidencia({ trabajador_rut: rut, tipo, descripcion, origen: 'totem' } as any);
            setState('incident-sent');
        } catch (e: any) {
            setError(e?.detail || e?.message || 'Error reportando incidencia');
            setState('error');
        } finally {
            setLoading(false);
        }
    }

    return {
        state,
        setState,
        rut,
        setRut,
        beneficio,
        ticket,
        loading,
        error,
        scanRut,
        generarTicket,
        agendarRetiro,
        reportarIncidencia,
    };
}
