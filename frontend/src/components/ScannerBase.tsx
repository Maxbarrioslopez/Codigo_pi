/**
 * Componente base de escáner unificado para Guardia y Totem
 * Maneja video, UI común, mejora de foto, y controles
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Scan, AlertCircle, FlashlightOff, Flashlight, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ScannerBaseProps {
    /** Callback cuando se escanea algo exitosamente */
    onScanResult: (text: string) => void;
    /** Callback de error */
    onError?: (error: string) => void;
    /** Si está escaneando activamente */
    isActive?: boolean;
    /** Formato de barritas a mostrar (PDF417, QR_CODE, etc.) */
    showGuide?: 'qr' | 'code128' | 'none';
    /** Permitir controles de cámara (linterna, cambio de cámara) */
    allowControls?: boolean;
    /** Sonido al escanear */
    enableSound?: boolean;
    /** Clases CSS personalizadas */
    containerClassName?: string;
}

export function ScannerBase({
    onScanResult,
    onError,
    isActive = true,
    showGuide = 'none',
    allowControls = true,
    enableSound = true,
    containerClassName = '',
}: ScannerBaseProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [torchOn, setTorchOn] = useState(false);
    const [focusMode, setFocusMode] = useState<'auto' | 'manual'>('auto');
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const streamRef = useRef<MediaStream | null>(null);

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

    // Iniciar acceso a cámara
    useEffect(() => {
        if (!isActive || !videoRef.current) return;

        const startCamera = async () => {
            try {
                const constraints: MediaStreamConstraints = {
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        ...(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
                            ? {
                                focusMode: { ideal: 'continuous' },
                                zoom: { ideal: 1 },
                            }
                            : {}),
                    },
                    audio: false,
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    streamRef.current = stream;
                }
            } catch (error: any) {
                onError?.(error.message || 'No se pudo acceder a la cámara');
            }
        };

        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, [isActive, onError]);

    // Toggle de linterna
    const toggleTorch = useCallback(async () => {
        try {
            const stream = streamRef.current;
            if (!stream) return;
            const [track] = stream.getVideoTracks();
            const capabilities = (track.getCapabilities?.() || {}) as any;
            if (!capabilities.torch) {
                onError?.('Linterna no disponible en este dispositivo');
                return;
            }
            await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
            setTorchOn(!torchOn);
        } catch (e) {
            onError?.('Error al alternar linterna');
        }
    }, [torchOn, onError]);

    // Cambiar enfoque
    const handleFocusMode = useCallback(async () => {
        try {
            const stream = streamRef.current;
            if (!stream) return;
            const [track] = stream.getVideoTracks();

            const newMode = focusMode === 'auto' ? 'manual' : 'auto';
            await track.applyConstraints({
                advanced: [{ focusMode: newMode } as any],
            });
            setFocusMode(newMode);
        } catch (e) {
            console.warn('Cambio de enfoque no soportado:', e);
        }
    }, [focusMode, onError]);

    // Reproducir sonido de escaneo
    const playBeep = useCallback(() => {
        if (!enableSound) return;
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.frequency.value = 800;
            gain.gain.setValueAtTime(0.3, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch {
            console.warn('No se pudo reproducir sonido de escaneo');
        }
    }, [enableSound]);

    // Vibración táctil
    const triggerHaptic = useCallback(() => {
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }, []);

    return (
        <div className={`relative bg-black rounded-lg overflow-hidden ${containerClassName}`}>
            {/* Video con mejoras de foto */}
            <div className="relative w-full aspect-video bg-black">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ display: brightness !== 100 || contrast !== 100 ? 'block' : 'none' }}
                />

                {/* Guía visual mejorada para carnet chileno */}
                {showGuide === 'qr' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative bg-black/40 absolute inset-0" />
                        <div className="relative w-80 h-52 border-4 border-green-400 rounded-xl shadow-2xl z-10"
                            style={{
                                boxShadow: '0 0 40px rgba(34, 197, 94, 0.5), inset 0 0 20px rgba(34, 197, 94, 0.1)',
                                animation: 'pulse 2s ease-in-out infinite'
                            }}>
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-300" />
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-300" />
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-300" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-300" />
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-300 to-transparent animate-scan" />
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-12 bg-green-400/60 rounded" />
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-12 bg-green-400/60 rounded" />
                            <div className="absolute -bottom-16 left-0 right-0 text-center">
                                <p className="text-white text-sm font-semibold">Coloca el carnet dentro del cuadro</p>
                                <p className="text-green-300 text-xs mt-1">Asegúrate que el QR esté visible</p>
                            </div>
                        </div>
                    </div>
                )}

                {showGuide === 'code128' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg className="w-64 h-20 text-green-400/30" viewBox="0 0 300 50">
                            <line x1="0" y1="10" x2="300" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                            {Array.from({ length: 15 }).map((_, i) => (
                                <line
                                    key={i}
                                    x1={i * 20 + 10}
                                    y1="5"
                                    x2={i * 20 + 10}
                                    y2="35"
                                    stroke="currentColor"
                                    strokeWidth={Math.random() > 0.5 ? 3 : 1}
                                    opacity="0.5"
                                />
                            ))}
                            <line x1="0" y1="40" x2="300" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                        </svg>
                    </div>
                )}

                {/* Indicador de escaneo activo */}
                {isActive && (
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <div className="flex h-2 w-2 items-center justify-center">
                            <div className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></div>
                            <div className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></div>
                        </div>
                        <span className="text-xs text-green-400">Escaneando</span>
                    </div>
                )}
            </div>

            {/* Controles */}
            {allowControls && (
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 px-4">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={toggleTorch}
                        className="bg-gray-700/50 hover:bg-gray-600/50 text-white"
                        title="Alternar linterna"
                    >
                        {torchOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleFocusMode}
                        className="bg-gray-700/50 hover:bg-gray-600/50 text-white"
                        title="Cambiar modo de enfoque"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </Button>

                    {/* Slider de brillo */}
                    <div className="flex items-center gap-2 bg-gray-700/50 px-2 py-1 rounded">
                        <span className="text-xs text-gray-200">Brillo:</span>
                        <input
                            type="range"
                            min="50"
                            max="150"
                            value={brightness}
                            onChange={(e) => setBrightness(Number(e.target.value))}
                            className="w-20 h-1"
                        />
                    </div>

                    {/* Slider de contraste */}
                    <div className="flex items-center gap-2 bg-gray-700/50 px-2 py-1 rounded">
                        <span className="text-xs text-gray-200">Contraste:</span>
                        <input
                            type="range"
                            min="50"
                            max="150"
                            value={contrast}
                            onChange={(e) => setContrast(Number(e.target.value))}
                            className="w-20 h-1"
                        />
                    </div>
                </div>
            )}
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
      `}</style>
        </div>
    );
}
