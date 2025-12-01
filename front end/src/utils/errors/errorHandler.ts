/**
 * Manejador centralizado de errores
 * Convierte errores de Axios a AppError con mensajes amigables
 * Opcionalmente muestra notificaciones toast al usuario
 */

import { AxiosError } from 'axios';
import { AppError, ErrorCode } from '@/types/errors';
import { toast } from 'sonner';

export class ErrorHandler {
    /**
     * Convierte errores de Axios a AppError tipados
     */
    static handleAxiosError(error: AxiosError): AppError {
        // Error de red (sin respuesta del servidor)
        if (!error.response) {
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                return new AppError(
                    ErrorCode.TIMEOUT_ERROR,
                    'Request timeout',
                    'La solicitud tardó demasiado. Por favor, intenta nuevamente.',
                    undefined,
                    error
                );
            }

            return new AppError(
                ErrorCode.NETWORK_ERROR,
                'Network error',
                'No se pudo conectar al servidor. Verifica tu conexión a internet.',
                undefined,
                error
            );
        }

        const { status, data } = error.response;

        // Mapear códigos HTTP a AppError
        switch (status) {
            case 400:
                return new AppError(
                    ErrorCode.VALIDATION_ERROR,
                    'Validation error',
                    (data as any)?.detail || 'Los datos ingresados no son válidos. Por favor, verifica tu información.',
                    400,
                    error
                );

            case 401:
                return new AppError(
                    ErrorCode.UNAUTHORIZED,
                    'Unauthorized',
                    'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
                    401,
                    error
                );

            case 403:
                return new AppError(
                    ErrorCode.FORBIDDEN,
                    'Forbidden',
                    'No tienes permisos para realizar esta acción.',
                    403,
                    error
                );

            case 404:
                return new AppError(
                    ErrorCode.NOT_FOUND,
                    'Not found',
                    (data as any)?.detail || 'El recurso solicitado no fue encontrado.',
                    404,
                    error
                );

            case 409:
                return new AppError(
                    ErrorCode.CONFLICT,
                    'Conflict',
                    (data as any)?.detail || 'Ya existe un registro con estos datos.',
                    409,
                    error
                );

            case 500:
            case 502:
            case 503:
                return new AppError(
                    ErrorCode.SERVER_ERROR,
                    'Server error',
                    'Error del servidor. Nuestro equipo ha sido notificado. Por favor, intenta más tarde.',
                    status,
                    error
                );

            default:
                return new AppError(
                    ErrorCode.UNKNOWN,
                    'Unknown error',
                    (data as any)?.detail || 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
                    status,
                    error
                );
        }
    }

    /**
     * Maneja un error y opcionalmente muestra notificación al usuario
     * @param error - Error a manejar
     * @param context - Contexto donde ocurrió el error (para logging)
     * @param showToast - Si debe mostrar notificación toast
     * @returns AppError procesado
     */
    static handle(error: unknown, context?: string, showToast: boolean = true): AppError {
        console.error(`[${context || 'ErrorHandler'}]`, error);

        let appError: AppError;

        if (error instanceof AppError) {
            appError = error;
        } else if ((error as any).isAxiosError) {
            appError = this.handleAxiosError(error as AxiosError);
        } else if (error instanceof Error) {
            appError = new AppError(
                ErrorCode.UNKNOWN,
                error.message,
                'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
                undefined,
                error
            );
        } else {
            appError = new AppError(
                ErrorCode.UNKNOWN,
                'Unknown error',
                'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
                undefined,
                error
            );
        }

        // Mostrar toast al usuario
        if (showToast) {
            toast.error(appError.userMessage, {
                description: context ? `Contexto: ${context}` : undefined,
                duration: 5000,
            });
        }

        // En producción, enviar a servicio de logging (Sentry, LogRocket, etc.)
        if (import.meta.env.PROD) {
            this.logToMonitoring(appError, context);
        }

        return appError;
    }

    /**
     * Envía errores a servicio de monitoreo (Sentry, LogRocket, etc.)
     * @private
     */
    private static logToMonitoring(error: AppError, context?: string) {
        // Integración con Sentry (si está configurado)
        if (typeof window !== 'undefined' && (window as any).Sentry) {
            (window as any).Sentry.captureException(error, {
                contexts: {
                    app: {
                        context,
                        code: error.code,
                        userMessage: error.userMessage,
                        statusCode: error.statusCode,
                    },
                },
            });
        }

        // Aquí se pueden agregar más integraciones (LogRocket, Datadog, etc.)
    }
}
