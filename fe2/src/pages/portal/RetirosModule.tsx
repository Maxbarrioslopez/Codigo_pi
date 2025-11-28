import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

export const RetirosModule = () => {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('todos');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await api.get('/tickets/listar/');
            setTickets(res.data || []);
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Error al cargar retiros');
        } finally {
            setLoading(false);
        }
    };

    const filteredTickets = filter === 'todos' ? tickets : tickets.filter(t => t.estado === filter);

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ margin: 0, color: '#1a237e' }}>Portal RRHH - Retiros</h1>
                <Link to="/rrhh" style={{ padding: '0.5rem 1rem', backgroundColor: '#1976d2', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>← Volver</Link>
            </div>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => setFilter('todos')} style={{ padding: '0.5rem 1rem', backgroundColor: filter === 'todos' ? '#1976d2' : '#e0e0e0', color: filter === 'todos' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Todos</button>
                <button onClick={() => setFilter('pendiente')} style={{ padding: '0.5rem 1rem', backgroundColor: filter === 'pendiente' ? '#ff9800' : '#e0e0e0', color: filter === 'pendiente' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Pendientes</button>
                <button onClick={() => setFilter('entregado')} style={{ padding: '0.5rem 1rem', backgroundColor: filter === 'entregado' ? '#4caf50' : '#e0e0e0', color: filter === 'entregado' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Entregados</button>
                <button onClick={() => setFilter('expirado')} style={{ padding: '0.5rem 1rem', backgroundColor: filter === 'expirado' ? '#f44336' : '#e0e0e0', color: filter === 'expirado' ? 'white' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Expirados</button>
            </div>
            {loading && <p>Cargando retiros...</p>}
            {error && <div style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
            {!loading && !error && (
                <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#1976d2', color: 'white' }}>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>UUID</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Trabajador</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Estado</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Creado</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Expira</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No se encontraron tickets</td></tr>
                            ) : (
                                filteredTickets.map((t) => (
                                    <tr key={t.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>{t.uuid?.substring(0, 8) || '—'}</td>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>{t.trabajador?.nombre || t.trabajador?.rut || '—'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                backgroundColor: t.estado === 'entregado' ? '#e8f5e9' : t.estado === 'pendiente' ? '#fff3e0' : '#ffebee',
                                                color: t.estado === 'entregado' ? '#2e7d32' : t.estado === 'pendiente' ? '#f57c00' : '#c62828',
                                                fontSize: '0.875rem',
                                                fontWeight: 500
                                            }}>
                                                {t.estado}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{new Date(t.created_at).toLocaleString()}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{t.ttl_expira_at ? new Date(t.ttl_expira_at).toLocaleString() : '—'}</td>
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
