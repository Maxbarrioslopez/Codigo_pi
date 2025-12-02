import React from 'react';
import { BarcodeFormat } from '@zxing/library';
import { useScanner } from '@/hooks/useScanner';
import { parseChileanIDFromPdf417 } from '@/utils/parseChileanID';

type Props = {
    onRutDetected: (rut: string) => void;
    onManualRut: (rut: string) => void;
    onConsultIncident?: () => void;
    onReportIncident?: () => void;
};

export default function TotemInitialScreen({ onRutDetected, onManualRut, onConsultIncident, onReportIncident }: Props) {
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const scanner = useScanner({
        formats: [BarcodeFormat.PDF_417],
        onResult: (text) => {
            const parsed = parseChileanIDFromPdf417(text);
            if (parsed?.rut) onRutDetected(parsed.rut);
        },
        onError: (err) => {
            // non-blocking: could show toast
            console.error('Scanner error', err);
        },
    });

    React.useEffect(() => {
        if (videoRef.current) {
            scanner.start(videoRef.current).catch(console.error);
        }
        return () => scanner.stop();
    }, []);

    const [rutInput, setRutInput] = React.useState('');

    return (
        <div className="flex flex-col items-center gap-4 p-4">
            <h2 className="text-2xl font-semibold">Escanea tu cédula o ingresa tu RUT</h2>
            <div className="w-full max-w-lg aspect-video bg-black rounded-md overflow-hidden">
                <video ref={videoRef} className="w-full h-full" muted playsInline />
            </div>
            <div className="w-full max-w-lg flex gap-2">
                <input
                    className="flex-1 border rounded px-3 py-2"
                    placeholder="12345678-9"
                    value={rutInput}
                    onChange={(e) => setRutInput(e.target.value)}
                />
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                    onClick={() => onManualRut(rutInput)}
                >
                    Validar RUT
                </button>
            </div>
            <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <button
                    className="px-4 py-2 bg-white border rounded hover:bg-gray-50"
                    onClick={() => onConsultIncident?.()}
                >
                    Consultar incidencia
                </button>
                <button
                    className="px-4 py-2 bg-white border rounded hover:bg-gray-50"
                    onClick={() => onReportIncident?.()}
                >
                    Reportar incidencia
                </button>
            </div>
        </div>
    );
}
