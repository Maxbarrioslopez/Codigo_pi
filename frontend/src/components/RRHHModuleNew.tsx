import { useState, useEffect } from 'react';
import { BarChart3, Users, Calendar, FileText, AlertCircle, Package, QrCode, Download, Plus, Edit, Trash2, Eye, Filter, Search, CheckCircle2, Clock, X, Upload } from 'lucide-react';
import { trabajadorService } from '../services/trabajador.service';
import { cicloService } from '../services/ciclo.service';
import { nominaService, NominaPreviewResponse } from '../services/nomina.service';
import { showError, showSuccess } from '../utils/toast';
import { validateRut, formatRutOnType, formatRut } from '../utils/rut';
import { stockService } from '../services/stock.service';
import { reportesRetirosPorDia, TicketDTO, IncidenciaDTO, RetirosDiaDTO } from '../services/api';
import { incidentService } from '../services/incident.service';
import { useCicloActivo } from '../hooks/useCicloActivo';
import { TrabajadorDTO, CicloDTO } from '../types';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CicloBimensualModule } from './CicloBimensualModule';

type RRHHTab = 'dashboard' | 'nomina' | 'ciclos' | 'incidentes' | 'reportes';

export function RRHHModuleNew() {
    const [currentTab, setCurrentTab] = useState<RRHHTab>('dashboard');
    const { ciclo: cicloActivo } = useCicloActivo();
    const [loading, setLoading] = useState(false);

    // Estado para trabajadores y nómina unificado
    const [trabajadores, setTrabajadores] = useState<TrabajadorDTO[]>([]);
    const [trabajadorFilter, setTrabajadorFilter] = useState('');
    const [showAddTrabajador, setShowAddTrabajador] = useState(false);
    const [trabajadorForm, setTrabajadorForm] = useState<Partial<TrabajadorDTO>>({});
    const [showCargaMasiva, setShowCargaMasiva] = useState(false);

    // Estado para ciclos
    const [ciclos, setCiclos] = useState<CicloDTO[]>([]);
    const [selectedCicloId, setSelectedCicloId] = useState<number | null>(null);
    const [showAddCiclo, setShowAddCiclo] = useState(false);
    const [cicloForm, setCicloForm] = useState<{ fecha_inicio?: string; fecha_fin?: string; nombre?: string }>({});

    // Estado para nómina
    const [nominaPreview, setNominaPreview] = useState<NominaPreviewResponse | null>(null);
    const [showNominaPreview, setShowNominaPreview] = useState(false);
    const [nominaHistorial, setNominaHistorial] = useState<any[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [processedFile, setProcessedFile] = useState<File | null>(null);

    // Estado para otros datos
    const [incidencias, setIncidencias] = useState<IncidenciaDTO[]>([]);
    const [resolviendoIncidencia, setResolviendoIncidencia] = useState<string | null>(null);
    const [tickets, setTickets] = useState<TicketDTO[]>([]);
    const [retirosDia, setRetirosDia] = useState<RetirosDiaDTO[]>([]);

    // Cargar datos al montar y cuando cambia el ciclo seleccionado
    useEffect(() => {
        loadAllData();
    }, [currentTab, selectedCicloId]);

    // Auto-seleccionar ciclo activo al cargar
    useEffect(() => {
        if (cicloActivo && !selectedCicloId) {
            setSelectedCicloId(cicloActivo.id!);
        }
    }, [cicloActivo]);

    async function loadAllData() {
        setLoading(true);
        try {
            const [trab, cicl, inc, ret, hist] = await Promise.all([
                trabajadorService.getAll().catch(() => []),
                cicloService.getAll().catch(() => []),
                incidentService.listarIncidencias().catch(() => []),
                reportesRetirosPorDia(7).catch(() => []),
                nominaService.getHistorial().catch(() => []),
            ]);
            setTrabajadores(trab);
            setCiclos(cicl);
            setIncidencias(Array.isArray(inc) ? inc : []);
            setRetirosDia(ret);
            setNominaHistorial(hist);
        } catch (error) {
            console.error('Error loading RRHH data:', error);
            showError('No se pudieron cargar todos los datos');
        } finally {
            setLoading(false);
        }
    }

    async function reloadIncidencias() {
        try {
            const inc = await incidentService.listarIncidencias().catch(() => []);
            setIncidencias(Array.isArray(inc) ? inc : []);
        } catch (error) {
            console.error('Error reloading incidencias:', error);
            showError('No se pudieron recargar las incidencias');
        }
    }

    async function handleResponderIncidencia(inc: IncidenciaDTO) {
        const codigo = inc.codigo || String(inc.id);
        if (!codigo) {
            showError('Código de incidencia no disponible');
            return;
        }

        const resolucion = window.prompt('Escribe la respuesta para esta incidencia');
        if (!resolucion || !resolucion.trim()) return;

        try {
            setResolviendoIncidencia(codigo);
            await incidentService.resolverIncidencia(codigo, resolucion.trim());
            showSuccess('Incidencia respondida', `Se envió la respuesta a ${codigo}`);
            await reloadIncidencias();
        } catch (error) {
            console.error('Error al responder incidencia:', error);
            showError('No se pudo responder la incidencia');
        } finally {
            setResolviendoIncidencia(null);
        }
    }

    // Auto-crear ciclo si no existe uno activo
    const ensureCicloActivo = async () => {
        if (cicloActivo) return cicloActivo;

        // Buscar si hay ciclo activo en la lista
        const activo = ciclos.find(c => c.activo);
        if (activo) {
            setSelectedCicloId(activo.id!);
            return activo;
        }

        // Si no hay ciclo activo, crear uno
        const hoy = new Date();
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        const fecha_inicio = hoy.toISOString().split('T')[0];
        const fecha_fin = finMes.toISOString().split('T')[0];

        try {
            const nuevoCiclo = await cicloService.create({ fecha_inicio, fecha_fin });
            setCiclos([...ciclos, nuevoCiclo]);
            setSelectedCicloId(nuevoCiclo.id!);
            showSuccess('Ciclo creado', `Ciclo ${nuevoCiclo.id} creado automáticamente para permitir edición`);
            return nuevoCiclo;
        } catch (error) {
            showError('Error', 'No se pudo crear ciclo automáticamente');
            return null;
        }
    };

    // TRABAJADORES - Agregar individual
    const handleAddTrabajador = async () => {
        // Asegurar que existe ciclo activo
        const ciclo = await ensureCicloActivo();
        if (!ciclo) return;

        if (!trabajadorForm.rut || !trabajadorForm.nombre) {
            showError('Campos requeridos', 'RUT y Nombre son obligatorios');
            return;
        }

        // Validar RUT
        if (!validateRut(trabajadorForm.rut)) {
            showError('RUT inválido', 'El RUT ingresado no es válido');
            return;
        }

        // Validar tipo de contrato
        if (!trabajadorForm.contrato) {
            showError('Campo requerido', 'Selecciona un tipo de contrato');
            return;
        }

        try {
            const payload = {
                ...trabajadorForm,
                beneficio_disponible: trabajadorForm.beneficio_disponible || {
                    tipo: 'Caja',
                    categoria: 'Estándar',
                    ciclo_id: ciclo.id
                }
            };
            const newTrabajador = await trabajadorService.create(payload);
            setTrabajadores([...trabajadores, newTrabajador]);
            setTrabajadorForm({});
            setShowAddTrabajador(false);
            showSuccess('Trabajador creado', `${newTrabajador.nombre} agregado al ciclo ${ciclo.id}`);
            loadAllData();
        } catch (error: any) {
            console.error('Error creating trabajador:', error);
            showError('Error al crear', error?.response?.data?.detail || 'No se pudo crear el trabajador');
        }
    };

    // Activar beneficio
    const handleActivarBeneficio = async (rut: string) => {
        try {
            // Asegurar que el RUT tenga el formato correcto (con guión)
            const formattedRut = formatRut(rut);
            await trabajadorService.desbloquear(formattedRut);
            showSuccess('Beneficio activado', 'El trabajador puede retirar su beneficio');
            loadAllData();
        } catch (error) {
            console.error('Error activating benefit:', error);
            showError('Error', 'No se pudo activar el beneficio');
        }
    };

    // Desactivar beneficio
    const handleDesactivarBeneficio = async (rut: string) => {
        try {
            // Asegurar que el RUT tenga el formato correcto (con guión)
            const formattedRut = formatRut(rut);
            await trabajadorService.bloquear(formattedRut);
            showSuccess('Beneficio desactivado', 'El trabajador no podrá retirar en este ciclo');
            loadAllData();
        } catch (error) {
            console.error('Error deactivating benefit:', error);
            showError('Error', 'No se pudo desactivar el beneficio');
        }
    };

    // Activar beneficios masivamente
    const handleActivarBeneficiosMasivo = async () => {
        if (!selectedCicloId) {
            showError('Error', 'Selecciona un ciclo primero');
            return;
        }

        const trabajadoresDelCiclo = filteredTrabajadores.filter(t => {
            const beneficio = t.beneficio_disponible || {};
            return beneficio.tipo === 'BLOQUEADO' || beneficio.activo === false;
        });

        if (trabajadoresDelCiclo.length === 0) {
            showError('Sin cambios', 'No hay trabajadores bloqueados en este ciclo');
            return;
        }

        if (!confirm(`¿Activar beneficio para ${trabajadoresDelCiclo.length} trabajador(es)?`)) {
            return;
        }

        setLoading(true);
        let activados = 0;
        let errores = 0;

        for (const t of trabajadoresDelCiclo) {
            try {
                const formattedRut = formatRut(t.rut!);
                await trabajadorService.desbloquear(formattedRut);
                activados++;
            } catch (error) {
                errores++;
                console.error(`Error activando ${t.rut}:`, error);
            }
        }

        setLoading(false);
        showSuccess('Proceso completado', `Activados: ${activados}, Errores: ${errores}`);
        loadAllData();
    };

    // Desactivar beneficios masivamente
    const handleDesactivarBeneficiosMasivo = async () => {
        if (!selectedCicloId) {
            showError('Error', 'Selecciona un ciclo primero');
            return;
        }

        const trabajadoresDelCiclo = filteredTrabajadores.filter(t => {
            const beneficio = t.beneficio_disponible || {};
            return beneficio.tipo !== 'BLOQUEADO' &&
                beneficio.tipo !== 'SIN_BENEFICIO' &&
                beneficio.activo !== false;
        });

        if (trabajadoresDelCiclo.length === 0) {
            showError('Sin cambios', 'No hay trabajadores activos en este ciclo');
            return;
        }

        if (!confirm(`¿Desactivar beneficio para ${trabajadoresDelCiclo.length} trabajador(es)? Esta acción bloqueará todos los beneficios del ciclo.`)) {
            return;
        }

        setLoading(true);
        let desactivados = 0;
        let errores = 0;

        for (const t of trabajadoresDelCiclo) {
            try {
                const formattedRut = formatRut(t.rut!);
                await trabajadorService.bloquear(formattedRut, `Desactivación masiva ciclo ${selectedCicloId}`);
                desactivados++;
            } catch (error) {
                errores++;
                console.error(`Error desactivando ${t.rut}:`, error);
            }
        }

        setLoading(false);
        showSuccess('Proceso completado', `Desactivados: ${desactivados}, Errores: ${errores}`);
        loadAllData();
    };

    // NÓMINA - Carga masiva
    const handleCargaMasiva = async () => {
        const ciclo = await ensureCicloActivo();
        if (!ciclo) return;

        if (!file) {
            showError('Sin archivo', 'Selecciona un archivo CSV o Excel');
            return;
        }

        const allowed = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (!allowed.includes(file.type)) {
            showError('Archivo inválido', 'Sube un CSV o Excel (.xlsx)');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showError('Archivo muy grande', 'El tamaño máximo es 10MB');
            return;
        }

        // Procesar CSV separado por punto y coma (;) en cliente: convertir a comas antes de enviar
        const processCsvIfSemicolon = (f: File) => new Promise<File>((resolve, reject) => {
            if (!f.name.toLowerCase().endsWith('.csv')) return resolve(f);
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const text = String(reader.result || '');
                    const firstLine = text.split(/\r?\n/)[0] || '';
                    if (firstLine.includes(';') && !firstLine.includes(',')) {
                        // reemplazar ; por , en todo el archivo
                        const converted = text.replace(/\r\n/g, '\n').replace(/;/g, ',');
                        // Forzar nombre terminado en .csv y tipo MIME correcto
                        let baseName = f.name.replace(/\.[^/.]+$/, '');
                        const forcedName = baseName + '_convertido.csv';
                        const newFile = new File([converted], forcedName, { type: 'text/csv' });
                        resolve(newFile);
                    } else {
                        resolve(f);
                    }
                } catch (e) {
                    resolve(f);
                }
            };
            reader.onerror = () => resolve(f);
            reader.readAsText(f, 'utf-8');
        });

        setLoading(true);
        try {
            // Preview (procesar CSV con ; si corresponde)
            const fileToSend = await processCsvIfSemicolon(file);
            setProcessedFile(fileToSend);
            const preview = await nominaService.previewFile(fileToSend, ciclo.id);
            // Validación avanzada de datos
            if (preview?.errores && Array.isArray(preview.errores)) {
                preview.errores = preview.errores.map((err: any, idx: number) => {
                    // Validar RUT
                    if (err.rut && !validateRut(err.rut)) {
                        err.mensaje = (err.mensaje || '') + ' | RUT inválido';
                    }
                    // Validar email
                    if (err.email && !/^\S+@\S+\.\S+$/.test(err.email)) {
                        err.mensaje = (err.mensaje || '') + ' | Email inválido';
                    }
                    // Validar teléfono
                    if (err.telefono && !/^\+?\d{8,15}$/.test(err.telefono)) {
                        err.mensaje = (err.mensaje || '') + ' | Teléfono inválido';
                    }
                    return err;
                });
            }
            setNominaPreview(preview);
            setShowNominaPreview(true);

            const total = preview?.resumen?.total_registros;
            showSuccess('Vista previa generada', typeof total === 'number' ? `${total} registros analizados` : preview?.detail || 'Validación OK');
        } catch (error: any) {
            showError('Error en preview', error?.response?.data?.detail || 'No se pudo procesar el archivo');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmarCargaMasiva = async () => {
        const toSend = processedFile || file;
        if (!toSend || !selectedCicloId) return;

        setLoading(true);
        try {
            await nominaService.confirmarFile(toSend, selectedCicloId);
            showSuccess('Nómina cargada', 'Trabajadores agregados correctamente');
            setShowCargaMasiva(false);
            setShowNominaPreview(false);
            setFile(null);
            setProcessedFile(null);
            setNominaPreview(null);
            loadAllData();
        } catch (error: any) {
            showError('Error confirmando', error?.response?.data?.detail || 'No se pudo cargar la nómina');
        } finally {
            setLoading(false);
        }
    };

    // CICLOS
    const handleAddCiclo = async () => {
        if (!cicloForm.fecha_inicio || !cicloForm.fecha_fin) {
            showError('Campos requeridos', 'Ingresa fecha de inicio y fin');
            return;
        }

        const ini = new Date(cicloForm.fecha_inicio);
        const fin = new Date(cicloForm.fecha_fin);
        if (isNaN(ini.getTime()) || isNaN(fin.getTime()) || ini >= fin) {
            showError('Fechas inválidas', 'La fecha de inicio debe ser anterior a la fecha de fin');
            return;
        }

        try {
            const newCiclo = await cicloService.create({
                fecha_inicio: cicloForm.fecha_inicio,
                fecha_fin: cicloForm.fecha_fin
            });
            setCiclos([...ciclos, newCiclo]);
            setSelectedCicloId(newCiclo.id!);
            setShowAddCiclo(false);
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
            showSuccess('Ciclo cerrado', `Ciclo #${cicloId} cerrado correctamente`);
        } catch (error) {
            console.error('Error closing ciclo:', error);
            showError('Error', 'No se pudo cerrar el ciclo');
        }
    };

    // Filtrar trabajadores por ciclo seleccionado
    const filteredTrabajadores = trabajadores.filter(t => {
        const matchesFilter = t.nombre?.toLowerCase().includes(trabajadorFilter.toLowerCase()) ||
            t.rut?.includes(trabajadorFilter);

        // Si hay ciclo seleccionado, filtrar por trabajadores de ese ciclo
        if (selectedCicloId && t.beneficio_disponible?.ciclo_id) {
            return matchesFilter && t.beneficio_disponible.ciclo_id === selectedCicloId;
        }

        return matchesFilter;
    });

    return (
        <div className="w-full h-full bg-[#F8F8F8]">
            {/* Header responsivo */}
            <div className="bg-white border-b-2 border-[#E0E0E0] p-3 md:p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-lg md:text-2xl font-bold text-[#333333]">Dashboard RRHH</h2>
                        <p className="text-xs md:text-sm text-[#6B6B6B]">Gestión de trabajadores, ciclos y nómina</p>
                    </div>
                    {cicloActivo && (
                        <Badge className="w-fit bg-[#017E49] text-white text-xs md:text-sm px-2 md:px-3 py-1 md:py-2">
                            Ciclo Actual: {cicloActivo?.id || 'Sin ciclo'}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Tabs responsivos */}
            <div className="p-3 md:p-6">
                <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as RRHHTab)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 gap-2 mb-6 bg-white border border-[#E0E0E0] p-1 md:p-2">
                        <TabsTrigger value="dashboard" className="text-xs md:text-sm">
                            <span className="inline-flex items-center gap-2">
                                <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
                                <span>Dashboard</span>
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="nomina" className="text-xs md:text-sm">
                            <span className="inline-flex items-center gap-2">
                                <Users className="w-3 h-3 md:w-4 md:h-4" />
                                <span>Trabajadores y Nómina</span>
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="ciclos" className="text-xs md:text-sm">
                            <span className="inline-flex items-center gap-2">
                                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                                <span>Ciclos</span>
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="incidentes" className="text-xs md:text-sm">
                            <span className="inline-flex items-center gap-2">
                                <QrCode className="w-3 h-3 md:w-4 md:h-4" />
                                <span>Incidentes</span>
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

                    {/* TRABAJADORES Y NÓMINA TAB - VISTA UNIFICADA */}
                    <TabsContent value="nomina" className="space-y-4">
                        <div className="bg-white rounded-lg border border-[#E0E0E0] p-3 md:p-6">
                            {/* Header con selector de ciclo */}
                            <div className="mb-4">
                                <div className="flex flex-col gap-3 mb-3">
                                    <div>
                                        <h3 className="text-[#333333] text-sm md:text-base font-semibold">Trabajadores y Nómina</h3>
                                        <p className="text-[#6B6B6B] text-xs">Gestiona trabajadores por ciclo y carga nóminas masivas</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                        <Label className="text-xs text-[#6B6B6B] whitespace-nowrap">Ciclo:</Label>
                                        <Select value={selectedCicloId?.toString() || ''} onValueChange={(val) => setSelectedCicloId(Number(val))}>
                                            <SelectTrigger className="w-full sm:w-[150px] text-sm">
                                                <SelectValue placeholder="Seleccionar ciclo..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ciclos.map(c => (
                                                    <SelectItem key={c.id} value={c.id!.toString()}>
                                                        Ciclo {c.id} {c.activo && '(Activo)'}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Dialog open={showAddCiclo} onOpenChange={setShowAddCiclo}>
                                            <DialogTrigger asChild>
                                                <Button className="w-full sm:w-auto bg-[#FF9F55] hover:bg-[#E68843] text-white text-xs sm:text-sm px-3 py-2 h-9">
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Nuevo Ciclo
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="w-full max-w-xs sm:max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle className="text-[#333333] text-base md:text-lg font-semibold">
                                                        Crear Nuevo Ciclo
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div>
                                                        <Label className="text-base font-semibold text-[#333333]">Fecha Inicio</Label>
                                                        <Input
                                                            type="date"
                                                            value={cicloForm.fecha_inicio || ''}
                                                            onChange={(e) => setCicloForm({ ...cicloForm, fecha_inicio: e.target.value })}
                                                            className="text-sm h-10 border-2 border-[#E0E0E0] rounded-lg mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-base font-semibold text-[#333333]">Fecha Fin</Label>
                                                        <Input
                                                            type="date"
                                                            value={cicloForm.fecha_fin || ''}
                                                            onChange={(e) => setCicloForm({ ...cicloForm, fecha_fin: e.target.value })}
                                                            className="text-sm h-10 border-2 border-[#E0E0E0] rounded-lg mt-1"
                                                        />
                                                    </div>
                                                    <Button
                                                        onClick={async () => {
                                                            if (!cicloForm.fecha_inicio || !cicloForm.fecha_fin) {
                                                                showError('Error', 'Ambas fechas son requeridas');
                                                                return;
                                                            }
                                                            try {
                                                                const nuevoCiclo = await cicloService.create(cicloForm);
                                                                setCiclos([...ciclos, nuevoCiclo]);
                                                                setSelectedCicloId(nuevoCiclo.id!);
                                                                setCicloForm({});
                                                                setShowAddCiclo(false);
                                                                showSuccess('Ciclo creado', `Ciclo ${nuevoCiclo.id} creado exitosamente`);
                                                            } catch (error) {
                                                                showError('Error', 'No se pudo crear el ciclo');
                                                            }
                                                        }}
                                                        className="w-full bg-[#017E49] hover:bg-[#015A34] text-white text-sm font-medium py-2"
                                                    >
                                                        Crear Ciclo
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>

                                {/* Advertencia si no hay ciclo activo */}
                                {!cicloActivo && (
                                    <div className="bg-[#FFF4E6] border border-[#FF9F55] rounded-lg p-3 mb-3">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-[#FF9F55] mt-0.5" />
                                            <div>
                                                <p className="text-xs text-[#333333] font-semibold">Sin ciclo activo</p>
                                                <p className="text-xs text-[#6B6B6B]">
                                                    No hay un ciclo activo. Al agregar un trabajador o cargar nómina, se creará automáticamente un ciclo para el mes actual.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Barra de acciones */}
                            <div className="flex flex-col gap-2 mb-4">
                                <Input
                                    placeholder="Buscar por nombre o RUT..."
                                    value={trabajadorFilter}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Si parece un RUT (solo números y punto), formatear
                                        if (/^[\d.]+$/.test(value) && value.length > 0) {
                                            setTrabajadorFilter(formatRutOnType(value));
                                        } else {
                                            setTrabajadorFilter(value);
                                        }
                                    }}
                                    className="flex-1 text-sm"
                                />

                                {/* Botones lado a lado */}
                                <div className="flex flex-col sm:flex-row gap-2">
                                    {/* Agregar trabajador individual */}
                                    <Dialog open={showAddTrabajador} onOpenChange={setShowAddTrabajador}>
                                        <DialogTrigger asChild>
                                            <Button className="flex-1 bg-[#017E49] hover:bg-[#015A34] text-white text-sm h-10">
                                                <Plus className="w-4 h-4 mr-2" />
                                                Agregar Trabajador
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="w-full max-w-xs sm:max-w-md md:max-w-lg">
                                            <DialogHeader>
                                                <DialogTitle className="text-[#333333] text-base md:text-lg font-semibold">
                                                    Agregar Trabajador Individual
                                                </DialogTitle>
                                                {selectedCicloId && (
                                                    <p className="text-xs text-[#6B6B6B] mt-1">
                                                        Se agregará al ciclo: {selectedCicloId}
                                                    </p>
                                                )}
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label className="text-base font-semibold text-[#333333]">RUT <span className="text-[#E12019]">*</span></Label>
                                                    <Input
                                                        placeholder="12.345.678-9"
                                                        value={trabajadorForm.rut || ''}
                                                        onChange={(e) => {
                                                            const formatted = formatRutOnType(e.target.value);
                                                            setTrabajadorForm({ ...trabajadorForm, rut: formatted });
                                                        }}
                                                        onBlur={(e) => {
                                                            if (e.target.value && !validateRut(e.target.value)) {
                                                                e.target.classList.add('border-red-500');
                                                            } else {
                                                                e.target.classList.remove('border-red-500');
                                                            }
                                                        }}
                                                        className="text-sm h-10 border-2 border-[#E0E0E0] rounded-lg mt-1"
                                                        maxLength={12}
                                                    />
                                                    <p className="text-xs text-[#6B6B6B] mt-1">Formato: 12.345.678-9</p>
                                                </div>
                                                <div>
                                                    <Label className="text-base font-semibold text-[#333333]">Nombre Completo <span className="text-[#E12019]">*</span></Label>
                                                    <Input
                                                        placeholder="Juan Pérez López"
                                                        value={trabajadorForm.nombre || ''}
                                                        onChange={(e) => setTrabajadorForm({ ...trabajadorForm, nombre: e.target.value })}
                                                        className="text-sm h-10 border-2 border-[#E0E0E0] rounded-lg mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-base font-semibold text-[#333333]">Tipo de Contrato <span className="text-[#E12019]">*</span></Label>
                                                    <Select value={trabajadorForm.contrato || ''} onValueChange={(val) => setTrabajadorForm({ ...trabajadorForm, contrato: val })}>
                                                        <SelectTrigger className="text-sm h-10 border-2 border-[#E0E0E0] rounded-lg mt-1">
                                                            <SelectValue placeholder="Seleccionar tipo..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Indefinido">Indefinido</SelectItem>
                                                            <SelectItem value="Plazo Fijo">Plazo Fijo</SelectItem>
                                                            <SelectItem value="Por Obra o Faena">Por Obra o Faena</SelectItem>
                                                            <SelectItem value="Honorarios">Honorarios</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label className="text-base font-semibold text-[#333333]">Sucursal</Label>
                                                    <Select value={trabajadorForm.sucursal || ''} onValueChange={(val) => setTrabajadorForm({ ...trabajadorForm, sucursal: val })}>
                                                        <SelectTrigger className="text-sm h-10 border-2 border-[#E0E0E0] rounded-lg mt-1">
                                                            <SelectValue placeholder="Seleccionar sucursal..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Casablanca">Casablanca</SelectItem>
                                                            <SelectItem value="Valparaiso Planta BIF">Valparaiso Planta BIF</SelectItem>
                                                            <SelectItem value="Valparaiso Planta BIC">Valparaiso Planta BIC</SelectItem>
                                                        </SelectContent>
                                                    </Select>
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

                                    {/* Carga masiva de nómina */}
                                    <Dialog open={showCargaMasiva} onOpenChange={setShowCargaMasiva}>
                                        <DialogTrigger asChild>
                                            <Button className="flex-1 bg-[#E12019] hover:bg-[#B51810] text-white text-sm h-10">
                                                <Upload className="w-4 h-4 mr-2" />
                                                Carga Masiva
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="w-full max-w-xs sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-[#333333] text-base md:text-lg font-semibold">
                                                    Carga Masiva de Nómina
                                                </DialogTitle>
                                                {selectedCicloId && (
                                                    <p className="text-xs text-[#6B6B6B] mt-1">
                                                        Ciclo: {selectedCicloId}
                                                    </p>
                                                )}
                                                {/* Enlaces para descargar plantillas (simple y completa) */}
                                                <div className="mt-2 flex gap-4">
                                                    <a href="/plantillas/nomina_simple.csv" download className="inline-flex items-center gap-2 text-sm text-[#017E49] hover:underline">
                                                        <Download className="w-4 h-4" />
                                                        Plantilla simple (rut,nombre,contrato)
                                                    </a>
                                                </div>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label className="text-base font-semibold text-[#333333]">Archivo CSV o Excel</Label>
                                                    <Input
                                                        type="file"
                                                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                                        onChange={(e) => { setFile(e.target.files?.[0] || null); setProcessedFile(null); }}
                                                        className="mt-1"
                                                    />
                                                    <p className="text-xs text-[#6B6B6B] mt-1">
                                                        Formato: RUT, Nombre, Tipo Contrato, Sucursal
                                                    </p>
                                                    {file && (
                                                        <div className="text-xs text-[#017E49] mt-2">Archivo cargado: {file.name}</div>
                                                    )}
                                                </div>
                                                <Button
                                                    onClick={handleCargaMasiva}
                                                    disabled={!file || loading}
                                                    className="w-full bg-[#FF9F55] hover:bg-[#E68843] text-white"
                                                >
                                                    {loading ? 'Procesando...' : 'Vista Previa'}
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {/* Botones de activación/desactivación masiva */}
                                {selectedCicloId && filteredTrabajadores.length > 0 && (() => {
                                    const inactivosCount = filteredTrabajadores.filter(t => {
                                        const beneficio = t.beneficio_disponible || {};
                                        return beneficio.tipo === 'BLOQUEADO' || beneficio.activo === false;
                                    }).length;
                                    const activosCount = filteredTrabajadores.filter(t => {
                                        const beneficio = t.beneficio_disponible || {};
                                        return beneficio.tipo !== 'BLOQUEADO' &&
                                            beneficio.tipo !== 'SIN_BENEFICIO' &&
                                            beneficio.activo !== false;
                                    }).length;

                                    return (
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button
                                                onClick={handleActivarBeneficiosMasivo}
                                                disabled={loading || inactivosCount === 0}
                                                className="flex-1 bg-[#017E49] hover:bg-[#015A34] text-white text-xs sm:text-sm h-9"
                                            >
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Activar Todos ({inactivosCount})
                                            </Button>
                                            <Button
                                                onClick={handleDesactivarBeneficiosMasivo}
                                                disabled={loading || activosCount === 0}
                                                className="flex-1 bg-[#FF9F55] hover:bg-[#E68843] text-white text-xs sm:text-sm h-9"
                                            >
                                                <X className="w-3 h-3 mr-1" />
                                                Desactivar Todos ({activosCount})
                                            </Button>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Preview modal */}
                            {nominaPreview && showNominaPreview && (
                                <Dialog open={showNominaPreview} onOpenChange={setShowNominaPreview}>
                                    <DialogContent className="w-full max-w-xs sm:max-w-md md:max-w-lg max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle className="text-[#333333] text-base md:text-lg font-semibold">
                                                Vista Previa - Ciclo {selectedCicloId}
                                            </DialogTitle>
                                        </DialogHeader>

                                        <div className="space-y-4">
                                            {/* Botón para descargar solo plantilla simple */}

                                            {nominaPreview.resumen && (
                                                <div className="grid grid-cols-2 gap-3 text-xs bg-[#F8F8F8] rounded-lg p-3">
                                                    <div>
                                                        <span className="text-[#6B6B6B]">Total</span>
                                                        <p className="font-bold text-[#333333]">{nominaPreview.resumen.total_registros}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[#6B6B6B]">Válidos</span>
                                                        <p className="font-bold text-[#017E49]">{nominaPreview.resumen.validos}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[#6B6B6B]">A Crear</span>
                                                        <p className="font-bold text-[#333333]">{nominaPreview.resumen.a_crear}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[#6B6B6B]">A Actualizar</span>
                                                        <p className="font-bold text-[#FF9F55]">{nominaPreview.resumen.a_actualizar}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {nominaPreview?.errores && nominaPreview.errores.length > 0 && (
                                                <div className="mt-4">
                                                    <h4 className="text-sm font-semibold text-[#FF9F55] mb-2">Errores detectados:</h4>
                                                    <table className="w-full text-xs border">
                                                        <thead className="bg-[#FFF3E0]">
                                                            <tr>
                                                                <th>Fila</th>
                                                                <th>RUT</th>
                                                                <th>Nombre</th>
                                                                <th>Email</th>
                                                                <th>Teléfono</th>
                                                                <th>Mensaje</th>
                                                                <th>Editar</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {nominaPreview.errores.map((err: any, idx: number) => (
                                                                <tr key={idx} className="border-b">
                                                                    <td>{err.fila || idx + 1}</td>
                                                                    <td>
                                                                        <input type="text" defaultValue={err.rut} className="border rounded px-1 w-24 text-xs" onBlur={e => err.rut = e.target.value} />
                                                                    </td>
                                                                    <td>
                                                                        <input type="text" defaultValue={err.nombre} className="border rounded px-1 w-24 text-xs" onBlur={e => err.nombre = e.target.value} />
                                                                    </td>
                                                                    <td>
                                                                        <input type="text" defaultValue={err.email} className="border rounded px-1 w-24 text-xs" onBlur={e => err.email = e.target.value} />
                                                                    </td>
                                                                    <td>
                                                                        <input type="text" defaultValue={err.telefono} className="border rounded px-1 w-20 text-xs" onBlur={e => err.telefono = e.target.value} />
                                                                    </td>
                                                                    <td className="text-[#FF9F55]">{err.mensaje}</td>
                                                                    <td>
                                                                        <Button size="sm" variant="outline" className="text-xs px-2 py-1" onClick={() => { showSuccess('Fila editada', 'Actualiza la vista previa para validar cambios'); }}>
                                                                            Guardar
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    <div className="mt-2 text-xs text-[#6B6B6B]">Edita los campos y guarda para corregir errores antes de confirmar la carga.</div>
                                                </div>
                                            )}

                                            <div className="pt-2">
                                                <Button
                                                    onClick={handleConfirmarCargaMasiva}
                                                    disabled={loading}
                                                    className="w-full bg-[#017E49] hover:bg-[#015A34] text-white text-sm font-medium py-2"
                                                >
                                                    {loading ? 'Agregando...' : 'Agregar todos'}
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}

                            {/* Tabla de trabajadores */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs md:text-sm">
                                    <thead className="bg-[#F8F8F8] border-b border-[#E0E0E0]">
                                        <tr>
                                            <th className="text-left p-2 md:p-3 font-semibold text-[#333333]">RUT</th>
                                            <th className="text-left p-2 md:p-3 font-semibold text-[#333333]">Nombre</th>
                                            <th className="text-left p-2 md:p-3 font-semibold text-[#333333]">Contrato</th>
                                            <th className="text-left p-2 md:p-3 font-semibold text-[#333333]">Sucursal</th>
                                            <th className="text-center p-2 md:p-3 font-semibold text-[#333333]">Beneficio</th>
                                            <th className="text-right p-2 md:p-3 font-semibold text-[#333333]">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTrabajadores.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-4 text-center text-[#6B6B6B]">
                                                    {selectedCicloId
                                                        ? 'No hay trabajadores en este ciclo'
                                                        : 'Selecciona un ciclo para ver trabajadores'
                                                    }
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTrabajadores.map((t) => {
                                                const beneficio = t.beneficio_disponible || {};
                                                const tieneBeneficio = beneficio.tipo !== 'BLOQUEADO' &&
                                                    beneficio.tipo !== 'SIN_BENEFICIO' &&
                                                    beneficio.activo !== false;
                                                // Mostrar tipo de contrato desde beneficio_disponible
                                                const contrato = beneficio.tipo_contrato || t.contrato || beneficio.contrato || '-';
                                                const sucursal = t.sucursal || beneficio.sucursal || '-';
                                                return (
                                                    <tr key={t.rut} className="border-b border-[#E0E0E0] hover:bg-[#F8F8F8]">
                                                        <td className="p-2 md:p-3 text-[#333333]">{t.rut}</td>
                                                        <td className="p-2 md:p-3 text-[#333333]">{t.nombre}</td>
                                                        <td className="p-2 md:p-3 text-[#6B6B6B]">{contrato}</td>
                                                        <td className="p-2 md:p-3 text-[#6B6B6B]">{sucursal}</td>
                                                        <td className="p-2 md:p-3 text-center">
                                                            <Badge className="text-xs px-2 py-0.5" variant={tieneBeneficio ? 'default' : 'outline'}>
                                                                {tieneBeneficio ? 'Activo' : 'Inactivo'}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-2 md:p-3 text-right">
                                                            <div className="inline-flex gap-2">
                                                                {tieneBeneficio ? (
                                                                    <button
                                                                        onClick={() => handleDesactivarBeneficio(t.rut!)}
                                                                        className="text-[#FF9F55] hover:text-[#E68843] text-xs md:text-sm"
                                                                        title="Desactivar beneficio"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleActivarBeneficio(t.rut!)}
                                                                        className="text-[#017E49] hover:bg-[#015A34] text-xs md:text-sm"
                                                                        title="Activar beneficio"
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Historial de cargas masivas removido */}
                        </div>
                    </TabsContent>

                    {/* CICLO TAB */}
                    <TabsContent value="ciclos" className="space-y-4">
                        <CicloBimensualModule />
                    </TabsContent>

                    {/* INCIDENTES TAB */}
                    <TabsContent value="incidentes" className="space-y-4">
                        <div className="bg-white rounded-lg border border-[#E0E0E0] p-3 md:p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-[#333333] text-sm md:text-base font-semibold">Reportes de Incidentes</h3>
                                    <p className="text-[#6B6B6B] text-xs">Reportados por Guardia ({incidencias.length})</p>
                                </div>
                                <button
                                    onClick={reloadIncidencias}
                                    className="px-3 py-2 bg-[#017E49] text-white text-xs rounded hover:bg-[#015F3A] transition-colors"
                                >
                                    Recargar
                                </button>
                            </div>
                            {incidencias.length === 0 ? (
                                <div className="text-center py-8 text-[#6B6B6B]">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No hay incidentes registrados</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs md:text-sm">
                                        <thead className="bg-[#F8F8F8] border-b-2 border-[#E0E0E0]">
                                            <tr>
                                                <th className="text-left p-2 md:p-3 text-[#333333] font-semibold">Código</th>
                                                <th className="text-left p-2 md:p-3 text-[#333333] font-semibold">Tipo</th>
                                                <th className="text-left p-2 md:p-3 text-[#333333] font-semibold">Trabajador</th>
                                                <th className="text-left p-2 md:p-3 text-[#333333] font-semibold">Descripción</th>
                                                <th className="text-center p-2 md:p-3 text-[#333333] font-semibold">Estado</th>
                                                <th className="text-center p-2 md:p-3 text-[#333333] font-semibold">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {incidencias.map((inc) => {
                                                // Buscar el nombre del trabajador si existe RUT
                                                const rutIncidencia = (inc as any).trabajador_rut
                                                    || (inc as any).trabajador?.rut
                                                    || (typeof inc.trabajador === 'string' ? inc.trabajador : undefined);
                                                
                                                const trabajador = rutIncidencia 
                                                    ? trabajadores.find(t => t.rut?.toLowerCase() === String(rutIncidencia).toLowerCase())
                                                    : null;
                                                
                                                const nombreTrabajador = trabajador?.nombre || (inc as any).trabajador_nombre || rutIncidencia || 'Sin dato';

                                                return (
                                                    <tr key={inc.id || inc.codigo} className="border-b border-[#E0E0E0] hover:bg-[#F8F8F8] transition-colors">
                                                        <td className="p-2 md:p-3 font-mono text-[#E12019]">{inc.codigo || String(inc.id)}</td>
                                                        <td className="p-2 md:p-3 capitalize">
                                                            <span className="px-2 py-1 bg-[#E8F5F1] text-[#017E49] rounded text-xs font-medium">
                                                                {inc.tipo || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="p-2 md:p-3">
                                                            <div className="text-[#333333] font-medium">{nombreTrabajador}</div>
                                                            {rutIncidencia && (
                                                                <div className="text-[#6B6B6B] text-xs">{rutIncidencia}</div>
                                                            )}
                                                        </td>
                                                        <td className="p-2 md:p-3 text-[#6B6B6B] max-w-xs truncate" title={inc.descripcion}>
                                                            {inc.descripcion || 'Sin descripción'}
                                                        </td>
                                                        <td className="p-2 md:p-3 text-center">
                                                            <Badge 
                                                                className="text-xs px-2 py-0.5 capitalize"
                                                                variant={inc.estado === 'resuelta' ? 'outline' : 'destructive'}
                                                            >
                                                                {inc.estado || 'pendiente'}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-2 md:p-3 text-center">
                                                            <button
                                                                className="px-3 py-1.5 rounded bg-[#017E49] text-white text-xs hover:bg-[#015F3A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                                                onClick={() => handleResponderIncidencia(inc)}
                                                                disabled={resolviendoIncidencia === (inc.codigo || String(inc.id)) || inc.estado === 'resuelta'}
                                                            >
                                                                {resolviendoIncidencia === (inc.codigo || String(inc.id)) ? 'Enviando...' : 'Responder'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
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
        </div >
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
