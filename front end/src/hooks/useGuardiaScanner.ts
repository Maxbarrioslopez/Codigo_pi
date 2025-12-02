import { useState } from 'react';
import { useScanner } from '@/hooks/useScanner';
import { BarcodeFormat } from '@zxing/library';
import { ticketService } from '@/services/ticket.service';

export type GuardiaScannerState =
    | 'idle'
    | 'scanning'
    | 'validating'
    | 'success'
    | 'error';

export type GuardiaScannerError =
    | 'ticket_not_found'
    | 'ticket_expired'
    | 'ticket_already_used'
    | 'qr_invalid'
    | 'no_stock'
    | 'network_error'
    | 'unknown_error';

export type ValidatedTicket = {
    uuid: string;
    trabajador: {
        rut: string;
        nombre: string;
    };
    beneficio: any;
    caja_asignada?: string;
    validated_at: string;
};

export function useGuardiaScanner() {
    const [state, setState] = useState<GuardiaScannerState>('idle');
    const [error, setError] = useState<GuardiaScannerError | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [validatedTicket, setValidatedTicket] = useState<ValidatedTicket | null>(null);

    const scanner = useScanner({
        formats: [BarcodeFormat.QR_CODE],
        onResult: async (qrText: string) => {
            setState('validating');
            setError(null);
            setErrorMessage('');

            try {
                // Extraer UUID del QR (puede ser payload firmado o UUID directo)
                const uuid = extractUUIDFromQR(qrText);

                // Validar ticket con backend
                const result = await ticketService.validarGuardia(uuid, 'CAJA-001');

                setValidatedTicket({
                    uuid: result.uuid,
                    trabajador: result.trabajador,
                    beneficio: result.data?.beneficio,
                    caja_asignada: result.data?.caja_codigo,
                    validated_at: new Date().toISOString(),
                });
                setState('success');
            } catch (err: any) {
                const errorCode = mapErrorToCode(err);
                setError(errorCode);
                setErrorMessage(err?.message || err?.detail || 'Error validando ticket');
                setState('error');
            }
        },
        onError: (err: Error) => {
            setError('unknown_error');
            setErrorMessage(err.message || 'Error del escáner');
            setState('error');
        },
    });

    const startScanning = (videoElement: HTMLVideoElement, deviceId?: string) => {
        setState('scanning');
        setError(null);
        setErrorMessage('');
        setValidatedTicket(null);
        return scanner.start(videoElement, deviceId);
    };

    const stopScanning = () => {
        scanner.stop();
        setState('idle');
    };

    const reset = () => {
        setState('idle');
        setError(null);
        setErrorMessage('');
        setValidatedTicket(null);
    };

    return {
        state,
        error,
        errorMessage,
        validatedTicket,
        isScanning: scanner.isActive,
        startScanning,
        stopScanning,
        reset,
    };
}

function extractUUIDFromQR(qrText: string): string {
    // Si el QR contiene payload firmado tipo "uuid|timestamp|signature"
    // extraer solo el UUID
    if (qrText.includes('|')) {
        return qrText.split('|')[0];
    }
    // Si es UUID directo, retornar tal cual
    return qrText;
}

function mapErrorToCode(err: any): GuardiaScannerError {
    const code = err?.code || err?.error?.code;
    switch (code) {
        case 'ticket_not_found':
            return 'ticket_not_found';
        case 'ticket_expired':
            return 'ticket_expired';
        case 'ticket_invalid_state':
        case 'ticket_already_used':
            return 'ticket_already_used';
        case 'qr_invalid':
            return 'qr_invalid';
        case 'no_stock':
            return 'no_stock';
        default:
            if (err?.message?.toLowerCase().includes('network')) {
                return 'network_error';
            }
            return 'unknown_error';
    }
}
