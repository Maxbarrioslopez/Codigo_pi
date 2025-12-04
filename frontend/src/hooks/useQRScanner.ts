import { useState, useEffect, useRef } from 'react';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';

/**
 * Hook personalizado para escanear códigos QR
 * Utiliza la librería @zxing/browser
 */
export interface UseQRScannerReturn {
    result: string | null;
    error: string | null;
    scanning: boolean;
    startScanning: (videoElementId: string) => Promise<void>;
    stopScanning: () => void;
    resetScanner: () => void;
}

export const useQRScanner = (): UseQRScannerReturn => {
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const readerRef = useRef<BrowserQRCodeReader | null>(null);
    const controlsRef = useRef<IScannerControls | null>(null);

    const startScanning = async (videoElementId: string) => {
        try {
            setScanning(true);
            setError(null);
            setResult(null);

            // Crear instancia del lector si no existe
            if (!readerRef.current) {
                readerRef.current = new BrowserQRCodeReader();
            }

            const reader = readerRef.current;

            // Obtener dispositivos de video disponibles
            const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();

            if (videoInputDevices.length === 0) {
                throw new Error('No se encontraron cámaras disponibles');
            }

            // Preferir cámara trasera en dispositivos móviles
            const selectedDeviceId = videoInputDevices.find((device: any) =>
                device.label.toLowerCase().includes('back') ||
                device.label.toLowerCase().includes('trasera')
            )?.deviceId || videoInputDevices[0].deviceId;

            // Iniciar escaneo continuo
            controlsRef.current = await reader.decodeFromVideoDevice(
                selectedDeviceId,
                videoElementId,
                (result, error) => {
                    if (result) {
                        setResult(result.getText());
                        setScanning(false);
                        // Detener automáticamente después de leer
                        stopScanning();
                    }
                    if (error && !(error.name === 'NotFoundException')) {
                        console.error('Error al escanear:', error);
                    }
                }
            );

        } catch (err: any) {
            console.error('Error al iniciar escaneo:', err);
            setError(err.message || 'Error al acceder a la cámara');
            setScanning(false);
        }
    };

    const stopScanning = () => {
        if (controlsRef.current) {
            controlsRef.current.stop();
            controlsRef.current = null;
        }
        setScanning(false);
    };

    const resetScanner = () => {
        setResult(null);
        setError(null);
    };

    // Limpiar al desmontar el componente
    useEffect(() => {
        return () => {
            stopScanning();
        };
    }, []);

    return {
        result,
        error,
        scanning,
        startScanning,
        stopScanning,
        resetScanner
    };
};

export default useQRScanner;
