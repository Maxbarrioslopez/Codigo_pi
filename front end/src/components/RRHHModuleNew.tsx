import { useState, useEffect } from 'react';
import { BarChart3, Users, Calendar, FileText, AlertCircle, Package, QrCode, Download, Plus, Edit, Trash2, Eye, Filter, Search, CheckCircle2, Clock, X } from 'lucide-react';
import { trabajadorService } from '../services/trabajador.service';
import { cicloService } from '../services/ciclo.service';
import { nominaService, NominaPreviewResponse } from '../services/nomina.service';
import { showError, showSuccess } from '../utils/toast';
import { stockService } from '../services/stock.service';
import { listarIncidencias, reportesRetirosPorDia, TicketDTO, IncidenciaDTO, RetirosDiaDTO } from '../services/api';
import { useCicloActivo } from '../hooks/useCicloActivo';
import { TrabajadorDTO, CicloDTO } from '../types';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

type RRHHTab = 'dashboard' | 'trabajadores' | 'ciclo' | 'nomina' | 'trazabilidad' | 'reportes';

export function RRHHModuleNew() {
    const [currentTab, setCurrentTab] = useState<RRHHTab>('dashboard');
    const { ciclo } = useCicloActivo();
    const [loading, setLoading] = useState(false);

    // Estado para trabajadores
    const [trabajadores, setTrabajadores] = useState<TrabajadorDTO[]>([]);
    const [trabajadorFilter, setTrabajadorFilter] = useState('');
    const [showAddTrabajador, setShowAddTrabajador] = useState(false);
    const [trabajadorForm, setTrabajadorForm] = useState<Partial<TrabajadorDTO>>({});

    // Estado para ciclos
    const [ciclos, setCiclos] = useState<CicloDTO[]>([]);
    const [showAddCiclo, setShowAddCiclo] = useState(false);
    const [cicloForm, setCicloForm] = useState<{ fecha_inicio?: string; fecha_fin?: string; nombre?: string }>({});
    const [newCycleId, setNewCycleId] = useState<number | null>(null);
    const [showNominaWizard, setShowNominaWizard] = useState(false);

    // Estado para nómina
    const [nominaPreview, setNominaPreview] = useState<NominaPreviewResponse | null>(null);
    const [showNominaPreview, setShowNominaPreview] = useState(false);
    const [nominaHistorial, setNominaHistorial] = useState<any[]>([]);

    // Estado para otros datos
    const [incidencias, setIncidencias] = useState<IncidenciaDTO[]>([]);
    const [tickets, setTickets] = useState<TicketDTO[]>([]);
    const [retirosDia, setRetirosDia] = useState<RetirosDiaDTO[]>([]);

    // Cargar datos al montar
    useEffect(() => {
        loadAllData();
    }, [currentTab]);

    async function loadAllData() {
        setLoading(true);
        try {
            const [trab, cicl, inc, ret, hist] = await Promise.all([
                trabajadorService.getAll().catch(() => []),
                cicloService.getAll().catch(() => []),
                listarIncidencias().catch(() => []),
                reportesRetirosPorDia(7).catch(() => []),
                nominaService.getHistorial().catch(() => []),
            ]);
            setTrabajadores(trab);
            setCiclos(cicl);
            setIncidencias(inc);
            setRetirosDia(ret);
            setNominaHistorial(hist);
        } catch (error) {
            console.error('Error loading RRHH data:', error);
        } finally {
            setLoading(false);
        }
    }

    // TRABAJADORES
    const handleAddTrabajador = async () => {
        if (!trabajadorForm.rut || !trabajadorForm.nombre) return;
        try {
            const newTrabajador = await trabajadorService.create(trabajadorForm);
            setTrabajadores([...trabajadores, newTrabajador]);
            setTrabajadorForm({});
            setShowAddTrabajador(false);
        } catch (error) {
            console.error('Error creating trabajador:', error);
        }
    };

    const handleDeleteTrabajador = async (rut: string) => {
        try {
            await trabajadorService.delete(rut);
            setTrabajadores(trabajadores.filter(t => t.rut !== rut));
        } catch (error) {
            console.error('Error deleting trabajador:', error);
        }
    };

    // CICLOS
    const handleAddCiclo = async () => {
        // Validación simple: fechas requeridas y orden
        if (!cicloForm.fecha_inicio || !cicloForm.fecha_fin) return;
        const ini = new Date(cicloForm.fecha_inicio);
        const fin = new Date(cicloForm.fecha_fin);
        if (isNaN(ini.getTime()) || isNaN(fin.getTime()) || ini >= fin) {
            showError('Fechas inválidas', 'La fecha de inicio debe ser anterior a la fecha de fin');
            return;
        }
        try {
            const newCiclo = await cicloService.create({ fecha_inicio: cicloForm.fecha_inicio, fecha_fin: cicloForm.fecha_fin });
            setCiclos([...ciclos, newCiclo]);
            setNewCycleId(newCiclo.id);
            setShowAddCiclo(false);
            // Abrir wizard de nómina para asociar carga inicial
            setShowNominaWizard(true);
            const name = cicloForm.nombre || `Ciclo ${new Date(cicloForm.fecha_inicio!).toISOString().slice(0, 7)}`;
            showSuccess('Ciclo creado', `${name} (#${newCiclo.id}) creado correctamente`);
            setCicloForm({});
        } catch (error) {
            console.error('Error creating ciclo:', error);
            showError('Error creando ciclo', 'Revisa los datos e intenta nuevamente');
        }
    };

    const handleCerrarCiclo = async (cicloId: number) => {
        try {
            const updated = await cicloService.cerrar(cicloId);
            setCiclos(ciclos.map(c => c.id === cicloId ? updated : c));
        } catch (error) {
            console.error('Error closing ciclo:', error);
        }
    };

    // NÓMINA
    const handleNominaPreview = async () => {
        if (!ciclo?.id) return;
        try {
            const preview = await nominaService.preview({ ciclo_id: ciclo.id });
            setNominaPreview(preview);
            setShowNominaPreview(true);
        } catch (error) {
            console.error('Error generating nomina preview:', error);
        }
    };

    const handleConfirmarNomina = async () => {
        if (!ciclo?.id) return;
        try {
            await nominaService.confirmar({ ciclo_id: ciclo.id, confirmado_por: 'RRHH' });
            setNominaPreview(null);
            setShowNominaPreview(false);
            loadAllData();
        } catch (error) {
            console.error('Error confirming nomina:', error);
        }
    };

    const filteredTrabajadores = trabajadores.filter(t =>
        t.nombre?.toLowerCase().includes(trabajadorFilter.toLowerCase()) ||
        t.rut?.includes(trabajadorFilter)
    );

    return (
        <div className="w-full h-full bg-[#F8F8F8]">
            {/* Header responsivo */}
            <div className="bg-white border-b-2 border-[#E0E0E0] p-3 md:p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg md:text-2xl font-bold text-[#333333]">Dashboard RRHH</h2>
                        <p className="text-xs md:text-sm text-[#6B6B6B]">Gestión de trabajadores, ciclos y nómina</p>
                    </div>
                    {ciclo && (
                        <Badge className="w-fit bg-[#017E49] text-white text-xs md:text-sm px-2 md:px-3 py-1 md:py-2">
                            Ciclo Actual: {ciclo?.id || 'Sin ciclo'}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Tabs responsivos */}
            <div className="p-3 md:p-6">
                <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as RRHHTab)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-2 mb-6 bg-white border border-[#E0E0E0] p-1 md:p-2">
                        <TabsTrigger value="dashboard" className="text-xs md:text-sm">
                            <span className="inline-flex items-center gap-2">
                                <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
                                <span>Dashboard</span>
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="trabajadores" className="text-xs md:text-sm">
                            <span className="inline-flex items-center gap-2">
                                <Users className="w-3 h-3 md:w-4 md:h-4" />
                                <span>Trabajadores</span>
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="ciclo" className="text-xs md:text-sm">
                            <span className="inline-flex items-center gap-2">
                                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                                <span>Ciclo</span>
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="nomina" className="text-xs md:text-sm">
                            <span className="inline-flex items-center gap-2">
                                <FileText className="w-3 h-3 md:w-4 md:h-4" />
                                <span>Nómina</span>
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="trazabilidad" className="text-xs md:text-sm">
                            <span className="inline-flex items-center gap-2">
                                <QrCode className="w-3 h-3 md:w-4 md:h-4" />
                                <span>Trazabilidad</span>
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="reportes" className="text-xs md:text-sm">
                            <span className="inline-flex items-center gap-2">
                                <Package className="w-3 h-3 md:w-4 md:h-4" />
                                <span>Reportes</span>
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    {/* DASHBOARD TAB */}
                    <TabsContent value="dashboard" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <DashboardCard title="Trabajadores Activos" value={trabajadores.length} icon={Users} color="#017E49" />
                            <DashboardCard title="Ciclos Activos" value={ciclos.filter(c => c.activo).length} icon={Calendar} color="#FF9F55" />
                            <DashboardCard title="Incidencias Pendientes" value={incidencias.filter(i => i.estado === 'pendiente').length} icon={AlertCircle} color="#E12019" />
                            <DashboardCard title="Retiros Hoy" value={retirosDia[0]?.entregados || 0} icon={Package} color="#6B6B6B" />
                        </div>

                        {/* Gráficos y tablas pequeñas - responsive */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg border border-[#E0E0E0] p-3 md:p-4">
                                <h3 className="text-sm md:text-base font-semibold text-[#333333] mb-3">Retiros Últimos 7 Días</h3>
                                <div className="space-y-2 overflow-x-auto">
                                    {retirosDia.slice(0, 5).map((dia, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs md:text-sm">
                                            <span className="text-[#6B6B6B]">{dia.fecha}</span>
                                            <span className="font-semibold text-[#E12019]">{dia.entregados}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-[#E0E0E0] p-3 md:p-4">
                                <h3 className="text-sm md:text-base font-semibold text-[#333333] mb-3">Incidencias Recientes</h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {incidencias.slice(0, 5).map((inc) => (
                                        <div key={inc.id} className="flex items-start justify-between text-xs md:text-sm">
                                            <span className="text-[#6B6B6B] truncate flex-1">{inc.tipo}</span>
                                            <Badge className="ml-2 text-xs px-2 py-0.5" variant={inc.estado === 'resuelto' ? 'outline' : 'destructive'}>
                                                {inc.estado}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TRABAJADORES TAB */}
                    <TabsContent value="trabajadores" className="space-y-4">
                        <div className="bg-white rounded-lg border border-[#E0E0E0] p-3 md:p-6">
                            <div className="mb-3">
                                <h3 className="text-[#333333] text-sm md:text-base font-semibold">Trabajadores y Nómina</h3>
                                <p className="text-[#6B6B6B] text-xs">Agrega trabajadores a la nómina (crear) o quítalos si fue un error (bloquear/eliminar).</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                                <Input
                                    placeholder="Buscar por nombre o RUT..."
                                    value={trabajadorFilter}
                                    onChange={(e) => setTrabajadorFilter(e.target.value)}
                                    className="flex-1 text-sm"
                                />
                                <Dialog open={showAddTrabajador} onOpenChange={setShowAddTrabajador}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full sm:w-auto bg-[#E12019] hover:bg-[#B51810] text-white text-sm md:text-base">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Agregar
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-full max-w-xs sm:max-w-md md:max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle className="text-[#333333] text-base md:text-lg font-semibold">Agregar Nuevo Trabajador</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-sm font-medium text-[#333333]">RUT</Label>
                                                <Input
                                                    placeholder="12.345.678-9"
                                                    value={trabajadorForm.rut || ''}
                                                    onChange={(e) => setTrabajadorForm({ ...trabajadorForm, rut: e.target.value })}
                                                    className="text-sm h-10 border-2 border-[#E0E0E0] rounded-lg mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-[#333333]">Nombre Completo</Label>
                                                <Input
                                                    placeholder="Nombre completo..."
                                                    value={trabajadorForm.nombre || ''}
                                                    onChange={(e) => setTrabajadorForm({ ...trabajadorForm, nombre: e.target.value })}
                                                    className="text-sm h-10 border-2 border-[#E0E0E0] rounded-lg mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-[#333333]">Sección</Label>
                                                <Input
                                                    placeholder="Producción, Logística, etc."
                                                    value={trabajadorForm.seccion || ''}
                                                    onChange={(e) => setTrabajadorForm({ ...trabajadorForm, seccion: e.target.value })}
                                                    className="text-sm h-10 border-2 border-[#E0E0E0] rounded-lg mt-1"
                                                />
                                            </div>
                                            <div className="pt-2">
                                                <Button
                                                    onClick={handleAddTrabajador}
                                                    className="w-full bg-[#017E49] hover:bg-[#015A34] text-white text-sm font-medium py-2 h-10"
                                                >
                                                    Crear Trabajador
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* Tabla responsiva de trabajadores */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs md:text-sm">
                                    <thead className="bg-[#F8F8F8] border-b border-[#E0E0E0]">
                                        <tr>
                                            <th className="text-left p-2 md:p-3 font-semibold text-[#333333]">RUT</th>
                                            <th className="text-left p-2 md:p-3 font-semibold text-[#333333]">Nombre</th>
                                            <th className="text-left p-2 md:p-3 font-semibold text-[#333333]">Sección</th>
                                            <th className="text-center p-2 md:p-3 font-semibold text-[#333333]">Estado</th>
                                            <th className="text-right p-2 md:p-3 font-semibold text-[#333333]">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTrabajadores.map((t) => (
                                            <tr key={t.rut} className="border-b border-[#E0E0E0] hover:bg-[#F8F8F8]">
                                                <td className="p-2 md:p-3 text-[#333333]">{t.rut}</td>
                                                <td className="p-2 md:p-3 text-[#333333]">{t.nombre}</td>
                                                <td className="p-2 md:p-3 text-[#6B6B6B]">{t.seccion || '-'}</td>
                                                <td className="p-2 md:p-3">
                                                    <Badge className="text-xs px-2 py-0.5" variant="default">
                                                        Activo
                                                    </Badge>
                                                </td>
                                                <td className="p-2 md:p-3 text-right">
                                                    <div className="inline-flex gap-2">
                                                        <button
                                                            onClick={() => trabajadorService.bloquear(t.rut!)}
                                                            className="text-[#FF9F55] hover:text-[#E68843] text-xs md:text-sm"
                                                            title="Bloquear beneficio"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => trabajadorService.desbloquear(t.rut!)}
                                                            className="text-[#017E49] hover:text-[#015A34] text-xs md:text-sm"
                                                            title="Desbloquear beneficio"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTrabajador(t.rut!)}
                                                            className="text-[#E12019] hover:text-[#B51810] text-xs md:text-sm"
                                                            title="Quitar de nómina"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    {/* CICLO TAB */}
                    <TabsContent value="ciclo" className="space-y-4">
                        <div className="bg-white rounded-lg border border-[#E0E0E0] p-3 md:p-6">
                            <div className="mb-3">
                                <h3 className="text-[#333333] text-sm md:text-base font-semibold">Gestión de Ciclos</h3>
                                <p className="text-[#6B6B6B] text-xs">Administra ciclos activos, crea nuevos y cierra cuando corresponda</p>
                            </div>
                            <div className="flex justify-end mb-4">
                                <Dialog open={showAddCiclo} onOpenChange={setShowAddCiclo}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full sm:w-auto bg-[#E12019] hover:bg-[#B51810] text-white text-sm md:text-base">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Nuevo Ciclo
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-full max-w-xs sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle className="text-[#333333] text-base md:text-lg font-semibold">Crear Nuevo Ciclo</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-sm font-medium text-[#333333]">Nombre (opcional)</Label>
                                                <Input
                                                    placeholder="Ciclo 2025-12"
                                                    value={cicloForm.nombre || ''}
                                                    onChange={(e) => setCicloForm({ ...cicloForm, nombre: e.target.value })}
                                                    className="text-sm h-10 border-2 border-[#E0E0E0] rounded-lg mt-1"
                                                />
                                                <p className="text-xs text-[#6B6B6B] mt-1">Ayuda a identificar este ciclo en reportes y nómina</p>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-sm font-medium text-[#333333]">Fecha inicio</Label>
                                                    <Input
                                                        type="date"
                                                        value={cicloForm.fecha_inicio || ''}
                                                        onChange={(e) => setCicloForm({ ...cicloForm, fecha_inicio: e.target.value })}
                                                        className="text-sm h-10 border-2 border-[#E0E0E0] rounded-lg mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-medium text-[#333333]">Fecha fin</Label>
                                                    <Input
                                                        type="date"
                                                        value={cicloForm.fecha_fin || ''}
                                                        onChange={(e) => setCicloForm({ ...cicloForm, fecha_fin: e.target.value })}
                                                        className="text-sm h-10 border-2 border-[#E0E0E0] rounded-lg mt-1"
                                                    />
                                                </div>
                                            </div>
                                            <div className="pt-2">
                                                <Button
                                                    onClick={handleAddCiclo}
                                                    className="w-full bg-[#017E49] hover:bg-[#015A34] text-white text-sm font-medium py-2 h-10"
                                                >
                                                    Crear Ciclo
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {newCycleId && (
                                <div className="mb-4 p-3 border border-[#E0E0E0] rounded-lg bg-[#F8F8F8] flex items-center justify-between">
                                    <span className="text-xs md:text-sm text-[#333333]">Ciclo creado: #{newCycleId}</span>
                                    <Button onClick={() => setShowNominaWizard(true)} className="text-xs bg-[#FF9F55] hover:bg-[#E68843] text-white">Subir nómina</Button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {ciclos.map((c) => (
                                    <div key={c.id} className="border-2 border-[#E0E0E0] rounded-lg p-3 md:p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-[#333333] text-sm md:text-base">Ciclo {c.id}</h3>
                                            <Badge className="text-xs px-2 py-0.5" variant={c.activo ? 'default' : 'outline'}>
                                                {c.activo ? 'Activo' : 'Cerrado'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-[#6B6B6B] mb-3">Días restantes: {c.dias_restantes || 0}</p>
                                        {c.activo && (
                                            <Button
                                                onClick={() => handleCerrarCiclo(c.id!)}
                                                className="w-full text-xs bg-[#FF9F55] hover:bg-[#E68843] text-white"
                                            >
                                                Cerrar Ciclo
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* NÓMINA TAB */}
                    <TabsContent value="nomina" className="space-y-4">
                        <div className="bg-white rounded-lg border border-[#E0E0E0] p-3 md:p-6">
                            <div className="mb-3">
                                <h3 className="text-[#333333] text-sm md:text-base font-semibold">Gestión de Nómina</h3>
                                <p className="text-[#6B6B6B] text-xs">Genera vista previa, confirma la carga y revisa el historial</p>
                            </div>
                            <Button
                                onClick={handleNominaPreview}
                                disabled={!ciclo || loading}
                                className="w-full sm:w-auto bg-[#E12019] hover:bg-[#B51810] text-white text-sm md:text-base mb-4"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Vista Previa Nómina
                            </Button>

                            {nominaPreview && showNominaPreview && (
                                <Dialog open={showNominaPreview} onOpenChange={setShowNominaPreview}>
                                    <DialogContent className="w-full max-w-xs sm:max-w-md md:max-w-lg max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="text-[#333333] text-base md:text-lg font-semibold">Preview Nómina - Ciclo {ciclo?.id}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4 text-xs md:text-sm bg-[#F8F8F8] rounded-lg p-3">
                                                <div>
                                                    <span className="text-[#6B6B6B] text-xs">Total Trabajadores</span>
                                                    <p className="font-bold text-[#333333] text-base">{nominaPreview.total_trabajadores}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[#6B6B6B] text-xs">Total Beneficios</span>
                                                    <p className="font-bold text-[#017E49] text-base">${nominaPreview.total_beneficios.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="border-t border-[#E0E0E0] pt-4">
                                                <h4 className="font-semibold text-[#333333] text-sm mb-3">Detalles de Beneficios</h4>
                                                <div className="max-h-48 overflow-y-auto text-xs">
                                                    {nominaPreview.detalles.map((det) => (
                                                        <div key={det.rut} className="flex justify-between items-center py-2 border-b border-[#E0E0E0] last:border-0">
                                                            <span className="text-[#333333] truncate flex-1">{det.nombre}</span>
                                                            <span className="text-[#017E49] font-semibold ml-2">${det.beneficio_asignado}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="pt-2">
                                                <Button
                                                    onClick={handleConfirmarNomina}
                                                    className="w-full bg-[#017E49] hover:bg-[#015A34] text-white text-sm font-medium py-2 h-auto"
                                                >
                                                    Confirmar Nómina
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                            {/* Historial de nómina */}
                            <div className="mt-4">
                                <h4 className="text-sm md:text-base font-semibold text-[#333333] mb-3">Historial de cargas</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs md:text-sm">
                                        <thead className="bg-[#F8F8F8] border-b border-[#E0E0E0]">
                                            <tr>
                                                <th className="text-left p-2 md:p-3">Archivo</th>
                                                <th className="text-left p-2 md:p-3">Usuario</th>
                                                <th className="text-left p-2 md:p-3">Registros</th>
                                                <th className="text-left p-2 md:p-3">Creado/Actualizado</th>
                                                <th className="text-left p-2 md:p-3">Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {nominaHistorial.map((h: any) => (
                                                <tr key={h.id} className="border-b border-[#E0E0E0]">
                                                    <td className="p-2 md:p-3 text-[#333333] truncate">{h.archivo_nombre}</td>
                                                    <td className="p-2 md:p-3 text-[#6B6B6B]">{h.usuario?.username || '-'}</td>
                                                    <td className="p-2 md:p-3 text-[#6B6B6B]">{h.total_registros}</td>
                                                    <td className="p-2 md:p-3 text-[#6B6B6B]">{h.creados}/{h.actualizados}</td>
                                                    <td className="p-2 md:p-3 text-[#6B6B6B]">{new Date(h.fecha_carga).toLocaleString('es-CL')}</td>
                                                </tr>
                                            ))}
                                            {nominaHistorial.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="p-3 text-center text-[#6B6B6B]">Sin historial disponible</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TRAZABILIDAD TAB */}
                    <TabsContent value="trazabilidad" className="space-y-4">
                        <div className="bg-white rounded-lg border border-[#E0E0E0] p-3 md:p-6">
                            <div className="mb-3">
                                <h3 className="text-[#333333] text-sm md:text-base font-semibold">Trazabilidad</h3>
                                <p className="text-[#6B6B6B] text-xs">Consulta incidencias y eventos relacionados con retiros y agendamientos</p>
                            </div>
                            <h3 className="text-sm md:text-base font-semibold text-[#333333] mb-4">Incidencias Registradas</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs md:text-sm">
                                    <thead className="bg-[#F8F8F8] border-b border-[#E0E0E0]">
                                        <tr>
                                            <th className="text-left p-2 md:p-3">Tipo</th>
                                            <th className="text-left p-2 md:p-3">RUT</th>
                                            <th className="text-left p-2 md:p-3">Descripción</th>
                                            <th className="text-center p-2 md:p-3">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {incidencias.slice(0, 10).map((inc) => (
                                            <tr key={inc.id} className="border-b border-[#E0E0E0]">
                                                <td className="p-2 md:p-3">{inc.tipo}</td>
                                                <td className="p-2 md:p-3">{inc.trabajador || 'N/A'}</td>
                                                <td className="p-2 md:p-3 text-[#6B6B6B] truncate">{inc.descripcion}</td>
                                                <td className="p-2 md:p-3 text-center">
                                                    <Badge className="text-xs px-2 py-0.5" variant={inc.estado === 'resuelto' ? 'outline' : 'destructive'}>
                                                        {inc.estado}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    {/* REPORTES TAB */}
                    <TabsContent value="reportes" className="space-y-4">
                        <div className="bg-white rounded-lg border border-[#E0E0E0] p-3 md:p-6">
                            <div className="mb-3">
                                <h3 className="text-[#333333] text-sm md:text-base font-semibold">Reportes</h3>
                                <p className="text-[#6B6B6B] text-xs">Retiros por día y otros indicadores operativos</p>
                            </div>
                            <h3 className="text-sm md:text-base font-semibold text-[#333333] mb-4">Retiros de los Últimos 7 Días</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {retirosDia.map((dia, i) => (
                                    <div key={i} className="border-2 border-[#E0E0E0] rounded-lg p-3 md:p-4">
                                        <p className="text-xs md:text-sm text-[#6B6B6B] mb-1">{dia.fecha}</p>
                                        <p className="text-lg md:text-2xl font-bold text-[#E12019]">{dia.entregados}</p>
                                        <p className="text-xs text-[#6B6B6B]">retiros</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
            {/* Wizard de nómina (aparece tras crear ciclo o CTA) */}
            <RRHHNominaWizard open={showNominaWizard} onOpenChange={setShowNominaWizard} cycleId={newCycleId} onConfirmed={loadAllData} />
        </div>
    );
}

// Componente para card del dashboard
function DashboardCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) {
    return (
        <div className="bg-white rounded-lg border border-[#E0E0E0] p-3 md:p-4 flex items-start gap-3 md:gap-4">
            <div className="p-2 md:p-3 rounded-lg" style={{ backgroundColor: color + '20' }}>
                <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm text-[#6B6B6B] truncate">{title}</p>
                <p className="text-lg md:text-2xl font-bold text-[#333333]">{value}</p>
            </div>
        </div>
    );
}

// Wizard modal: carga de nómina después de crear ciclo
// Nota: se monta al final para no interferir con estructura principal
// Integra endpoints basados en archivo: preview y confirmar
export function RRHHNominaWizard({ open, onOpenChange, cycleId, onConfirmed }: { open: boolean; onOpenChange: (o: boolean) => void; cycleId: number | null; onConfirmed?: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);

    const doPreview = async () => {
        if (!file) return;
        const allowed = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (file && !allowed.includes(file.type)) {
            showError('Archivo inválido', 'Sube un CSV o Excel (.xlsx)');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showError('Archivo muy grande', 'El tamaño máximo es 10MB');
            return;
        }
        setLoading(true);
        try {
            const result = await nominaService.previewFile(file, cycleId ?? undefined);
            setPreview(result);
            // Backend retorna { detail, resumen? }; si no hay resumen mostramos mensaje básico
            const total = result?.resumen?.total_registros;
            showSuccess('Vista previa generada', typeof total === 'number' ? `${total} registros analizados` : result?.detail || 'Validación OK');
        } finally {
            setLoading(false);
        }
    };

    const doConfirm = async () => {
        if (!file) return;
        setLoading(true);
        try {
            await nominaService.confirmarFile(file, cycleId ?? undefined);
            showSuccess('Nómina confirmada', 'La carga se ejecutó correctamente');
            onOpenChange(false);
            onConfirmed?.();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-[#333333]">Carga inicial de nómina</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <p className="text-xs text-[#6B6B6B]">Ciclo creado: {cycleId ?? '-'} — Selecciona el archivo CSV/XLSX de nómina para generar la vista previa y confirmar.</p>
                    <Input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    <div className="flex gap-2">
                        <Button onClick={doPreview} disabled={!file || loading} className="bg-[#FF9F55] hover:bg-[#E68843] text-white">Vista Previa</Button>
                        <Button onClick={doConfirm} disabled={!file || !preview || loading} className="bg-[#017E49] hover:bg-[#015A34] text-white">Confirmar</Button>
                        <Button onClick={() => onOpenChange(false)} variant="outline" className="border-[#E0E0E0]">Cancelar</Button>
                    </div>
                    {preview && (
                        <div className="border border-[#E0E0E0] rounded p-3 bg-[#F8F8F8]">
                            <p className="text-xs text-[#333333]">{preview.detail || 'Validación realizada.'}</p>
                            {preview.resumen && (
                                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                    <div><span className="text-[#6B6B6B]">Total:</span> <strong>{preview.resumen.total_registros}</strong></div>
                                    <div><span className="text-[#6B6B6B]">Válidos:</span> <strong>{preview.resumen.validos}</strong></div>
                                    <div><span className="text-[#6B6B6B]">Inválidos:</span> <strong>{preview.resumen.invalidos}</strong></div>
                                    <div><span className="text-[#6B6B6B]">A crear:</span> <strong>{preview.resumen.a_crear}</strong></div>
                                    <div><span className="text-[#6B6B6B]">A actualizar:</span> <strong>{preview.resumen.a_actualizar}</strong></div>
                                    <div><span className="text-[#6B6B6B]">Sin beneficio:</span> <strong>{preview.resumen.sin_beneficio}</strong></div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
