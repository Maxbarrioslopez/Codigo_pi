/**
 * Tipos de errores personalizados para la aplicación
 * Mapean errores HTTP a códigos semánticos
 */

export enum ErrorCode {
    // Errores de red
    NETWORK_ERROR = 'NETWORK_ERROR',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR',

    // Errores de validación
    VALIDATION_ERROR = 'VALIDATION_ERROR',

    // Errores de autenticación/autorización
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',

    // Errores de recursos
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',

    // Errores del servidor
    SERVER_ERROR = 'SERVER_ERROR',

    // Errores desconocidos
    UNKNOWN = 'UNKNOWN',
}

/**
 * Clase personalizada para errores de la aplicación
 * Incluye código de error, mensaje técnico y mensaje amigable para el usuario
 */
export class AppError extends Error {
    constructor(
        public code: ErrorCode,
        public message: string,
        public userMessage: string,
        public statusCode?: number,
        public originalError?: any
    ) {
        super(message);
        this.name = 'AppError';

        // Mantener stack trace correcto en V8
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }
}
