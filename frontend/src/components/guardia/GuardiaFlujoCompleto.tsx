import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { beneficioService } from '@/services/beneficio.service';
import GuardiaValidarBeneficio from './GuardiaValidarBeneficio';
import GuardiaConfirmarEntrega from './GuardiaConfirmarEntrega';

type FlowStep = 'lookup' | 'validar' | 'confirmar' | 'completado';

interface GuardiaFlowState {
    beneficio: any | null;
    step: FlowStep;
    error: string | null;
}

export default function GuardiaFlujoCompleto() {
    const [state, setState] = useState<GuardiaFlowState>({
        beneficio: null,
        step: 'lookup',
        error: null
    });
    const [rutInput, setRutInput] = useState('');
    const [loading, setLoading] = useState(false);

    const normalizarRUT = (rut: string): string => {
        let clean = rut.trim().toUpperCase();
        if (!clean.includes('-')) {
            if (clean.length === 8) {
                clean = `${clean}-K`;
            } else if (clean.length === 9) {
                clean = `${clean.slice(0, 8)}-${clean[8]}`;
            }
        }
        return clean;
    };

    const handleBuscarBeneficio = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!rutInput.trim()) {
            setState({ ...state, error: 'Ingresa un RUT' });
            return;
        }

        setLoading(true);
        try {
            const rut = normalizarRUT(rutInput);
            const beneficio = await beneficioService.getBeneficioByRUT(rut);

            if (!beneficio) {
                setState({
                    ...state,
                    error: `No hay beneficio activo para RUT ${rut}`,
                    beneficio: null
                });
            } else {
                setState({
                    beneficio: beneficio,
                    step: 'validar',
                    error: null
                });
            }
        } catch (error: any) {
            setState({
                ...state,
                error: error.message || 'Error buscando beneficio'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleValidacionExitosa = (resultado: any) => {
        setState({
            beneficio: { ...state.beneficio, ...resultado },
            step: 'confirmar',
            error: null
        });
    };

    const handleEntregaExitosa = (resultado: any) => {
        setState({
            beneficio: { ...state.beneficio, ...resultado },
            step: 'completado',
            error: null
        });
    };

    const handleReiniciar = () => {
        setState({
            beneficio: null,
            step: 'lookup',
            error: null
        });
        setRutInput('');
    };

    // Pantalla: Buscar Beneficio
    if (state.step === 'lookup') {
        return (
            <div className="flex flex-col h-screen bg-white">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6">
                    <h1 className="text-3xl font-bold">Retiro de Beneficios</h1>
                    <p className="text-amber-100 mt-1">Busca trabajador por RUT</p>
                </div>

                {/* Contenido */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-2xl w-full">
                        {/* Búsqueda */}
                        <form onSubmit={handleBuscarBeneficio} className="space-y-4">
                            <div>
                                <label className="block text-lg font-bold text-gray-800 mb-3">
                                    <Search className="w-5 h-5 inline mr-2" />
                                    Ingresa el RUT del trabajador
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={rutInput}
                                        onChange={(e) => {
                                            setRutInput(e.target.value);
                                            setState({ ...state, error: null });
                                        }}
                                        placeholder="Ejemplo: 12345678-9"
                                        className="flex-1 px-4 py-3 text-2xl border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none font-mono"
                                        disabled={loading}
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 disabled:bg-gray-400 text-lg transition-colors"
                                    >
                                        {loading ? (
                                            <RefreshCw className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <Search className="w-6 h-6" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Error */}
                            {state.error && (
                                <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 flex items-start gap-3">
                                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-900 font-semibold">{state.error}</p>
                                </div>
                            )}

                            {/* Instrucciones */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                                <h3 className="font-bold text-amber-900 mb-2">Instrucciones</h3>
                                <ol className="text-sm text-amber-800 space-y-1 ml-4 list-decimal">
                                    <li>Ingresa el RUT del trabajador (con o sin guión)</li>
                                    <li>El sistema buscará sus beneficios activos</li>
                                    <li>Si hay beneficios disponibles, podrás procesar el retiro</li>
                                </ol>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // Pantalla: Validar Beneficio
    if (state.step === 'validar' && state.beneficio) {
        return (
            <GuardiaValidarBeneficio
                beneficio={state.beneficio}
                onValidacionExitosa={handleValidacionExitosa}
                onCancelar={handleReiniciar}
            />
        );
    }

    // Pantalla: Confirmar Entrega
    if (state.step === 'confirmar' && state.beneficio) {
        return (
            <GuardiaConfirmarEntrega
                beneficio={state.beneficio}
                onEntregaExitosa={handleEntregaExitosa}
                onVolver={() => setState({ ...state, step: 'validar' })}
            />
        );
    }

    // Pantalla: Completado
    if (state.step === 'completado') {
        return (
            <div className="flex flex-col h-screen bg-green-50">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
                    <h1 className="text-3xl font-bold">Entrega Completada</h1>
                </div>

                {/* Contenido */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-2xl w-full text-center">
                        <CheckCircle2 className="w-24 h-24 text-green-600 mx-auto mb-4" />

                        <h2 className="text-3xl font-bold text-green-900 mb-2">
                            ¡Entrega Completada Exitosamente!
                        </h2>

                        <div className="bg-white rounded-lg p-6 mt-6 border-2 border-green-200 space-y-4 text-left">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Trabajador</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {state.beneficio?.trabajador?.nombre}
                                </p>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-sm text-gray-600 mb-1">Beneficio</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {state.beneficio?.tipo_beneficio?.nombre}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Ciclo: {state.beneficio?.ciclo?.nombre}
                                </p>
                            </div>

                            {state.beneficio?.caja_entregada && (
                                <div className="border-t border-gray-200 pt-4 bg-amber-50 rounded p-3">
                                    <p className="text-sm text-amber-700 mb-1">Caja Entregada</p>
                                    <p className="text-lg font-bold text-amber-900">
                                        {state.beneficio.caja_entregada}
                                    </p>
                                </div>
                            )}

                            <div className="border-t border-gray-200 pt-4">
                                <p className="text-sm text-gray-600 mb-1">Estado</p>
                                <p className="inline-block px-4 py-1 rounded-full font-semibold text-white bg-green-600">
                                    {state.beneficio?.estado?.toUpperCase() || 'RETIRADO'}
                                </p>
                            </div>
                        </div>

                        {/* Botón Reiniciar */}
                        <button
                            onClick={handleReiniciar}
                            className="mt-8 px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 text-lg transition-colors"
                        >
                            Procesar Siguiente Beneficio
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
