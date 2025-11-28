import { useEffect, useState } from 'react';
import api from '../../api/client';

export const ReportesModule = () => {
    const [retiros, setRetiros] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dias, setDias] = useState(7);

    useEffect(() => {
        fetchRetiros();
    }, [dias]);

    const fetchRetiros = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/reportes/retiros_por_dia/?dias=${dias}`);
            setRetiros(res.data || []);
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Error al cargar reportes');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '1.5rem' }}>
            <h1>Portal RRHH - Reportes</h1>
            <div style={{ marginBottom: '1rem' }}>
                <label>
                    Días:
                    <select value={dias} onChange={(e) => setDias(Number(e.target.value))} style={{ marginLeft: '0.5rem' }}>
                        <option value={7}>7 días</option>
                        <option value={14}>14 días</option>
                        <option value={30}>30 días</option>
                    </select>
                </label>
            </div>
            {loading && <p>Cargando reportes...</p>}
            {error && <div style={{ color: 'crimson' }}>{error}</div>}
            {!loading && !error && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f5f5f5' }}>
                                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd' }}>Fecha</th>
                                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd' }}>Entregados</th>
                                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd' }}>Pendientes</th>
                                <th style={{ textAlign: 'left', padding: '8px', border: '1px solid #ddd' }}>Expirados</th>
                            </tr>
                        </thead>
                        <tbody>
                            {retiros.length === 0 ? (
                                <tr><td colSpan={4} style={{ padding: '8px', border: '1px solid #ddd' }}>Sin datos</td></tr>
                            ) : (
                                retiros.map((r, idx) => (
                                    <tr key={idx}>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{r.fecha}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{r.entregados}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{r.pendientes}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{r.expirados}</td>
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
