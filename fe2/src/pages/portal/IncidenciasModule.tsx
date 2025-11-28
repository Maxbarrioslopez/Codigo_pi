import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

export const IncidenciasModule = () => {
    const [incidencias, setIncidencias] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchIncidencias();
    }, [filter]);

    const fetchIncidencias = async () => {
        try {
            setLoading(true);
            const url = filter ? `/incidencias/listar/?estado=${filter}` : '/incidencias/listar/';
            const res = await api.get(url);
            setIncidencias(res.data || []);
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Error al cargar incidencias');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ margin: 0, color: '#1a237e' }}>Portal RRHH - Incidencias</h1>
                <Link to="/rrhh" style={{ padding: '0.5rem 1rem', backgroundColor: '#1976d2', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>← Volver</Link>
            </div>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => setFilter('')} style={{ padding: '0.5rem 1rem', backgroundColor: filter === '' ? '#1976d2' : '#e0e0e0', color: filter === '' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Todas</button>
                <button onClick={() => setFilter('pendiente')} style={{ padding: '0.5rem 1rem', backgroundColor: filter === 'pendiente' ? '#ff9800' : '#e0e0e0', color: filter === 'pendiente' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Pendientes</button>
                <button onClick={() => setFilter('resuelta')} style={{ padding: '0.5rem 1rem', backgroundColor: filter === 'resuelta' ? '#4caf50' : '#e0e0e0', color: filter === 'resuelta' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Resueltas</button>
            </div>
            {loading && <p>Cargando incidencias...</p>}
            {error && <div style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
            {!loading && !error && (
                <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#1976d2', color: 'white' }}>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Código</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Tipo</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Estado</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Origen</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Fecha</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Descripción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {incidencias.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No se encontraron incidencias</td></tr>
                            ) : (
                                incidencias.map((i) => (
                                    <tr key={i.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>{i.codigo}</td>
                                        <td style={{ padding: '1rem' }}>{i.tipo}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                backgroundColor: i.estado === 'resuelta' ? '#e8f5e9' : '#fff3e0',
                                                color: i.estado === 'resuelta' ? '#2e7d32' : '#f57c00',
                                                fontSize: '0.875rem',
                                                fontWeight: 500
                                            }}>
                                                {i.estado}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{i.metadata?.origen || 'N/A'}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{new Date(i.created_at).toLocaleString()}</td>
                                        <td style={{ padding: '1rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.descripcion || '—'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
