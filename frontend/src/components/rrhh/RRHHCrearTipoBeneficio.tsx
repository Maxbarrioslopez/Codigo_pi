import React, { useState, useEffect } from 'react';
import { Plus, Package, Gift, Loader, CheckCircle2, X, AlertCircle, Shield } from 'lucide-react';
import { apiClient } from '@/services/apiClient';

interface TipoBeneficio {
    id: number;
    nombre: string;
    descripcion?: string;
    requiere_validacion_guardia: boolean;
    es_caja: boolean;
    tipos_contrato: string[];
}

interface RRHHCrearTipoBeneficioProps {
    onBeneficioCreado?: (tipo: TipoBeneficio) => void;
    onError?: (error: string) => void;
}

export default function RRHHCrearTipoBeneficio({
    onBeneficioCreado,
    onError
}: RRHHCrearTipoBeneficioProps) {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [categoria, setCategoria] = useState<'caja' | 'otro'>('caja');
    const [requiereGuardia, setRequiereGuardia] = useState(true);
    const [tiposContratoSeleccionados, setTiposContratoSeleccionados] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [resultado, setResultado] = useState<any>(null);

    const tiposContrato = [
        { value: 'indefinido', label: 'Indefinido' },
        { value: 'plazo_fijo', label: 'Plazo Fijo' },
        { value: 'part_time', label: 'Part Time' },
        { value: 'honorarios', label: 'Honorarios' },
        { value: 'externos', label: 'Externos' },
    ];

    // Si es caja, siempre requiere guardia
    useEffect(() => {
        if (categoria === 'caja') {
            setRequiereGuardia(true);
        }
    }, [categoria]);

    const toggleTipoContrato = (tipo: string) => {
        if (tiposContratoSeleccionados.includes(tipo)) {
            setTiposContratoSeleccionados(tiposContratoSeleccionados.filter(t => t !== tipo));
        } else {
            setTiposContratoSeleccionados([...tiposContratoSeleccionados, tipo]);
        }
    };

    const handleCrear = async () => {
        if (!nombre.trim()) {
            setResultado({
                exitoso: false,
                mensaje: 'El nombre del beneficio es requerido'
            });
            return;
        }

        if (tiposContratoSeleccionados.length === 0) {
            setResultado({
                exitoso: false,
                mensaje: 'Selecciona al menos un tipo de contrato'
            });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || undefined,
                requiere_validacion_guardia: requiereGuardia,
                es_caja: categoria === 'caja',
                tipos_contrato: tiposContratoSeleccionados
            };

            const { data } = await apiClient.post<TipoBeneficio>('tipos-beneficio/', payload);

            setResultado({
                exitoso: true,
                tipo: data,
                mensaje: `Tipo de beneficio "${data.nombre}" creado exitosamente`
            });

            // Limpiar formulario
            setNombre('');
            setDescripcion('');
            setCategoria('caja');
            setRequiereGuardia(true);
            setTiposContratoSeleccionados([]);

            // Callback
            onBeneficioCreado?.(data);

            // Limpiar resultado después de 3 segundos
            setTimeout(() => setResultado(null), 3000);
        } catch (error: any) {
            const mensaje = error?.response?.data?.detail || error.message || 'Error creando tipo de beneficio';
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
        <div className="flex flex-col bg-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#E12019] to-[#B51810] text-[#333333] p-6 rounded-t-xl">
                <h1 className="text-3xl font-bold">Crear Tipo de Beneficio</h1>
                <p className="text-[#333333] mt-1 font-semibold text-lg">Define un nuevo tipo de beneficio para asignar a trabajadores</p>
            </div>

            {/* Contenido */}
            <div className="p-6">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Información */}
                    <div className="bg-[#E8F5F1] border-2 border-[#CFE9E1] rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-[#017E49] flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-[#333333]">
                                <p className="font-bold mb-1">¿Qué es un Tipo de Beneficio?</p>
                                <p>
                                    Es una plantilla que define qué tipo de beneficio se puede asignar (Ej: Caja de Navidad, 
                                    Bono Fiestas Patrias, etc.). Una vez creado, podrás asignarlo a trabajadores específicos.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Nombre */}
                    <div>
                        <label className="block text-lg font-bold text-[#333333] mb-2">
                            Nombre del Beneficio <span className="text-[#E12019]">*</span>
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => {
                                setNombre(e.target.value);
                                setResultado(null);
                            }}
                            placeholder="Ej: Caja de Navidad Premium, Bono Fiestas Patrias"
                            className="w-full px-4 py-3 border-2 border-[#E0E0E0] rounded-lg focus:border-[#E12019] focus:outline-none focus:ring-2 focus:ring-[#E12019]/20 text-lg"
                            disabled={loading}
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-lg font-bold text-[#333333] mb-2">
                            Descripción (opcional)
                        </label>
                        <textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Describe el beneficio, su contenido o características..."
                            className="w-full px-4 py-3 border-2 border-[#E0E0E0] rounded-lg focus:border-[#E12019] focus:outline-none focus:ring-2 focus:ring-[#E12019]/20 resize-none"
                            rows={3}
                            disabled={loading}
                        />
                    </div>

                    {/* Categoría: Caja u Otro */}
                    <div className="bg-[#F8F8F8] border-2 border-[#E0E0E0] rounded-lg p-4">
                        <h3 className="font-bold text-[#333333] mb-3">
                            Tipo de Beneficio <span className="text-[#E12019]">*</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setCategoria('caja')}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                    categoria === 'caja'
                                        ? 'border-[#017E49] bg-[#E8F5F1]'
                                        : 'border-[#E0E0E0] bg-white hover:border-[#017E49]'
                                }`}
                                disabled={loading}
                            >
                                <Package className={`w-8 h-8 mx-auto mb-2 ${
                                    categoria === 'caja' ? 'text-[#017E49]' : 'text-[#6B6B6B]'
                                }`} />
                                <p className="font-bold text-center text-[#333333]">Caja Física</p>
                                <p className="text-xs text-[#555555] text-center mt-1">
                                    Requiere validación con guardia
                                </p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setCategoria('otro')}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                    categoria === 'otro'
                                        ? 'border-[#017E49] bg-[#E8F5F1]'
                                        : 'border-[#E0E0E0] bg-white hover:border-[#017E49]'
                                }`}
                                disabled={loading}
                            >
                                <Gift className={`w-8 h-8 mx-auto mb-2 ${
                                    categoria === 'otro' ? 'text-[#017E49]' : 'text-[#6B6B6B]'
                                }`} />
                                <p className="font-bold text-center text-[#333333]">Otro Beneficio</p>
                                <p className="text-xs text-[#555555] text-center mt-1">
                                    Bono, permiso, descuento, etc.
                                </p>
                            </button>
                        </div>

                        {/* Si es OTRO, preguntar si requiere guardia */}
                        {categoria === 'otro' && (
                            <div className="mt-4 p-3 bg-white border border-[#E0E0E0] rounded-lg">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={requiereGuardia}
                                        onChange={(e) => setRequiereGuardia(e.target.checked)}
                                        className="w-5 h-5 text-[#017E49]"
                                        disabled={loading}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-[#017E49]" />
                                            <span className="font-semibold text-[#333333]">
                                                Requiere validación con guardia
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#555555] mt-1">
                                            Si está marcado, el trabajador deberá pasar por guardia para validar el código QR
                                        </p>
                                    </div>
                                </label>
                            </div>
                        )}

                        {categoria === 'caja' && (
                            <div className="mt-4 p-3 bg-[#FFF9F0] border border-[#FFE0B2] rounded-lg">
                                <div className="flex items-start gap-2">
                                    <Shield className="w-5 h-5 text-[#FF9F55] flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-[#333333]">
                                        <strong>Las cajas físicas siempre requieren validación con guardia.</strong> 
                                        El guardia escaneará el código QR y registrará la entrega de la caja.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tipos de Contrato */}
                    <div className="bg-[#E8F5F1] border-2 border-[#CFE9E1] rounded-lg p-4">
                        <h3 className="font-bold text-[#333333] mb-3">
                            ¿Qué tipos de contrato pueden recibir este beneficio? <span className="text-[#E12019]">*</span>
                        </h3>
                        <div className="space-y-2">
                            {tiposContrato.map(tipo => (
                                <label
                                    key={tipo.value}
                                    className="flex items-center gap-3 p-3 bg-white border-2 border-[#E0E0E0] rounded-lg cursor-pointer hover:border-[#017E49] transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={tiposContratoSeleccionados.includes(tipo.value)}
                                        onChange={() => toggleTipoContrato(tipo.value)}
                                        className="w-5 h-5 text-[#017E49]"
                                        disabled={loading}
                                    />
                                    <span className="font-semibold text-[#333333]">{tipo.label}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-[#555555] mt-3">
                            <strong>Nota:</strong> Solo los trabajadores con estos tipos de contrato podrán recibir este beneficio
                        </p>
                    </div>

                    {/* Resultado */}
                    {resultado && (
                        <div
                            className={`rounded-lg p-4 border-2 ${
                                resultado.exitoso
                                    ? 'bg-[#E8F5F1] border-[#017E49]'
                                    : 'bg-[#FFEBE9] border-[#E12019]'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                {resultado.exitoso ? (
                                    <CheckCircle2 className="w-6 h-6 text-[#017E49] flex-shrink-0 mt-0.5" />
                                ) : (
                                    <X className="w-6 h-6 text-[#E12019] flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <p className={resultado.exitoso ? 'text-[#333333] font-bold' : 'text-[#333333] font-bold'}>
                                        {resultado.mensaje}
                                    </p>
                                    {resultado.tipo && (
                                        <div className="mt-2 text-sm text-[#333333] space-y-1">
                                            <p><strong>ID:</strong> {resultado.tipo.id}</p>
                                            <p><strong>Nombre:</strong> {resultado.tipo.nombre}</p>
                                            <p><strong>Categoría:</strong> {resultado.tipo.es_caja ? 'Caja Física' : 'Otro Beneficio'}</p>
                                            <p><strong>Requiere Guardia:</strong> {resultado.tipo.requiere_validacion_guardia ? 'Sí' : 'No'}</p>
                                            <p><strong>Tipos de Contrato:</strong> {resultado.tipo.tipos_contrato.join(', ')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Botón Crear */}
                    <button
                        onClick={handleCrear}
                        disabled={loading || !nombre.trim() || tiposContratoSeleccionados.length === 0}
                        className="w-full px-6 py-4 bg-[#E12019] text-white font-bold rounded-lg hover:bg-[#B51810] disabled:bg-[#C0C0C0] disabled:text-[#6B6B6B] disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xl transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-6 h-6 animate-spin" />
                                Creando...
                            </>
                        ) : (
                            <>
                                <Plus className="w-6 h-6" />
                                Crear Tipo de Beneficio
                            </>
                        )}
                    </button>

                    {/* Resumen */}
                    {nombre && tiposContratoSeleccionados.length > 0 && (
                        <div className="bg-[#F8F8F8] border border-[#E0E0E0] rounded-lg p-4">
                            <h4 className="font-bold text-[#333333] mb-2">Resumen:</h4>
                            <ul className="text-sm text-[#333333] space-y-1">
                                <li>📦 <strong>Nombre:</strong> {nombre}</li>
                                <li>🏷️ <strong>Tipo:</strong> {categoria === 'caja' ? 'Caja Física' : 'Otro Beneficio'}</li>
                                <li>🛡️ <strong>Validación Guardia:</strong> {requiereGuardia ? 'Sí' : 'No'}</li>
                                <li>👥 <strong>Contratos permitidos:</strong> {tiposContratoSeleccionados.map(t => 
                                    tiposContrato.find(tc => tc.value === t)?.label
                                ).join(', ')}</li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
