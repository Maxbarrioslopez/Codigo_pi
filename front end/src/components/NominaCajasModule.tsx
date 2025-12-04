import { useState, useEffect } from 'react';
import { Upload, Package, Users, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { cajasService, CajaBeneficioDTO } from '@/services/cajas.service';
import { cicloService } from '@/services/ciclo.service';
import { CicloDTO, TipoBeneficioDTO, TrabajadorDTO } from '@/types';
import { toast } from 'sonner';

interface TrabajadorConCaja extends TrabajadorDTO {
    tipo_contrato?: string;
    cajaAsignada?: number | null;
}

export function NominaCajasModule() {
    const [ciclos, setCiclos] = useState<CicloDTO[]>([]);
    const [beneficios, setBeneficios] = useState<TipoBeneficioDTO[]>([]);
    const [cajas, setCajas] = useState<CajaBeneficioDTO[]>([]);
    const [trabajadores, setTrabajadores] = useState<TrabajadorConCaja[]>([]);

    const [selectedCiclo, setSelectedCiclo] = useState<CicloDTO | null>(null);
    const [selectedBeneficio, setSelectedBeneficio] = useState<TipoBeneficioDTO | null>(null);

    const [showAsignacionModal, setShowAsignacionModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [asignacionProgress, setAsignacionProgress] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [ciclosData, beneficiosData, cajasData] = await Promise.all([
                cicloService.getAll(),
                cicloService.getAllTipos(),
                cajasService.getCajasBeneficio(),
            ]);
            setCiclos(ciclosData.filter(c => c.activo));
            setBeneficios(beneficiosData.filter(b => b.activo));
            setCajas(cajasData.filter(c => c.activo));
        } catch (error) {
            toast.error('Error al cargar datos');
            console.error(error);
        }
    };

    const getCajasDisponibles = (beneficioId: number | undefined) => {
        if (!beneficioId) return [];
        return cajas.filter(c => c.beneficio === beneficioId);
    };

    const handleAsignarCajaMasiva = (tipoContrato: string, cajaId: number) => {
        setTrabajadores(trabajadores.map(t => {
            if (t.tipo_contrato === tipoContrato) {
                return { ...t, cajaAsignada: cajaId };
            }
            return t;
        }));
        toast.success(`Cajas asignadas a todos los trabajadores de tipo ${tipoContrato}`);
    };

    const handleAsignarCajaIndividual = (trabajadorId: number, cajaId: number) => {
        setTrabajadores(trabajadores.map(t => {
            if (t.id === trabajadorId) {
                return { ...t, cajaAsignada: cajaId };
            }
            return t;
        }));
    };

    const handleConfirmarAsignacion = async () => {
        if (!selectedCiclo || !selectedBeneficio) {
            toast.error('Selecciona ciclo y beneficio');
            return;
        }

        const sinCaja = trabajadores.filter(t => !t.cajaAsignada);
        if (sinCaja.length > 0) {
            toast.error(`${sinCaja.length} trabajadores sin caja asignada`);
            return;
        }

        setShowConfirmModal(true);
    };

    const handleProcesarAsignacion = async () => {
        if (!selectedCiclo || !selectedBeneficio) return;

        try {
            setLoading(true);
            setAsignacionProgress(0);
            setShowConfirmModal(false);

            // Preparar datos para envío bulk
            const asignaciones = trabajadores.map(t => ({
                trabajador: t.id,
                ciclo: selectedCiclo.id,
                tipo_beneficio: selectedBeneficio.id,
                caja_beneficio: t.cajaAsignada!,
            }));

            // Enviar en chunks para mejor UX
            const chunkSize = 50;
            for (let i = 0; i < asignaciones.length; i += chunkSize) {
                const chunk = asignaciones.slice(i, i + chunkSize);
                await cajasService.createBeneficiosTrabajadores(chunk);
                setAsignacionProgress(Math.min(100, ((i + chunkSize) / asignaciones.length) * 100));
            }

            toast.success(`${trabajadores.length} beneficios asignados con códigos QR generados`);
            setShowAsignacionModal(false);
            resetState();
        } catch (error) {
            toast.error('Error al procesar asignación');
            console.error(error);
        } finally {
            setLoading(false);
            setAsignacionProgress(0);
        }
    };

    const resetState = () => {
        setTrabajadores([]);
        setSelectedCiclo(null);
        setSelectedBeneficio(null);
    };

    const cargarTrabajadoresDemo = () => {
        // Simulación de carga de nómina - en producción vendría del Excel
        const trabajadoresDemo: TrabajadorConCaja[] = [
            { id: 1, rut: '12345678-9', nombre: 'Juan Pérez', beneficio_disponible: {}, tipo_contrato: 'planta', cajaAsignada: null },
            { id: 2, rut: '23456789-0', nombre: 'Ana López', beneficio_disponible: {}, tipo_contrato: 'planta', cajaAsignada: null },
            { id: 3, rut: '34567890-1', nombre: 'Carlos Ruiz', beneficio_disponible: {}, tipo_contrato: 'contrata', cajaAsignada: null },
            { id: 4, rut: '45678901-2', nombre: 'María González', beneficio_disponible: {}, tipo_contrato: 'contrata', cajaAsignada: null },
            { id: 5, rut: '56789012-3', nombre: 'Pedro Soto', beneficio_disponible: {}, tipo_contrato: 'honorarios', cajaAsignada: null },
        ];
        setTrabajadores(trabajadoresDemo);
        setShowAsignacionModal(true);
    };

    const cajasDisponibles = getCajasDisponibles(selectedBeneficio?.id);
    const tiposContrato = [...new Set(trabajadores.map(t => t.tipo_contrato).filter(Boolean))];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-6 h-6" />
                        Carga de Nómina con Cajas
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Carga trabajadores y asigna cajas de beneficio por ciclo
                    </p>
                </div>
                <Button
                    onClick={cargarTrabajadoresDemo}
                    className="bg-[#E12019] text-white hover:bg-[#B51810]"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Cargar Nómina (Demo)
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Ciclos Activos</span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{ciclos.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Beneficios Disponibles</span>
                        <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{beneficios.length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Cajas Creadas</span>
                        <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{cajas.length}</p>
                </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-1">Proceso de Carga con Cajas</h3>
                        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                            <li>Sube archivo Excel con RUT, Nombre y Tipo de Contrato</li>
                            <li>Selecciona el Ciclo y Beneficio correspondiente</li>
                            <li>Asigna qué caja le corresponde a cada trabajador (individual o masivo)</li>
                            <li>Confirma para generar códigos QR únicos automáticamente</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* Modal Asignación */}
            <Dialog open={showAsignacionModal} onOpenChange={setShowAsignacionModal}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Asignar Cajas a Trabajadores</DialogTitle>
                        <DialogDescription>
                            {trabajadores.length} trabajadores cargados - Asigna cajas antes de confirmar
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Selección de Ciclo y Beneficio */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Ciclo *</Label>
                                <Select
                                    value={selectedCiclo?.id.toString() || ''}
                                    onValueChange={(value) => {
                                        const ciclo = ciclos.find(c => c.id === parseInt(value));
                                        setSelectedCiclo(ciclo || null);
                                    }}
                                >
                                    <SelectTrigger className="mt-2">
                                        <SelectValue placeholder="Selecciona ciclo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ciclos.map((ciclo) => (
                                            <SelectItem key={ciclo.id} value={ciclo.id.toString()}>
                                                {ciclo.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Beneficio *</Label>
                                <Select
                                    value={selectedBeneficio?.id.toString() || ''}
                                    onValueChange={(value) => {
                                        const beneficio = beneficios.find(b => b.id === parseInt(value));
                                        setSelectedBeneficio(beneficio || null);
                                    }}
                                >
                                    <SelectTrigger className="mt-2">
                                        <SelectValue placeholder="Selecciona beneficio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {beneficios.map((beneficio) => (
                                            <SelectItem key={beneficio.id} value={beneficio.id.toString()}>
                                                {beneficio.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Asignación Masiva por Tipo Contrato */}
                        {selectedBeneficio && cajasDisponibles.length > 0 && (
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <h4 className="font-semibold mb-3">Asignación Masiva por Tipo de Contrato</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {tiposContrato.map((tipo) => (
                                        <div key={tipo} className="bg-white p-3 rounded border">
                                            <p className="text-sm font-medium mb-2 capitalize">{tipo}</p>
                                            <Select onValueChange={(value) => handleAsignarCajaMasiva(tipo!, parseInt(value))}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Asignar caja..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {cajasDisponibles.map((caja) => (
                                                        <SelectItem key={caja.id} value={caja.id.toString()}>
                                                            {caja.nombre}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Lista de Trabajadores */}
                        <div>
                            <h4 className="font-semibold mb-3">Trabajadores y Cajas Asignadas</h4>
                            <div className="border rounded-lg overflow-hidden">
                                <div className="max-h-96 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left">RUT</th>
                                                <th className="px-4 py-2 text-left">Nombre</th>
                                                <th className="px-4 py-2 text-left">Tipo Contrato</th>
                                                <th className="px-4 py-2 text-left">Caja Asignada</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {trabajadores.map((trabajador) => (
                                                <tr key={trabajador.id} className="border-t hover:bg-gray-50">
                                                    <td className="px-4 py-2">{trabajador.rut}</td>
                                                    <td className="px-4 py-2">{trabajador.nombre}</td>
                                                    <td className="px-4 py-2">
                                                        <Badge variant="outline" className="capitalize">
                                                            {trabajador.tipo_contrato || 'N/A'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {selectedBeneficio && cajasDisponibles.length > 0 ? (
                                                            <Select
                                                                value={trabajador.cajaAsignada?.toString() || ''}
                                                                onValueChange={(value) => handleAsignarCajaIndividual(trabajador.id, parseInt(value))}
                                                            >
                                                                <SelectTrigger className="h-8 w-40">
                                                                    <SelectValue placeholder="Seleccionar..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {cajasDisponibles.map((caja) => (
                                                                        <SelectItem key={caja.id} value={caja.id.toString()}>
                                                                            {caja.nombre}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">Selecciona beneficio primero</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {loading && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span>Procesando asignaciones...</span>
                                    <span>{Math.round(asignacionProgress)}%</span>
                                </div>
                                <Progress value={asignacionProgress} className="h-2" />
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowAsignacionModal(false)}
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmarAsignacion}
                            className="flex-1 bg-[#017E49] text-white hover:bg-[#016339]"
                            disabled={!selectedCiclo || !selectedBeneficio || loading}
                        >
                            Confirmar y Generar QR
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal Confirmación */}
            <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirmar Asignación</DialogTitle>
                        <DialogDescription>
                            Se generarán códigos QR únicos para {trabajadores.length} trabajadores
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-900 mb-2">
                                <strong>Resumen:</strong>
                            </p>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Ciclo: {selectedCiclo?.nombre}</li>
                                <li>• Beneficio: {selectedBeneficio?.nombre}</li>
                                <li>• Trabajadores: {trabajadores.length}</li>
                                <li>• Cajas asignadas: {trabajadores.filter(t => t.cajaAsignada).length}</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="flex-1">
                            Cancelar
                        </Button>
                        <Button onClick={handleProcesarAsignacion} className="flex-1 bg-[#E12019] text-white hover:bg-[#B51810]">
                            Sí, Procesar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
