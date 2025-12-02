import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, History, Eye, Download, Calendar, Package, QrCode, AlertCircle, CheckCircle, Clock, XCircle, User, Briefcase, MapPin, Building } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { trabajadorService } from '../services/trabajador.service';

export function TrabajadoresModule() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterContract, setFilterContract] = useState('all');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const loadWorkers = async () => {
      try {
        setLoading(true);
        const workersList = await trabajadorService.getAll();
        setWorkers(workersList || []);
      } catch (error) {
        console.error('Error loading workers:', error);
        setWorkers([]);
      } finally {
        setLoading(false);
      }
    };
    loadWorkers();
  }, []);

  const getStatusBadge = (status: string) => {
    const styles = {
      'Activo': 'bg-[#017E49] text-white',
      'Pendiente': 'bg-[#FF9F55] text-white',
      'Bloqueado': 'bg-[#E12019] text-white',
      'Inactivo': 'bg-[#6B6B6B] text-white',
    };
    return styles[status as keyof typeof styles] || 'bg-[#6B6B6B] text-white';
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'delivery':
        return <Package className="w-4 h-4" />;
      case 'qr':
        return <QrCode className="w-4 h-4" />;
      case 'cycle':
        return <Calendar className="w-4 h-4" />;
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'payroll':
        return <User className="w-4 h-4" />;
      case 'benefit':
        return <CheckCircle className="w-4 h-4" />;
      case 'incident':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (view === 'detail' && selectedWorker) {
    return (
      <div className="space-y-6">
        {/* Header Detail */}
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <button
                onClick={() => setView('list')}
                className="text-[#E12019] mb-2 inline-flex items-center gap-2 hover:underline"
              >
                ← Volver a listado
              </button>
              <h2 className="text-[#333333] mb-2">{selectedWorker.name}</h2>
              <p className="text-[#6B6B6B]">RUT: {selectedWorker.rut}</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowEditModal(true)}
                className="bg-[#017E49] text-white hover:bg-[#016339] h-11 px-6 rounded-xl"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                className="border-2 border-[#E0E0E0] h-11 px-6 rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Worker Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#F8F8F8] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-[#6B6B6B]" />
                <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Contrato</p>
              </div>
              <p className="text-[#333333]">{selectedWorker.contract}</p>
            </div>
            <div className="bg-[#F8F8F8] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-[#6B6B6B]" />
                <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Sección</p>
              </div>
              <p className="text-[#333333]">{selectedWorker.section}</p>
            </div>
            <div className="bg-[#F8F8F8] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-[#6B6B6B]" />
                <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Sucursal</p>
              </div>
              <p className="text-[#333333]">{selectedWorker.branch}</p>
            </div>
            <div className="bg-[#F8F8F8] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-[#6B6B6B]" />
                <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Estado</p>
              </div>
              <Badge className={getStatusBadge(selectedWorker.benefitStatus)}>
                {selectedWorker.benefitStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Benefit Summary */}
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
          <h3 className="text-[#333333] mb-4">Resumen de Beneficio</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-[#6B6B6B] mb-2" style={{ fontSize: '14px' }}>Tipo de Beneficio</p>
              <p className="text-[#333333]">{selectedWorker.benefit}</p>
            </div>
            <div>
              <p className="text-[#6B6B6B] mb-2" style={{ fontSize: '14px' }}>Último Retiro</p>
              <p className="text-[#333333]">{selectedWorker.lastDelivery || 'Sin retiros'}</p>
            </div>
            <div>
              <p className="text-[#6B6B6B] mb-2" style={{ fontSize: '14px' }}>Próximo Elegible</p>
              <p className="text-[#333333]">{selectedWorker.nextEligible || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
          <h3 className="text-[#333333] mb-6">Historial Completo (Timeline)</h3>
          <div className="space-y-4">
            {mockTimeline.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#017E49] text-white flex items-center justify-center">
                    {getTimelineIcon(event.type)}
                  </div>
                  {index < mockTimeline.length - 1 && (
                    <div className="w-0.5 h-full bg-[#E0E0E0] mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>
                      {event.title}
                    </h4>
                    <span className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                      {event.date}
                    </span>
                  </div>
                  <p className="text-[#6B6B6B] mb-2" style={{ fontSize: '14px' }}>
                    {event.description}
                  </p>
                  {event.guard && (
                    <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>
                      Guardia: {event.guard}
                    </p>
                  )}
                  {event.admin && (
                    <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>
                      Admin: {event.admin}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-[#333333] mb-2">Gestión de Trabajadores</h2>
            <p className="text-[#6B6B6B]">
              Administra trabajadores, beneficios asignados y consulta historial completo
            </p>
          </div>
          <Button
            onClick={() => setShowRegisterModal(true)}
            className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Trabajador
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B6B6B] w-5 h-5" />
              <Input
                placeholder="Buscar por RUT, nombre o sección..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-2 border-[#E0E0E0] rounded-xl"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="Activo">Activo</SelectItem>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="Bloqueado">Bloqueado</SelectItem>
              <SelectItem value="Inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterContract} onValueChange={setFilterContract}>
            <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl">
              <SelectValue placeholder="Tipo de contrato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los contratos</SelectItem>
              <SelectItem value="Indefinido">Indefinido</SelectItem>
              <SelectItem value="Plazo fijo">Plazo fijo</SelectItem>
              <SelectItem value="Part time">Part time</SelectItem>
              <SelectItem value="Honorarios">Honorarios</SelectItem>
              <SelectItem value="Practicante">Practicante</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8F8F8] border-b-2 border-[#E0E0E0]">
                <th className="text-left p-4 text-[#333333]">RUT</th>
                <th className="text-left p-4 text-[#333333]">Nombre</th>
                <th className="text-left p-4 text-[#333333]">Sección</th>
                <th className="text-left p-4 text-[#333333]">Contrato</th>
                <th className="text-left p-4 text-[#333333]">Sucursal</th>
                <th className="text-left p-4 text-[#333333]">Beneficio</th>
                <th className="text-left p-4 text-[#333333]">Estado</th>
                <th className="text-left p-4 text-[#333333]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-[#6B6B6B]">Cargando trabajadores...</td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-[#6B6B6B]">No hay trabajadores registrados</td>
                </tr>
              ) : workers.map((worker) => (
                <tr key={worker.id} className="border-b border-[#E0E0E0] hover:bg-[#F8F8F8]">
                  <td className="p-4 text-[#333333]">{worker.rut}</td>
                  <td className="p-4 text-[#333333]">{worker.name}</td>
                  <td className="p-4 text-[#6B6B6B]">{worker.section}</td>
                  <td className="p-4 text-[#6B6B6B]">{worker.contract}</td>
                  <td className="p-4 text-[#6B6B6B]">{worker.branch}</td>
                  <td className="p-4 text-[#6B6B6B]">{worker.benefit}</td>
                  <td className="p-4">
                    <Badge className={getStatusBadge(worker.benefitStatus)}>
                      {worker.benefitStatus}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedWorker(worker);
                          setView('detail');
                        }}
                        className="h-9 px-3 rounded-lg border-2 border-[#E0E0E0]"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedWorker(worker);
                          setShowEditModal(true);
                        }}
                        className="h-9 px-3 rounded-lg border-2 border-[#E0E0E0]"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Worker Modal */}
      <Dialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#333333]">Registrar Nuevo Trabajador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rut" className="text-[#333333]">RUT</Label>
                <Input
                  id="rut"
                  placeholder="12.345.678-9"
                  className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2"
                />
              </div>
              <div>
                <Label htmlFor="name" className="text-[#333333]">Nombre Completo</Label>
                <Input
                  id="name"
                  placeholder="María González Pérez"
                  className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="section" className="text-[#333333]">Área/Sección</Label>
                <Select>
                  <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                    <SelectValue placeholder="Seleccionar sección" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produccion">Producción</SelectItem>
                    <SelectItem value="logistica">Logística</SelectItem>
                    <SelectItem value="administracion">Administración</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="contract" className="text-[#333333]">Tipo de Contrato</Label>
                <Select>
                  <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                    <SelectValue placeholder="Seleccionar contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indefinido">Indefinido</SelectItem>
                    <SelectItem value="plazo-fijo">Plazo fijo</SelectItem>
                    <SelectItem value="part-time">Part time</SelectItem>
                    <SelectItem value="honorarios">Honorarios</SelectItem>
                    <SelectItem value="practicante">Practicante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="branch" className="text-[#333333]">Sucursal</Label>
                <Select>
                  <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                    <SelectValue placeholder="Seleccionar sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="santiago">Planta Santiago</SelectItem>
                    <SelectItem value="rancagua">Planta Rancagua</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="benefit" className="text-[#333333]">Tipo de Beneficio</Label>
                <Select>
                  <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                    <SelectValue placeholder="Seleccionar beneficio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="estandar">Estándar</SelectItem>
                    <SelectItem value="sin-beneficio">Sin beneficio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRegisterModal(false)}
                className="h-11 px-6 rounded-xl border-2 border-[#E0E0E0]"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => setShowRegisterModal(false)}
                className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Worker Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#333333]">Editar Trabajador</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="history">Historial de Cambios</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-rut" className="text-[#333333]">RUT</Label>
                  <Input
                    id="edit-rut"
                    defaultValue={selectedWorker?.rut}
                    className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-name" className="text-[#333333]">Nombre Completo</Label>
                  <Input
                    id="edit-name"
                    defaultValue={selectedWorker?.name}
                    className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#333333]">Estado de Beneficio</Label>
                  <Select defaultValue={selectedWorker?.benefitStatus}>
                    <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                      <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#333333]">Tipo de Beneficio</Label>
                  <Select defaultValue={selectedWorker?.benefit}>
                    <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Premium">Premium</SelectItem>
                      <SelectItem value="Estándar">Estándar</SelectItem>
                      <SelectItem value="Sin beneficio">Sin beneficio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="h-11 px-6 rounded-xl border-2 border-[#E0E0E0]"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => setShowEditModal(false)}
                  className="bg-[#017E49] text-white hover:bg-[#016339] h-11 px-6 rounded-xl"
                >
                  Guardar Cambios
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="history">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <div className="border-2 border-[#E0E0E0] rounded-xl p-4">
                  <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '12px' }}>15-Ene-2025 10:30</p>
                  <p className="text-[#333333]">Estado actualizado: Activo → Bloqueado</p>
                  <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Por: Laura Méndez (RRHH)</p>
                </div>
                <div className="border-2 border-[#E0E0E0] rounded-xl p-4">
                  <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '12px' }}>10-Dic-2024 14:20</p>
                  <p className="text-[#333333]">Beneficio actualizado: Estándar → Premium</p>
                  <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Por: Carlos Ruiz (RRHH)</p>
                </div>
                <div className="border-2 border-[#E0E0E0] rounded-xl p-4">
                  <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '12px' }}>01-Oct-2024 09:15</p>
                  <p className="text-[#333333]">Sección actualizada: Administración → Producción</p>
                  <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Por: Ana Torres (RRHH)</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
