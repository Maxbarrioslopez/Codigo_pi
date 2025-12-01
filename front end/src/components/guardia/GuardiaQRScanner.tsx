/**
 * Componente de escáner QR para módulo de Guardia
 * Usa la cámara del dispositivo para escanear códigos QR de tickets
 * Basado en @zxing/browser
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Camera, CameraOff, Scan, AlertCircle, Flashlight, FlashlightOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface GuardiaQRScannerProps {
    /** Callback cuando se escanea un ticket exitosamente */
    onTicketScanned: (uuid: string) => void;
    /** Callback para cerrar el escáner */
    onClose?: () => void;
    /** Si está escaneando activamente */
    isActive?: boolean;
    /** Ventana para evitar duplicados del mismo UUID (ms) */
    dedupeWindowMs?: number;
    /** Callback de error general */
    onError?: (error: Error) => void;
}

/**
 * Escáner QR para validación de tickets en portería
 * Extrae el UUID del ticket desde el contenido del QR
 * 
 * @example
 * <GuardiaQRScanner
 *   onTicketScanned={(uuid) => console.log('Ticket escaneado:', uuid)}
 *   onClose={() => setShowScanner(false)}
 *   isActive={true}
 * />
 */
export function GuardiaQRScanner({
    onTicketScanned,
    onClose,
    isActive = true,
    dedupeWindowMs = 2000,
    onError,
}: GuardiaQRScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string>('');
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [lastScannedUUID, setLastScannedUUID] = useState<string>('');
    const lastScanAtRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);
    const [torchOn, setTorchOn] = useState(false);

    // Inicializar lector QR y obtener dispositivos
    useEffect(() => {
        const codeReader = new BrowserQRCodeReader();
        codeReaderRef.current = codeReader;

        // Obtener lista de cámaras disponibles
        BrowserQRCodeReader.listVideoInputDevices()
            .then((videoDevices: MediaDeviceInfo[]) => {
                setDevices(videoDevices);
                if (videoDevices.length > 0) {
                    // Restaurar preferencia
                    const stored = localStorage.getItem('qr_camera_id') || '';
                    const exists = videoDevices.find(d => d.deviceId === stored);
                    if (stored && exists) {
                        setSelectedDeviceId(stored);
                    } else {
                        // Preferir cámara trasera si está disponible
                        const backCamera = videoDevices.find((d: MediaDeviceInfo) =>
                            d.label.toLowerCase().includes('back') ||
                            d.label.toLowerCase().includes('trasera')
                        );
                        setSelectedDeviceId(backCamera?.deviceId || videoDevices[0].deviceId);
                    }
                }
            })
            .catch((err: Error) => {
                console.error('Error al listar cámaras:', err);
                setError('No se pudieron detectar cámaras en el dispositivo');
                onError?.(err);
            });

        return () => {
            // Detener streams de video al desmontar
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
            streamRef.current = null;
        };
    }, []);

    /**
     * Extraer UUID del contenido QR
     * El QR puede contener:
     * - UUID directo: "550e8400-e29b-41d4-a716-446655440000"
     * - URL con UUID: "https://tmluc.cl/tickets/550e8400-e29b-41d4-a716-446655440000"
     * - JSON: {"uuid": "550e8400-e29b-41d4-a716-446655440000"}
     */
    const extractUUID = useCallback((text: string): string | null => {
        // Regex para UUID v4
        const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

        // Intentar extraer UUID directamente
        const match = text.match(uuidRegex);
        if (match) {
            return match[0];
        }

        // Intentar parsear como JSON
        try {
            const parsed = JSON.parse(text);
            if (parsed.uuid && typeof parsed.uuid === 'string') {
                const uuidMatch = parsed.uuid.match(uuidRegex);
                if (uuidMatch) return uuidMatch[0];
            }
        } catch {
            // No es JSON válido, continuar
        }

        return null;
    }, []);

    // Iniciar escaneo cuando el componente se activa
    useEffect(() => {
        if (!isActive || !selectedDeviceId || !videoRef.current || !codeReaderRef.current) {
            return;
        }

        setIsScanning(true);
        setError('');

        const codeReader = codeReaderRef.current;

        codeReader
            .decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err, controls) => {
                if (result) {
                    const text = result.getText();
                    const uuid = extractUUID(text);

                    if (uuid) {
                        // Evitar escanear el mismo ticket múltiples veces
                        const now = Date.now();
                        if (
                            uuid !== lastScannedUUID ||
                            now - lastScanAtRef.current > dedupeWindowMs
                        ) {
                            setLastScannedUUID(uuid);
                            lastScanAtRef.current = now;
                            onTicketScanned(uuid);

                            // Vibración táctil si está disponible
                            if (navigator.vibrate) {
                                navigator.vibrate(200);
                            }
                        }
                    } else {
                        setError('QR no válido. Debe contener un UUID de ticket.');
                    }
                }

                if (err && !(err.name === 'NotFoundException')) {
                    console.error('Error al escanear QR:', err);
                    onError?.(err as Error);
                }
            })
            .catch((err) => {
                console.error('Error al iniciar escáner:', err);
                setError('Error al acceder a la cámara. Verifica los permisos.');
                setIsScanning(false);
                onError?.(err as Error);
            });

        // Guardar stream y localStorage de cámara seleccionada
        const startTrackWatcher = setInterval(() => {
            if (videoRef.current && videoRef.current.srcObject && !streamRef.current) {
                streamRef.current = videoRef.current.srcObject as MediaStream;
            }
        }, 200);

        localStorage.setItem('qr_camera_id', selectedDeviceId);

        return () => {
            // Detener streams de video
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
            streamRef.current = null;
            clearInterval(startTrackWatcher);
            setIsScanning(false);
        };
    }, [isActive, selectedDeviceId, extractUUID, onTicketScanned, lastScannedUUID, dedupeWindowMs, onError]);

    // Detener escaneo al desmontar
    useEffect(() => {
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleSwitchCamera = () => {
        if (devices.length <= 1) return;

        const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
        const nextIndex = (currentIndex + 1) % devices.length;
        const nextId = devices[nextIndex].deviceId;
        setSelectedDeviceId(nextId);
        localStorage.setItem('qr_camera_id', nextId);
    };

    // Torch toggle si está disponible
    const toggleTorch = async () => {
        try {
            const stream = streamRef.current;
            if (!stream) return;
            const [track] = stream.getVideoTracks();
            const capabilities = (track.getCapabilities?.() || {}) as any;
            if (!capabilities.torch) return;
            await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
            setTorchOn(!torchOn);
        } catch (e) {
            console.warn('Torch no soportado o fallo al alternar:', e);
        }
    };

    // Pausar al ocultar pestaña
    useEffect(() => {
        const onVisibility = () => {
            if (document.hidden) {
                if (videoRef.current && videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach(t => t.stop());
                }
                streamRef.current = null;
                setIsScanning(false);
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-black/90 rounded-lg overflow-hidden">
            {/* Video de la cámara */}
            <div className="relative w-full h-full flex items-center justify-center">
                <video
                    ref={videoRef}
                    className="max-w-full max-h-full object-contain"
                    playsInline
                    muted
                />

                {/* Overlay con marco de escaneo */}
                {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative w-64 h-64 border-4 border-green-500 rounded-lg">
                            {/* Esquinas del marco */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400" />

                            {/* Línea de escaneo animada */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-green-400 animate-scan" />
                        </div>
                    </div>
                )}

                {/* Indicador de estado */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between" aria-live="polite">
                    <div className="bg-black/60 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                        {isScanning ? (
                            <>
                                <Scan className="w-5 h-5 animate-pulse text-green-400" />
                                <span className="text-sm font-medium">Escaneando...</span>
                            </>
                        ) : (
                            <>
                                <CameraOff className="w-5 h-5 text-red-400" />
                                <span className="text-sm font-medium">Cámara detenida</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="absolute bottom-20 left-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-lg flex items-center gap-2" role="alert">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}
            </div>

            {/* Controles */}
            <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center">
                {devices.length > 1 && (
                    <Button
                        onClick={handleSwitchCamera}
                        variant="secondary"
                        size="lg"
                        className="bg-white/90 hover:bg-white"
                        aria-label="Cambiar cámara"
                    >
                        <Camera className="w-5 h-5 mr-2" />
                        Cambiar cámara
                    </Button>
                )}

                {/* Torch toggle si es soportado */}
                <Button
                    onClick={toggleTorch}
                    variant="secondary"
                    size="lg"
                    className="bg-white/90 hover:bg-white"
                    aria-pressed={torchOn}
                    aria-label={torchOn ? 'Apagar linterna' : 'Encender linterna'}
                >
                    {torchOn ? <FlashlightOff className="w-5 h-5 mr-2" /> : <Flashlight className="w-5 h-5 mr-2" />}
                    {torchOn ? 'Apagar linterna' : 'Encender linterna'}
                </Button>

                {onClose && (
                    <Button
                        onClick={onClose}
                        variant="destructive"
                        size="lg"
                        aria-label="Cerrar escáner"
                    >
                        Cerrar escáner
                    </Button>
                )}
            </div>

            <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}
