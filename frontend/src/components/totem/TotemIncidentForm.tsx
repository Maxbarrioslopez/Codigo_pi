import React from 'react';
import { ArrowLeft, Send } from 'lucide-react';

type Props = {
    onSubmit: (tipo: string, descripcion: string) => void;
    onBack: () => void;
    loading?: boolean;
};

export default function TotemIncidentForm({ onSubmit, onBack, loading }: Props) {
    const [tipo, setTipo] = React.useState('usuario');
    const [descripcion, setDescripcion] = React.useState('');

    return (
        <div className="w-full h-full bg-white flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 p-6 pb-2">
                <h2 className="text-3xl font-bold text-gray-800">Reportar incidencia</h2>
            </div>

            {/* Formulario scrolleable */}
            <div className="flex-1 overflow-y-auto p-6 pt-2">
                <div className="flex flex-col gap-4 w-full">
                    <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-2">Tipo</label>
                        <select
                            className="w-full border-2 border-gray-300 rounded px-4 py-3 text-lg focus:outline-none focus:border-blue-500"
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                        >
                            <option value="usuario">Usuario</option>
                            <option value="operacional">Operacional</option>
                            <option value="tecnica">Técnica</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-lg font-semibold text-gray-700 mb-2">Descripción</label>
                        <textarea
                            className="w-full border-2 border-gray-300 rounded px-4 py-3 text-lg focus:outline-none focus:border-blue-500 min-h-40"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Describe el problema..."
                        />
                    </div>
                </div>
            </div>

            {/* Botones - SIEMPRE VISIBLES */}
            <div className="flex-shrink-0 bg-white border-t-2 border-gray-300 p-6 space-y-3">
                <button
                    onClick={() => onSubmit(tipo, descripcion)}
                    disabled={!!loading || !descripcion.trim()}
                    className="w-full px-8 py-6 bg-blue-600 text-black rounded-lg font-black hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center gap-3 transition-all text-lg shadow-2xl border-3 border-blue-700 disabled:opacity-50"
                >
                    <Send size={32} />
                    <span>Enviar incidencia</span>
                </button>

                <button
                    onClick={onBack}
                    className="w-full px-8 py-6 bg-indigo-600 text-black rounded-lg font-black hover:bg-indigo-700 active:bg-indigo-800 flex items-center justify-center gap-3 transition-all text-lg shadow-2xl border-3 border-indigo-700"
                >
                    <ArrowLeft size={32} />
                    <span>Volver Atrás</span>
                </button>
            </div>
        </div>
    );
}
