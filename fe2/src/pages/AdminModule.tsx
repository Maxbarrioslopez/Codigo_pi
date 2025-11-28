import { Link } from 'react-router-dom';
import './AdminModule.css';

export const AdminModule = () => {
    return (
        <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ margin: 0, color: '#1a237e' }}>Panel de Administración</h1>
                <Link to="/dashboard" style={{ padding: '0.5rem 1rem', backgroundColor: '#1976d2', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>← Volver</Link>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚧</div>
                <h2 style={{ color: '#1976d2', marginBottom: '1rem' }}>Módulo en Desarrollo</h2>
                <p style={{ color: '#666', fontSize: '1.125rem', marginBottom: '0.5rem' }}>La gestión de usuarios estará disponible próximamente.</p>
                <p style={{ color: '#999', fontSize: '0.875rem' }}>Por ahora, los usuarios deben ser creados desde el panel de administración de Django.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
                <Link to="/rrhh" style={{ padding: '1.5rem', backgroundColor: '#e3f2fd', borderRadius: '8px', textDecoration: 'none', color: '#1565c0', fontWeight: 500, textAlign: 'center' }}>
                    Portal RRHH →
                </Link>
                <Link to="/guardia" style={{ padding: '1.5rem', backgroundColor: '#fff3e0', borderRadius: '8px', textDecoration: 'none', color: '#e65100', fontWeight: 500, textAlign: 'center' }}>
                    Panel Guardia →
                </Link>
                <Link to="/menu" style={{ padding: '1.5rem', backgroundColor: '#f3e5f5', borderRadius: '8px', textDecoration: 'none', color: '#6a1b9a', fontWeight: 500, textAlign: 'center' }}>
                    Menú Principal →
                </Link>
            </div>
        </div>
    );
};