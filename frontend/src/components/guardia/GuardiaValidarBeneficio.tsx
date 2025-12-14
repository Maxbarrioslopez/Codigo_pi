import React, { useState, useRef } from 'react';
import { Check, X, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import { guardiaService } from '@/services/guardia.service';

interface GuardiaValidarBeneficioProps {
    beneficio: any;
    onValidacionExitosa: (resultado: any) => void;
    onCancelar: () => void;
}

export default function GuardiaValidarBeneficio({
    beneficio,
    onValidacionExitosa,
    onCancelar
}: GuardiaValidarBeneficioProps) {
    const [codigoEscaneado, setCodigoEscaneado] = useState('');
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<any>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleValidar = async () => {
        if (!codigoEscaneado.trim()) {
            setResultado({
                exitoso: false,
                mensaje: 'Ingresa el código del QR o escanea',
                razones: ['Código vacío']
            });
            return;
        }

        setLoading(true);
        try {
            const resultado = await guardiaService.validarBeneficio(beneficio.id, codigoEscaneado);
            setResultado(resultado);

            if (resultado.exitoso) {
                setTimeout(() => onValidacionExitosa(resultado), 1500);
            }
        } catch (error: any) {
            setResultado({
                exitoso: false,
                mensaje: error.message || 'Error en validación',
                razones: []
            });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleValidar();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <div className="flex items-center gap-3 mb-2">
                    <button
                        onClick={onCancelar}
                        className="p-2 hover:bg-blue-500 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold">Validar Beneficio</h1>
                        <p className="text-blue-100 mt-1">Escanea el código QR o ingresa manualmente</p>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
                <div className="space-y-6 max-w-2xl mx-auto w-full">
                    {/* Información del beneficio */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <h3 className="font-bold text-blue-900 mb-3">Información del Beneficio</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-blue-700">Trabajador:</span>
                                <span className="font-semibold text-blue-900">{beneficio?.trabajador?.nombre}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-700">RUT:</span>
                                <span className="font-semibold font-mono text-blue-900">{beneficio?.trabajador?.rut}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-700">Beneficio:</span>
                                <span className="font-semibold text-blue-900">{beneficio?.tipo_beneficio?.nombre}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-700">Ciclo:</span>
                                <span className="font-semibold text-blue-900">{beneficio?.ciclo?.nombre}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-700">Estado:</span>
                                <span className={`font-semibold px-3 py-1 rounded-full text-white ${
                                    beneficio?.estado === 'validado' ? 'bg-green-600' :
                                    beneficio?.estado === 'pendiente' ? 'bg-yellow-600' : 'bg-red-600'
                                }`}>
                                    {beneficio?.estado?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Entrada de código */}
                    <div className="space-y-4">
                        <label className="block text-lg font-bold text-gray-800">
                            Código del QR
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={codigoEscaneado}
                            onChange={(e) => {
                                setCodigoEscaneado(e.target.value);
                                setResultado(null);
                            }}
                            onKeyPress={handleKeyPress}
                            placeholder="Escanea el código QR aquí..."
                            className="w-full px-4 py-3 text-2xl border-3 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-center"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    {/* Resultado */}
                    {resultado && (
                        <div
                            className={`rounded-lg p-4 border-2 ${
                                resultado.exitoso
                                    ? 'bg-green-50 border-green-400'
                                    : 'bg-red-50 border-red-400'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                {resultado.exitoso ? (
                                    <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <X className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <p
                                        className={`font-bold text-lg ${
                                            resultado.exitoso ? 'text-green-900' : 'text-red-900'
                                        }`}
                                    >
                                        {resultado.exitoso ? '✓ Validación Exitosa' : '✗ Validación Fallida'}
                                    </p>
                                    {resultado.razones && resultado.razones.length > 0 && (
                                        <ul className="mt-2 text-sm space-y-1">
                                            {resultado.razones.map((razon: string, idx: number) => (
                                                <li key={idx} className={resultado.exitoso ? 'text-green-700' : 'text-red-700'}>
                                                    {razon}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Botones */}
                <div className="max-w-2xl mx-auto w-full mt-6 space-y-3 border-t border-gray-200 pt-6">
                    <button
                        onClick={handleValidar}
                        disabled={loading || !codigoEscaneado.trim()}
                        className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2 text-lg transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Validando...
                            </>
                        ) : (
                            <>
                                <Check className="w-5 h-5" />
                                Validar Código
                            </>
                        )}
                    </button>
                    <button
                        onClick={onCancelar}
                        className="w-full px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 inline mr-2" />
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}
