import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Camera, CameraOff } from 'lucide-react';

export interface TotemScannerPanelProps {
    onRutDetected: (rut: string) => void;
    onError?: (error: string) => void;
}

export default function TotemScannerPanel({ onRutDetected, onError }: TotemScannerPanelProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string>('');
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [output, setOutput] = useState<string>('—');
    const [runOutput, setRunOutput] = useState<string>('—');
    const [scanSuccess, setScanSuccess] = useState(false);
    const lastScanAtRef = useRef<number>(0);
    const isMountedRef = useRef(true);

    /**
     * Extraer RUN del contenido QR
     */
    const extractRUN = useCallback((text: string): string | null => {
        if (!text) return null;
        const t = text.replace(/\s+/g, ' ').trim();

        // URL con parámetro
        try {
            const decoded = decodeURIComponent(t);
            const urlMatch = decoded.match(/https?:[^\s]+/i);
            const candidateUrl = urlMatch ? urlMatch[0] : decoded;
            const u = new URL(candidateUrl);
            const paramRun = u.searchParams.get('run') || u.searchParams.get('RUN');
            const paramRut = u.searchParams.get('rut') || u.searchParams.get('RUT');
            const fromParam = (paramRun || paramRut || '').trim();
            if (fromParam) {
                const cleaned = fromParam.replace(/\./g, '').replace(/\s+/g, '');
                const m = cleaned.match(/([0-9]{6,9})-?([0-9kK])/);
                if (m) return `${m[1]}-${m[2]}`;
            }
        } catch { /* no URL */ }

        // Etiqueta RUN/RUT
        const withLabel = t.match(/RU[NT]\s*[=:]?\s*([0-9\.]{6,12})[-\s]?([0-9kK])/i);
        if (withLabel) return `${withLabel[1].replace(/\./g, '')}-${withLabel[2]}`;

        // Explícito con guión
        const explicit = t.match(/([0-9]{6,9})\s*-\s*([0-9kK])/);
        if (explicit) return `${explicit[1]}-${explicit[2]}`;

        // Contiguos
        const contiguous = t.match(/([0-9]{6,9})\s*([0-9kK])/);
        if (contiguous) return `${contiguous[1]}-${contiguous[2]}`;

        // Con puntos
        const dotted = t.match(/([0-9\.]{6,12})[-\s]?([0-9kK])/);
        if (dotted) {
            const num = dotted[1].replace(/\./g, '');
            if (num.length >= 6 && num.length <= 9) return `${num}-${dotted[2]}`;
        }

        return null;
    }, []);

    // Inicializar
    useEffect(() => {
        isMountedRef.current = true;
        const codeReader = new BrowserQRCodeReader();
        codeReaderRef.current = codeReader;

        BrowserQRCodeReader.listVideoInputDevices()
            .then(videoDevices => {
                setDevices(videoDevices);
                if (videoDevices.length > 0) {
                    const stored = localStorage.getItem('totem_camera_id') || '';
                    const exists = videoDevices.find(d => d.deviceId === stored);
                    const backCamera = videoDevices.find(d =>
                        d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera')
                    );
                    setSelectedDeviceId(exists ? stored : (backCamera?.deviceId || videoDevices[0].deviceId));
                }
            })
            .catch(err => {
                setError('No se pudieron detectar cámaras');
                onError?.(err.message);
            });

        return () => {
            isMountedRef.current = false;
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
        };
    }, [onError]);

    // Iniciar
    const startCamera = useCallback(async () => {
        if (!selectedDeviceId || !videoRef.current || !codeReaderRef.current) return;

        setIsScanning(true);
        setError('');
        setOutput('Buscando código QR...');

        try {
            await codeReaderRef.current.decodeFromVideoDevice(
                selectedDeviceId,
                videoRef.current,
                (result) => {
                    if (result) {
                        const text = result.getText();
                        console.log('✓ QR:', text);
                        setOutput(text);

                        const run = extractRUN(text);
                        if (run && Date.now() - lastScanAtRef.current > 1500) {
                            lastScanAtRef.current = Date.now();
                            console.log('✓ RUN:', run);
                            setRunOutput(run);
                            if (navigator.vibrate) navigator.vibrate(200);
                            setScanSuccess(true);
                            setTimeout(() => {
                                setScanSuccess(false);
                                onRutDetected(run);
                            }, 600);
                        }
                    }
                }
            );
            localStorage.setItem('totem_camera_id', selectedDeviceId);
        } catch (err: any) {
            setError('Error: ' + err.message);
            onError?.(err.message);
            setIsScanning(false);
        }
    }, [selectedDeviceId, extractRUN, onRutDetected, onError]);

    // Detener
    const stopCamera = useCallback(() => {
        try {
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
            }
            if (videoRef.current?.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
                videoRef.current.srcObject = null;
            }
        } catch (err) {
            console.warn('Error al detener cámara:', err);
        }
        // Solo actualizar estado si el componente sigue montado
        if (isMountedRef.current) {
            setIsScanning(false);
            setOutput('—');
            setRunOutput('—');
        }
    }, []);

    // Auto-iniciar (sin startCamera en dependencias para evitar loop)
    useEffect(() => {
        if (selectedDeviceId && !isScanning && codeReaderRef.current) {
            startCamera();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDeviceId]);

    return (
        <div className="w-full h-full flex flex-col gap-4">
            <div className="relative w-full bg-black rounded-md overflow-hidden" style={{ minHeight: '300px' }}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
                    <div style={{
                        width: '55%',
                        maxWidth: 360,
                        aspectRatio: '1 / 1',
                        border: '4px solid rgba(255,255,255,0.9)',
                        boxShadow: '0 0 30px rgba(0,0,0,0.35)',
                        borderRadius: 12
                    }} />
                </div>

                {isScanning && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                        <div className="flex h-2 w-2">
                            <div className="animate-ping absolute h-2 w-2 rounded-full bg-green-400 opacity-75" />
                            <div className="relative h-2 w-2 rounded-full bg-green-500" />
                        </div>
                        <span className="text-xs text-green-400">Escaneando</span>
                    </div>
                )}

                {scanSuccess && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(34, 197, 94, 0.3)',
                        border: '4px solid #22c55e',
                        pointerEvents: 'none'
                    }} />
                )}
            </div>

            <div className="flex gap-2 flex-wrap items-center">
                <button
                    onClick={isScanning ? stopCamera : startCamera}
                    className={`px-4 py-2 rounded font-semibold text-white flex items-center gap-2 ${
                        isScanning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                >
                    {isScanning ? (
                        <>
                            <CameraOff size={18} />
                            Detener
                        </>
                    ) : (
                        <>
                            <Camera size={18} />
                            Iniciar
                        </>
                    )}
                </button>
                {devices.length > 0 && (
                    <select
                        className="border rounded px-2 py-2 text-sm"
                        value={selectedDeviceId}
                        onChange={e => {
                            setSelectedDeviceId(e.target.value);
                            localStorage.setItem('totem_camera_id', e.target.value);
                        }}
                        disabled={isScanning}
                    >
                        {devices.map(d => (
                            <option key={d.deviceId} value={d.deviceId}>
                                {d.label || `Cámara ${d.deviceId.substring(0, 5)}`}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {error && <div className="border border-red-300 bg-red-50 rounded p-3 text-sm text-red-700">{error}</div>}

            <div className="border rounded p-3 bg-white">
                <strong>Resultado:</strong>
                <div className="text-sm break-words">{output}</div>
                <div className="mt-3 pt-3 border-t">
                    <strong>RUN detectado:</strong>
                    <div className="text-sm font-mono">{runOutput}</div>
                </div>
            </div>
        </div>
    );
}
