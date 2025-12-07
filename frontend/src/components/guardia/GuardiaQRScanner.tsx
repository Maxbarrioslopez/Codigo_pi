/**
 * Componente de escáner QR para módulo de Guardia
 * Usa la cámara del dispositivo para escanear códigos QR de tickets
 * Basado en @zxing/browser con mejoras de foto integradas
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
 * Incluye mejoras de foto: brillo, contraste, y visualización en canvas
 */
export function GuardiaQRScanner({
    onTicketScanned,
    onClose,
    isActive = true,
    dedupeWindowMs = 2000,
    onError,
}: GuardiaQRScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string>('');
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [lastScannedUUID, setLastScannedUUID] = useState<string>('');
    const lastScanAtRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);
    const [torchOn, setTorchOn] = useState(false);
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [detectedQRBounds, setDetectedQRBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [scanSuccess, setScanSuccess] = useState(false);

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

    // Aplicar mejoras de foto al canvas (brightness, contrast, etc.)
    useEffect(() => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video || !isActive) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const animate = () => {
            if (!video.paused && !video.ended) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Aplicar filtros
                ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
                ctx.drawImage(video, 0, 0);
            }
            requestAnimationFrame(animate);
        };

        animate();
    }, [isActive, brightness, contrast]);

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

                            // Feedback visual y sonoro
                            setScanSuccess(true);
                            playSuccessSound();
                            if (navigator.vibrate) {
                                navigator.vibrate([100, 50, 100, 50, 100]); // Patrón de éxito
                            }

                            // Pausa 1s para mostrar feedback, luego dispara callback
                            setTimeout(() => {
                                onTicketScanned(uuid);
                                setScanSuccess(false);
                            }, 1000);
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
            // Torch constraint not standardized yet, skip TypeScript error
            await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
            setTorchOn(!torchOn);
        } catch (e) {
            console.warn('Torch no soportado o fallo al alternar:', e);
        }
    };

    // Reproducir sonido de éxito
    const playSuccessSound = useCallback(() => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            // Secuencia de tonos para sonido de éxito: do-mi-sol
            const notes = [262, 330, 392]; // C4, E4, G4 en Hz
            let time = audioContext.currentTime;

            notes.forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();
                oscillator.connect(gain);
                gain.connect(audioContext.destination);

                oscillator.frequency.value = frequency;
                gain.gain.setValueAtTime(0.2, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

                oscillator.start(time + index * 0.15);
                oscillator.stop(time + index * 0.15 + 0.2);
            });
        } catch {
            console.warn('No se pudo reproducir sonido de éxito');
        }
    }, []);

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
            {/* Video de la cámara con canvas de mejoras */}
            <div className="relative w-full h-full flex items-center justify-center">
                <video
                    ref={videoRef}
                    className="max-w-full max-h-full object-contain"
                    playsInline
                    muted
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 max-w-full max-h-full object-contain"
                    style={{ display: brightness !== 100 || contrast !== 100 ? 'block' : 'none' }}
                />

                {/* Overlay con marco de escaneo mejorado para carnet chileno */}
                {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {/* Marco exterior oscurecido */}
                        <div className="absolute inset-0 bg-black/40" />

                        {/* Zona de enfoque principal - Carnet Chileno */}
                        <div className="relative w-80 h-52 rounded-xl shadow-2xl"
                            style={{
                                border: scanSuccess ? '4px solid #22c55e' : '4px solid #4ade80',
                                boxShadow: scanSuccess
                                    ? '0 0 80px rgba(34, 197, 94, 1), inset 0 0 40px rgba(34, 197, 94, 0.3)'
                                    : '0 0 40px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(34, 197, 94, 0.1)',
                                animation: scanSuccess ? 'pulse-success 0.5s ease-out' : 'pulse 2s ease-in-out infinite',
                                transition: 'all 0.3s ease'
                            }}>                            {/* Esquinas resaltadas */}
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-300" />
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-300" />
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-300" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-300" />

                            {/* Línea de escaneo animada horizontal */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-300 to-transparent animate-scan" />

                            {/* Marcadores laterales */}
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-12 bg-green-400/60 rounded" />
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-12 bg-green-400/60 rounded" />

                            {/* Texto de instrucción */}
                            <div className="absolute -bottom-16 left-0 right-0 text-center">
                                <p className="text-white text-sm font-semibold">Coloca el carnet dentro del cuadro</p>
                                <p className="text-green-300 text-xs mt-1">Asegúrate que el QR esté visible</p>
                            </div>
                        </div>

                        {/* Puntos de referencia circulares en las esquinas */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <circle cx="10%" cy="10%" r="8" fill="none" stroke="rgba(34, 197, 94, 0.6)" strokeWidth="2" />
                            <circle cx="90%" cy="10%" r="8" fill="none" stroke="rgba(34, 197, 94, 0.6)" strokeWidth="2" />
                            <circle cx="10%" cy="90%" r="8" fill="none" stroke="rgba(34, 197, 94, 0.6)" strokeWidth="2" />
                            <circle cx="90%" cy="90%" r="8" fill="none" stroke="rgba(34, 197, 94, 0.6)" strokeWidth="2" />
                        </svg>
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
                    <div className="absolute bottom-40 left-4 right-4 bg-red-500/90 text-white px-4 py-3 rounded-lg flex items-center gap-2" role="alert">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}
            </div>

            {/* Controles: Brillo, Contraste, Cámara, Linterna */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
                {/* Sliders de brillo y contraste */}
                <div className="flex gap-2 bg-black/70 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs text-gray-200 whitespace-nowrap">Brillo:</span>
                        <input
                            type="range"
                            min="50"
                            max="150"
                            value={brightness}
                            onChange={(e) => setBrightness(Number(e.target.value))}
                            className="w-full h-1"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs text-gray-200 whitespace-nowrap">Contraste:</span>
                        <input
                            type="range"
                            min="50"
                            max="150"
                            value={contrast}
                            onChange={(e) => setContrast(Number(e.target.value))}
                            className="w-full h-1"
                        />
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 justify-center">
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
            </div>

            <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 1; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0; opacity: 1; }
        }
        .animate-scan {
          animation: scan 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(34, 197, 94, 0.1); }
          50% { box-shadow: 0 0 60px rgba(34, 197, 94, 0.8), inset 0 0 30px rgba(34, 197, 94, 0.2); }
        }
        @keyframes pulse-success {
          0% { box-shadow: 0 0 80px rgba(34, 197, 94, 1), inset 0 0 40px rgba(34, 197, 94, 0.3); scale: 1; }
          50% { box-shadow: 0 0 120px rgba(34, 197, 94, 1), inset 0 0 60px rgba(34, 197, 94, 0.5); scale: 1.05; }
          100% { box-shadow: 0 0 80px rgba(34, 197, 94, 1), inset 0 0 40px rgba(34, 197, 94, 0.3); scale: 1; }
        }
      `}</style>
        </div>
    );
}
