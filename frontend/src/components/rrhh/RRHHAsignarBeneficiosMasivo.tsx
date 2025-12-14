import React, { useState, useEffect } from 'react';
import { Users, Loader, CheckCircle2, AlertCircle, RefreshCw, Gift } from 'lucide-react';
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

interface ResultadoAsignacion {
    ciclo_id: number;
    ciclo_nombre: string;
    tipo_beneficio: string;
    trabajadores_procesados: number;
    beneficios_creados: number;
    beneficios_existentes: number;
    errores: Array<{ trabajador_rut: string; error: string }>;
}

export default function RRHHAsignarBeneficiosMasivo() {
    const [tipos, setTipos] = useState<TipoBeneficio[]>([]);
    const [ciclos, setCiclos] = useState<Ciclo[]>([]);
    const [selectedTipo, setSelectedTipo] = useState<number>(0);
    const [selectedCiclo, setSelectedCiclo] = useState<number>(0);
    const [soloSinBeneficio, setSoloSinBeneficio] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [resultado, setResultado] = useState<ResultadoAsignacion | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoadingData(true);
        try {
            const { data: tiposData } = await apiClient.get<TipoBeneficio[]>('tipos-beneficio/');
            setTipos(tiposData);

            const { data: ciclosData } = await apiClient.get<Ciclo[]>('ciclos/');
            setCiclos(ciclosData);

            // Pre-seleccionar ciclo activo
            const cicloActivo = ciclosData.find(c => c.activo);
            if (cicloActivo) {
                setSelectedCiclo(cicloActivo.id);
            }
        } catch (error: any) {
            console.error('Error cargando datos:', error);
            setError('Error cargando tipos de beneficio y ciclos');
        } finally {
            setLoadingData(false);
        }
    };

    const handleAsignarMasivo = async () => {
        if (!selectedCiclo) {
            setError('Debes seleccionar un ciclo');
            return;
        }

        setLoading(true);
        setError(null);
        setResultado(null);

        try {
            const body: any = {
                solo_sin_beneficio: soloSinBeneficio
            };

            // Si se seleccionó un tipo específico, incluirlo
            if (selectedTipo > 0) {
                body.tipo_beneficio_id = selectedTipo;
            }

            const { data } = await apiClient.post<ResultadoAsignacion>(
                `ciclos/${selectedCiclo}/asignar-beneficios-pendientes/`,
                body
            );

            setResultado(data);
        } catch (error: any) {
            console.error('Error asignando beneficios:', error);
            setError(error.response?.data?.detail || 'Error al asignar beneficios masivamente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Users className="w-8 h-8" />
                    Asignación Masiva de Beneficios
                </h1>
                <p className="text-indigo-100 mt-1">
                    Asigna beneficios automáticamente a todos los trabajadores sin beneficio en un ciclo
                </p>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {loadingData ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader className="w-8 h-8 animate-spin text-indigo-600" />
                            <span className="ml-3 text-gray-600">Cargando datos...</span>
                        </div>
                    ) : (
                        <>
                            {/* Explicación del proceso */}
                            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-bold text-blue-900 mb-2">¿Cómo funciona?</h3>
                                        <div className="text-sm text-blue-800 space-y-2">
                                            <p>
                                                <strong>1. Selecciona el ciclo:</strong> Elige el ciclo para el cual quieres asignar beneficios.
                                            </p>
                                            <p>
                                                <strong>2. Tipo de beneficio (opcional):</strong> Si no seleccionas ninguno, se usará automáticamente 
                                                el primer tipo de beneficio activo del ciclo.
                                            </p>
                                            <p>
                                                <strong>3. Modo de asignación:</strong>
                                            </p>
                                            <ul className="list-disc ml-6 space-y-1">
                                                <li>
                                                    <strong>"Solo sin beneficio"</strong>: Asigna beneficios únicamente a trabajadores 
                                                    que NO tienen ningún beneficio en el ciclo seleccionado. Los trabajadores que ya 
                                                    tienen beneficio NO son afectados.
                                                </li>
                                                <li>
                                                    <strong>"Reasignar a todos"</strong>: ELIMINA todos los beneficios existentes y 
                                                    crea nuevos beneficios para TODOS los trabajadores. Útil para cambiar el tipo 
                                                    de beneficio de todo el ciclo.
                                                </li>
                                            </ul>
                                            <p className="pt-2 border-t border-blue-300 mt-3">
                                                <strong>✅ Resultado:</strong> El sistema procesa todos los trabajadores del sistema 
                                                y crea registros de <code className="bg-blue-200 px-1 rounded">BeneficioTrabajador</code> en 
                                                estado <strong>PENDIENTE</strong> para cada trabajador que lo necesite.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Selección de ciclo */}
                            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                                    Seleccionar Ciclo
                                </h3>
                                <select
                                    value={selectedCiclo}
                                    onChange={(e) => setSelectedCiclo(Number(e.target.value))}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-lg"
                                >
                                    <option value={0}>-- Selecciona un ciclo --</option>
                                    {ciclos.map(ciclo => (
                                        <option key={ciclo.id} value={ciclo.id}>
                                            {ciclo.nombre} {ciclo.activo && '✓ ACTIVO'}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selección de tipo de beneficio */}
                            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                                    Tipo de Beneficio (Opcional)
                                </h3>
                                <select
                                    value={selectedTipo}
                                    onChange={(e) => setSelectedTipo(Number(e.target.value))}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-lg"
                                >
                                    <option value={0}>-- Usar beneficio por defecto del ciclo --</option>
                                    {tipos.map(tipo => (
                                        <option key={tipo.id} value={tipo.id}>
                                            {tipo.nombre}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-sm text-gray-600 mt-2">
                                    Si no seleccionas ninguno, se usará el primer tipo de beneficio activo del ciclo
                                </p>
                            </div>

                            {/* Modo de asignación */}
                            <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                                    Modo de Asignación
                                </h3>
                                <div className="space-y-3">
                                    <label className="flex items-start gap-3 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 transition-colors">
                                        <input
                                            type="radio"
                                            name="modo"
                                            checked={soloSinBeneficio}
                                            onChange={() => setSoloSinBeneficio(true)}
                                            className="mt-1 w-4 h-4 text-indigo-600"
                                        />
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-900">Solo trabajadores sin beneficio</div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                Asigna beneficios únicamente a trabajadores que NO tienen ningún beneficio 
                                                en el ciclo seleccionado. Trabajadores con beneficio existente no son afectados.
                                            </div>
                                            <div className="text-xs text-green-600 font-semibold mt-1">
                                                ✓ Recomendado para agregar trabajadores nuevos
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-orange-400 transition-colors">
                                        <input
                                            type="radio"
                                            name="modo"
                                            checked={!soloSinBeneficio}
                                            onChange={() => setSoloSinBeneficio(false)}
                                            className="mt-1 w-4 h-4 text-orange-600"
                                        />
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-900">Reasignar a TODOS los trabajadores</div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                ELIMINA todos los beneficios existentes en el ciclo y crea nuevos beneficios 
                                                para TODOS los trabajadores del sistema.
                                            </div>
                                            <div className="text-xs text-orange-600 font-semibold mt-1">
                                                ⚠️ Cuidado: Elimina beneficios existentes
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Resultado */}
                            {resultado && (
                                <div className="bg-green-50 border-2 border-green-400 rounded-lg p-5">
                                    <div className="flex items-start gap-3 mb-4">
                                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-green-900 text-lg">
                                                ✅ Asignación completada exitosamente
                                            </h3>
                                            <p className="text-sm text-green-700 mt-1">
                                                {resultado.ciclo_nombre} - {resultado.tipo_beneficio}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                        <div className="bg-white rounded-lg p-4 border border-green-300">
                                            <div className="text-3xl font-bold text-indigo-600">
                                                {resultado.trabajadores_procesados}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                Trabajadores procesados
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-lg p-4 border border-green-300">
                                            <div className="text-3xl font-bold text-green-600">
                                                {resultado.beneficios_creados}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                Beneficios creados
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-lg p-4 border border-green-300">
                                            <div className="text-3xl font-bold text-gray-600">
                                                {resultado.beneficios_existentes}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                Ya tenían beneficio
                                            </div>
                                        </div>
                                    </div>

                                    {resultado.errores.length > 0 && (
                                        <div className="mt-4 bg-red-50 border border-red-300 rounded-lg p-3">
                                            <div className="font-bold text-red-900 mb-2">
                                                ⚠️ Errores ({resultado.errores.length})
                                            </div>
                                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                                {resultado.errores.map((err, idx) => (
                                                    <div key={idx} className="text-sm text-red-700">
                                                        <strong>{err.trabajador_rut}:</strong> {err.error}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-red-900 font-bold">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Botón principal */}
                            <button
                                onClick={handleAsignarMasivo}
                                disabled={loading || !selectedCiclo}
                                className={`w-full px-6 py-4 text-white font-bold rounded-lg flex items-center justify-center gap-3 text-lg transition-colors ${
                                    soloSinBeneficio
                                        ? 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400'
                                        : 'bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-6 h-6 animate-spin" />
                                        Procesando trabajadores...
                                    </>
                                ) : soloSinBeneficio ? (
                                    <>
                                        <Gift className="w-6 h-6" />
                                        Asignar a trabajadores sin beneficio
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-6 h-6" />
                                        Reasignar a TODOS los trabajadores
                                    </>
                                )}
                            </button>

                            {/* Advertencia final */}
                            {!soloSinBeneficio && (
                                <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm text-orange-800">
                                            <p className="font-bold mb-1">⚠️ Advertencia: Modo Reasignar</p>
                                            <p>
                                                Esta operación ELIMINARÁ todos los beneficios existentes en el ciclo y 
                                                creará nuevos para todos los trabajadores. Usa esta opción solo si estás 
                                                seguro de querer resetear los beneficios del ciclo.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
