import { useEffect, useState } from 'react';
import api from '../../api/client';

export const GuardiaDashboard = () => {
    const [metricas, setMetricas] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMetricas = async () => {
            try {
                setLoading(true);
                const res = await api.get('/metricas/guardia/');
                setMetricas(res.data);
            } catch (e: any) {
                setError(e?.response?.data?.detail || 'Error al cargar métricas');
            } finally {
                setLoading(false);
            }
        };
        fetchMetricas();
    }, []);

    return (
        <div style={{ padding: '1.5rem' }}>
            <h1>Guardia - Dashboard</h1>
            {loading && <p>Cargando métricas...</p>}
            {error && <div style={{ color: 'crimson' }}>{error}</div>}
            {metricas && (
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
                        <h3>Entregados</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metricas.entregados || 0}</p>
                    </div>
                    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
                        <h3>Pendientes</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metricas.pendientes || 0}</p>
                    </div>
                    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
                        <h3>Incidencias Pendientes</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metricas.incidencias_pendientes || 0}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
