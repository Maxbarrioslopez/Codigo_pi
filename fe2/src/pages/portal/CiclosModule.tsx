import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

export const CiclosModule = () => {
    const [cicloActivo, setCicloActivo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCicloActivo();
    }, []);

    const fetchCicloActivo = async () => {
        try {
            setLoading(true);
            const res = await api.get('/ciclo/activo/');
            setCicloActivo(res.data);
        } catch (e: any) {
            setError(e?.response?.data?.detail || 'Error al cargar ciclo activo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ margin: 0, color: '#1a237e' }}>Portal RRHH - Ciclos Bimensuales</h1>
                <Link to="/rrhh" style={{ padding: '0.5rem 1rem', backgroundColor: '#1976d2', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>← Volver</Link>
            </div>
            {loading && <p>Cargando ciclo activo...</p>}
            {error && <div style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>{error}</div>}
            {!loading && !error && cicloActivo && (
                <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 style={{ margin: 0, color: '#1976d2' }}>Ciclo Activo</h2>
                        <span style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: '20px',
                            backgroundColor: '#e8f5e9',
                            color: '#2e7d32',
                            fontSize: '1rem',
                            fontWeight: 600
                        }}>
                            ✓ Activo
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        <div style={{ padding: '1.5rem', backgroundColor: '#f5f5f5', borderRadius: '8px', borderLeft: '4px solid #1976d2' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID Ciclo</h3>
                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1a237e' }}>{cicloActivo.id}</p>
                        </div>
                        <div style={{ padding: '1.5rem', backgroundColor: '#f5f5f5', borderRadius: '8px', borderLeft: '4px solid #4caf50' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha Inicio</h3>
                            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#333' }}>{new Date(cicloActivo.fecha_inicio).toLocaleDateString()}</p>
                        </div>
                        <div style={{ padding: '1.5rem', backgroundColor: '#f5f5f5', borderRadius: '8px', borderLeft: '4px solid #ff9800' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha Fin</h3>
                            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#333' }}>{new Date(cicloActivo.fecha_fin).toLocaleDateString()}</p>
                        </div>
                        <div style={{ padding: '1.5rem', backgroundColor: '#f5f5f5', borderRadius: '8px', borderLeft: '4px solid #f44336' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Días Restantes</h3>
                            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: cicloActivo.dias_restantes <= 5 ? '#f44336' : '#333' }}>{cicloActivo.dias_restantes} días</p>
                        </div>
                    </div>
                    {cicloActivo.dias_restantes <= 5 && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fff3e0', borderRadius: '4px', border: '1px solid #ff9800' }}>
                            <p style={{ margin: 0, color: '#e65100', fontWeight: 500 }}>⚠️ El ciclo está próximo a finalizar. Considere preparar el siguiente ciclo.</p>
                        </div>
                    )}
                </div>
            )}
            {!loading && !error && !cicloActivo && (
                <div style={{ backgroundColor: '#fff3e0', padding: '2rem', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ margin: 0, color: '#e65100', fontSize: '1.125rem' }}>No hay un ciclo activo en este momento.</p>
                </div>
            )}
        </div>
    );
};
