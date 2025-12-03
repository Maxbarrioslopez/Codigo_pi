import { apiClient, ApiClientWrapper } from '@/services/apiClient';

export interface LoginResponse {
    access: string;
    refresh: string;
}

export interface MeResponse {
    id: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    rol: 'admin' | 'rrhh' | 'guardia' | 'supervisor';
    debe_cambiar_contraseña?: boolean;
}

function isValidToken(token?: string | null): token is string {
    return !!(token && token !== 'undefined' && token !== 'null' && token.trim() !== '');
}

export const AuthService = {
    async login(username: string, password: string) {
        const { data } = await apiClient.post<LoginResponse>('/auth/login/', { username, password });
        if (!isValidToken(data?.access) || !isValidToken(data?.refresh)) {
            throw new Error('Invalid login response: missing tokens');
        }
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        ApiClientWrapper.setAuthTokens(data.access, data.refresh);
        return data;
    },

    async refresh() {
        const refresh = localStorage.getItem('refresh_token');
        if (!isValidToken(refresh)) {
            throw new Error('No refresh token available');
        }
        const { data } = await apiClient.post<LoginResponse>('/auth/refresh/', { refresh });
        if (!isValidToken(data?.access)) {
            throw new Error('Invalid refresh response: missing access');
        }
        localStorage.setItem('access_token', data.access);
        ApiClientWrapper.setAuthTokens(data.access, refresh!);
        return data.access;
    },

    async me() {
        const res = await apiClient.get<MeResponse>('/auth/me/');
        return res.data;
    },

    logout() {
        ApiClientWrapper.logout();
        try {
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        } catch { }
    },
};

export default AuthService;