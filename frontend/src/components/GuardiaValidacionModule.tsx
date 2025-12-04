import { useState, useEffect } from 'react';
import { QrCode, Search, CheckCircle, XCircle, AlertTriangle, Package, User, BarChart3 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { cajasService, BeneficioTrabajadorDTO, ValidacionCajaDTO } from '@/services/cajas.service';
import { toast } from 'sonner';

export function GuardiaValidacionModule() {
    const [codigoIngresado, setCodigoIngresado] = useState('');
    const [beneficioEncontrado, setBeneficioEncontrado] = useState<BeneficioTrabajadorDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const [cajaFisica, setCajaFisica] = useState('');
    const [notas, setNotas] = useState('');

    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        exitosos: 0,
        rechazados: 0,
        errores: 0,
        cajas_coinciden: 0,
    });

    const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
    const [historial, setHistorial] = useState<ValidacionCajaDTO[]>([]);

    useEffect(() => {
        loadEstadisticas();
    }, []);

    const loadEstadisticas = async () => {
        try {
            const stats = await cajasService.getEstadisticasValidaciones();
            setEstadisticas(stats);
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        }
    };

    const loadHistorial = async () => {
        try {
            const data = await cajasService.getValidacionesCaja();
            setHistorial(data);
            setShowEstadisticasModal(true);
        } catch (error) {
            toast.error('Error al cargar historial');
            console.error(error);
        }
    };

    const handleBuscarCodigo = async () => {
        if (!codigoIngresado.trim()) {
            toast.error('Ingresa un código');
            return;
        }

        try {
            setLoading(true);
            const beneficio = await cajasService.getBeneficioTrabajadorPorCodigo(codigoIngresado.trim());
            setBeneficioEncontrado(beneficio);
            toast.success('Trabajador encontrado');
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Código no encontrado');
            setBeneficioEncontrado(null);
        } finally {
            setLoading(false);
        }
    };

    const handleValidarEntrega = async (resultado: 'exitoso' | 'rechazado') => {
        if (!beneficioEncontrado) return;

        if (resultado === 'exitoso' && !cajaFisica.trim()) {
            toast.error('Ingresa el código de la caja física');
            return;
        }

        try {
            setLoading(true);
            await cajasService.createValidacionCaja({
                beneficio_trabajador_id: beneficioEncontrado.id,
                codigo_escaneado: codigoIngresado,
                resultado,
                caja_validada: cajaFisica,
                notas,
            });

            toast.success(
                resultado === 'exitoso'
                    ? '✅ Entrega registrada exitosamente'
                    : '❌ Entrega rechazada'
            );

            // Resetear
            resetForm();
            loadEstadisticas();
        } catch (error: any) {
            toast.error(error?.response?.data?.error || 'Error al registrar validación');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCodigoIngresado('');
        setBeneficioEncontrado(null);
        setCajaFisica('');
        setNotas('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBuscarCodigo();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <QrCode className="w-6 h-6" />
                                Validación de Cajas - Guardia
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Escanea QR o ingresa código para validar entregas
                            </p>
                        </div>
                        <Button
                            onClick={loadHistorial}
                            variant="outline"
                            size="sm"
                        >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Ver Estadísticas
                        </Button>
                    </div>
                </div>

                {/* Estadísticas Rápidas */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600">Total Hoy</span>
                            <Package className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-green-700">Exitosos</span>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-green-700">{estadisticas.exitosos}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-red-700">Rechazados</span>
                            <XCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <p className="text-2xl font-bold text-red-700">{estadisticas.rechazados}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-yellow-700">Errores</span>
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        </div>
                        <p className="text-2xl font-bold text-yellow-700">{estadisticas.errores}</p>
                    </div>
                </div>

                {/* Scanner Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="mb-4">
                        <Label htmlFor="codigo" className="text-base font-semibold">
                            Código de Verificación
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                            Escanea el código QR o ingrésalo manualmente
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Input
                            id="codigo"
                            placeholder="BEN-0013-000001-abc1d2e3"
                            value={codigoIngresado}
                            onChange={(e) => setCodigoIngresado(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="text-lg font-mono"
                            autoFocus
                        />
                        <Button
                            onClick={handleBuscarCodigo}
                            disabled={loading || !codigoIngresado.trim()}
                            className="bg-[#017E49] text-white hover:bg-[#016339]"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Buscar
                        </Button>
                    </div>
                </div>

                {/* Resultado de Búsqueda */}
                {beneficioEncontrado && (
                    <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900">Trabajador Encontrado</h3>
                                <p className="text-sm text-gray-600">Verifica los datos antes de entregar</p>
                            </div>
                        </div>

                        {/* Datos del Trabajador */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-600">RUT</span>
                                </div>
                                <p className="text-lg font-semibold text-gray-900">{beneficioEncontrado.trabajador.rut}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <User className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-600">Nombre</span>
                                </div>
                                <p className="text-lg font-semibold text-gray-900">{beneficioEncontrado.trabajador.nombre}</p>
                            </div>
                        </div>

                        {/* Beneficio a Entregar */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-3">
                                <Package className="w-5 h-5 text-blue-600" />
                                <h4 className="font-semibold text-blue-900">Debe Recibir:</h4>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-blue-600">Caja ID: {beneficioEncontrado.caja_beneficio}</Badge>
                                    <span className="text-sm text-blue-800">
                                        Ciclo: {beneficioEncontrado.ciclo}
                                    </span>
                                </div>
                                <p className="text-xs text-blue-700 font-mono bg-blue-100 p-2 rounded">
                                    QR: {beneficioEncontrado.qr_data}
                                </p>
                            </div>
                        </div>

                        {/* Formulario de Validación */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="caja-fisica">Código Caja Física Entregada *</Label>
                                <Input
                                    id="caja-fisica"
                                    placeholder="CAJA-12345"
                                    value={cajaFisica}
                                    onChange={(e) => setCajaFisica(e.target.value.toUpperCase())}
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label htmlFor="notas">Notas (opcional)</Label>
                                <Textarea
                                    id="notas"
                                    placeholder="Observaciones..."
                                    value={notas}
                                    onChange={(e) => setNotas(e.target.value)}
                                    className="mt-2"
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                            <Button
                                onClick={() => handleValidarEntrega('exitoso')}
                                disabled={loading || !cajaFisica.trim()}
                                className="bg-green-600 text-white hover:bg-green-700 h-12"
                            >
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Sí, Entregar Caja
                            </Button>
                            <Button
                                onClick={() => handleValidarEntrega('rechazado')}
                                disabled={loading}
                                variant="outline"
                                className="border-red-500 text-red-600 hover:bg-red-50 h-12"
                            >
                                <XCircle className="w-5 h-5 mr-2" />
                                Rechazar Entrega
                            </Button>
                        </div>
                    </div>
                )}

                {/* Instrucciones */}
                {!beneficioEncontrado && (
                    <div className="bg-gray-50 p-6 rounded-lg border">
                        <h3 className="font-semibold text-gray-900 mb-3">Instrucciones:</h3>
                        <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
                            <li>Solicita al trabajador que muestre el código QR desde el TOTEM</li>
                            <li>Escanea el código o ingrésalo manualmente</li>
                            <li>Verifica que el RUT del trabajador coincida con el sistema</li>
                            <li>Confirma qué tipo de caja debe recibir</li>
                            <li>Entrega la caja física y registra el código de la caja</li>
                            <li>Presiona "Sí, Entregar Caja" para confirmar</li>
                        </ol>
                    </div>
                )}

                {/* Modal Estadísticas */}
                <Dialog open={showEstadisticasModal} onOpenChange={setShowEstadisticasModal}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Historial de Validaciones</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            {historial.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No hay validaciones registradas</p>
                            ) : (
                                <div className="space-y-3">
                                    {historial.map((validacion) => (
                                        <div
                                            key={validacion.id}
                                            className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge
                                                            variant={
                                                                validacion.resultado === 'exitoso'
                                                                    ? 'default'
                                                                    : validacion.resultado === 'rechazado'
                                                                        ? 'destructive'
                                                                        : 'secondary'
                                                            }
                                                        >
                                                            {validacion.resultado}
                                                        </Badge>
                                                        <span className="text-sm text-gray-600">
                                                            {new Date(validacion.fecha_validacion).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">
                                                        <strong>Código:</strong> {validacion.codigo_escaneado}
                                                    </p>
                                                    <p className="text-sm">
                                                        <strong>Caja:</strong> {validacion.caja_validada}
                                                    </p>
                                                    {validacion.notas && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            <strong>Notas:</strong> {validacion.notas}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    {validacion.caja_coincide ? (
                                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-600" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
