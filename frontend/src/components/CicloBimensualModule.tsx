import { useState, useEffect } from 'react';
import { Calendar, Clock, Settings, History, Unlock, AlertCircle, CheckCircle, XCircle, Package, User, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
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

  // Modales
  const [showCreateCicloModal, setShowCreateCicloModal] = useState(false);
  const [showCreateBeneficioModal, setShowCreateBeneficioModal] = useState(false);
  const [showCreateCajaModal, setShowCreateCajaModal] = useState(false);
  const [showEditBeneficioModal, setShowEditBeneficioModal] = useState(false);
  const [showAgregarBeneficioModal, setShowAgregarBeneficioModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // Datos de formularios
  const [cicloForm, setCicloForm] = useState({ nombre: '', fecha_inicio: '', fecha_fin: '', descripcion: '' });
  const [beneficioForm, setBeneficioForm] = useState({ nombre: '', descripcion: '', activo: true, tipos_contrato: [] as string[], requiere_validacion_guardia: false });
  const [cajaForm, setCajaForm] = useState({ beneficio: 0, nombre: '', descripcion: '', codigo_tipo: '' });
  const [selectedBeneficio, setSelectedBeneficio] = useState<TipoBeneficioDTO | null>(null);
  const [selectedCiclo, setSelectedCiclo] = useState<CicloDTO | null>(null);
  const [selectedBeneficiosParaCiclo, setSelectedBeneficiosParaCiclo] = useState<number[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);

  useEffect(() => {
    loadData();
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

  const openEditBeneficio = (beneficio: TipoBeneficioDTO) => {
    setSelectedBeneficio(beneficio);
    setBeneficioForm({
      nombre: beneficio.nombre,
      descripcion: beneficio.descripcion || '',
      activo: beneficio.activo,
      tipos_contrato: beneficio.tipos_contrato || [],
      requiere_validacion_guardia: beneficio.requiere_validacion_guardia || false,
    });
    setShowEditBeneficioModal(true);
  };

  // ==================== CRUD CAJAS ====================

  const handleCreateCaja = async () => {
    if (!cajaForm.beneficio || !cajaForm.nombre || !cajaForm.codigo_tipo) {
      toast.error('Completa todos los campos requeridos');
      return;
    }
    try {
      await cajasService.createCajaBeneficio({
        ...cajaForm,
        activo: true,
      });
      toast.success('Caja creada exitosamente');
      setShowCreateCajaModal(false);
      setCajaForm({ beneficio: 0, nombre: '', descripcion: '', codigo_tipo: '' });
      loadData();
    } catch (error) {
      toast.error('Error al crear caja');
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
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ciclos">
            <Calendar className="w-4 h-4 mr-2" />
            Ciclos
          </TabsTrigger>
          <TabsTrigger value="beneficios">
            <Package className="w-4 h-4 mr-2" />
            Beneficios
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
                      onClick={() => {
                        setSelectedCiclo(ciclo);
                        setSelectedBeneficiosParaCiclo(ciclo.beneficios_activos.map(b => b.id));
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
              {beneficios.map((beneficio) => (
                <div key={beneficio.id} className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Package className="w-8 h-8 text-[#E12019]" />
                      <div>
                        <h3 className="text-[#333333] font-semibold">{beneficio.nombre}</h3>
                        <Badge className={beneficio.activo ? 'bg-[#017E49]' : 'bg-[#6B6B6B]'}>
                          {beneficio.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-[#6B6B6B] text-sm mb-4 min-h-[40px]">
                    {beneficio.descripcion || 'Sin descripción'}
                  </p>

                  <Button
                    onClick={() => openEditBeneficio(beneficio)}
                    className="w-full bg-[#E12019] text-white hover:bg-[#B51810]"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                </div>
              ))}
            </div>
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
          <div className="space-y-4 py-4">
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

      {/* Modal Crear Caja */}
      <Dialog open={showCreateCajaModal} onOpenChange={setShowCreateCajaModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nueva Caja</DialogTitle>
            <DialogDescription>
              Define una variante de caja para un beneficio (ej: Premium, Estándar)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="caja-beneficio">Beneficio *</Label>
              <Select
                value={cajaForm.beneficio?.toString() || ''}
                onValueChange={(value) => setCajaForm({ ...cajaForm, beneficio: parseInt(value) })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecciona un beneficio" />
                </SelectTrigger>
                <SelectContent>
                  {beneficios.map((ben) => (
                    <SelectItem key={ben.id} value={ben.id.toString()}>
                      {ben.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="caja-nombre">Nombre de la Caja *</Label>
              <Input
                id="caja-nombre"
                placeholder="ej: Premium, Estándar, VIP"
                value={cajaForm.nombre}
                onChange={(e) => setCajaForm({ ...cajaForm, nombre: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="caja-codigo">Código Tipo *</Label>
              <Input
                id="caja-codigo"
                placeholder="ej: NAV-PREM, NAV-STD"
                value={cajaForm.codigo_tipo}
                onChange={(e) => setCajaForm({ ...cajaForm, codigo_tipo: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="caja-desc">Descripción</Label>
              <Textarea
                id="caja-desc"
                placeholder="Describe esta caja..."
                value={cajaForm.descripcion}
                onChange={(e) => setCajaForm({ ...cajaForm, descripcion: e.target.value })}
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateCajaModal(false);
                setCajaForm({ beneficio: 0, nombre: '', descripcion: '', codigo_tipo: '' });
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateCaja} className="flex-1 bg-[#FF8C00] text-white hover:bg-[#E67E00]">
              Crear Caja
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Beneficio */}
      <Dialog open={showEditBeneficioModal} onOpenChange={setShowEditBeneficioModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Tipo de Beneficio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-ben-nombre">Nombre del Beneficio *</Label>
              <Input
                id="edit-ben-nombre"
                value={beneficioForm.nombre}
                onChange={(e) => setBeneficioForm({ ...beneficioForm, nombre: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="edit-ben-desc">Descripción</Label>
              <Textarea
                id="edit-ben-desc"
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
                      className="w-4 h-4"
                    />
                    <label htmlFor={`edit-tipo-${tipo}`} className="text-sm cursor-pointer">
                      {tipo === 'todos' ? 'Todos los contratos' : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Label htmlFor="edit-ben-guardia" className="text-sm font-medium">Requiere Validación del Guardia</Label>
              <Switch
                id="edit-ben-guardia"
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
              <Label htmlFor="edit-ben-activo">Activo</Label>
              <Switch
                id="edit-ben-activo"
                checked={beneficioForm.activo}
                onCheckedChange={(checked) => setBeneficioForm({ ...beneficioForm, activo: checked })}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditBeneficioModal(false);
                setSelectedBeneficio(null);
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Gestionar Beneficios del Ciclo</DialogTitle>
            <DialogDescription>Selecciona los beneficios para {selectedCiclo?.nombre}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-[#6B6B6B]">Marca los beneficios que deseas agregar/eliminar del ciclo:</p>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {beneficios.filter(ben => ben.activo).map((beneficio) => (
                <div key={beneficio.id} className="flex items-start gap-3 p-3 border border-[#E0E0E0] rounded-lg hover:bg-[#F8F8F8]">
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
                    className="w-5 h-5 mt-0.5"
                  />
                  <label htmlFor={`ben-${beneficio.id}`} className="flex-1 cursor-pointer">
                    <p className="font-semibold text-[#333333]">{beneficio.nombre}</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">{beneficio.descripcion || 'Sin descripción'}</p>
                    <p className="text-xs text-[#017E49] mt-1">
                      Aplica a: {beneficio.tipos_contrato.join(', ') || 'No especificado'}
                    </p>
                  </label>
                </div>
              ))}
            </div>
            {beneficios.filter(ben => ben.activo).length === 0 && (
              <div className="text-center py-6 text-[#6B6B6B]">
                No hay beneficios activos disponibles
              </div>
            )}
          </div>
          <div className="flex gap-3">
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
            <Button onClick={handleAgregarBeneficioACiclo} className="flex-1 bg-[#017E49] text-white hover:bg-[#016339]">
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
