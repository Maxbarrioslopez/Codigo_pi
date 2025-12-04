import { useState, useEffect } from 'react';
import { incidentService } from '@/services/incident.service';
import { IncidenciaDTO } from '@/types';

export type IncidentFilter = {
    estado?: 'pendiente' | 'en_proceso' | 'resuelta';
    tipo?: 'tecnica' | 'operacional' | 'usuario';
    trabajador_rut?: string;
};

export function useGuardiaIncidents(autoRefresh = true, intervalMs = 30000) {
    const [incidents, setIncidents] = useState<IncidenciaDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<IncidentFilter>({});

    const fetchIncidents = async (filterOverride?: IncidentFilter) => {
        const activeFilter = filterOverride || filter;
        setLoading(true);
        setError(null);
        try {
            const result = await incidentService.listarIncidencias(
                activeFilter.trabajador_rut,
                activeFilter.estado,
                activeFilter.tipo
            );
            setIncidents(result);
        } catch (err: any) {
            setError(err?.message || err?.detail || 'Error cargando incidencias');
        } finally {
            setLoading(false);
        }
    };

    const createIncident = async (data: {
        trabajador_rut?: string;
        tipo: string;
        descripcion: string;
        origen: string;
    }) => {
        setLoading(true);
        setError(null);
        try {
            const newIncident = await incidentService.crearIncidencia(data);
            setIncidents((prev) => [newIncident, ...prev]);
            return newIncident;
        } catch (err: any) {
            setError(err?.message || err?.detail || 'Error creando incidencia');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const resolveIncident = async (codigo: string, resolucion: string) => {
        setLoading(true);
        setError(null);
        try {
            const updated = await incidentService.resolverIncidencia(codigo, resolucion);
            setIncidents((prev) =>
                prev.map((inc) => (inc.codigo === codigo ? updated : inc))
            );
            return updated;
        } catch (err: any) {
            setError(err?.message || err?.detail || 'Error resolviendo incidencia');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const changeState = async (
        codigo: string,
        newState: 'pendiente' | 'en_proceso' | 'resuelta'
    ) => {
        setLoading(true);
        setError(null);
        try {
            const updated = await incidentService.cambiarEstadoIncidencia(codigo, newState);
            setIncidents((prev) =>
                prev.map((inc) => (inc.codigo === codigo ? updated : inc))
            );
            return updated;
        } catch (err: any) {
            setError(err?.message || err?.detail || 'Error cambiando estado');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = (newFilter: IncidentFilter) => {
        setFilter(newFilter);
        fetchIncidents(newFilter);
    };

    useEffect(() => {
        fetchIncidents();
        if (!autoRefresh) return;
        const interval = setInterval(() => fetchIncidents(), intervalMs);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoRefresh, intervalMs]);

    return {
        incidents,
        loading,
        error,
        filter,
        applyFilter,
        createIncident,
        resolveIncident,
        changeState,
        refresh: fetchIncidents,
    };
}
