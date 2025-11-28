import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Componente para proteger rutas que requieren autenticación
 * Puede filtrar por roles específicos
 */
interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    allowedRoles
}) => {
    const { isAuthenticated, user, loading } = useAuth();

    // Mostrar loader mientras carga el estado de autenticación
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    // Si no está autenticado, redirigir a login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si se especificaron roles permitidos, verificar
    if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso No Autorizado</h2>
                    <p className="text-gray-600 mb-4">
                        No tienes permisos para acceder a esta sección.
                    </p>
                    <p className="text-sm text-gray-500">
                        Tu rol actual: <span className="font-semibold">{user.rol}</span>
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    // Usuario autenticado y con rol correcto
    return <>{children}</>;
};

export default ProtectedRoute;
