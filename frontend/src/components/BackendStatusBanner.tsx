/**
 * Banner de estado del backend
 * Se muestra cuando el backend no está disponible
 */

import { useBackendHealth } from '@/hooks/useBackendHealth';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function BackendStatusBanner() {
    const { isBackendUp, isChecking, error, recheckNow } = useBackendHealth();

    if (isBackendUp) {
        return null;
    }

    return (
        <div className="bg-red-600 text-white py-3 px-4 shadow-lg">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <div>
                        <p className="font-semibold">Backend no disponible</p>
                        <p className="text-sm text-red-100">
                            {error || 'No se puede conectar con el servidor. Verifica que el backend esté ejecutándose.'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={recheckNow}
                    disabled={isChecking}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                    {isChecking ? 'Verificando...' : 'Reintentar'}
                </button>
            </div>
        </div>
    );
}
