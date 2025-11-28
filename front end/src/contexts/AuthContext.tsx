import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Sistema de Autenticación con JWT
 * Maneja login, logout, almacenamiento de tokens y verificación de roles
 */

// Tipos
export interface User {
    id: number;
    username: string;
    rol: 'admin' | 'rrhh' | 'guardia' | 'supervisor';
    email?: string;
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

    const login = async (username: string, password: string) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Error de autenticación');
            }

            const data = await response.json();

            // Decodificar el token para obtener información del usuario
            const tokenPayload = JSON.parse(atob(data.access.split('.')[1]));

            const userData: User = {
                id: tokenPayload.user_id,
                username: tokenPayload.username || username,
                rol: tokenPayload.rol || 'guardia',
            };

            // Guardar en estado y localStorage
            setUser(userData);
            setAccessToken(data.access);
            setRefreshToken(data.refresh);

            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
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

// Helper para refrescar el token de acceso
export const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
    try {
        const response = await fetch('http://localhost:8000/api/auth/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!response.ok) {
            throw new Error('Fallo al refrescar token');
        }

        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        return data.access;
    } catch (error) {
        console.error('Error al refrescar token:', error);
        localStorage.clear();
        window.location.href = '/login';
        return null;
    }
};
