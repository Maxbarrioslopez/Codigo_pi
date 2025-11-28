import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

export const NominaModule = () => {
    const [trabajadores, setTrabajadores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredTrabajadores = trabajadores.filter(t =>
        t.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.rut?.includes(searchTerm)
    );

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ margin: 0, color: '#1a237e' }}>Portal RRHH - Nómina</h1>
                <Link to="/rrhh" style={{ padding: '0.5rem 1rem', backgroundColor: '#1976d2', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>← Volver</Link>
            </div>
            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Buscar por nombre o RUT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', maxWidth: '400px', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
                />
            </div>
            {loading && <p>Cargando trabajadores...</p>}
            {error && <div style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
            {!loading && !error && (
                <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#1976d2', color: 'white' }}>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>RUT</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Nombre</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Rol</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTrabajadores.length === 0 ? (
                                <tr><td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No se encontraron trabajadores</td></tr>
                            ) : (
                                filteredTrabajadores.map((t, idx) => (
                                    <tr key={t.id || idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                        <td style={{ padding: '1rem' }}>{t.rut || '—'}</td>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>{t.nombre || '—'}</td>
                                        <td style={{ padding: '1rem' }}>{t.rol || 'trabajador'}</td>
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
