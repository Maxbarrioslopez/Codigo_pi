import React, { useState } from 'react';
import { Plus, Upload, FileUp, Check, X, AlertCircle, Loader } from 'lucide-react';
import { trabajadorService } from '@/services/trabajador.service';

interface TrabajadorFormData {
    rut: string;
    nombre: string;
    tipo_contrato: 'planta' | 'contrata' | 'honorarios' | 'indefinido';
}
interface FormData {
    rut: string;
    nombre: string;
    tipo_contrato: 'indefinido' | 'plazo_fijo' | 'part_time' | 'honorarios' | 'externos';
}

interface RRHHAgregarTrabajadorProps {
    onTrabajadorAgregado?: (trabajador: any) => void;
    onError?: (error: string) => void;
}

export default function RRHHAgregarTrabajador({
    onTrabajadorAgregado,
    onError
}: RRHHAgregarTrabajadorProps) {
    const [modo, setModo] = useState<'manual' | 'masivo'>('manual');
    const [formData, setFormData] = useState<TrabajadorFormData>({
        rut: '',
        nombre: '',
        tipo_contrato: 'indefinido'
    });
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<any>(null);
    const [cargaMasiva, setCargaMasiva] = useState({
        loading: false,
        resultado: null as any
    });

    const normalizarRUT = (rut: string): string => {
        // Limpiar espacios y convertir a mayúsculas
        let clean = rut.trim().toUpperCase();
        // Si no tiene guión, agregarlo
        if (!clean.includes('-')) {
            if (clean.length === 8) {
                clean = `${clean}-K`;
            } else if (clean.length === 9) {
                clean = `${clean.slice(0, 8)}-${clean[8]}`;
            }
        }
        return clean;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'rut') {
            setFormData({ ...formData, [name]: normalizarRUT(value) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleAgregarManual = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.rut || !formData.nombre) {
            onError?.('RUT y nombre son requeridos');
            return;
        }

        setLoading(true);
        try {
            const trabajador = await trabajadorService.create({
                rut: formData.rut,
                nombre: formData.nombre,
                beneficio_disponible: { tipo_contrato: formData.tipo_contrato }
            });

            setResultado({
                exitoso: true,
                trabajador: trabajador,
                mensaje: `Trabajador ${trabajador.nombre} agregado exitosamente`
            });

            // Limpiar formulario
            setFormData({ rut: '', nombre: '', tipo_contrato: 'indefinido' });

            // Callback
            onTrabajadorAgregado?.(trabajador);

            // Limpiar resultado después de 2 segundos
            setTimeout(() => setResultado(null), 3000);
        } catch (error: any) {
            const mensaje = error.message || 'Error agregando trabajador';
            setResultado({
                exitoso: false,
                mensaje: mensaje
            });
            onError?.(mensaje);
        } finally {
            setLoading(false);
        }
    };

    const handleCargaMasiva = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCargaMasiva({ ...cargaMasiva, loading: true });

        try {
            // Leer archivo CSV
            const text = await file.text();
            const lineas = text.split('\n');

            // Parsear CSV (esperado: RUT, Nombre, Tipo Contrato)
            const trabajadoresAagregar: TrabajadorFormData[] = [];
            let erroresParseado = [];

            for (let i = 1; i < lineas.length; i++) {
                const linea = lineas[i].trim();
                if (!linea) continue;

                const partes = linea.split(',').map(p => p.trim());
                if (partes.length < 2) {
                    erroresParseado.push(`Línea ${i + 1}: formato inválido`);
                    continue;
                }

                trabajadoresAagregar.push({
                    rut: normalizarRUT(partes[0]),
                    nombre: partes[1],
                    tipo_contrato: (partes[2] || 'indefinido').toLowerCase() as any
                });
            }

            if (trabajadoresAagregar.length === 0) {
                throw new Error('No hay trabajadores válidos en el archivo');
            }

            // Agregar trabajadores
            const resultados = {
                exitosos: 0,
                errores: 0,
                detalles: [] as any[]
            };

            for (const trab of trabajadoresAagregar) {
                try {
                    const trabajador = await trabajadorService.create({
                        rut: trab.rut,
                        nombre: trab.nombre,
                        beneficio_disponible: { tipo_contrato: trab.tipo_contrato }
                    });
                    resultados.exitosos++;
                    resultados.detalles.push({
                        rut: trab.rut,
                        nombre: trab.nombre,
                        exitoso: true
                    });
                } catch (error: any) {
                    resultados.errores++;
                    resultados.detalles.push({
                        rut: trab.rut,
                        nombre: trab.nombre,
                        exitoso: false,
                        error: error.message
                    });
                }
            }

            setCargaMasiva({
                ...cargaMasiva,
                resultado: {
                    exitoso: resultados.errores === 0,
                    mensaje: `Cargados ${resultados.exitosos} trabajadores, ${resultados.errores} errores`,
                    resultados: resultados
                }
            });

            // Callback
            if (resultados.exitosos > 0) {
                onTrabajadorAgregado?.(null);
            }

            // Reset input
            e.target.value = '';
        } catch (error: any) {
            const mensaje = error.message || 'Error en carga masiva';
            setCargaMasiva({
                ...cargaMasiva,
                resultado: {
                    exitoso: false,
                    mensaje: mensaje
                }
            });
            onError?.(mensaje);
        } finally {
            setCargaMasiva({ ...cargaMasiva, loading: false });
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <h1 className="text-3xl font-bold">Agregar Trabajadores</h1>
                <p className="text-blue-100 mt-1">Ingreso manual o carga masiva de trabajadores</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => { setModo('manual'); setResultado(null); }}
                    className={`flex-1 py-4 px-6 font-bold text-lg transition-colors ${
                        modo === 'manual'
                            ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                    <Plus className="w-5 h-5 inline mr-2" />
                    Manual
                </button>
                <button
                    onClick={() => { setModo('masivo'); setResultado(null); }}
                    className={`flex-1 py-4 px-6 font-bold text-lg transition-colors ${
                        modo === 'masivo'
                            ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                    <Upload className="w-5 h-5 inline mr-2" />
                    Carga Masiva
                </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
                {modo === 'manual' ? (
                    // Formulario Manual
                    <div className="max-w-2xl mx-auto">
                        <form onSubmit={handleAgregarManual} className="space-y-6">
                            {/* RUT */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    RUT <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="rut"
                                    value={formData.rut}
                                    onChange={handleInputChange}
                                    placeholder="12345678-9"
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-mono"
                                    disabled={loading}
                                />
                                <p className="text-xs text-gray-500 mt-1">Formato: 12345678-9</p>
                            </div>

                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Nombre Completo <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    placeholder="Juan Pérez López"
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    disabled={loading}
                                />
                            </div>

                            {/* Tipo de Contrato */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Tipo de Contrato
                                </label>
                                <select
                                    name="tipo_contrato"
                                    value={formData.tipo_contrato}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                    disabled={loading}
                                >
                                    <option value="planta">Planta</option>
                                    <option value="contrata">Contrata</option>
                                    <option value="honorarios">Honorarios</option>
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
                                            <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <X className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                        )}
                                        <p className={resultado.exitoso ? 'text-green-900' : 'text-red-900'}>
                                            {resultado.mensaje}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Botón */}
                            <button
                                type="submit"
                                disabled={loading || !formData.rut || !formData.nombre}
                                className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2 text-lg transition-colors"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        Agregando...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        Agregar Trabajador
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    // Carga Masiva
                    <div className="max-w-2xl mx-auto">
                        <div className="space-y-6">
                            {/* Instrucciones */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-bold text-blue-900 mb-2">Instrucciones</h3>
                                <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                                    <li>Prepara un archivo CSV con columnas: RUT, Nombre, Tipo Contrato</li>
                                    <li>Los tipos de contrato pueden ser: Indefinido, Plazo Fijo, Part Time, Honorarios, Externos</li>
                                    <li>Sube el archivo con el botón de abajo</li>
                                    <li>Se cargarán automáticamente todos los trabajadores válidos</li>
                                </ol>
                            </div>

                            {/* Ejemplo */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <h3 className="font-bold text-gray-900 mb-2 text-sm">Ejemplo de formato CSV:</h3>
                                <pre className="text-xs bg-white p-2 border border-gray-300 rounded overflow-x-auto">
{`RUT,Nombre,Tipo Contrato
12345678-9,Juan Pérez López,planta
87654321-K,María García González,contrata
11223344-5,Roberto López Martínez,honorarios`}
                                </pre>
                            </div>

                            {/* Upload */}
                            <div className="border-2 border-dashed border-blue-400 rounded-lg p-8 text-center">
                                <FileUp className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleCargaMasiva}
                                        disabled={cargaMasiva.loading}
                                        className="hidden"
                                    />
                                    <span className="text-lg font-bold text-blue-600 hover:text-blue-700">
                                        Selecciona un archivo CSV
                                    </span>
                                </label>
                                <p className="text-sm text-gray-500 mt-2">O arrastra un archivo aquí</p>
                            </div>

                            {/* Resultado Carga Masiva */}
                            {cargaMasiva.resultado && (
                                <div
                                    className={`rounded-lg p-4 border-2 ${
                                        cargaMasiva.resultado.exitoso
                                            ? 'bg-green-50 border-green-400'
                                            : 'bg-red-50 border-red-400'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {cargaMasiva.resultado.exitoso ? (
                                            <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                            <p
                                                className={`font-bold ${
                                                    cargaMasiva.resultado.exitoso
                                                        ? 'text-green-900'
                                                        : 'text-red-900'
                                                }`}
                                            >
                                                {cargaMasiva.resultado.mensaje}
                                            </p>
                                            {cargaMasiva.resultado.resultados && (
                                                <details className="mt-3 text-sm">
                                                    <summary className="cursor-pointer font-semibold">
                                                        Ver detalles
                                                    </summary>
                                                    <ul className="mt-2 space-y-1">
                                                        {cargaMasiva.resultado.resultados.detalles.map(
                                                            (det: any, idx: number) => (
                                                                <li
                                                                    key={idx}
                                                                    className={det.exitoso ? 'text-green-700' : 'text-red-700'}
                                                                >
                                                                    {det.rut} - {det.nombre}
                                                                    {det.error && ` (${det.error})`}
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
