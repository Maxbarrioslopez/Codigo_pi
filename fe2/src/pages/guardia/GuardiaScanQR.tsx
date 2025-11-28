import { useState, useRef, useEffect } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';
import api from '../../api/client';

export const GuardiaScanQR = () => {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);

    useEffect(() => {
        initCamera();
        return () => stopScanning();
    }, []);

    const initCamera = async () => {
        try {
            const codeReader = new BrowserQRCodeReader();
            codeReaderRef.current = codeReader;
            const videoDevices = await codeReader.listVideoInputDevices();
            setDevices(videoDevices);
            if (videoDevices.length > 0) setSelectedDevice(videoDevices[0].deviceId);
        } catch (err) {
            console.error('Error initializing camera:', err);
            setError('Error al inicializar la cámara');
        }
    };

    const startScanning = async () => {
        if (!codeReaderRef.current || !videoRef.current) return;
        setScanning(true);
        setError('');
        setResult('');
        try {
            const deviceId = selectedDevice || null;
            await codeReaderRef.current.decodeFromVideoDevice(
                deviceId,
                videoRef.current,
                async (res, err) => {
                    if (res) {
                        const uuid = res.getText();
                        await validarTicket(uuid);
                        stopScanning();
                    }
                    if (err && !(err.name === 'NotFoundException')) {
                        console.error('QR scan error:', err);
                    }
                }
            );
        } catch (err) {
            console.error('Error starting scan:', err);
            setError('Error al iniciar el escaneo');
            setScanning(false);
        }
    };

    const stopScanning = () => {
        if (codeReaderRef.current) codeReaderRef.current.reset();
        setScanning(false);
    };

    const validarTicket = async (uuid: string) => {
        try {
            const response = await api.post(`/tickets/${uuid}/validar_guardia/`, {});
            setResult(`Ticket validado: ${response.data.estado}`);
            setTimeout(() => setResult(''), 5000);
        } catch (err: any) {
            console.error('Error validando ticket:', err);
            setError(err.response?.data?.detail || 'Error al validar ticket');
            setTimeout(() => setError(''), 5000);
        }
    };

    return (
        <div style={{ padding: '1.5rem' }}>
            <h1>Guardia - Escanear QR</h1>
            <div style={{ marginTop: '1rem' }}>
                <video ref={videoRef} style={{ width: '100%', maxWidth: '400px', border: '2px solid #ccc', borderRadius: '8px' }} />
            </div>
            {devices.length > 1 && (
                <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)} disabled={scanning} style={{ marginTop: '0.5rem' }}>
                    {devices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Cámara ${d.deviceId.substring(0, 8)}`}
                        </option>
                    ))}
                </select>
            )}
            <div style={{ marginTop: '1rem' }}>
                <button onClick={scanning ? stopScanning : startScanning} style={{ padding: '0.5rem 1rem' }}>
                    {scanning ? 'Detener' : 'Iniciar Escaneo'}
                </button>
            </div>
            {result && <div style={{ color: 'green', marginTop: '1rem' }}>{result}</div>}
            {error && <div style={{ color: 'crimson', marginTop: '1rem' }}>{error}</div>}
        </div>
    );
};
