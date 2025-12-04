import React from 'react';
import { BarcodeFormat } from '@zxing/library';
import { useScanner } from '@/hooks/useScanner';
import { parseChileanIDFromPdf417 } from '@/utils/parseChileanID';
import { formatRutOnType, validateRut, cleanRut, formatRut } from '@/utils/rut';
import { trabajadorService } from '@/services/trabajador.service';
import { CheckCircle2, AlertCircle } from 'lucide-react';

type Props = {
    onRutDetected: (rut: string) => void;
    onManualRut: (rut: string) => void;
    onConsultIncident?: () => void;
    onReportIncident?: () => void;
};

export default function TotemInitialScreen({ onRutDetected, onManualRut, onConsultIncident, onReportIncident }: Props) {
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const [rutInput, setRutInput] = React.useState('');
    const [beneficioStatus, setBeneficioStatus] = React.useState<{
        loading: boolean;
        error: string | null;
        data: any | null;
    }>({ loading: false, error: null, data: null });

    const scanner = useScanner({
        formats: [BarcodeFormat.PDF_417],
        onResult: (text) => {
            const parsed = parseChileanIDFromPdf417(text);
            if (parsed?.rut) onRutDetected(parsed.rut);
        },
        onError: (err) => {
            console.error('Scanner error', err);
        },
    });

    React.useEffect(() => {
        if (videoRef.current) {
            scanner.start(videoRef.current).catch(console.error);
        }
        return () => scanner.stop();
    }, []);

    const handleRutInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatRutOnType(e.target.value);
        setRutInput(formatted);
        setBeneficioStatus({ loading: false, error: null, data: null });
    };

    const handleVerifyBenefit = async () => {
        if (!rutInput || !validateRut(rutInput)) {
            setBeneficioStatus({
                loading: false,
                error: 'RUT inválido. Verifica el formato.',
                data: null,
            });
            return;
        }

        setBeneficioStatus({ loading: true, error: null, data: null });
        try {
            // Formatear RUT con guión para el backend
            const formattedRut = formatRut(rutInput);
            // Get current ciclo_id from localStorage or API
            const userData = localStorage.getItem('user');
            const cicloActual = localStorage.getItem('ciclo_id');

            const cicloId = cicloActual ? parseInt(cicloActual, 10) : undefined;

            // Si no hay ciclo activo, mostrar mensaje específico
            if (!cicloId) {
                setBeneficioStatus({
                    loading: false,
                    error: 'Sin beneficio momentáneamente. No hay ciclo activo.',
                    data: null,
                });
                return;
            }

            const result = await trabajadorService.getBeneficio(formattedRut, cicloId);

            setBeneficioStatus({
                loading: false,
                error: null,
                data: result.beneficio,
            });
        } catch (error: any) {
            // Analizar el tipo de error
            const errorMsg = error?.detail || error?.message || '';
            let customMessage = 'No se pudo verificar el beneficio';

            // Si el error indica que no está en la nómina o no tiene beneficio
            if (errorMsg.toLowerCase().includes('no encontrado') ||
                errorMsg.toLowerCase().includes('no está en') ||
                errorMsg.toLowerCase().includes('no tiene beneficio') ||
                error?.status === 404) {
                customMessage = 'No tiene beneficio en este ciclo';
            }

            setBeneficioStatus({
                loading: false,
                error: customMessage,
                data: null,
            });
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4">
            <h2 className="text-2xl font-semibold">Escanea tu cédula o ingresa tu RUT</h2>
            <div className="w-full max-w-lg aspect-video bg-black rounded-md overflow-hidden">
                <video ref={videoRef} className="w-full h-full" muted playsInline />
            </div>

            {/* RUT Input Section */}
            <div className="w-full max-w-lg">
                <input
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 font-mono text-lg tracking-wider focus:border-[#017E49] focus:outline-none focus:ring-2 focus:ring-[#017E49]/20 transition-all"
                    placeholder="12.345.678-9"
                    value={rutInput}
                    onChange={handleRutInputChange}
                    maxLength={12}
                />
            </div>

            {/* Benefit Verification Button */}
            <div className="w-full max-w-lg">
                <button
                    className="w-full px-6 py-4 bg-[#017E49] text-white rounded-xl font-bold hover:bg-[#015A34] disabled:bg-gray-400 flex items-center justify-center gap-2 transition-colors shadow-md"
                    onClick={handleVerifyBenefit}
                    disabled={!rutInput || !validateRut(rutInput) || beneficioStatus.loading}
                >
                    {beneficioStatus.loading ? (
                        <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Verificando beneficio...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 size={20} />
                            Verificar Beneficio
                        </>
                    )}
                </button>
            </div>

            {/* Benefit Status Display */}
            {beneficioStatus.data && (
                <div className="w-full max-w-lg bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="text-emerald-600 flex-shrink-0 mt-1" size={20} />
                        <div className="flex-1">
                            <h3 className="font-semibold text-emerald-900">Beneficio Activo</h3>
                            <p className="text-sm text-emerald-800 mt-1">
                                <strong>Nombre:</strong> {beneficioStatus.data.nombre}
                            </p>
                            {beneficioStatus.data.beneficio_disponible?.tipo && (
                                <p className="text-sm text-emerald-800">
                                    <strong>Tipo:</strong> {beneficioStatus.data.beneficio_disponible.tipo}
                                </p>
                            )}
                            {beneficioStatus.data.beneficio_disponible?.categoria && (
                                <p className="text-sm text-emerald-800">
                                    <strong>Categoría:</strong> {beneficioStatus.data.beneficio_disponible.categoria}
                                </p>
                            )}
                            {beneficioStatus.data.beneficio_disponible?.ciclo_id && (
                                <p className="text-sm text-emerald-800">
                                    <strong>Ciclo:</strong> {beneficioStatus.data.beneficio_disponible.ciclo_id}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {beneficioStatus.error && (
                <div className="w-full max-w-lg bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
                        <div>
                            <h3 className="font-semibold text-red-900">Error al verificar beneficio</h3>
                            <p className="text-sm text-red-800 mt-1">{beneficioStatus.error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Support Buttons */}
            <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
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
