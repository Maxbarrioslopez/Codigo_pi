import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

export const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const modules = [
        {
            title: 'Administración',
            description: 'Gestión de usuarios y configuración del sistema',
            path: '/admin',
            icon: '⚙️',
            roles: ['admin'],
        },
        {
            title: 'Control de Asistencia',
            description: 'Monitoreo y gestión de asistencias',
            path: '/guardia',
            icon: '👮',
            roles: ['admin', 'guardia'],
        },
        {
            title: 'Recursos Humanos',
            description: 'Gestión de trabajadores',
            path: '/rrhh',
            icon: '👥',
            roles: ['admin', 'rrhh', 'supervisor'],
        },
        {
            title: 'Totem de Registro',
            description: 'Registro de entrada y salida con QR',
            path: '/totem',
            icon: '📱',
            roles: ['admin', 'guardia', 'rrhh', 'supervisor'],
        },
    ];

    const availableModules = modules.filter(module =>
        user && module.roles.includes(user.rol)
    );

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div className="user-info">
                    <h1>Bienvenido, {user?.username}</h1>
                    <p className="user-role">Rol: {user?.rol}</p>
                </div>
                <button onClick={handleLogout} className="btn-logout">
                    Cerrar Sesión
                </button>
            </div>

            <div className="modules-grid">
                {availableModules.map((module) => (
                    <Link
                        key={module.path}
                        to={module.path}
                        className="module-card"
                    >
                        <div className="module-icon">{module.icon}</div>
                        <h2>{module.title}</h2>
                        <p>{module.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
};
