import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, ApiClientWrapper } from '@/services/apiClient';

/**
 * Sistema de Autenticación con JWT
 * Maneja login, logout, almacenamiento de tokens y verificación de roles
 * Integrado con apiClient (Axios) para manejo centralizado de tokens
 * 
 * TOKENS: Usa SOLO access_token y refresh_token en localStorage
 * CLIENTE: Usa SOLO apiClient (Axios) con interceptors automáticos
 */

// Tipos
export interface User {
    id: number;
    username: string;
    rol: 'admin' | 'rrhh' | 'guardia' | 'supervisor';
    email?: string;
    first_name?: string;
    last_name?: string;
    debe_cambiar_contraseña?: boolean;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    hasRole: (roles: string | string[]) => boolean;
}

// Contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Proveedor
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Cargar usuario desde localStorage al iniciar
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedAccessToken = localStorage.getItem('access_token');
        const storedRefreshToken = localStorage.getItem('refresh_token');

        if (storedUser && storedAccessToken) {
            try {
                setUser(JSON.parse(storedUser));
                setAccessToken(storedAccessToken);
                setRefreshToken(storedRefreshToken);
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.clear();
            }
        }
        setLoading(false);
    }, []);

    // Sincroniza el token de acceso con apiClient
    useEffect(() => {
        if (accessToken && refreshToken) {
            ApiClientWrapper.setAuthTokens(accessToken, refreshToken);
        }
    }, [accessToken, refreshToken]);

    const login = async (username: string, password: string) => {
        setLoading(true);
        try {
            // Intentar login con backend real usando apiClient
            const { data } = await apiClient.post('/auth/login/', { username, password });

            // Decodificar el token para obtener información del usuario
            const tokenPayload = JSON.parse(atob(data.access.split('.')[1]));

            const userData: User = {
                id: tokenPayload.user_id,
                username: tokenPayload.username || username,
                rol: tokenPayload.rol || 'guardia',
                email: tokenPayload.email,
                debe_cambiar_contraseña: tokenPayload.debe_cambiar_contraseña || false,
            };

            // Guardar en estado y localStorage
            setUser(userData);
            setAccessToken(data.access);
            setRefreshToken(data.refresh);

            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);

            // Inyectar tokens en apiClient
            ApiClientWrapper.setAuthTokens(data.access, data.refresh);

        } catch (error: any) {
            // Mejor manejo de errores para diferenciar problemas
            let errorMessage = 'Error al iniciar sesión';

            if (error.code === 'ECONNABORTED') {
                // Timeout
                errorMessage = 'Servidor no responde. Por favor, intenta más tarde.';
            } else if (error.code === 'ERR_NETWORK') {
                // Error de red (CORS, conexión rechazada, etc)
                errorMessage = 'Problema de conexión. Verifica que el servidor esté disponible.';
            } else if (error.response?.status === 401 || error.response?.status === 400) {
                // Credenciales inválidas o no autenticado
                errorMessage = error.response?.data?.detail || 'Usuario o contraseña incorrecto';
            } else if (error.response?.status === 429) {
                // Rate limiting - demasiados intentos
                errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
            } else if (error.response?.status === 403) {
                // Acceso denegado - usuario sin permiso
                errorMessage = 'No tienes permiso para acceder. Contacta al administrador.';
            } else if (error.response?.status >= 500) {
                // Error del servidor
                errorMessage = 'Error en el servidor. Intenta más tarde.';
            } else if (error.response?.data?.detail) {
                // Usar mensaje específico del backend si está disponible
                errorMessage = error.response.data.detail;
            }

            console.error('Login error details:', {
                status: error.response?.status,
                code: error.code,
                message: error.message,
                data: error.response?.data,
            });

            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        ApiClientWrapper.logout();
    };

    const hasRole = (roles: string | string[]): boolean => {
        if (!user) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.rol);
    };

    const value: AuthContextType = {
        user,
        accessToken,
        refreshToken,
        loading,
        login,
        logout,
        isAuthenticated: !!user && !!accessToken,
        hasRole,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

// Helper para refrescar el token de acceso (delegado a apiClient interceptors)
export const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
    try {
        const { data } = await apiClient.post('/auth/refresh/', { refresh: refreshToken });

        localStorage.setItem('access_token', data.access);
        ApiClientWrapper.setAuthTokens(data.access, refreshToken);
        return data.access;
    } catch (error) {
        console.error('Error al refrescar token:', error);
        localStorage.clear();
        window.location.href = '/login';
        return null;
    }
};
