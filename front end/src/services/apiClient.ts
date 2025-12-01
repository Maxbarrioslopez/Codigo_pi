/**
 * Cliente HTTP centralizado con Axios
 * Incluye interceptors para autenticación automática y refresh de tokens
 * Compatible con backend Django REST Framework
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';

// Configuración base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Crear instancia de axios con configuración por defecto
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL.replace(/\/$/, ''), // Remover trailing slash
    timeout: 30000, // 30 segundos
    headers: {
        'Content-Type': 'application/json',
    },
});

// Flag para evitar múltiples solicitudes de refresh simultáneas
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

// Procesar cola de solicitudes fallidas después de refrescar el token
const processQueue = (error: Error | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });

    failedQueue = [];
};

// Interceptor de Request: Adjunta el token de acceso a cada solicitud
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const accessToken = localStorage.getItem('access_token');

        if (accessToken && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Interceptor de Response: Maneja errores 401 y refresca tokens
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Si el error es 401 y no es un reintento
        if (error.response?.status === 401 && !originalRequest._retry) {

            // Si ya está refrescando, agregar a la cola
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        return apiClient(originalRequest);
                    })
                    .catch(err => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh_token');

            if (!refreshToken) {
                // Sin refresh token: rechazar y permitir que la UI decida (no redirigir aquí)
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                return Promise.reject(error);
            }

            try {
                // Intentar refrescar el token
                const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
                    refresh: refreshToken,
                });

                const { access } = response.data;

                // Guardar nuevo token de acceso
                localStorage.setItem('access_token', access);

                // Actualizar el header de la solicitud original
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                }

                // Procesar cola de solicitudes fallidas
                processQueue();
                isRefreshing = false;

                // Reintentar la solicitud original
                return apiClient(originalRequest);

            } catch (refreshError) {
                // Error al refrescar el token: limpiar y propagar
                processQueue(refreshError as Error);
                isRefreshing = false;

                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

/**
 * API Client wrapper con métodos tipados
 */
export class ApiClientWrapper {
    /**
     * GET request
     */
    static async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return apiClient.get<T>(url, config);
    }

    /**
     * POST request
     */
    static async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return apiClient.post<T>(url, data, config);
    }

    /**
     * PUT request
     */
    static async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return apiClient.put<T>(url, data, config);
    }

    /**
     * PATCH request
     */
    static async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return apiClient.patch<T>(url, data, config);
    }

    /**
     * DELETE request
     */
    static async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        return apiClient.delete<T>(url, config);
    }

    /**
     * Configurar tokens de autenticación
     */
    static setAuthTokens(accessToken: string, refreshToken: string) {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
    }

    /**
     * Limpiar tokens (logout)
     */
    static logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    }
}

// Exportar instancia singleton (compatibilidad con código existente)
export default apiClient;

// Exportar wrapper tipado
export { apiClient };
