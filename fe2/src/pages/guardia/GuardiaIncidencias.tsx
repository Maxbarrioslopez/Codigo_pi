import { useEffect, useState } from 'react';
import api from '../../api/client';

type Incidencia = {
    id: number;
    trabajador: string;
    tipo: string;
    descripcion: string;
    estado: string;
    fecha: string;
};

export const GuardiaIncidencias = () => {
    const [data, setData] = useState<Incidencia[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const fetchIncidencias = async () => {
            try {
                setLoading(true);
                // Ajustar endpoint según backend disponible
                const res = await api.get('/guardia/incidencias/');
                if (!mounted) return;
                setData(res.data || []);
                setError(null);
            } catch (e: any) {
                if (!mounted) return;
                setError(e?.response?.data?.detail || 'No se pudo cargar incidencias');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchIncidencias();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div style={{ padding: '1.5rem' }}>
            <h1>Guardia - Incidencias</h1>
            {loading && <p>Cargando incidencias…</p>}
            {error && (
                <div style={{ color: 'crimson', marginTop: '0.5rem' }}>
                    {error}
                </div>
            )}
            {!loading && !error && (
                <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '8px' }}>ID</th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Trabajador</th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Tipo</th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Estado</th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Fecha</th>
                                <th style={{ textAlign: 'left', padding: '8px' }}>Descripción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '8px' }}>Sin incidencias</td>
                                </tr>
                            ) : (
                                data.map((i) => (
                                    <tr key={i.id}>
                                        <td style={{ padding: '8px' }}>{i.id}</td>
                                        <td style={{ padding: '8px' }}>{i.trabajador}</td>
                                        <td style={{ padding: '8px' }}>{i.tipo}</td>
                                        <td style={{ padding: '8px' }}>{i.estado}</td>
                                        <td style={{ padding: '8px' }}>{new Date(i.fecha).toLocaleString()}</td>
                                        <td style={{ padding: '8px' }}>{i.descripcion}</td>
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
