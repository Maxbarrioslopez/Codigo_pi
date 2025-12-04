/**
 * Hook para monitorear el estado de salud del backend
 * Realiza checks periódicos a /api/health/readiness/
 */

import { useState, useEffect } from 'react';
import { apiClient } from '@/services/apiClient';

export interface BackendHealth {
    isBackendUp: boolean;
    isChecking: boolean;
    lastCheck: Date | null;
    error: string | null;
}

const CHECK_INTERVAL = 30000; // 30 segundos
const INITIAL_CHECK_DELAY = 1000; // 1 segundo

export function useBackendHealth() {
    const [health, setHealth] = useState<BackendHealth>({
        isBackendUp: true,
        isChecking: false,
        lastCheck: null,
        error: null,
    });

    const checkHealth = async () => {
        setHealth(prev => ({ ...prev, isChecking: true }));

        try {
            // Usar endpoint de health sin autenticación
            await apiClient.get('/health/readiness/', { timeout: 5000 });

            setHealth({
                isBackendUp: true,
                isChecking: false,
                lastCheck: new Date(),
                error: null,
            });
        } catch (error: any) {
            console.warn('Backend health check failed:', error.message);

            setHealth({
                isBackendUp: false,
                isChecking: false,
                lastCheck: new Date(),
                error: error.message || 'Backend no disponible',
            });
        }
    };

    useEffect(() => {
        // Check inicial después de un delay
        const initialTimer = setTimeout(checkHealth, INITIAL_CHECK_DELAY);

        // Checks periódicos
        const interval = setInterval(checkHealth, CHECK_INTERVAL);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, []);

    return {
        ...health,
        recheckNow: checkHealth,
    };
}
