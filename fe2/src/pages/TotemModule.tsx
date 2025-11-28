import { useState, useRef, useEffect } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';
import api from '../api/client';
import './TotemModule.css';

type Screen = 'menu' | 'scan' | 'consultar' | 'reportar';

export const TotemModule = () => {
    const [screen, setScreen] = useState<Screen>('menu');
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState('');
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>('');
    const [incidencias, setIncidencias] = useState<any[]>([]);
    const [tipoIncidencia, setTipoIncidencia] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [submitting, setSubmitting] = useState(false);
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
                        const qrCode = res.getText();
                        await validarBeneficio(qrCode);
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

    const validarBeneficio = async (rut: string) => {
        try {
            const response = await api.get(`/beneficios/${rut}/`);
            setResult(`Beneficio validado para ${response.data.beneficio?.nombre || rut}`);
            setTimeout(() => setResult(''), 5000);
        } catch (err: any) {
            console.error('Error validando beneficio:', err);
            setError(err.response?.data?.detail || 'Error al validar beneficio');
            setTimeout(() => setError(''), 5000);
        }
    };

    const consultarIncidencias = async () => {
        try {
            const response = await api.get('/incidencias/listar/');
            setIncidencias(response.data || []);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al cargar incidencias');
        }
    };

    const reportarIncidencia = async () => {
        if (!tipoIncidencia) return;
        setSubmitting(true);
        setError('');
        try {
            await api.post('/incidencias/', {
                tipo: tipoIncidencia,
                descripcion,
                origen: 'totem',
            });
            setResult('Incidencia reportada exitosamente');
            setTipoIncidencia('');
            setDescripcion('');
            setTimeout(() => {
                setResult('');
                setScreen('menu');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error al reportar incidencia');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (screen === 'consultar') consultarIncidencias();
    }, [screen]);

    return (
        <div className="totem-module">
            {screen === 'menu' && (
                <div className="totem-menu">
                    <h1>Tótem de Autoservicio</h1>
                    <div className="menu-buttons">
                        <button onClick={() => setScreen('scan')} className="menu-btn">
                            Escanear QR (Beneficio)
                        </button>
                        <button onClick={() => setScreen('consultar')} className="menu-btn">
                            Ver Incidencias
                        </button>
                        <button onClick={() => setScreen('reportar')} className="menu-btn">
                            Reportar Incidencia
                        </button>
                    </div>
                </div>
            )}

            {screen === 'scan' && (
                <div className="totem-scan">
                    <button onClick={() => setScreen('menu')} className="back-btn">← Volver</button>
                    <h2>Escanear QR</h2>
                    <div className="camera-container">
                        <video ref={videoRef} className={`camera-preview ${scanning ? 'active' : ''}`} />
                        {!scanning && (
                            <div className="camera-overlay">
                                <div className="qr-frame" />
                                <p>Presiona "Iniciar Escaneo"</p>
                            </div>
                        )}
                    </div>
                    {devices.length > 1 && (
                        <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)} disabled={scanning}>
                            {devices.map((d) => (
                                <option key={d.deviceId} value={d.deviceId}>
                                    {d.label || `Cámara ${d.deviceId.substring(0, 8)}`}
                                </option>
                            ))}
                        </select>
                    )}
                    <button onClick={scanning ? stopScanning : startScanning} className="btn-scan">
                        {scanning ? 'Detener' : 'Iniciar Escaneo'}
                    </button>
                    {result && <div className="result success">{result}</div>}
                    {error && <div className="result error">{error}</div>}
                </div>
            )}

            {screen === 'consultar' && (
                <div className="totem-consultar">
                    <button onClick={() => setScreen('menu')} className="back-btn">← Volver</button>
                    <h2>Ver Incidencias</h2>
                    {error && <div className="result error">{error}</div>}
                    <div style={{ overflowX: 'auto' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Tipo</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incidencias.length === 0 ? (
                                    <tr><td colSpan={4}>Sin incidencias</td></tr>
                                ) : (
                                    incidencias.map((i) => (
                                        <tr key={i.id}>
                                            <td>{i.codigo}</td>
                                            <td>{i.tipo}</td>
                                            <td>{i.estado}</td>
                                            <td>{new Date(i.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {screen === 'reportar' && (
                <div className="totem-reportar">
                    <button onClick={() => setScreen('menu')} className="back-btn">← Volver</button>
                    <h2>Reportar Incidencia</h2>
                    <label>
                        Tipo:
                        <select value={tipoIncidencia} onChange={(e) => setTipoIncidencia(e.target.value)}>
                            <option value="">Seleccionar</option>
                            <option value="Documento ilegible">Documento ilegible</option>
                            <option value="Ticket dañado">Ticket dañado</option>
                            <option value="Datos incorrectos">Datos incorrectos</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </label>
                    <label>
                        Descripción:
                        <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={4} />
                    </label>
                    <button onClick={reportarIncidencia} disabled={!tipoIncidencia || submitting} className="btn-submit">
                        {submitting ? 'Enviando...' : 'Enviar Incidencia'}
                    </button>
                    {result && <div className="result success">{result}</div>}
                    {error && <div className="result error">{error}</div>}
                </div>
            )}
        </div>
    );
};
