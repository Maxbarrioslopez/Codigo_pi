import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, ApiClientWrapper } from '@/services/apiClient';

/**
 * Sistema de Autenticación con JWT
 * Maneja login, logout, almacenamiento de tokens y verificación de roles
 * Integrado con apiClient para manejo centralizado de tokens
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

    // Base de la API para endpoints de auth (coincide con api.ts)
    const API_BASE =
        (import.meta as any)?.env?.VITE_API_URL?.replace(/\/$/, '') ||
        (import.meta as any)?.env?.VITE_API_PREFIX?.replace(/\/$/, '') ||
        '/api';

    const login = async (username: string, password: string) => {
        setLoading(true);
        try {
            // Usuarios mock para desarrollo independiente
            const mockUsers: Record<string, { password: string; user: User }> = {
                admin: {
                    password: 'admin123',
                    user: { id: 1, username: 'admin', rol: 'admin', email: 'admin@tmluc.cl' }
                },
                guardia: {
                    password: 'guardia123',
                    user: { id: 2, username: 'guardia', rol: 'guardia', email: 'guardia@tmluc.cl' }
                },
                rrhh: {
                    password: 'rrhh123',
                    user: { id: 3, username: 'rrhh', rol: 'rrhh', email: 'rrhh@tmluc.cl' }
                }
            };

            // Intentar login con backend real usando apiClient
            try {
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
                localStorage.setItem('mock_mode', 'false');

                // Inyectar tokens en apiClient
                ApiClientWrapper.setAuthTokens(data.access, data.refresh);
                return;
            } catch (backendError) {
                console.warn('Backend no disponible, usando modo mock:', backendError);
            }

            // Fallback a usuarios mock si backend no está disponible
            const mockUser = mockUsers[username.toLowerCase()];
            if (mockUser && mockUser.password === password) {
                const mockToken = `mock.${btoa(JSON.stringify({ user_id: mockUser.user.id, username: mockUser.user.username, rol: mockUser.user.rol }))}.mock`;

                setUser(mockUser.user);
                setAccessToken(mockToken);
                setRefreshToken(mockToken);

                localStorage.setItem('user', JSON.stringify(mockUser.user));
                localStorage.setItem('access_token', mockToken);
                localStorage.setItem('refresh_token', mockToken);
                localStorage.setItem('mock_mode', 'true');
                ApiClientWrapper.setAuthTokens(mockToken, mockToken);
                return;
            }

            throw new Error('Credenciales inválidas');
        } catch (error) {
            console.error('Error de login:', error);
            throw error;
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
