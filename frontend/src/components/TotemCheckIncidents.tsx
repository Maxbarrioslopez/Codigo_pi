import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { incidentService } from '../services/incident.service';
import { Input } from './ui/input';
import { validateRut } from '@/utils/rut';

interface TotemCheckIncidentsProps {
    onBack: () => void;
}

export function TotemCheckIncidents({ onBack }: TotemCheckIncidentsProps) {
    const [rut, setRut] = useState('');
    const [incidencias, setIncidencias] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [error, setError] = useState<string>('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!rut.trim()) {
            setError('Por favor ingresa tu RUT');
            return;
        }

        if (!validateRut(rut)) {
            setError('RUT inválido. Por favor verifica el formato');
            return;
        }

        try {
            setLoading(true);
            setSearched(true);
            console.log('Buscando incidencias para RUT:', rut);
            const datos = await incidentService.listarIncidencias(rut);
            console.log('Incidencias obtenidas (raw):', datos);
            console.log('Tipo de datos:', typeof datos);
            console.log('¿Es array?:', Array.isArray(datos));

            // Asegurar que es un array
            const incidenciasArray = Array.isArray(datos) ? datos : (datos ? [datos] : []);
            console.log('Incidencias procesadas:', incidenciasArray);

            setIncidencias(incidenciasArray);
            setSelectedIndex(0);

            if (incidenciasArray.length === 0) {
                setError('No hay incidencias para este RUT');
            }
        } catch (err) {
            console.error('Error cargando incidencias:', err);
            setError('Error al cargar las incidencias. Intenta nuevamente.');
            setIncidencias([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (estado: string) => {
        switch (estado?.toLowerCase()) {
            case 'resuelta':
                return '#017E49';
            case 'en_proceso':
                return '#FF9F55';
            case 'pendiente':
                return '#E12019';
            default:
                return '#6B6B6B';
        }
    };

    const getStatusText = (estado: string) => {
        switch (estado?.toLowerCase()) {
            case 'resuelta':
                return 'Resuelta';
            case 'en_proceso':
                return 'En proceso';
            case 'pendiente':
                return 'Pendiente';
            default:
                return estado || 'Desconocido';
        }
    };

    const incident = incidencias[selectedIndex];

    return (
        <div className="h-full flex flex-col p-12 overflow-y-auto">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-[#333333] hover:text-[#E12019] transition-colors mb-8 self-start"
                style={{ fontSize: '16px', fontWeight: 500 }}
            >
                <ArrowLeft className="w-5 h-5" />
                Volver
            </button>

            {/* Header */}
            <div className="text-center mb-8">
                <div style={{ fontSize: '32px', fontWeight: 700 }} className="text-[#333333] mb-2">
                    Consultar mis incidencias
                </div>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="w-full max-w-md mx-auto mb-8">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[#333333] mb-2" style={{ fontSize: '16px', fontWeight: 500 }}>
                            Ingresa tu RUT
                        </label>
                        <Input
                            type="text"
                            value={rut}
                            onChange={(e) => setRut(e.target.value)}
                            placeholder="Ej: 12345678-9"
                            className="w-full"
                        />
                    </div>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-8 py-4 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors disabled:opacity-50"
                        style={{ fontSize: '18px', fontWeight: 700, minHeight: '56px' }}
                    >
                        {loading ? 'Buscando...' : 'Buscar incidencias'}
                    </button>
                </div>
            </form>

            {/* Results */}
            {searched && (
                <>
                    {loading ? (
                        <div className="text-center text-[#6B6B6B] py-8">Buscando incidencias...</div>
                    ) : incidencias.length === 0 ? (
                        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-8 w-full max-w-md mx-auto text-center">
                            <p className="text-[#6B6B6B]" style={{ fontSize: '16px' }}>
                                No hay incidencias reportadas para este RUT.
                            </p>
                        </div>
                    ) : incident ? (
                        <>
                            {/* Incident Card */}
                            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-8 w-full max-w-md mx-auto mb-6 shadow-lg">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-[#E0E0E0]">
                                    <div>
                                        <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                                            Número de incidencia
                                        </p>
                                        <p className="text-[#E12019]" style={{ fontSize: '24px', fontWeight: 700 }}>
                                            {incident.codigo || 'N/A'}
                                        </p>
                                    </div>
                                    <span
                                        className="px-4 py-2 text-white rounded-full uppercase"
                                        style={{ fontSize: '14px', fontWeight: 700, backgroundColor: getStatusColor(incident.estado) }}
                                    >
                                        {getStatusText(incident.estado)}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                                            Tipo de incidencia
                                        </p>
                                        <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>
                                            {incident.tipo || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                                            Fecha de reporte
                                        </p>
                                        <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>
                                            {incident.created_at ? new Date(incident.created_at).toLocaleDateString('es-ES') : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                                            Descripción
                                        </p>
                                        <p className="text-[#333333]" style={{ fontSize: '16px', lineHeight: '1.5' }}>
                                            {incident.descripcion || 'Sin descripción'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                                            Respuesta de RRHH
                                        </p>
                                        <p className="text-[#333333]" style={{ fontSize: '16px', lineHeight: '1.5' }}>
                                            {incident.resolucion || incident?.metadata?.resolucion || 'Aún no hay respuesta registrada'}
                                        </p>
                                    </div>
                                </div>

                                {/* Status Timeline */}
                                <div className="pt-6 border-t-2 border-[#E0E0E0]">
                                    <p className="text-[#333333] mb-4" style={{ fontSize: '16px', fontWeight: 500 }}>
                                        Seguimiento
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#017E49] flex items-center justify-center flex-shrink-0">
                                                <CheckCircle2 className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>
                                                    Incidencia recibida
                                                </p>
                                                <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>
                                                    {incident.created_at
                                                        ? new Date(incident.created_at).toLocaleString('es-ES')
                                                        : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        {incident.estado !== 'pendiente' && (
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: getStatusColor(incident.estado) }}
                                                >
                                                    {incident.estado === 'resuelta' ? (
                                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                                    ) : (
                                                        <AlertCircle className="w-5 h-5 text-white" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>
                                                        {incident.estado === 'resuelta'
                                                            ? 'Incidencia resuelta'
                                                            : 'En revisión por RRHH'}
                                                    </p>
                                                    <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>
                                                        {incident.resolved_at
                                                            ? new Date(incident.resolved_at).toLocaleString('es-ES')
                                                            : 'En proceso...'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            {incidencias.length > 1 && (
                                <div className="flex gap-4 items-center justify-center mb-6 w-full max-w-md mx-auto">
                                    <button
                                        onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                                        disabled={selectedIndex === 0}
                                        className="px-4 py-2 bg-[#E0E0E0] text-[#333333] rounded disabled:opacity-50"
                                    >
                                        ←
                                    </button>
                                    <span className="text-[#333333]">
                                        {selectedIndex + 1} de {incidencias.length}
                                    </span>
                                    <button
                                        onClick={() => setSelectedIndex(Math.min(incidencias.length - 1, selectedIndex + 1))}
                                        disabled={selectedIndex === incidencias.length - 1}
                                        className="px-4 py-2 bg-[#E0E0E0] text-[#333333] rounded disabled:opacity-50"
                                    >
                                        →
                                    </button>
                                </div>
                            )}
                        </>
                    ) : null}
                </>
            )}

            {/* Footer */}
            <div className="w-full max-w-md mx-auto mt-auto">
                <button
                    onClick={onBack}
                    className="w-full px-8 py-6 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors"
                    style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
                >
                    Volver al inicio
                </button>
            </div>
        </div>
    );
}
