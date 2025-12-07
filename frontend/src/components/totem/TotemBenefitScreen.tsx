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

    return (
        <div className="flex flex-col h-full p-6 bg-white overflow-y-auto">
            {/* Saludo personalizado */}
            <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-[#017E49] mb-1">¡Hola, {nombre}!</h1>
                <p className="text-gray-600">RUT: {formatRut(rut)}</p>
            </div>

            {/* Sección de Beneficio */}
            <div className="w-full mb-6">
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

            {/* Botones de Acciones - Mejorados */}
            <div className="space-y-3 mb-6">
                <button
                    onClick={onReportIncident}
                    className="w-full px-6 py-4 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 flex items-center justify-center gap-3 transition-colors text-lg shadow-md"
                >
                    <Bug size={24} />
                    Reportar un Problema
                </button>

                <button
                    onClick={onConsultIncident}
                    className="w-full px-6 py-4 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 flex items-center justify-center gap-3 transition-colors text-lg shadow-md"
                >
                    <FileText size={24} />
                    Consultar Mis Incidencias
                </button>
            </div>

            {/* Botón de Atrás */}
            <button
                onClick={onBack}
                className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors mt-auto"
            >
                <ArrowLeft size={20} />
                Volver a Escanear
            </button>
        </div>
    );
}
