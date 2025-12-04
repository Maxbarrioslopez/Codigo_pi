/**
 * Configuración centralizada de la API por entorno
 * Permite cambiar comportamiento sin editar archivos críticos
 * 
 * Usos:
 * import apiConfig from '@/config/api.config';
 * console.log(apiConfig.baseUrl);
 */

interface ApiConfig {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    logRequests: boolean;
    enableCompression: boolean;
}

export const getApiConfig = (): ApiConfig => {
    // Configuración de desarrollo
    if (import.meta.env.DEV) {
        return {
            baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
            timeout: 30000,
            retryAttempts: 1,
            retryDelay: 1000,
            logRequests: true,
            enableCompression: false,
        };
    }

    // Configuración de producción
    return {
        baseUrl: import.meta.env.VITE_API_URL || '/api',
        timeout: 30000,
        retryAttempts: 2,
        retryDelay: 2000,
        logRequests: false,
        enableCompression: true,
    };
};

const apiConfig = getApiConfig();

/**
 * Información de depuración
 */
export const getDebugInfo = () => ({
    environment: import.meta.env.MODE,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    apiBaseUrl: apiConfig.baseUrl,
    viteApiUrl: import.meta.env.VITE_API_URL,
    timestamp: new Date().toISOString(),
});

export default apiConfig;
