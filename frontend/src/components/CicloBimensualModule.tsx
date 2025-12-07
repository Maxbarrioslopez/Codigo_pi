import { useState, useEffect } from 'react';
import { Calendar, Clock, Settings, History, Unlock, AlertCircle, CheckCircle, XCircle, Package, User, Plus, Edit2, Edit, Trash2, Check, X, Boxes, List } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { cicloService } from '@/services/ciclo.service';
import { cajasService } from '@/services/cajas.service';
import { CicloDTO, TipoBeneficioDTO } from '@/types';
import { toast } from 'sonner';



export function CicloBimensualModule() {
  // Estados para ciclos
  const [ciclos, setCiclos] = useState<CicloDTO[]>([]);
  const [beneficios, setBeneficios] = useState<TipoBeneficioDTO[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para cajas
  const [cajasDelBeneficio, setCajasDelBeneficio] = useState<any[]>([]);
  const [beneficiosConCajas, setBeneficiosConCajas] = useState<any[]>([]);
  const [soloCajas, setSoloCajas] = useState<any[]>([]);
  const [showViewCajasModal, setShowViewCajasModal] = useState(false);
  const [cajasTabActual, setCajasTabActual] = useState<'beneficios' | 'solo-cajas'>('beneficios');

  // Modales
  const [showCreateCicloModal, setShowCreateCicloModal] = useState(false);
  const [showCreateBeneficioModal, setShowCreateBeneficioModal] = useState(false);
  const [showCreateCajaModal, setShowCreateCajaModal] = useState(false);
  const [showEditBeneficioModal, setShowEditBeneficioModal] = useState(false);
  const [showEditCajaModal, setShowEditCajaModal] = useState(false);
  const [showAgregarBeneficioModal, setShowAgregarBeneficioModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // Datos de formularios
  const [cicloForm, setCicloForm] = useState({ nombre: '', fecha_inicio: '', fecha_fin: '', descripcion: '' });
  const [beneficioForm, setBeneficioForm] = useState({ nombre: '', descripcion: '', activo: true, tipos_contrato: [] as string[], requiere_validacion_guardia: false });
  const [cajaForm, setCajaForm] = useState({ beneficio: 0, nombre: '', descripcion: '', codigo_tipo: '', activo: true });
  const [selectedBeneficio, setSelectedBeneficio] = useState<TipoBeneficioDTO | null>(null);
  const [selectedCaja, setSelectedCaja] = useState<any>(null);
  const [selectedCiclo, setSelectedCiclo] = useState<CicloDTO | null>(null);
  const [selectedBeneficiosParaCiclo, setSelectedBeneficiosParaCiclo] = useState<number[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Load cajas data for the Cajas tab
    const loadCajasData = async () => {
      try {
        const [beneficiosConCajasData, soloCajasData] = await Promise.all([
          cajasService.getBeneficiosConCajas(false).catch(() => []),
          cajasService.getSoloCajas(false).catch(() => []),
        ]);
        setBeneficiosConCajas(beneficiosConCajasData);
        setSoloCajas(soloCajasData);
      } catch (error) {
        console.error('Error loading cajas data:', error);
      }
    };
    loadCajasData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ciclosData, beneficiosData] = await Promise.all([
        cicloService.getAll().catch(() => []),
        cicloService.getAllTipos().catch(() => []),
      ]);
      setCiclos(ciclosData);
      setBeneficios(beneficiosData);
    } catch (error) {
      toast.error('Error al cargar datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== CRUD CICLOS ====================

  const handleCreateCiclo = async () => {
    if (!cicloForm.nombre || !cicloForm.fecha_inicio || !cicloForm.fecha_fin) {
      toast.error('Completa todos los campos requeridos');
      return;
    }
    try {
      await cicloService.create(cicloForm);
      toast.success('Ciclo creado exitosamente');
      setShowCreateCicloModal(false);
      setCicloForm({ nombre: '', fecha_inicio: '', fecha_fin: '', descripcion: '' });
      loadData();
    } catch (error) {
      toast.error('Error al crear ciclo');
      console.error(error);
    }
  };

  const handleAgregarBeneficioACiclo = async () => {
    if (!selectedCiclo) {
      toast.error('Error: No se seleccionó ciclo');
      return;
    }
    try {
      await cicloService.update(selectedCiclo.id, {
        beneficios_activos_ids: selectedBeneficiosParaCiclo,
      } as any);

      toast.success('Beneficios actualizados en el ciclo');
      setShowAgregarBeneficioModal(false);
      setSelectedBeneficiosParaCiclo([]);
      loadData();
    } catch (error) {
      toast.error('Error al actualizar beneficios');
      console.error(error);
    }
  };

  // ==================== CRUD BENEFICIOS ====================

  const handleCreateBeneficio = async () => {
    if (!beneficioForm.nombre) {
      toast.error('El nombre del beneficio es requerido');
      return;
    }
    try {
      await cicloService.createTipo(beneficioForm);
      toast.success('Tipo de beneficio creado');
      setShowCreateBeneficioModal(false);
      setBeneficioForm({ nombre: '', descripcion: '', activo: true, tipos_contrato: [], requiere_validacion_guardia: false });
      loadData();
    } catch (error) {
      toast.error('Error al crear beneficio');
      console.error(error);
    }
  };

  const handleUpdateBeneficio = async () => {
    if (!selectedBeneficio || !beneficioForm.nombre) {
      toast.error('Completa los campos requeridos');
      return;
    }
    try {
      await cicloService.updateTipo(selectedBeneficio.id, beneficioForm);
      toast.success('Beneficio actualizado');
      setShowEditBeneficioModal(false);
      setBeneficioForm({ nombre: '', descripcion: '', activo: true, tipos_contrato: [], requiere_validacion_guardia: false });
      setSelectedBeneficio(null);
      loadData();
    } catch (error) {
      toast.error('Error al actualizar beneficio');
      console.error(error);
    }
  };

  const openEditBeneficio = async (beneficio: TipoBeneficioDTO) => {
    setSelectedBeneficio(beneficio);
    setBeneficioForm({
      nombre: beneficio.nombre,
      descripcion: beneficio.descripcion || '',
      activo: beneficio.activo,
      tipos_contrato: beneficio.tipos_contrato || [],
      requiere_validacion_guardia: beneficio.requiere_validacion_guardia || false,
    });

    // Cargar cajas del beneficio y todas las cajas disponibles
    try {
      const [cajas, todasLasCajas] = await Promise.all([
        cajasService.obtenerCajasPorBeneficio(beneficio.id, true),
        cajasService.getSoloCajas(false),
      ]);
      setCajasDelBeneficio(cajas);
      setSoloCajas(todasLasCajas);
    } catch (error) {
      console.error('Error al cargar cajas:', error);
      setCajasDelBeneficio([]);
      setSoloCajas([]);
    }

    setShowEditBeneficioModal(true);
  };

  const handleVerCajasBeneficio = async (beneficio: TipoBeneficioDTO) => {
    try {
      setSelectedBeneficio(beneficio);
      const [cajas, beneficiosConCajasData, soloCajasData] = await Promise.all([
        cajasService.obtenerCajasPorBeneficio(beneficio.id, true),
        cajasService.getBeneficiosConCajas(false),
        cajasService.getSoloCajas(false),
      ]);
      setCajasDelBeneficio(cajas);
      setBeneficiosConCajas(beneficiosConCajasData);
      setSoloCajas(soloCajasData);
      setCajasTabActual('beneficios');
      setShowViewCajasModal(true);
    } catch (error) {
      toast.error('Error al cargar cajas');
      console.error(error);
    }
  };

  // ==================== CRUD CAJAS ====================

  const handleCreateCaja = async () => {
    const beneficioId = cajaForm.beneficio && cajaForm.beneficio !== 0 ? cajaForm.beneficio : null;

    if (!cajaForm.nombre || !cajaForm.codigo_tipo) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    try {
      if (beneficioId) {
        await cajasService.crearCajaBeneficio(beneficioId, {
          nombre: cajaForm.nombre,
          descripcion: cajaForm.descripcion,
          codigo_tipo: cajaForm.codigo_tipo,
          activo: cajaForm.activo !== false,
        });
      } else {
        await cajasService.createCajaBeneficio({
          nombre: cajaForm.nombre,
          descripcion: cajaForm.descripcion,
          codigo_tipo: cajaForm.codigo_tipo,
          activo: cajaForm.activo !== false,
          beneficio: undefined,
        });
      }

      toast.success('Caja creada exitosamente');
      setShowCreateCajaModal(false);
      setCajaForm({ beneficio: 0, nombre: '', descripcion: '', codigo_tipo: '', activo: true });

      const [beneficiosConCajasData, soloCajasData] = await Promise.all([
        cajasService.getBeneficiosConCajas(false),
        cajasService.getSoloCajas(false),
      ]);
      setBeneficiosConCajas(beneficiosConCajasData);
      setSoloCajas(soloCajasData);

      // Recargar cajas del beneficio si está seleccionado
      if (selectedBeneficio) {
        const cajasActualizadas = await cajasService.obtenerCajasPorBeneficio(selectedBeneficio.id, true);
        setCajasDelBeneficio(cajasActualizadas);
      }
    } catch (error: any) {
      const detalle = error?.response?.data ? JSON.stringify(error.response.data) : '';
      toast.error(detalle ? `Error al crear caja: ${detalle}` : 'Error al crear caja');
      console.error(error);
    }
  };

  const handleToggleCajaAsignacion = async (cajaId: number) => {
    if (!selectedBeneficio) return;

    try {
      // Verificar si la caja está actualmente asignada al beneficio
      const estaAsignada = cajasDelBeneficio.some(c => c.id === cajaId);
      const nuevoBeneficioId = estaAsignada ? null : selectedBeneficio.id;

      await cajasService.updateCajaBeneficio(cajaId, {
        beneficio: nuevoBeneficioId
      });

      toast.success(estaAsignada ? 'Caja desasignada del beneficio' : 'Caja asignada al beneficio');

      // Actualizar localmente de manera inmediata para mejor UX
      if (estaAsignada) {
        // Desasignar
        setCajasDelBeneficio(cajasDelBeneficio.filter(c => c.id !== cajaId));
      } else {
        // Asignar
        const cajaAAsignar = soloCajas.find(c => c.id === cajaId);
        if (cajaAAsignar) {
          setCajasDelBeneficio([...cajasDelBeneficio, { ...cajaAAsignar, beneficio: selectedBeneficio.id, beneficio_id: selectedBeneficio.id }]);
        }
      }

      // Recargar datos del servidor después de actualizar UI
      try {
        const [beneficiosConCajasData, soloCajasData, cajasActualizadas] = await Promise.all([
          cajasService.getBeneficiosConCajas(false),
          cajasService.getSoloCajas(false),
          cajasService.obtenerCajasPorBeneficio(selectedBeneficio.id, true),
        ]);
        setBeneficiosConCajas(beneficiosConCajasData);
        setSoloCajas(soloCajasData);
        // Validar que las cajas cargadas realmente pertenezcan a este beneficio
        const cajasValidas = cajasActualizadas.filter((c: any) => c.beneficio === selectedBeneficio.id || c.beneficio_id === selectedBeneficio.id);
        setCajasDelBeneficio(cajasValidas);
      } catch (error) {
        console.error('Error reloading cajas:', error);
      }
    } catch (error) {
      toast.error('Error al actualizar asignación de caja');
      console.error(error);
    }
  };

  const handleEditCaja = (caja: any) => {
    setSelectedCaja(caja);
    setCajaForm({
      beneficio: caja.beneficio_id || 0,
      nombre: caja.nombre,
      descripcion: caja.descripcion || '',
      codigo_tipo: caja.codigo_tipo,
      activo: caja.activo !== false,
    });
    if (caja.beneficio_id) {
      const ben = beneficios.find(b => b.id === caja.beneficio_id);
      setSelectedBeneficio(ben || null);
    } else {
      setSelectedBeneficio(null);
    }
    setShowEditCajaModal(true);
  };

  const handleUpdateCaja = async () => {
    if (!selectedCaja) return;

    if (!cajaForm.nombre || !cajaForm.codigo_tipo) {
      toast.error('Por favor completa nombre y código');
      return;
    }

    try {
      await cajasService.updateCajaBeneficio(selectedCaja.id, {
        nombre: cajaForm.nombre,
        descripcion: cajaForm.descripcion,
        codigo_tipo: cajaForm.codigo_tipo,
        activo: cajaForm.activo !== false,
      });
      toast.success('Caja actualizada exitosamente');
      setShowEditCajaModal(false);
      setCajaForm({ beneficio: 0, nombre: '', descripcion: '', codigo_tipo: '', activo: true });
      setSelectedCaja(null);
      setSelectedBeneficio(null);

      // Recargar datos
      try {
        const [beneficiosConCajasData, soloCajasData] = await Promise.all([
          cajasService.getBeneficiosConCajas(false),
          cajasService.getSoloCajas(false),
        ]);
        setBeneficiosConCajas(beneficiosConCajasData);
        setSoloCajas(soloCajasData);

        if (selectedBeneficio) {
          const cajasActualizadas = await cajasService.obtenerCajasPorBeneficio(selectedBeneficio.id, true);
          setCajasDelBeneficio(cajasActualizadas);
        }
      } catch (error) {
        console.error('Error reloading cajas:', error);
      }
    } catch (error) {
      toast.error('Error al actualizar caja');
      console.error(error);
    }
  };

  const handleToggleCajaActivo = async (cajaId: number, cajaActual: any) => {
    try {
      const caja = await cajasService.toggleCajaActivo(cajaId);
      toast.success(caja.activo ? 'Caja activada' : 'Caja desactivada');

      // Actualizar la lista local
      setCajasDelBeneficio(cajasDelBeneficio.map(c =>
        c.id === cajaId ? { ...c, activo: caja.activo } : c
      ));

      // Recargar datos de beneficios con cajas
      try {
        const [beneficiosConCajasData, soloCajasData] = await Promise.all([
          cajasService.getBeneficiosConCajas(false),
          cajasService.getSoloCajas(false),
        ]);
        setBeneficiosConCajas(beneficiosConCajasData);
        setSoloCajas(soloCajasData);

        // Recargar cajas del beneficio si está seleccionado
        if (selectedBeneficio) {
          const cajasActualizadas = await cajasService.obtenerCajasPorBeneficio(selectedBeneficio.id, true);
          setCajasDelBeneficio(cajasActualizadas);
        }
      } catch (error) {
        console.error('Error reloading cajas:', error);
      }
    } catch (error) {
      toast.error('Error al actualizar caja');
      console.error(error);
    }
  };

  const handleDeleteCaja = async (cajaId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta caja?')) {
      return;
    }
    try {
      await cajasService.deleteCajaBeneficio(cajaId);
      toast.success('Caja eliminada exitosamente');

      // Actualizar la lista local
      setCajasDelBeneficio(cajasDelBeneficio.filter(c => c.id !== cajaId));

      // Recargar datos de beneficios con cajas
      try {
        const [beneficiosConCajasData, soloCajasData] = await Promise.all([
          cajasService.getBeneficiosConCajas(false),
          cajasService.getSoloCajas(false),
        ]);
        setBeneficiosConCajas(beneficiosConCajasData);
        setSoloCajas(soloCajasData);

        // Recargar cajas del beneficio si está seleccionado
        if (selectedBeneficio) {
          const cajasActualizadas = await cajasService.obtenerCajasPorBeneficio(selectedBeneficio.id, true);
          setCajasDelBeneficio(cajasActualizadas);
        }
      } catch (error) {
        console.error('Error reloading cajas:', error);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('409')) {
        toast.error('No se puede eliminar: hay trabajadores con esta caja asignada');
      } else {
        toast.error('Error al eliminar caja');
      }
      console.error(error);
    }
  };

  const handleCerrarCiclo = async (cicloId: number) => {
    if (!confirm('¿Estás seguro de cerrar este ciclo? Esta acción desactivará el ciclo.')) {
      return;
    }
    try {
      await cicloService.cerrar(cicloId);
      toast.success('Ciclo cerrado exitosamente');
      loadData();
    } catch (error) {
      toast.error('Error al cerrar ciclo');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con botones principales */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-[#333333] mb-2 text-2xl font-bold">Gestión de Ciclo Bimensual</h2>
            <p className="text-[#6B6B6B]">
              Control de ciclos de beneficios y tipos de beneficios disponibles
            </p>
          </div>
        </div>

        {/* Botones principales */}
        <div className="flex gap-3">
          <Button
            onClick={() => setShowCreateCicloModal(true)}
            className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Ciclo
          </Button>
          <Button
            onClick={() => setShowCreateBeneficioModal(true)}
            className="bg-[#017E49] text-white hover:bg-[#016339] h-11 px-6 rounded-xl"
          >
            <Package className="w-4 h-4 mr-2" />
            Crear Beneficio
          </Button>
          <Button
            onClick={() => setShowCreateCajaModal(true)}
            className="text-white h-11 px-6 rounded-xl"
            style={{ backgroundColor: '#FF8C00' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E67E00'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF8C00'}
          >
            <Package className="w-4 h-4 mr-2" />
            Crear Caja
          </Button>
        </div>
      </div>

      {/* Tabs para ver Ciclos y Beneficios */}
      <Tabs defaultValue="ciclos" className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-3">
          <TabsTrigger value="ciclos">
            <Calendar className="w-4 h-4 mr-2" />
            Ciclos
          </TabsTrigger>
          <TabsTrigger value="beneficios">
            <Package className="w-4 h-4 mr-2" />
            Beneficios
          </TabsTrigger>
          <TabsTrigger value="cajas">
            <Package className="w-4 h-4 mr-2" />
            Cajas
          </TabsTrigger>
        </TabsList>

        {/* Tab Ciclos */}
        <TabsContent value="ciclos" className="space-y-6 mt-6">
          {loading ? (
            <div className="text-center py-12 text-[#6B6B6B]">Cargando ciclos...</div>
          ) : ciclos.length === 0 ? (
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-12 text-center">
              <Calendar className="w-12 h-12 text-[#6B6B6B] mx-auto mb-4" />
              <p className="text-[#6B6B6B]">No hay ciclos creados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ciclos.map((ciclo) => (
                <div key={ciclo.id} className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-[#333333] font-bold text-lg">{ciclo.nombre}</h3>
                      <p className="text-[#6B6B6B] text-sm">
                        {ciclo.fecha_inicio} → {ciclo.fecha_fin}
                      </p>
                    </div>
                    <Badge className={ciclo.activo ? 'bg-[#017E49]' : 'bg-[#6B6B6B]'}>
                      {ciclo.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-[#6B6B6B] text-sm">Duración</p>
                      <p className="text-[#333333] font-semibold">{ciclo.duracion_dias} días</p>
                    </div>
                    <div>
                      <p className="text-[#6B6B6B] text-sm">Restantes</p>
                      <p className="text-[#E12019] font-semibold">{ciclo.dias_restantes} días</p>
                    </div>
                    <div>
                      <p className="text-[#6B6B6B] text-sm">Progreso</p>
                      <p className="text-[#333333] font-semibold">{ciclo.progreso_porcentaje}%</p>
                    </div>
                    <div>
                      <p className="text-[#6B6B6B] text-sm">Beneficios</p>
                      <p className="text-[#333333] font-semibold">{ciclo.beneficios_activos.length}</p>
                    </div>
                  </div>

                  {ciclo.beneficios_activos.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[#6B6B6B] text-sm mb-2">Beneficios activos:</p>
                      <div className="flex flex-wrap gap-2">
                        {ciclo.beneficios_activos.map((beneficio) => (
                          <Badge key={beneficio.id} className="bg-[#E12019] text-white">
                            {beneficio.nombre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        setSelectedCiclo(ciclo);
                        setSelectedBeneficiosParaCiclo(ciclo.beneficios_activos.map(b => b.id));

                        // Cargar datos de cajas si no están disponibles
                        if (beneficiosConCajas.length === 0) {
                          try {
                            const [beneficiosConCajasData, soloCajasData] = await Promise.all([
                              cajasService.getBeneficiosConCajas(false),
                              cajasService.getSoloCajas(false),
                            ]);
                            setBeneficiosConCajas(beneficiosConCajasData);
                            setSoloCajas(soloCajasData);
                          } catch (error) {
                            console.error('Error loading cajas data:', error);
                          }
                        }

                        setShowAgregarBeneficioModal(true);
                      }}
                      className="flex-1 bg-[#017E49] text-white hover:bg-[#016339]"
                      disabled={!ciclo.activo}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Beneficio
                    </Button>
                    {ciclo.activo ? (
                      <Button
                        onClick={() => handleCerrarCiclo(ciclo.id)}
                        className="flex-1 bg-[#FF9F55] text-white hover:bg-[#E68843]"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cerrar Ciclo
                      </Button>
                    ) : (
                      <Button variant="outline" className="flex-1" disabled>
                        Ciclo Cerrado
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        {/* Tab Beneficios */}
        <TabsContent value="beneficios" className="space-y-6 mt-6">
          {loading ? (
            <div className="text-center py-12 text-[#6B6B6B]">Cargando beneficios...</div>
          ) : beneficios.length === 0 ? (
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-12 text-center">
              <Package className="w-12 h-12 text-[#6B6B6B] mx-auto mb-4" />
              <p className="text-[#6B6B6B]">No hay beneficios creados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {beneficios.map((beneficio) => {
                // Buscar cajas relacionadas a este beneficio
                const beneficioConCajas = beneficiosConCajas.find(b => b.id === beneficio.id);
                const totalCajas = beneficioConCajas?.cajas?.length || 0;
                const cajasActivas = beneficioConCajas?.cajas?.filter((c: any) => c.activo).length || 0;

                return (
                  <div key={beneficio.id} className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6 hover:border-[#FF9F55] transition-colors">
                    {/* HEADER CON NOMBRE Y ESTADO */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <Package className="w-8 h-8 text-[#E12019] flex-shrink-0" />
                        <div>
                          <h3 className="text-[#333333] font-semibold text-base">{beneficio.nombre}</h3>
                          <Badge className={beneficio.activo ? 'bg-[#017E49]' : 'bg-[#6B6B6B]'}>
                            {beneficio.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* DESCRIPCIÓN */}
                    <p className="text-[#6B6B6B] text-sm mb-4 min-h-[40px]">
                      {beneficio.descripcion || 'Sin descripción'}
                    </p>

                    {/* INFORMACIÓN DETALLADA */}
                    <div className="space-y-3 mb-4 p-4 bg-[#F8F8F8] rounded-lg border border-[#E0E0E0]">
                      {/* CAJAS INFORMACIÓN */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#FF9F55]" />
                          <span className="text-xs font-semibold text-[#333333]">Cajas:</span>
                        </div>
                        <span className="text-sm font-bold text-[#FF9F55]">
                          {cajasActivas}/{totalCajas}
                          <span className="text-xs text-[#6B6B6B] ml-1">activas</span>
                        </span>
                      </div>

                      {/* VALIDACIÓN GUARDIA */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {beneficio.requiere_validacion_guardia ? (
                            <>
                              <span className="text-[#FF9F55]">🔐</span>
                              <span className="text-xs font-semibold text-[#333333]">Validación:</span>
                            </>
                          ) : (
                            <>
                              <span className="text-[#6B6B6B]">•</span>
                              <span className="text-xs font-semibold text-[#333333]">Validación:</span>
                            </>
                          )}
                        </div>
                        <Badge className={beneficio.requiere_validacion_guardia
                          ? 'bg-[#FFE6CC] text-[#FF9F55] border border-[#FF9F55]'
                          : 'bg-[#E6F3EE] text-[#017E49] border border-[#017E49]'
                        }>
                          {beneficio.requiere_validacion_guardia ? 'Doble Validación' : 'Sin Validación'}
                        </Badge>
                      </div>

                      {/* TIPOS DE CONTRATO */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#017E49]" />
                          <span className="text-xs font-semibold text-[#333333]">Aplica a:</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#6B6B6B]">
                            {beneficio.tipos_contrato?.length > 0
                              ? beneficio.tipos_contrato.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')
                              : 'No especificado'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* BOTONES */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleVerCajasBeneficio(beneficio)}
                        className="flex-1 bg-[#FF8C00] text-white hover:bg-[#E67E00]"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Ver Cajas
                      </Button>
                      <Button
                        onClick={() => openEditBeneficio(beneficio)}
                        className="flex-1 bg-[#E12019] text-white hover:bg-[#B51810]"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab Cajas */}
        <TabsContent value="cajas" className="space-y-6 mt-6">
          {loading ? (
            <div className="text-center py-12 text-[#6B6B6B]">Cargando cajas...</div>
          ) : beneficiosConCajas.length === 0 ? (
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-12 text-center">
              <Package className="w-12 h-12 text-[#6B6B6B] mx-auto mb-4" />
              <p className="text-[#6B6B6B]">No hay beneficios con cajas disponibles</p>
            </div>
          ) : (
            <Tabs defaultValue="por-beneficio" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#F8F8F8] border-2 border-[#E0E0E0]">
                <TabsTrigger value="por-beneficio" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-[#FF9F55]">
                  <Package className="w-4 h-4 mr-2" />
                  Por Beneficio
                </TabsTrigger>
                <TabsTrigger value="todas-cajas" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-[#FF9F55]">
                  <List className="w-4 h-4 mr-2" />
                  Todas las Cajas
                </TabsTrigger>
              </TabsList>

              {/* SUB-TAB: POR BENEFICIO */}
              <TabsContent value="por-beneficio" className="space-y-4 mt-6">
                {beneficiosConCajas.map((beneficio: any) => (
                  <div key={beneficio.id} className="bg-white border-2 border-[#E0E0E0] rounded-xl overflow-hidden">
                    {/* HEADER BENEFICIO */}
                    <div className="bg-gradient-to-r from-[#FFF4E6] to-[#FFE6CC] border-b-2 border-[#FF9F55] p-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-[#333333] font-bold text-lg flex items-center gap-2">
                            <Package className="w-5 h-5 text-[#FF9F55]" />
                            {beneficio.nombre}
                          </h3>
                          <p className="text-[#6B6B6B] text-sm mt-1">{beneficio.descripcion || 'Sin descripción'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={beneficio.activo ? 'bg-[#017E49]' : 'bg-[#6B6B6B]'}>
                            {beneficio.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                          {beneficio.requiere_validacion_guardia && (
                            <Badge className="bg-[#E12019] text-white">Validación Guardia</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CAJAS */}
                    <div className="p-6">
                      {beneficio.cajas && beneficio.cajas.length > 0 ? (
                        <div className="space-y-3">
                          {beneficio.cajas.map((caja: any) => (
                            <div
                              key={caja.id}
                              className="border-2 border-[#E0E0E0] rounded-lg p-4 hover:border-[#FF9F55] transition-colors"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-[#333333] text-base">{caja.nombre}</h4>
                                    <Badge className={caja.activo ? 'bg-[#017E49] text-white' : 'bg-[#999999] text-white'}>
                                      {caja.activo ? 'Activa' : 'Inactiva'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-[#6B6B6B] font-mono mb-2">{caja.codigo_tipo}</p>
                                </div>
                              </div>

                              {/* DESCRIPCIÓN */}
                              {caja.descripcion && (
                                <p className="text-sm text-[#6B6B6B] p-2 bg-[#F8F8F8] rounded mb-3 border-l-4 border-[#FF9F55]">
                                  {caja.descripcion}
                                </p>
                              )}

                              {/* INFO Y ACCIONES */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                                {/* INFORMACIÓN */}
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-[#333333]">Beneficio:</span>
                                    <span className="text-[#6B6B6B]">{beneficio.nombre}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-[#333333]">Código:</span>
                                    <span className="text-[#6B6B6B] font-mono">{caja.codigo_tipo}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-[#333333]">Disponible:</span>
                                    <Badge className="bg-[#E6F3EE] text-[#017E49] border border-[#017E49]">
                                      {caja.activo ? 'Sí' : 'No'}
                                    </Badge>
                                  </div>
                                </div>

                                {/* VALIDACIÓN GUARDIA INFO */}
                                <div className="flex items-center gap-2 text-xs p-2 bg-[#FFF4E6] rounded border border-[#FF9F55]">
                                  {caja.activo && beneficio.requiere_validacion_guardia ? (
                                    <>
                                      <span className="text-[#FF9F55] font-semibold">✓</span>
                                      <span className="text-[#6B6B6B]">El guardia validará esta caja</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-[#6B6B6B]">•</span>
                                      <span className="text-[#6B6B6B]">
                                        {caja.activo ? 'Sin validación requerida' : 'Caja inactiva'}
                                      </span>
                                    </>
                                  )}
                                </div>

                                {/* ACCIONES */}
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => handleEditCaja(caja)}
                                    className="flex items-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors bg-[#E6F3EE] text-[#017E49] hover:bg-[#D9E9E3]"
                                  >
                                    <Edit className="w-3 h-3" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleToggleCajaActivo(caja.id, caja)}
                                    className={`flex items-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors ${caja.activo
                                      ? 'bg-[#FFF4E6] text-[#FF9F55] hover:bg-[#FFE6CC]'
                                      : 'bg-[#E6F3EE] text-[#017E49] hover:bg-[#D9E9E3]'
                                      }`}
                                  >
                                    {caja.activo ? (
                                      <>
                                        <X className="w-3 h-3" />
                                        Desactivar
                                      </>
                                    ) : (
                                      <>
                                        <Check className="w-3 h-3" />
                                        Activar
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-[#F8F8F8] rounded-lg border-2 border-dashed border-[#E0E0E0]">
                          <Package className="w-8 h-8 mx-auto mb-2 text-[#E0E0E0]" />
                          <p className="text-[#6B6B6B] text-sm font-semibold">No hay cajas definidas para este beneficio</p>
                        </div>
                      )}
                    </div>

                    {/* BOTÓN AGREGAR CAJA */}
                    <div className="bg-[#F8F8F8] border-t-2 border-[#E0E0E0] p-4">
                      <Button
                        onClick={() => {
                          setSelectedBeneficio(beneficio);
                          setCajaForm({ beneficio: beneficio.id, nombre: '', descripcion: '', codigo_tipo: '', activo: true });
                          setShowCreateCajaModal(true);
                        }}
                        className="w-full bg-[#FF8C00] text-white hover:bg-[#E67E00]"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Nueva Caja a {beneficio.nombre}
                      </Button>
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* SUB-TAB: TODAS LAS CAJAS */}
              <TabsContent value="todas-cajas" className="space-y-4 mt-6">
                {soloCajas.length > 0 ? (
                  <div className="space-y-3">
                    {soloCajas.map((caja: any) => (
                      <div
                        key={caja.id}
                        className="border-2 border-[#E0E0E0] rounded-lg p-4 hover:border-[#FF9F55] transition-colors bg-white"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-[#333333] text-base">{caja.nombre}</h4>
                              <Badge className={caja.activo ? 'bg-[#017E49] text-white' : 'bg-[#999999] text-white'}>
                                {caja.activo ? 'Activa' : 'Inactiva'}
                              </Badge>
                            </div>
                            <p className="text-xs text-[#6B6B6B] font-mono mb-2">{caja.codigo_tipo}</p>
                          </div>
                        </div>

                        {/* DESCRIPCIÓN */}
                        {caja.descripcion && (
                          <p className="text-sm text-[#6B6B6B] p-2 bg-[#F8F8F8] rounded mb-3 border-l-4 border-[#FF9F55]">
                            {caja.descripcion}
                          </p>
                        )}

                        {/* INFO Y ACCIONES */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                          {/* INFORMACIÓN */}
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#333333]">Caja:</span>
                              <span className="text-[#6B6B6B]">{caja.nombre}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#333333]">Código:</span>
                              <span className="text-[#6B6B6B] font-mono">{caja.codigo_tipo}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#333333]">Disponible:</span>
                              <Badge className="bg-[#E6F3EE] text-[#017E49] border border-[#017E49]">
                                {caja.activo ? 'Sí' : 'No'}
                              </Badge>
                            </div>
                          </div>

                          {/* VALIDACIÓN INFO */}
                          <div className="flex items-center gap-2 text-xs p-2 bg-[#FFF4E6] rounded border border-[#FF9F55]">
                            {caja.activo ? (
                              <>
                                <span className="text-[#FF9F55] font-semibold">✓</span>
                                <span className="text-[#6B6B6B]">Caja activa</span>
                              </>
                            ) : (
                              <>
                                <span className="text-[#6B6B6B]">•</span>
                                <span className="text-[#6B6B6B]">
                                  Caja inactiva
                                </span>
                              </>
                            )}
                          </div>

                          {/* ACCIONES */}
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleEditCaja(caja)}
                              className="flex items-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors bg-[#E6F3EE] text-[#017E49] hover:bg-[#D9E9E3]"
                            >
                              <Edit className="w-3 h-3" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleToggleCajaActivo(caja.id, caja)}
                              className={`flex items-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors ${caja.activo
                                ? 'bg-[#FFF4E6] text-[#FF9F55] hover:bg-[#FFE6CC]'
                                : 'bg-[#E6F3EE] text-[#017E49] hover:bg-[#D9E9E3]'
                                }`}
                            >
                              {caja.activo ? (
                                <>
                                  <X className="w-3 h-3" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3" />
                                  Activar
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-12 text-center">
                    <Package className="w-12 h-12 text-[#6B6B6B] mx-auto mb-4" />
                    <p className="text-[#6B6B6B]">No hay cajas creadas</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
      </Tabs>

      {/* ==================== MODALES ==================== */}

      {/* Modal Crear Ciclo */}
      <Dialog open={showCreateCicloModal} onOpenChange={setShowCreateCicloModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Ciclo</DialogTitle>
            <DialogDescription>Define un nuevo ciclo de beneficios</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 pb-24">
            <div>
              <Label htmlFor="ciclo-nombre">Nombre del Ciclo *</Label>
              <Input
                id="ciclo-nombre"
                placeholder="ej: Navidad 2025, Verano 2026"
                value={cicloForm.nombre}
                onChange={(e) => setCicloForm({ ...cicloForm, nombre: e.target.value })}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ciclo-inicio">Fecha Inicio *</Label>
                <Input
                  id="ciclo-inicio"
                  type="date"
                  value={cicloForm.fecha_inicio}
                  onChange={(e) => setCicloForm({ ...cicloForm, fecha_inicio: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="ciclo-fin">Fecha Fin *</Label>
                <Input
                  id="ciclo-fin"
                  type="date"
                  value={cicloForm.fecha_fin}
                  onChange={(e) => setCicloForm({ ...cicloForm, fecha_fin: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ciclo-desc">Descripción</Label>
              <Textarea
                id="ciclo-desc"
                placeholder="Notas sobre este ciclo..."
                value={cicloForm.descripcion}
                onChange={(e) => setCicloForm({ ...cicloForm, descripcion: e.target.value })}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowCreateCicloModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleCreateCiclo} className="flex-1 bg-[#E12019] text-white hover:bg-[#B51810]">
              Crear Ciclo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Crear Beneficio */}
      <Dialog open={showCreateBeneficioModal} onOpenChange={setShowCreateBeneficioModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Tipo de Beneficio</DialogTitle>
            <DialogDescription>Define un beneficio que podrá usar en los ciclos</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="ben-nombre">Nombre del Beneficio *</Label>
              <Input
                id="ben-nombre"
                placeholder="ej: Caja de Navidad, Paseo Familiar"
                value={beneficioForm.nombre}
                onChange={(e) => setBeneficioForm({ ...beneficioForm, nombre: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="ben-desc">Descripción</Label>
              <Textarea
                id="ben-desc"
                placeholder="Describe este beneficio..."
                value={beneficioForm.descripcion}
                onChange={(e) => setBeneficioForm({ ...beneficioForm, descripcion: e.target.value })}
                className="mt-2"
                rows={3}
              />
            </div>
            <div>
              <Label>Aplica a tipos de contrato *</Label>
              <div className="space-y-2 mt-2">
                {['todos', 'planta', 'contrata', 'honorarios'].map((tipo) => (
                  <div key={tipo} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`tipo-${tipo}`}
                      checked={beneficioForm.tipos_contrato.includes(tipo)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBeneficioForm({
                            ...beneficioForm,
                            tipos_contrato: [...beneficioForm.tipos_contrato, tipo],
                          });
                        } else {
                          setBeneficioForm({
                            ...beneficioForm,
                            tipos_contrato: beneficioForm.tipos_contrato.filter((t) => t !== tipo),
                          });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <label htmlFor={`tipo-${tipo}`} className="text-sm cursor-pointer">
                      {tipo === 'todos' ? 'Todos los contratos' : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Label htmlFor="ben-guardia" className="text-sm font-medium">Requiere Validación del Guardia</Label>
              <Switch
                id="ben-guardia"
                checked={beneficioForm.requiere_validacion_guardia}
                onCheckedChange={(checked) => setBeneficioForm({ ...beneficioForm, requiere_validacion_guardia: checked })}
              />
            </div>
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              {beneficioForm.requiere_validacion_guardia
                ? '✓ Doble autenticación: El guardia verificará cada entrega con QR'
                : '• Entrega normal: Sin validación del guardia'}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ben-activo">Activo</Label>
              <Switch
                id="ben-activo"
                checked={beneficioForm.activo}
                onCheckedChange={(checked) => setBeneficioForm({ ...beneficioForm, activo: checked })}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowCreateBeneficioModal(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleCreateBeneficio} className="flex-1 bg-[#017E49] text-white hover:bg-[#016339]">
              Crear Beneficio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Crear/Editar Caja */}
      <Dialog open={showCreateCajaModal || showEditCajaModal} onOpenChange={(open) => {
        setShowCreateCajaModal(open);
        setShowEditCajaModal(open);
        if (!open) {
          setCajaForm({ beneficio: 0, nombre: '', descripcion: '', codigo_tipo: '', activo: true });
          setSelectedCaja(null);
          setSelectedBeneficio(null);
        }
      }}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#FF8C00]" />
              {showEditCajaModal ? 'Editar Caja' : 'Agregar Nueva Caja'}
            </DialogTitle>
            <DialogDescription>
              {showEditCajaModal ? 'Modifica los detalles de la caja' : 'Crea una variante de caja para un beneficio (ej: Premium, Estándar, Básica)'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* NOMBRE */}
            <div>
              <Label htmlFor="caja-nombre" className="text-[#333333] font-semibold">
                Nombre de la Caja *
              </Label>
              <Input
                id="caja-nombre"
                placeholder="ej: Premium, Estándar, VIP, Básica"
                value={cajaForm.nombre}
                onChange={(e) => setCajaForm({ ...cajaForm, nombre: e.target.value })}
                className="mt-2 h-10 border-2 border-[#E0E0E0] rounded-lg"
              />
              <p className="text-xs text-[#6B6B6B] mt-1">Nombre descriptivo de la variante de caja</p>
            </div>

            {/* BENEFICIO - OPCIONAL */}
            <div>
              <Label htmlFor="caja-beneficio" className="text-[#333333] font-semibold">Beneficio (Opcional)</Label>
              <Select
                value={cajaForm.beneficio && cajaForm.beneficio !== 0 ? cajaForm.beneficio.toString() : '0'}
                onValueChange={(value) => {
                  if (value === '0') {
                    setSelectedBeneficio(null);
                    setCajaForm({ ...cajaForm, beneficio: 0 });
                  } else {
                    const ben = beneficios.find(b => b.id.toString() === value);
                    setSelectedBeneficio(ben || null);
                    setCajaForm({ ...cajaForm, beneficio: ben ? ben.id : 0 });
                  }
                }}
              >
                <SelectTrigger className="mt-2 h-10 border-2 border-[#E0E0E0] rounded-lg">
                  <SelectValue placeholder="Sin beneficio asignado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sin beneficio</SelectItem>
                  {beneficios.map((ben) => (
                    <SelectItem key={ben.id} value={ben.id.toString()}>
                      {ben.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[#6B6B6B] mt-1">Opcionalmente asigna esta caja a un beneficio específico</p>
            </div>

            {/* BENEFICIO ASIGNADO - INFO */}
            {selectedBeneficio && (
              <div className="bg-[#FFF4E6] border-2 border-[#FF9F55] rounded-lg p-3">
                <p className="text-xs text-[#6B6B6B] font-semibold mb-1">
                  Asignada a: <span className="text-[#FF9F55] font-bold">{selectedBeneficio.nombre}</span>
                </p>
              </div>
            )}

            {/* CÓDIGO ÚNICO */}
            <div>
              <Label htmlFor="caja-codigo" className="text-[#333333] font-semibold">
                Código Único *
              </Label>
              <Input
                id="caja-codigo"
                placeholder="ej: CAJ-NAV-PREM, CAJ-NAV-STD, CAJ-PASEO-VIP"
                value={cajaForm.codigo_tipo}
                onChange={(e) => setCajaForm({ ...cajaForm, codigo_tipo: e.target.value.toUpperCase() })}
                className="mt-2 h-10 border-2 border-[#E0E0E0] rounded-lg font-mono text-sm"
              />
              <p className="text-xs text-[#6B6B6B] mt-1">
                Código único y automatizado. Formato: CAJ-[TIPO]-[VARIANTE]
              </p>
            </div>

            {/* DESCRIPCIÓN */}
            <div>
              <Label htmlFor="caja-desc" className="text-[#333333] font-semibold">
                Descripción (opcional)
              </Label>
              <Textarea
                id="caja-desc"
                placeholder="ej: Caja premium con productos de alta calidad, incluye..."
                value={cajaForm.descripcion}
                onChange={(e) => setCajaForm({ ...cajaForm, descripcion: e.target.value })}
                className="mt-2 border-2 border-[#E0E0E0] rounded-lg text-sm"
                rows={3}
              />
            </div>

            {/* ESTADO ACTIVO/INACTIVO */}
            <div className="bg-[#F0F0F0] rounded-lg p-4 border-2 border-[#E0E0E0]">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[#333333] font-semibold">Estado de la Caja</Label>
                <Switch
                  id="caja-activa"
                  checked={cajaForm.activo !== false}
                  onCheckedChange={(checked) => setCajaForm({ ...cajaForm, activo: checked })}
                />
              </div>
              <div className="text-xs bg-white p-2 rounded border border-[#E0E0E0]">
                {cajaForm.activo !== false ? (
                  <p className="text-[#017E49]">
                    ✓ <span className="font-semibold">Caja Activa</span> - El guardia deberá validar cada entrega con QR
                  </p>
                ) : (
                  <p className="text-[#999999]">
                    • <span className="font-semibold">Caja Inactiva</span> - Esta caja no estará disponible
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-[#E0E0E0] z-50 pt-4 pb-4 px-4 shadow-lg">
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                onClick={showEditCajaModal ? handleUpdateCaja : handleCreateCaja}
                className="w-full h-14 bg-gradient-to-r from-[#FF7300] to-[#FF9500] hover:from-[#E05F00] hover:to-[#E07700] text-white border-2 border-[#E05F00] font-bold shadow-lg text-lg flex items-center justify-center rounded-xl transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
              >
                <Plus className="w-5 h-5 mr-2" />
                {showEditCajaModal ? 'GUARDAR CAMBIOS' : 'CREAR CAJA'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateCajaModal(false);
                  setCajaForm({ beneficio: 0, nombre: '', descripcion: '', codigo_tipo: '', activo: true });
                  setSelectedBeneficio(null);
                }}
                className="w-full h-11 text-[#666666] border-[#D0D0D0] hover:bg-gray-50"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Beneficio */}
      <Dialog open={showEditBeneficioModal} onOpenChange={setShowEditBeneficioModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#FF9F55]" />
              {selectedBeneficio?.nombre}
            </DialogTitle>
            <DialogDescription>
              Edita los detalles del beneficio y gestiona sus cajas
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="detalles" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detalles">Detalles</TabsTrigger>
              <TabsTrigger value="cajas">Cajas ({cajasDelBeneficio.length})</TabsTrigger>
            </TabsList>

            {/* TAB DETALLES */}
            <TabsContent value="detalles" className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-ben-nombre" className="font-semibold">Nombre del Beneficio *</Label>
                <Input
                  id="edit-ben-nombre"
                  value={beneficioForm.nombre}
                  onChange={(e) => setBeneficioForm({ ...beneficioForm, nombre: e.target.value })}
                  className="mt-2 h-10 border-2 border-[#E0E0E0] rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="edit-ben-desc" className="font-semibold">Descripción</Label>
                <Textarea
                  id="edit-ben-desc"
                  value={beneficioForm.descripcion}
                  onChange={(e) => setBeneficioForm({ ...beneficioForm, descripcion: e.target.value })}
                  className="mt-2 border-2 border-[#E0E0E0] rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <Label className="font-semibold mb-3 block">Aplica a tipos de contrato *</Label>
                <div className="space-y-2 bg-[#F8F8F8] p-3 rounded-lg border border-[#E0E0E0]">
                  {['todos', 'planta', 'contrata', 'honorarios'].map((tipo) => (
                    <div key={tipo} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`edit-tipo-${tipo}`}
                        checked={beneficioForm.tipos_contrato.includes(tipo)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBeneficioForm({
                              ...beneficioForm,
                              tipos_contrato: [...beneficioForm.tipos_contrato, tipo],
                            });
                          } else {
                            setBeneficioForm({
                              ...beneficioForm,
                              tipos_contrato: beneficioForm.tipos_contrato.filter((t) => t !== tipo),
                            });
                          }
                        }}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor={`edit-tipo-${tipo}`} className="text-sm cursor-pointer flex-1">
                        {tipo === 'todos' ? 'Todos los contratos' : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#E6F3EE] rounded-lg border-2 border-[#017E49]">
                <Label htmlFor="edit-ben-guardia" className="text-sm font-medium text-[#333333]">
                  Requiere Validación del Guardia
                </Label>
                <Switch
                  id="edit-ben-guardia"
                  checked={beneficioForm.requiere_validacion_guardia}
                  onCheckedChange={(checked) => setBeneficioForm({ ...beneficioForm, requiere_validacion_guardia: checked })}
                />
              </div>

              <div className="text-xs text-[#6B6B6B] bg-[#FFF4E6] p-3 rounded border-l-4 border-[#FF9F55]">
                {beneficioForm.requiere_validacion_guardia
                  ? '✓ Doble autenticación: El guardia verificará cada entrega con QR'
                  : '• Entrega normal: Sin validación del guardia'}
              </div>

              <div className="flex items-center justify-between p-3 bg-[#F0F0F0] rounded-lg border border-[#E0E0E0]">
                <Label htmlFor="edit-ben-activo" className="font-semibold text-[#333333]">Activo</Label>
                <Switch
                  id="edit-ben-activo"
                  checked={beneficioForm.activo}
                  onCheckedChange={(checked) => setBeneficioForm({ ...beneficioForm, activo: checked })}
                />
              </div>
            </TabsContent>

            {/* TAB CAJAS */}
            <TabsContent value="cajas" className="space-y-4 py-4">
              <p className="text-sm text-[#6B6B6B] mb-4">
                Selecciona las cajas que pertenecen a este beneficio
              </p>

              {soloCajas.length === 0 ? (
                <div className="text-center py-8 bg-[#F8F8F8] rounded-lg border-2 border-dashed border-[#E0E0E0]">
                  <Package className="w-12 h-12 mx-auto mb-3 text-[#E0E0E0]" />
                  <p className="text-[#6B6B6B] font-semibold">No hay cajas disponibles</p>
                  <p className="text-xs text-[#6B6B6B] mt-1">Primero crea cajas en el sistema</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {soloCajas.map((caja) => {
                    const estaAsignada = cajasDelBeneficio.some(c => c.id === caja.id);
                    return (
                      <label
                        key={caja.id}
                        className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${estaAsignada
                          ? 'border-[#FF8C00] bg-[#FFF4E6]'
                          : 'border-[#E0E0E0] bg-white hover:border-[#CCCCCC]'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={estaAsignada}
                          onChange={() => handleToggleCajaAsignacion(caja.id)}
                          className="w-5 h-5 rounded border-2 border-[#E0E0E0] text-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[#333333]">{caja.nombre}</h4>
                            <span className="text-xs text-[#6B6B6B] font-mono">{caja.codigo_tipo}</span>
                            {caja.beneficio_nombre && caja.beneficio !== selectedBeneficio?.id && (
                              <Badge className="bg-[#999999] text-white text-xs">
                                {caja.beneficio_nombre}
                              </Badge>
                            )}
                            <Badge className={caja.activo ? 'bg-[#017E49] text-white text-xs' : 'bg-[#999999] text-white text-xs'}>
                              {caja.activo ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </div>
                          {caja.descripcion && (
                            <p className="text-xs text-[#6B6B6B] mt-1">{caja.descripcion}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-4 border-t border-[#E0E0E0]">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditBeneficioModal(false);
                setSelectedBeneficio(null);
                setCajasDelBeneficio([]);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateBeneficio} className="flex-1 bg-[#E12019] text-white hover:bg-[#B51810]">
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Agregar Beneficio a Ciclo */}
      <Dialog open={showAgregarBeneficioModal} onOpenChange={setShowAgregarBeneficioModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#FF9F55]" />
              Gestionar Beneficios del Ciclo
            </DialogTitle>
            <DialogDescription>
              Selecciona los beneficios para <span className="font-semibold text-[#333333]">{selectedCiclo?.nombre}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <p className="text-sm text-[#6B6B6B] font-semibold">
              Marca los beneficios que deseas agregar/eliminar del ciclo:
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {beneficiosConCajas.filter(ben => ben.activo).map((beneficio: any) => (
                <div
                  key={beneficio.id}
                  className="border-2 border-[#E0E0E0] rounded-lg p-4 hover:border-[#FF9F55] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={`ben-${beneficio.id}`}
                      checked={selectedBeneficiosParaCiclo.includes(beneficio.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBeneficiosParaCiclo([...selectedBeneficiosParaCiclo, beneficio.id]);
                        } else {
                          setSelectedBeneficiosParaCiclo(selectedBeneficiosParaCiclo.filter(id => id !== beneficio.id));
                        }
                      }}
                      className="w-5 h-5 mt-1 cursor-pointer"
                    />
                    <label htmlFor={`ben-${beneficio.id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-bold text-[#333333] text-base">{beneficio.nombre}</p>
                        <Badge className={beneficio.activo ? 'bg-[#017E49] text-white' : 'bg-[#999999] text-white'}>
                          {beneficio.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>

                      {/* DESCRIPCIÓN */}
                      {beneficio.descripcion && (
                        <p className="text-sm text-[#6B6B6B] mb-2 p-2 bg-[#F8F8F8] rounded border-l-4 border-[#FF9F55]">
                          {beneficio.descripcion}
                        </p>
                      )}

                      {/* INFORMACIÓN ADICIONAL */}
                      <div className="space-y-2 mt-3 p-3 bg-[#F8F8F8] rounded-lg border border-[#E0E0E0]">
                        {/* Tipos de contrato */}
                        <div className="flex items-start gap-2 text-xs">
                          <span className="font-semibold text-[#333333] min-w-[100px]">Aplica a:</span>
                          <span className="text-[#6B6B6B] flex-1">
                            {beneficio.tipos_contrato && beneficio.tipos_contrato.length > 0
                              ? beneficio.tipos_contrato.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')
                              : 'No especificado'}
                          </span>
                        </div>

                        {/* Validación de guardia */}
                        <div className="flex items-start gap-2 text-xs">
                          <span className="font-semibold text-[#333333] min-w-[100px]">Verificación:</span>
                          {beneficio.requiere_validacion_guardia ? (
                            <span className="text-[#017E49] font-medium bg-[#E6F3EE] px-2 py-1 rounded flex items-center gap-1">
                              🔐 Doble verificación guardia
                            </span>
                          ) : (
                            <span className="text-[#999999]">Sin verificación</span>
                          )}
                        </div>

                        {/* Cantidad de cajas */}
                        <div className="flex items-start gap-2 text-xs">
                          <span className="font-semibold text-[#333333] min-w-[100px]">Cajas:</span>
                          {beneficio.cajas && beneficio.cajas.length > 0 ? (
                            <span className="text-[#FF9F55] font-bold">
                              {beneficio.cajas.length} ({beneficio.cajas.filter((c: any) => c.activo).length} activas)
                            </span>
                          ) : (
                            <span className="text-[#999999]">Sin cajas</span>
                          )}
                        </div>

                        {/* Estado */}
                        <div className="flex items-start gap-2 text-xs">
                          <span className="font-semibold text-[#333333] min-w-[100px]">Estado:</span>
                          <Badge className={beneficio.activo ? 'bg-[#E6F3EE] text-[#017E49] border border-[#017E49]' : 'bg-[#F0F0F0] text-[#999999]'}>
                            {beneficio.activo ? '✓ Activo' : '✗ Inactivo'}
                          </Badge>
                        </div>
                      </div>

                      {/* CAJAS DISPONIBLES */}
                      {beneficio.cajas && beneficio.cajas.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#E0E0E0]">
                          <p className="text-xs font-semibold text-[#333333] mb-3">Cajas Asignadas ({beneficio.cajas.length} total, {beneficio.cajas.filter((c: any) => c.activo).length} activas):</p>
                          <div className="space-y-2">
                            {beneficio.cajas.map((caja: any) => (
                              <div
                                key={caja.id}
                                className={`text-xs px-3 py-2 rounded border-2 ${caja.activo
                                  ? 'bg-[#E6F3EE] text-[#017E49] border-[#017E49]'
                                  : 'bg-[#F0F0F0] text-[#999999] border-[#E0E0E0]'
                                  }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold">{caja.nombre}</span>
                                    <span className="font-mono text-xs opacity-75">({caja.codigo_tipo})</span>
                                  </div>
                                  <Badge className={caja.activo ? 'bg-[#017E49] text-white text-xs' : 'bg-[#999999] text-white text-xs'}>
                                    {caja.activo ? 'Activa' : 'Inactiva'}
                                  </Badge>
                                </div>
                                {caja.descripcion && (
                                  <p className="text-xs opacity-75 mb-1">{caja.descripcion}</p>
                                )}
                                {beneficio.requiere_validacion_guardia && (
                                  <div className="flex items-center gap-1 mt-1 p-1 bg-opacity-30 rounded">
                                    <span className="text-[#FF9F55] font-bold">🔐</span>
                                    <span className="text-xs font-semibold">Requiere verificación doble de guardia</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {beneficios.filter(ben => ben.activo).length === 0 && (
              <div className="text-center py-8 bg-[#F8F8F8] rounded-lg border-2 border-dashed border-[#E0E0E0]">
                <Package className="w-12 h-12 mx-auto mb-2 text-[#E0E0E0]" />
                <p className="text-[#6B6B6B] font-semibold">No hay beneficios activos disponibles</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#E0E0E0]">
            <Button
              variant="outline"
              onClick={() => {
                setShowAgregarBeneficioModal(false);
                setSelectedBeneficiosParaCiclo([]);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAgregarBeneficioACiclo}
              className="flex-1 bg-[#017E49] text-white hover:bg-[#016339] font-semibold"
            >
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Cajas del Beneficio - CON TABS */}
      <Dialog open={showViewCajasModal} onOpenChange={setShowViewCajasModal}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#FF8C00]" />
              Gestión de Cajas
            </DialogTitle>
            <DialogDescription>
              Visualiza y gestiona las cajas de beneficio disponibles
            </DialogDescription>
          </DialogHeader>

          <Tabs value={cajasTabActual} onValueChange={(value: any) => setCajasTabActual(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#F0F0F0] p-1 rounded-lg">
              <TabsTrigger value="beneficios" className="data-[state=active]:bg-white data-[state=active]:text-[#FF8C00]">
                <Package className="w-4 h-4 mr-2" />
                Beneficios con Cajas
              </TabsTrigger>
              <TabsTrigger value="solo-cajas" className="data-[state=active]:bg-white data-[state=active]:text-[#FF8C00]">
                <Boxes className="w-4 h-4 mr-2" />
                Solo Cajas
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: BENEFICIOS CON CAJAS */}
            <TabsContent value="beneficios" className="space-y-4 py-4">
              {beneficiosConCajas.length === 0 ? (
                <div className="text-center py-8 bg-[#F8F8F8] rounded-lg border-2 border-dashed border-[#E0E0E0]">
                  <Package className="w-12 h-12 mx-auto mb-3 text-[#E0E0E0]" />
                  <p className="text-[#6B6B6B] font-semibold">No hay beneficios con cajas</p>
                  <p className="text-xs text-[#6B6B6B] mt-1">Define cajas para un beneficio primero</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {beneficiosConCajas.map((beneficio: any) => (
                    <div key={beneficio.id} className="border-2 border-[#E0E0E0] rounded-lg p-4 hover:border-[#FF8C00] transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-bold text-[#333333] text-base">{beneficio.nombre}</h4>
                        <Badge className={beneficio.activo ? 'bg-[#017E49] text-white' : 'bg-[#999999] text-white'}>
                          {beneficio.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>

                      {beneficio.descripcion && (
                        <p className="text-sm text-[#6B6B6B] mb-3">{beneficio.descripcion}</p>
                      )}

                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-[#6B6B6B] uppercase">Cajas disponibles:</p>
                        {beneficio.cajas.length === 0 ? (
                          <p className="text-xs text-[#999999] italic">Sin cajas definidas</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {beneficio.cajas.map((caja: any) => (
                              <div key={caja.id} className="bg-[#F8F8F8] p-2 rounded border border-[#E0E0E0]">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-semibold text-xs text-[#333333]">{caja.nombre}</p>
                                    <p className="text-xs text-[#6B6B6B]">{caja.codigo_tipo}</p>
                                  </div>
                                  <Badge className={caja.activo ? 'bg-[#E6F3EE] text-[#017E49]' : 'bg-[#FFEBEB] text-[#E12019]'}>
                                    {caja.activo ? '✓' : '✕'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: SOLO CAJAS */}
            <TabsContent value="solo-cajas" className="space-y-4 py-4">
              {soloCajas.length === 0 ? (
                <div className="text-center py-8 bg-[#F8F8F8] rounded-lg border-2 border-dashed border-[#E0E0E0]">
                  <Boxes className="w-12 h-12 mx-auto mb-3 text-[#E0E0E0]" />
                  <p className="text-[#6B6B6B] font-semibold">No hay cajas definidas</p>
                  <p className="text-xs text-[#6B6B6B] mt-1">Crea cajas para los beneficios primero</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {soloCajas.map((caja: any) => (
                    <div key={caja.id} className="border-2 border-[#E0E0E0] rounded-lg p-4 hover:border-[#FF8C00] transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-[#333333] text-base">{caja.nombre}</h4>
                            <Badge className={caja.activo ? 'bg-[#017E49] text-white' : 'bg-[#999999] text-white'}>
                              {caja.activo ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#6B6B6B] mt-1">
                            <span className="font-semibold">Beneficio:</span> {caja.beneficio_nombre}
                          </p>
                          <p className="text-xs text-[#6B6B6B] mt-1">
                            <span className="font-semibold">Código:</span> {caja.codigo_tipo}
                          </p>
                        </div>
                      </div>

                      {caja.descripcion && (
                        <p className="text-sm text-[#6B6B6B] mb-3 p-2 bg-[#F8F8F8] rounded border-l-4 border-[#FF8C00]">
                          {caja.descripcion}
                        </p>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleToggleCajaActivo(caja.id, caja)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${caja.activo
                            ? 'bg-[#FFF4E6] text-[#FF8C00] hover:bg-[#FFE6CC]'
                            : 'bg-[#E6F3EE] text-[#017E49] hover:bg-[#D9E9E3]'
                            }`}
                        >
                          {caja.activo ? (
                            <>
                              <X className="w-3 h-3" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" />
                              Activar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-4 border-t border-[#E0E0E0]">
            <Button
              onClick={() => {
                setShowViewCajasModal(false);
                setCajasDelBeneficio([]);
              }}
              variant="outline"
              className="flex-1"
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                // Preparar formulario para nueva caja
                setCajaForm({ beneficio: selectedBeneficio?.id || 0, nombre: '', descripcion: '', codigo_tipo: '', activo: true });
                setShowCreateCajaModal(true);
                setShowViewCajasModal(false);
              }}
              className="flex-1 bg-[#FF8C00] text-white hover:bg-[#E67E00]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Caja
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}