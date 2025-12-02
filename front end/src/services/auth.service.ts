/**
 * Servicio de Autenticación y Gestión de Usuarios
 * Maneja login, creación de usuarios, cambio de contraseña y logout
 */

import { apiClient } from './apiClient';
import { ErrorHandler } from '@/utils/errors/errorHandler';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    access: string;
    refresh: string;
    user: {
        id: number;
        username: string;
        rol: 'admin' | 'rrhh' | 'guardia' | 'supervisor';
        email: string;
        first_name: string;
        last_name: string;
    };
}

export interface CreateUserRequest {
    username: string;
    email: string;
    rol: 'rrhh' | 'guardia' | 'supervisor';
    password?: string; // Si no se proporciona, se genera una temporal
    first_name?: string;
    last_name?: string;
}

export interface CreateUserResponse {
    id: number;
    username: string;
    email: string;
    rol: string;
    password?: string; // Contraseña temporal (solo en creación)
    debe_cambiar_contraseña: boolean;
}

export interface ChangePasswordRequest {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
}

export interface ResetPasswordRequest {
    username: string;
    new_password: string;
}

export interface ResetPasswordResponse {
    success: boolean;
    message: string;
    new_password?: string; // Si es temporal
}

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    rol: 'admin' | 'rrhh' | 'guardia' | 'supervisor';
    is_active: boolean;
    last_login: string | null;
    date_joined: string;
}

/**
 * Servicio Singleton para autenticación
 */
export class AuthService {
    private static instance: AuthService;

    private constructor() { }

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    /**
     * Login con username y password
     * @param credentials - Username y password
     */
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        try {
            const { data } = await apiClient.post<LoginResponse>('auth/login/', credentials);
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.login', false);
        }
    }

    /**
     * Logout del usuario
     */
    async logout(): Promise<void> {
        try {
            await apiClient.post('auth/logout/', {});
        } catch (error) {
            // No lanzar error en logout, simplemente limpiar localStorage
            console.warn('Error al hacer logout:', error);
        }
    }

    /**
     * Cambiar contraseña (usuario autenticado)
     * @param request - Contraseñas antigua y nueva
     */
    async changePassword(request: ChangePasswordRequest): Promise<void> {
        try {
            await apiClient.post('auth/change-password/', request);
        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.changePassword', false);
        }
    }

    /**
     * Crear nuevo usuario (solo admin)
     * @param data - Datos del usuario a crear
     */
    async createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
        try {
            const { data: result } = await apiClient.post<CreateUserResponse>('usuarios/', data);
            return result;
        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.createUser', false);
        }
    }

    /**
     * Resetear contraseña de usuario (solo admin)
     * @param username - Username del usuario
     * @param newPassword - Nueva contraseña
     */
    async resetPassword(username: string, newPassword: string): Promise<ResetPasswordResponse> {
        try {
            const { data } = await apiClient.post<ResetPasswordResponse>('usuarios/reset-password/', {
                username,
                new_password: newPassword
            });
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.resetPassword', false);
        }
    }

    /**
     * Obtener información del usuario actual
     */
    async getCurrentUser(): Promise<CreateUserResponse> {
        try {
            const { data } = await apiClient.get<CreateUserResponse>('auth/me/');
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.getCurrentUser', false);
        }
    }

    /**
     * Verificar si la sesión es válida (refresh token)
     */
    async verifySession(): Promise<boolean> {
        try {
            await this.getCurrentUser();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Listar todos los usuarios del sistema (solo admin)
     */
    async listUsers(): Promise<User[]> {
        try {
            const { data } = await apiClient.get<User[]>('usuarios/');
            return data;
        } catch (error) {
            throw ErrorHandler.handle(error, 'AuthService.listUsers', false);
        }
    }
}

// Exportar instancia singleton
export const authService = AuthService.getInstance();
