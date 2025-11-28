import { Link } from 'react-router-dom';

export const MainMenu = () => (
    <div style={{ padding: '1.5rem' }}>
        <h1>Menú Principal</h1>
        <p>Acceso a módulos (excluye Tótem):</p>
        <ul style={{ lineHeight: '2' }}>
            <li><Link to="/dashboard">Panel</Link></li>
            <li><Link to="/guardia">Guardia - Dashboard</Link></li>
            <li><Link to="/guardia/escanear">Guardia - Escanear</Link></li>
            <li><Link to="/guardia/incidencias">Guardia - Incidencias</Link></li>
            <li><Link to="/guardia/metricas">Guardia - Métricas</Link></li>
            <li><Link to="/rrhh">Portal RRHH</Link></li>
            <li><Link to="/rrhh/nomina">RRHH - Nómina</Link></li>
            <li><Link to="/rrhh/retiros">RRHH - Retiros</Link></li>
            <li><Link to="/rrhh/incidencias">RRHH - Incidencias</Link></li>
            <li><Link to="/rrhh/reportes">RRHH - Reportes</Link></li>
            <li><Link to="/rrhh/trabajadores">RRHH - Trabajadores</Link></li>
            <li><Link to="/rrhh/ciclos">RRHH - Ciclos</Link></li>
        </ul>
    </div>
);
