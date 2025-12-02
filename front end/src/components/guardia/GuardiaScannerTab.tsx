import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Scan, Camera, X } from 'lucide-react';
import { useGuardiaScanner } from '@/hooks/useGuardiaScanner';

export function GuardiaScannerTab() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [deviceId, setDeviceId] = useState<string | undefined>(undefined);

    const {
        state,
        error,
        errorMessage,
        validatedTicket,
        isScanning,
        startScanning,
        stopScanning,
        reset,
    } = useGuardiaScanner();

    useEffect(() => {
        if (cameraActive && videoRef.current) {
            startScanning(videoRef.current, deviceId).catch((err) => {
                console.error('Error iniciando cámara:', err);
                setCameraActive(false);
            });
        }
        return () => {
            if (isScanning) stopScanning();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cameraActive, deviceId]);

    const toggleCamera = () => {
        if (cameraActive) {
            stopScanning();
        }
        setCameraActive(!cameraActive);
    };

    const handleReset = () => {
        reset();
        setCameraActive(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-4 md:p-6">
                <h2 className="text-xl md:text-2xl font-bold text-[#333333] mb-2">
                    Validación de Tickets
                </h2>
                <p className="text-[#6B6B6B] text-sm md:text-base">
                    Escanea el código QR del ticket del trabajador para validar y entregar el beneficio
                </p>
            </div>

            {/* Estado: Idle o Scanning */}
            {(state === 'idle' || state === 'scanning') && (
                <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
                    {cameraActive ? (
                        <div className="relative">
                            <video
                                ref={videoRef}
                                className="w-full h-64 md:h-96 object-cover rounded-lg bg-black"
                                autoPlay
                                playsInline
                                muted
                            />
                            <button
                                onClick={toggleCamera}
                                className="absolute top-2 right-2 p-2 bg-[#E12019] text-white rounded-full hover:bg-[#B51810] transition-colors shadow-lg z-10"
                                title="Desactivar cámara"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            {/* Marco de guía */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="w-64 h-64 md:w-80 md:h-80 relative">
                                    <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-[#E12019] rounded-tl-lg"></div>
                                    <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-[#E12019] rounded-tr-lg"></div>
                                    <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-[#E12019] rounded-bl-lg"></div>
                                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-[#E12019] rounded-br-lg"></div>
                                    <div className="absolute inset-x-0 h-1 bg-[#E12019] animate-pulse" style={{ top: '50%', boxShadow: '0 0 15px #E12019' }}></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-12">
                            <Scan className="w-24 h-24 text-[#E12019] mb-6" />
                            <button
                                onClick={toggleCamera}
                                className="px-6 py-3 bg-[#E12019] text-white rounded-lg hover:bg-[#B51810] transition-colors flex items-center gap-2 shadow-md text-base font-semibold"
                            >
                                <Camera className="w-5 h-5" />
                                Activar Cámara
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Estado: Validating */}
            {state === 'validating' && (
                <div className="bg-white border-2 border-[#FF9F55] rounded-xl p-8 flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-[#FF9F55] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-lg font-semibold text-[#333333]">Validando ticket...</p>
                </div>
            )}

            {/* Estado: Success */}
            {state === 'success' && validatedTicket && (
                <div className="bg-white border-2 border-[#017E49] rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <CheckCircle2 className="w-12 h-12 text-[#017E49]" />
                        <div>
                            <h3 className="text-xl font-bold text-[#333333]">✓ Ticket Válido</h3>
                            <p className="text-[#6B6B6B] text-sm">Beneficio listo para entrega</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="bg-[#F8F8F8] rounded-lg p-3">
                            <p className="text-[#6B6B6B] text-xs mb-1">Trabajador</p>
                            <p className="text-[#333333] font-semibold">{validatedTicket.trabajador.nombre}</p>
                        </div>
                        <div className="bg-[#F8F8F8] rounded-lg p-3">
                            <p className="text-[#6B6B6B] text-xs mb-1">RUT</p>
                            <p className="text-[#333333] font-semibold">{validatedTicket.trabajador.rut}</p>
                        </div>
                        {validatedTicket.caja_asignada && (
                            <div className="bg-[#F8F8F8] rounded-lg p-3">
                                <p className="text-[#6B6B6B] text-xs mb-1">Caja Asignada</p>
                                <p className="text-[#333333] font-semibold">{validatedTicket.caja_asignada}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleReset}
                        className="w-full px-6 py-3 bg-[#017E49] text-white rounded-lg hover:bg-[#015A34] transition-colors font-semibold"
                    >
                        Confirmar Entrega y Escanear Siguiente
                    </button>
                </div>
            )}

            {/* Estado: Error */}
            {state === 'error' && error && (
                <div className="bg-white border-2 border-[#E12019] rounded-xl p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <AlertCircle className="w-12 h-12 text-[#E12019] flex-shrink-0" />
                        <div>
                            <h3 className="text-xl font-bold text-[#333333] mb-2">Error de Validación</h3>
                            <p className="text-[#E12019] font-medium">{getErrorTitle(error)}</p>
                            <p className="text-[#6B6B6B] text-sm mt-2">{errorMessage}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleReset}
                        className="w-full px-6 py-3 bg-[#E12019] text-white rounded-lg hover:bg-[#B51810] transition-colors font-semibold"
                    >
                        Reintentar
                    </button>
                </div>
            )}
        </div>
    );
}

function getErrorTitle(errorCode: string): string {
    const titles: Record<string, string> = {
        ticket_not_found: 'Ticket No Encontrado',
        ticket_expired: 'Ticket Expirado',
        ticket_already_used: 'Ticket Ya Utilizado',
        qr_invalid: 'Código QR Inválido',
        no_stock: 'Sin Stock Disponible',
        network_error: 'Error de Conexión',
        unknown_error: 'Error Desconocido',
    };
    return titles[errorCode] || 'Error de Validación';
}
