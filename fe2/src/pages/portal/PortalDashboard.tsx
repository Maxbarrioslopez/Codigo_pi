import { Link } from 'react-router-dom';

export const PortalDashboard = () => (
    <div style={{ padding: '1.5rem' }}>
        <h1>Portal RRHH - Dashboard</h1>
        <p>Acceso rápido a módulos de RRHH:</p>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: '1.5rem' }}>
            <Link to="/rrhh/nomina" style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', textDecoration: 'none', color: 'inherit', backgroundColor: '#f5f5f5' }}>
                <h3>Nómina</h3>
            </Link>
            <Link to="/rrhh/retiros" style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', textDecoration: 'none', color: 'inherit', backgroundColor: '#f5f5f5' }}>
                <h3>Retiros</h3>
            </Link>
            <Link to="/rrhh/incidencias" style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', textDecoration: 'none', color: 'inherit', backgroundColor: '#f5f5f5' }}>
                <h3>Incidencias</h3>
            </Link>
            <Link to="/rrhh/reportes" style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', textDecoration: 'none', color: 'inherit', backgroundColor: '#f5f5f5' }}>
                <h3>Reportes</h3>
            </Link>
            <Link to="/rrhh/trabajadores" style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', textDecoration: 'none', color: 'inherit', backgroundColor: '#f5f5f5' }}>
                <h3>Trabajadores</h3>
            </Link>
            <Link to="/rrhh/ciclos" style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', textDecoration: 'none', color: 'inherit', backgroundColor: '#f5f5f5' }}>
                <h3>Ciclos</h3>
            </Link>
        </div>
    </div>
);
