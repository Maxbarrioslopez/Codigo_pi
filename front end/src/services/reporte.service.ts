import { apiClient } from './apiClient';

export const reporteService = {
    async retirosPorDia(dias: number = 7) {
        const { data } = await apiClient.get(`/reportes/retiros_por_dia/?dias=${dias}`);
        return data;
    },
    async trabajadoresActivos(ciclo_id?: number) {
        const q = ciclo_id ? `?ciclo_id=${ciclo_id}` : '';
        const { data } = await apiClient.get(`/rrhh/reportes/trabajadores-activos/${q}`);
        return data;
    },
    async incidencias(params?: { estado?: string; tipo?: string; trabajador_rut?: string }) {
        const query = new URLSearchParams();
        if (params?.estado) query.set('estado', params.estado);
        if (params?.tipo) query.set('tipo', params.tipo);
        if (params?.trabajador_rut) query.set('trabajador_rut', params.trabajador_rut);
        const q = query.toString() ? `?${query}` : '';
        const { data } = await apiClient.get(`/incidencias/listar/${q}`);
        return data;
    },
    async stock() {
        const { data } = await apiClient.get('/rrhh/reportes/stock/');
        return data;
    },
    async tiempoPromedioRetiro() {
        const { data } = await apiClient.get('/rrhh/reportes/tiempo-promedio-retiro/');
        return data;
    }
};
