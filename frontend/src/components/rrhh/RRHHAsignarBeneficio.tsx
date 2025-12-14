import React, { useState, useEffect } from 'react';
import { Gift, Loader, CheckCircle2, X, AlertCircle, Search } from 'lucide-react';
import { beneficioService } from '@/services/beneficio.service';
import { trabajadorService } from '@/services/trabajador.service';
import { apiClient } from '@/services/apiClient';

interface TipoBeneficio {
    id: number;
    nombre: string;
    descripcion?: string;
}

interface Ciclo {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    activo: boolean;
}

interface RRHHAsignarBeneficioProps {
    onBeneficioAsignado?: (beneficio: any) => void;
    onError?: (error: string) => void;
}

export default function RRHHAsignarBeneficio({
    onBeneficioAsignado,
    onError
}: RRHHAsignarBeneficioProps) {
    const [rutInput, setRutInput] = useState('');
    const [trabajadorEncontrado, setTrabajadorEncontrado] = useState<any>(null);
    const [tipos, setTipos] = useState<TipoBeneficio[]>([]);
    const [ciclos, setCiclos] = useState<Ciclo[]>([]);
    const [selectedTipo, setSelectedTipo] = useState<number>(0);
    const [selectedCiclo, setSelectedCiclo] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [resultado, setResultado] = useState<any>(null);

    // Cargar tipos de beneficio y ciclos al montar
    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoadingData(true);
        try {
            // Cargar tipos de beneficio
            const { data: tiposData } = await apiClient.get<TipoBeneficio[]>('tipos-beneficio/');
            setTipos(tiposData);

            // Cargar ciclos
            const { data: ciclosData } = await apiClient.get<Ciclo[]>('ciclos/');
            setCiclos(ciclosData);

            // Pre-seleccionar ciclo activo si existe
            const cicloActivo = ciclosData.find(c => c.activo);
            if (cicloActivo) {
                setSelectedCiclo(cicloActivo.id);
            }
        } catch (error: any) {
            console.error('Error cargando datos:', error);
            onError?.('Error cargando tipos de beneficio y ciclos');
        } finally {
            setLoadingData(false);
        }
    };

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

    const buscarTrabajador = async () => {
        if (!rutInput.trim()) {
            setResultado({
                exitoso: false,
                mensaje: 'Ingresa un RUT'
            });
            return;
        }

        setLoading(true);
        try {
            const rut = normalizarRUT(rutInput);
            const trabajador = await trabajadorService.getByRUT(rut);
            setTrabajadorEncontrado(trabajador);
            setResultado(null);
        } catch (error: any) {
            setTrabajadorEncontrado(null);
            setResultado({
                exitoso: false,
                mensaje: error.message || 'Trabajador no encontrado'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAsignar = async () => {
        if (!trabajadorEncontrado) {
            setResultado({
                exitoso: false,
                mensaje: 'Primero busca un trabajador'
            });
            return;
        }

        if (!selectedTipo || !selectedCiclo) {
            setResultado({
                exitoso: false,
                mensaje: 'Selecciona tipo de beneficio y ciclo'
            });
            return;
        }

        setLoading(true);
        try {
            const beneficio = await beneficioService.asignarBeneficio({
                trabajador: trabajadorEncontrado.id,
                ciclo: selectedCiclo,
                tipo_beneficio: selectedTipo
            });

            setResultado({
                exitoso: true,
                beneficio: beneficio,
                mensaje: `Beneficio asignado exitosamente a ${trabajadorEncontrado.nombre}`
            });

            // Limpiar formulario
            setTrabajadorEncontrado(null);
            setRutInput('');
            setSelectedTipo(0);

            // Callback
            onBeneficioAsignado?.(beneficio);

            // Limpiar resultado después de 3 segundos
            setTimeout(() => setResultado(null), 3000);
        } catch (error: any) {
            const mensaje = error.message || 'Error asignando beneficio';
            setResultado({
                exitoso: false,
                mensaje: mensaje
            });
            onError?.(mensaje);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
                <h1 className="text-3xl font-bold">Asignar Beneficio</h1>
                <p className="text-purple-100 mt-1">Asignar beneficio a trabajador en ciclo activo</p>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                    {loadingData ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader className="w-8 h-8 animate-spin text-purple-600" />
                            <span className="ml-3 text-gray-600">Cargando datos...</span>
                        </div>
                    ) : (
                        <>
                            {/* Búsqueda de trabajador */}
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                                <h3 className="font-bold text-blue-900 mb-3">1. Buscar Trabajador</h3>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={rutInput}
                                        onChange={(e) => {
                                            setRutInput(e.target.value);
                                            setResultado(null);
                                        }}
                                        onKeyPress={(e) => e.key === 'Enter' && buscarTrabajador()}
                                        placeholder="Ingresa RUT (Ej: 12345678-9)"
                                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-mono"
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={buscarTrabajador}
                                        disabled={loading || !rutInput.trim()}
                                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
                                    >
                                        {loading ? (
                                            <Loader className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Search className="w-5 h-5" />
                                        )}
                                        Buscar
                                    </button>
                                </div>

                                {/* Trabajador encontrado */}
                                {trabajadorEncontrado && (
                                    <div className="mt-4 bg-green-50 border border-green-300 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            <span className="font-bold text-green-900">Trabajador encontrado</span>
                                        </div>
                                        <p className="text-sm text-green-800">
                                            <strong>Nombre:</strong> {trabajadorEncontrado.nombre}
                                        </p>
                                        <p className="text-sm text-green-800">
                                            <strong>RUT:</strong> {trabajadorEncontrado.rut}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Selección de tipo de beneficio */}
                            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                                <h3 className="font-bold text-purple-900 mb-3">2. Seleccionar Tipo de Beneficio</h3>
                                <select
                                    value={selectedTipo}
                                    onChange={(e) => setSelectedTipo(Number(e.target.value))}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                                    disabled={!trabajadorEncontrado}
                                >
                                    <option value={0}>-- Selecciona un tipo --</option>
                                    {tipos.map(tipo => (
                                        <option key={tipo.id} value={tipo.id}>
                                            {tipo.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selección de ciclo */}
                            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                                <h3 className="font-bold text-amber-900 mb-3">3. Seleccionar Ciclo</h3>
                                <select
                                    value={selectedCiclo}
                                    onChange={(e) => setSelectedCiclo(Number(e.target.value))}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                                    disabled={!trabajadorEncontrado}
                                >
                                    <option value={0}>-- Selecciona un ciclo --</option>
                                    {ciclos.map(ciclo => (
                                        <option key={ciclo.id} value={ciclo.id}>
                                            {ciclo.nombre} {ciclo.activo && '(ACTIVO)'}
                                        </option>
                                    ))}
                                </select>
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
                                            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <X className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                            <p className={resultado.exitoso ? 'text-green-900 font-bold' : 'text-red-900 font-bold'}>
                                                {resultado.mensaje}
                                            </p>
                                            {resultado.beneficio && (
                                                <div className="mt-2 text-sm text-green-700">
                                                    <p><strong>ID Beneficio:</strong> {resultado.beneficio.id}</p>
                                                    <p><strong>Estado:</strong> {resultado.beneficio.estado}</p>
                                                    <p><strong>Código:</strong> {resultado.beneficio.codigo_verificacion}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Botón asignar */}
                            <button
                                onClick={handleAsignar}
                                disabled={loading || !trabajadorEncontrado || !selectedTipo || !selectedCiclo}
                                className="w-full px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center justify-center gap-2 text-lg transition-colors"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        Asignando...
                                    </>
                                ) : (
                                    <>
                                        <Gift className="w-5 h-5" />
                                        Asignar Beneficio
                                    </>
                                )}
                            </button>

                            {/* Info */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-gray-700">
                                        <p className="font-bold mb-1">Información importante:</p>
                                        <ul className="list-disc ml-4 space-y-1">
                                            <li>El beneficio se crea en estado <strong>PENDIENTE</strong></li>
                                            <li>El trabajador podrá ver su beneficio en el tótem</li>
                                            <li>Guardia deberá validar el código QR para cambiar a <strong>VALIDADO</strong></li>
                                            <li>Solo después de validado, el trabajador podrá retirar</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
