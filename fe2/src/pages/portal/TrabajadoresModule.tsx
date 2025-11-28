import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

export const TrabajadoresModule = () => {
    const [trabajadores, setTrabajadores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActivo, setFilterActivo] = useState('todos');

    useEffect(() => {
        fetchTrabajadores();
    }, []);

    const fetchTrabajadores = async () => {
        try {
            setLoading(true);
            const res = await api.get('/trabajadores/');
            setTrabajadores(res.data || []);
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Error al cargar trabajadores');
        } finally {
            setLoading(false);
        }
    };

    const filteredTrabajadores = trabajadores
        .filter(t => {
            const matchSearch = t.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || t.rut?.includes(searchTerm);
            const matchActivo = filterActivo === 'todos' || (filterActivo === 'activos' ? t.activo : !t.activo);
            return matchSearch && matchActivo;
        });

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ margin: 0, color: '#1a237e' }}>Portal RRHH - Trabajadores</h1>
                <Link to="/rrhh" style={{ padding: '0.5rem 1rem', backgroundColor: '#1976d2', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>← Volver</Link>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Buscar por nombre o RUT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, minWidth: '250px', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <select value={filterActivo} onChange={(e) => setFilterActivo(e.target.value)} style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="todos">Todos</option>
                    <option value="activos">Activos</option>
                    <option value="inactivos">Inactivos</option>
                </select>
            </div>
            {loading && <p>Cargando trabajadores...</p>}
            {error && <div style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
            {!loading && !error && (
                <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#1976d2', color: 'white' }}>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>RUT</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Nombre</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Rol</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTrabajadores.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No se encontraron trabajadores</td></tr>
                            ) : (
                                filteredTrabajadores.map((t, idx) => (
                                    <tr key={t.id || idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{t.rut || '—'}</td>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>{t.nombre || '—'}</td>
                                        <td style={{ padding: '1rem' }}>{t.email || '—'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                backgroundColor: '#e3f2fd',
                                                color: '#1565c0',
                                                fontSize: '0.875rem'
                                            }}>
                                                {t.rol || 'trabajador'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                backgroundColor: t.activo ? '#e8f5e9' : '#ffebee',
                                                color: t.activo ? '#2e7d32' : '#c62828',
                                                fontSize: '0.875rem',
                                                fontWeight: 500
                                            }}>
                                                {t.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
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
