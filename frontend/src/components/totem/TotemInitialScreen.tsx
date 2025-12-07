import React from 'react';
import { formatRutOnType, validateRut, cleanRut, formatRut } from '@/utils/rut';
import { trabajadorService } from '@/services/trabajador.service';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import TotemScannerPanel from '@/components/TotemScannerPanel';

type Props = {
    onRutDetected: (rut: string) => void;
    onManualRut: (rut: string) => void;
    onConsultIncident?: () => void;
    onReportIncident?: () => void;
};

export default function TotemInitialScreen({ onRutDetected, onManualRut, onConsultIncident, onReportIncident }: Props) {
    const [rutInput, setRutInput] = React.useState('');
    const [trabajadorNombre, setTrabajadorNombre] = React.useState<string | null>(null);
    const [beneficioStatus, setBeneficioStatus] = React.useState<{
        loading: boolean;
        error: string | null;
        data: any | null;
    }>({ loading: false, error: null, data: null });

    const handleRutInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatRutOnType(e.target.value);
        setRutInput(formatted);
        setBeneficioStatus({ loading: false, error: null, data: null });
        
        // Buscar nombre si el RUT es válido
        if (formatted && validateRut(formatted)) {
            obtenerDatosTrabajador(formatted);
        } else {
            setTrabajadorNombre(null);
        }
    };

    // Obtener datos básicos del trabajador (nombre)
    const obtenerDatosTrabajador = async (rut: string) => {
        try {
            const response = await fetch(`/api/trabajadores-datos/${rut}/`);
            const data = await response.json();
            if (data.existe) {
                setTrabajadorNombre(data.nombre);
                return data.nombre;
            } else {
                setTrabajadorNombre(null);
                return null;
            }
        } catch (error) {
            console.error('Error obteniendo datos del trabajador:', error);
            setTrabajadorNombre(null);
            return null;
        }
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

            {/* Escáner mejorado con cuadro de enfoque */}
            <div className="w-full max-w-lg bg-black rounded-md overflow-hidden border-2 border-gray-300" style={{ minHeight: '300px' }}>
                <TotemScannerPanel
                    onRutDetected={async (rut) => {
                        const formatted = formatRut(rut);
                        setRutInput(formatted);
                        
                        // Buscar nombre del trabajador
                        await obtenerDatosTrabajador(rut);
                        
                        onRutDetected(rut);
                    }}
                    }}
                    onError={(msg) => {
                        setBeneficioStatus({
                            loading: false,
                            error: msg,
                            data: null,
                        });
                    }}
                />
            </div>

            {/* Separador visual */}
            <div className="w-full max-w-lg flex items-center gap-2">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-gray-500 text-sm">O ingresa manualmente</span>
                <div className="flex-1 border-t border-gray-300"></div>
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

            {/* Trabajador encontrado */}
            {trabajadorNombre && (
                <div className="w-full max-w-lg bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle2 className="text-blue-600 flex-shrink-0" size={20} />
                    <div>
                        <p className="text-sm text-blue-600">
                            <strong>Persona encontrada:</strong>
                        </p>
                        <p className="text-blue-900 font-semibold">{trabajadorNombre}</p>
                    </div>
                </div>
            )}

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
