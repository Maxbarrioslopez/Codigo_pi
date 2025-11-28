import { useEffect, useState } from 'react';
import api from '../../api/client';

export const GuardiaMetricas = () => {
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
            <h1>Guardia - Métricas</h1>
            {loading && <p>Cargando métricas...</p>}
            {error && <div style={{ color: 'crimson' }}>{error}</div>}
            {metricas && (
                <div>
                    <h2>Estadísticas del día</h2>
                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '1rem' }}>
                        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', backgroundColor: '#e8f5e9' }}>
                            <h3>Entregados</h3>
                            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2e7d32' }}>{metricas.entregados || 0}</p>
                        </div>
                        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', backgroundColor: '#fff3e0' }}>
                            <h3>Pendientes</h3>
                            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f57c00' }}>{metricas.pendientes || 0}</p>
                        </div>
                        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', backgroundColor: '#ffebee' }}>
                            <h3>Incidencias Pendientes</h3>
                            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#c62828' }}>{metricas.incidencias_pendientes || 0}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
