import React from 'react';
import { formatRutOnType, validateRut, formatRut } from '@/utils/rut';
import { CheckCircle2 } from 'lucide-react';
import TotemScannerPanel from '@/components/TotemScannerPanel';

type Props = {
    onRutDetected: (rut: string) => void;
    onCheckIncidents?: () => void;
};

export default function TotemInitialScreen({ onRutDetected, onCheckIncidents }: Props) {
    const [rutInput, setRutInput] = React.useState('');
    const [trabajadorNombre, setTrabajadorNombre] = React.useState<string | null>(null);
    const [searching, setSearching] = React.useState(false);

    const handleRutInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatRutOnType(e.target.value);
        setRutInput(formatted);
        setTrabajadorNombre(null);

        // Buscar nombre si el RUT es válido
        if (formatted && validateRut(formatted)) {
            obtenerDatosTrabajador(formatted);
        }
    };

    // Obtener datos básicos del trabajador (nombre)
    const obtenerDatosTrabajador = async (rut: string) => {
        try {
            setSearching(true);
            const response = await fetch(`http://localhost:8000/api/trabajadores-datos/${rut}/`);
            const data = await response.json();
            if (data.existe) {
                setTrabajadorNombre(data.nombre);
            } else {
                setTrabajadorNombre(null);
            }
        } catch (error) {
            console.error('Error obteniendo datos del trabajador:', error);
            setTrabajadorNombre(null);
        } finally {
            setSearching(false);
        }
    };

    const handleLogin = () => {
        if (rutInput && validateRut(rutInput)) {
            onRutDetected(rutInput);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 p-4">
            <h2 className="text-3xl font-bold text-center mb-2">¡Bienvenido!</h2>
            <p className="text-gray-600 text-center max-w-lg">Escanea tu cédula o ingresa tu RUT para continuar</p>

            {/* Escáner mejorado con cuadro de enfoque */}
            <div className="w-full max-w-lg bg-black rounded-md overflow-hidden border-2 border-gray-300" style={{ minHeight: '300px' }}>
                <TotemScannerPanel
                    onRutDetected={async (rut) => {
                        setRutInput(rut); // Rellenar input automáticamente
                        await obtenerDatosTrabajador(rut);
                        // Pequeña pausa para mostrar el nombre antes de transicionar
                        await new Promise(r => setTimeout(r, 800));
                        onRutDetected(rut);
                    }}
                    onError={(msg) => {
                        console.error('Scanner error:', msg);
                    }}
                />
            </div>

            {/* Separador visual */}
            <div className="w-full max-w-lg flex items-center gap-2">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="text-gray-500 text-sm">O ingresa manualmente</span>
                <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* RUT Input Section */}
            <div className="w-full max-w-lg">
                <input
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 font-mono text-lg tracking-wider focus:border-[#017E49] focus:outline-none focus:ring-2 focus:ring-[#017E49]/20 transition-all"
                    placeholder="12.345.678-9"
                    value={rutInput}
                    onChange={handleRutInputChange}
                    maxLength={12}
                />
            </div>

            {/* Trabajador encontrado */}
            {trabajadorNombre && !searching && (
                <div className="w-full max-w-lg bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle2 className="text-blue-600 flex-shrink-0" size={24} />
                    <div>
                        <p className="text-sm text-blue-600 font-semibold">Persona encontrada:</p>
                        <p className="text-blue-900 font-bold text-lg">{trabajadorNombre}</p>
                    </div>
                </div>
            )}

            {/* Botón de Continuar */}
            <div className="w-full max-w-lg">
                <button
                    className="w-full px-6 py-4 bg-[#017E49] text-white rounded-xl font-bold hover:bg-[#015A34] disabled:bg-gray-400 transition-colors shadow-md text-lg"
                    onClick={handleLogin}
                    disabled={!rutInput || !validateRut(rutInput) || searching}
                >
                    {searching ? (
                        <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block mr-2"></div>
                            Buscando...
                        </>
                    ) : (
                        'Continuar'
                    )}
                </button>
            </div>

            {/* Botón de Consultar Incidencias */}
            {onCheckIncidents && (
                <div className="w-full max-w-lg mt-4">
                    <button
                        className="w-full px-6 py-4 bg-[#E12019] text-white rounded-xl font-bold hover:bg-[#B51810] transition-colors shadow-md text-lg"
                        onClick={onCheckIncidents}
                    >
                        Consultar mis incidencias
                    </button>
                </div>
            )}
        </div>
    );
}
