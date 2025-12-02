import React, { useEffect, useRef } from 'react';
import { BarcodeFormat } from '@zxing/library';
import { useScanner } from '@/hooks/useScanner';
import { parseChileanIDFromPdf417 } from '@/utils/parseChileanID';

export type TotemScannerPanelProps = {
    onRutDetected: (rut: string) => void;
    onError?: (msg: string) => void;
    deviceId?: string;
};

export default function TotemScannerPanel({ onRutDetected, onError, deviceId }: TotemScannerPanelProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const scanner = useScanner({
        formats: [BarcodeFormat.PDF_417, BarcodeFormat.QR_CODE],
        deviceId,
        onResult: (text: string) => {
            // Primero intenta PDF417 -> RUT
            const parsed = parseChileanIDFromPdf417(text);
            if (parsed?.rut) {
                onRutDetected(parsed.rut);
                return;
            }
            // Si no, considera que QR pueda traer RUT directo
            const maybeRut = text.trim();
            const rutMatch = maybeRut.match(/\b\d{7,8}-[\dkK]\b/);
            if (rutMatch) {
                onRutDetected(rutMatch[0].toUpperCase());
                return;
            }
            onError?.('No se pudo extraer un RUT válido del código');
        },
        onError: (err: Error) => {
            onError?.(err.message || 'Error del escáner');
        },
    });

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        scanner.start(v, deviceId).catch(e => onError?.(e.message || 'No fue posible iniciar la cámara'));
        return () => scanner.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deviceId]);

    return (
        <div className="totem-scanner-panel">
            <video ref={videoRef} className="w-full h-auto" muted playsInline />
        </div>
    );
}
