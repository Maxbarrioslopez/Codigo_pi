import './GuardiaModule.css';

export const GuardiaModule = () => {
    return (
        <div className="guardia-module">
            <div className="header">
                <h1>Control de Asistencia</h1>
            </div>

            <div className="coming-soon">
                <div className="icon">🚧</div>
                <h2>Módulo en Desarrollo</h2>
                <p>El control de asistencia estará disponible próximamente.</p>
                <p className="info">Este módulo permitirá monitorear entradas y salidas de trabajadores en tiempo real.</p>
            </div>
        </div>
    );
};
