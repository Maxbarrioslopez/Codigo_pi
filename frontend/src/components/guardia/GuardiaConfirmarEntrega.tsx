import React, { useState } from 'react';
import { CheckCircle2, Loader, AlertCircle, Package, ArrowLeft, X } from 'lucide-react';
import { guardiaService } from '@/services/guardia.service';

interface GuardiaConfirmarEntregaProps {
    beneficio: any;
    onEntregaExitosa: (resultado: any) => void;
    onVolver: () => void;
}

export default function GuardiaConfirmarEntrega({
    beneficio,
    onEntregaExitosa,
    onVolver
}: GuardiaConfirmarEntregaProps) {
    const [cajaFisicaCodigo, setCajaFisicaCodigo] = useState('');
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<any>(null);

    const handleConfirmarEntrega = async () => {
        setLoading(true);
        try {
            const resultado = await guardiaService.confirmarEntrega(beneficio.id, cajaFisicaCodigo || undefined);
            setResultado(resultado);

            if (resultado.exitoso) {
                setTimeout(() => {
                    onEntregaExitosa(resultado);
                }, 1500);
            }
        } catch (error: any) {
            setResultado({
                exitoso: false,
                mensaje: error.message || 'Error confirmando entrega',
                razones: []
            });
        } finally {
            setLoading(false);
        }
    };

    // Pantalla de éxito
    if (resultado?.exitoso) {
        return (
            <div className="flex flex-col h-screen bg-green-50 justify-center items-center p-6">
                <div className="text-center space-y-6">
                    <CheckCircle2 className="w-32 h-32 text-green-600 mx-auto" />
                    <h2 className="text-4xl font-bold text-green-900">¡Entrega Completada!</h2>
                    
                    <div className="bg-white rounded-lg p-6 shadow-lg max-w-md mx-auto space-y-3 text-left">
                        <div>
                            <p className="text-sm text-gray-600">Trabajador</p>
                            <p className="font-bold text-lg text-gray-900">{beneficio?.trabajador?.nombre}</p>
                        </div>
                        <div className="border-t pt-3">
                            <p className="text-sm text-gray-600">Beneficio</p>
                            <p className="font-bold text-gray-900">{beneficio?.tipo_beneficio?.nombre}</p>
                        </div>
                        {cajaFisicaCodigo && (
                            <div className="border-t pt-3 bg-amber-50">
                                <p className="text-sm text-amber-700">Caja Entregada</p>
                                <p className="font-bold text-amber-900 text-lg">{cajaFisicaCodigo}</p>
                            </div>
                        )}
                    </div>

                    <p className="text-green-700 text-sm mt-6">Redirigiendo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
                <div className="flex items-center gap-3 mb-2">
                    <button
                        onClick={onVolver}
                        className="p-2 hover:bg-purple-500 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold">Confirmar Entrega</h1>
                        <p className="text-purple-100 mt-1">Registro de caja física (opcional)</p>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
                <div className="max-w-2xl mx-auto w-full space-y-6">
                    {/* Estado validado */}
                    <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                            <h3 className="font-bold text-green-900 text-lg">Beneficio Validado</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-green-700">Trabajador:</span>
                                <span className="font-semibold text-green-900">{beneficio?.trabajador?.nombre}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-green-700">Beneficio:</span>
                                <span className="font-semibold text-green-900">{beneficio?.tipo_beneficio?.nombre}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-green-700">Ciclo:</span>
                                <span className="font-semibold text-green-900">{beneficio?.ciclo?.nombre}</span>
                            </div>
                        </div>
                    </div>

                    {/* Caja física */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-lg font-bold text-gray-800 mb-3">
                                <Package className="w-5 h-5 inline mr-2" />
                                Código de Caja Física (Opcional)
                            </label>
                            <input
                                type="text"
                                value={cajaFisicaCodigo}
                                onChange={(e) => {
                                    setCajaFisicaCodigo(e.target.value);
                                    setResultado(null);
                                }}
                                placeholder="Ingresa el código de la caja..."
                                className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none font-mono"
                                disabled={loading}
                            />
                            <p className="text-xs text-gray-500 mt-2">Este paso es opcional. Puedes dejar en blanco.</p>
                        </div>
                    </div>

                    {/* Error */}
                    {resultado && !resultado.exitoso && (
                        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <X className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-bold text-red-900">Error en la entrega</p>
                                    {resultado.razones && resultado.razones.length > 0 && (
                                        <ul className="mt-2 text-sm space-y-1">
                                            {resultado.razones.map((razon: string, idx: number) => (
                                                <li key={idx} className="text-red-700">
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
                        onClick={handleConfirmarEntrega}
                        disabled={loading}
                        className="w-full px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center justify-center gap-2 text-lg transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Completando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                Confirmar Entrega
                            </>
                        )}
                    </button>
                    <button
                        onClick={onVolver}
                        className="w-full px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 inline mr-2" />
                        Volver a Validación
                    </button>
                </div>
            </div>
        </div>
    );
}
