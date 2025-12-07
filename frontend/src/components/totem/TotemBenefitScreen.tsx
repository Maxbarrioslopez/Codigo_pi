import React from 'react';
import { CheckCircle2, AlertCircle, FileText, Bug, ArrowLeft } from 'lucide-react';
import { formatRut } from '@/utils/rut';

type Props = {
    rut: string;
    nombre: string;
    beneficio: any;
    onReportIncident: () => void;
    onConsultIncident: () => void;
    onBack: () => void;
};

export default function TotemBenefitScreen({
    rut,
    nombre,
    beneficio,
    onReportIncident,
    onConsultIncident,
    onBack
}: Props) {
    const tieneBeneficio = !!beneficio && beneficio.activo;
    const stock = beneficio?.stock ?? 0;

    // Debug: log para verificar que el componente está recibiendo datos
    console.log('TotemBenefitScreen:', { nombre, beneficio, tieneBeneficio });

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Contenedor con scroll para contenido */}
            <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-4">
                {/* Saludo personalizado */}
                <div className="text-center bg-yellow-200 p-4 rounded flex-shrink-0">
                    <h1 className="text-6xl font-bold text-[#017E49] mb-1">¡Hola, {nombre}!</h1>
                    <p className="text-gray-600 text-xl">RUT: {formatRut(rut)}</p>
                </div>

                {/* Sección de Beneficio */}
                <div className="w-full flex-shrink-0">
                    {tieneBeneficio ? (
                        // Con beneficio
                        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-lg p-8 text-center">
                            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-emerald-900 mb-2">¡Beneficio Otorgado!</h3>

                            <div className="mt-6 space-y-3 text-left bg-white rounded-lg p-4">
                                {beneficio.tipo && (
                                    <p className="text-lg">
                                        <strong className="text-emerald-700">Tipo de Beneficio:</strong>
                                        <span className="ml-2 text-gray-800">{beneficio.tipo}</span>
                                    </p>
                                )}
                                {beneficio.categoria && (
                                    <p className="text-lg">
                                        <strong className="text-emerald-700">Categoría:</strong>
                                        <span className="ml-2 text-gray-800">{beneficio.categoria}</span>
                                    </p>
                                )}
                                {beneficio.descripcion && (
                                    <p className="text-lg">
                                        <strong className="text-emerald-700">Descripción:</strong>
                                        <span className="ml-2 text-gray-800">{beneficio.descripcion}</span>
                                    </p>
                                )}
                                {stock > 0 && (
                                    <p className="text-lg">
                                        <strong className="text-emerald-700">Stock Disponible:</strong>
                                        <span className="ml-2 text-gray-800">{stock} unidades</span>
                                    </p>
                                )}
                            </div>

                            <p className="mt-6 text-emerald-800 text-sm font-semibold">
                                Acércate al mostrador para retirar tu beneficio
                            </p>
                        </div>
                    ) : (
                        // Sin beneficio
                        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-8 text-center">
                            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-red-900 mb-2">Sin Beneficio en el Ciclo Actual</h3>
                            <p className="text-red-800 mt-4">
                                No hay beneficio disponible para ti en este ciclo. Consulta con recursos humanos si crees que esto es un error.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Botones de Acciones - FIJOS AL FINAL */}
            <div className="flex-shrink-0 p-6 pt-4 space-y-3 bg-white border-t border-gray-200">
                <button
                    onClick={onReportIncident}
                    className="w-full px-8 py-5 bg-red-600 text-black rounded-lg font-black hover:bg-red-700 active:bg-red-800 flex items-center justify-center gap-3 transition-all text-lg shadow-2xl border-2 border-red-700"
                >
                    <Bug size={28} />
                    <span>Reportar Problema</span>
                </button>

                <button
                    onClick={onConsultIncident}
                    className="w-full px-8 py-5 bg-blue-600 text-black rounded-lg font-black hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center gap-3 transition-all text-lg shadow-2xl border-2 border-blue-700"
                >
                    <FileText size={28} />
                    <span>Consultar Incidencias</span>
                </button>

                <button
                    onClick={onBack}
                    className="w-full px-8 py-5 bg-indigo-600 text-black rounded-lg font-black hover:bg-indigo-700 active:bg-indigo-800 flex items-center justify-center gap-3 transition-all text-lg shadow-2xl border-2 border-indigo-700"
                >
                    <ArrowLeft size={28} />
                    <span>Volver a Escanear</span>
                </button>
            </div>
        </div>
    );
}
