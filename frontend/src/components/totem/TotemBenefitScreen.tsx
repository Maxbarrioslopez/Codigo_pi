import React from 'react';
import { CheckCircle2, AlertCircle, Bug, ArrowLeft } from 'lucide-react';
import { formatRut } from '@/utils/rut';

type Props = {
    rut: string;
    nombre: string;
    beneficio: any;
    onReportIncident: () => void;
    onBack: () => void;
};

export default function TotemBenefitScreen({
    rut,
    nombre,
    beneficio,
    onReportIncident,
    onBack
}: Props) {
    const tieneBeneficio = !!beneficio && beneficio.activo;
    const stock = beneficio?.stock ?? 0;
    const requiereGuardia = !!beneficio?.requiere_validacion_guardia;
    const codigoGuardia = beneficio?.codigo_guardia || beneficio?.codigo_verificacion;

    const qrUrl = codigoGuardia
        ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(codigoGuardia)}`
        : undefined;

    const handlePrintGuardia = () => {
        const w = window.open('', '_blank', 'width=480,height=640');
        if (!w) return;
        const html = `<!DOCTYPE html>
<html><head><title>Validación Guardia</title>
<style>
  body { font-family: Arial, sans-serif; padding: 16px; color: #111; }
  h1 { font-size: 20px; margin-bottom: 12px; }
  .card { border: 1px solid #ddd; border-radius: 10px; padding: 16px; }
  .row { margin-bottom: 10px; font-size: 15px; }
  .label { font-weight: 700; color: #0f5132; }
  .code { font-size: 28px; font-weight: 800; letter-spacing: 1px; color: #0f5132; text-align: center; margin: 12px 0; }
  .qr { text-align: center; margin-top: 8px; }
  .small { color: #555; font-size: 13px; }
</style>
</head><body>
  <h1>Validación con guardia</h1>
  <div class="card">
    <div class="row"><span class="label">Trabajador:</span> ${nombre}</div>
    <div class="row"><span class="label">RUT:</span> ${rut}</div>
    <div class="row"><span class="label">Beneficio:</span> ${beneficio?.tipo || 'Beneficio'}</div>
    <div class="row"><span class="label">Categoría:</span> ${beneficio?.categoria || 'N/A'}</div>
    <div class="code">${codigoGuardia || 'Código no disponible'}</div>
    ${qrUrl ? `<div class="qr"><img src="${qrUrl}" alt="QR" /></div>` : ''}
    <p class="small">Presenta este código al guardia para validar la entrega.</p>
  </div>
</body></html>`;
        w.document.write(html);
        w.document.close();
        w.focus();
        w.print();
    };
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

                            {codigoGuardia && (
                                <div className="mt-6 bg-white border-2 border-emerald-300 rounded-lg p-4 space-y-3">
                                    <p className="text-emerald-900 font-semibold">Validación con guardia</p>
                                    <p className="text-gray-800">Código para mostrar al guardia:</p>
                                    <div className="text-center text-3xl font-black text-emerald-700 tracking-wide bg-emerald-50 border border-emerald-300 rounded-lg py-3">
                                        {codigoGuardia}
                                    </div>
                                    {qrUrl && (
                                        <div className="flex flex-col items-center gap-2">
                                            <img src={qrUrl} alt="QR validación guardia" className="w-40 h-40" />
                                            <p className="text-gray-600 text-xs text-center">Escanea o ingresa el código con el guardia</p>
                                        </div>
                                    )}
                                    <button
                                        onClick={handlePrintGuardia}
                                        className="w-full mt-2 px-4 py-3 bg-[#017E49] text-white rounded-lg font-semibold hover:bg-[#017E49] transition-colors"
                                    >
                                        Imprimir código para guardia
                                    </button>
                                </div>
                            )}

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
