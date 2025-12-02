import { useState } from 'react';
import { QrCode, Package, Search, Plus, Eye, Download, CheckCircle, Clock, XCircle, AlertCircle, User, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function TrazabilidadModule() {
  description: 'Trabajador elegible para retiro',
    user: 'Sistema Tótem',
  },
];

export function TrazabilidadModule() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedQR, setSelectedQR] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const getStatusBadge = (status: string) => {
    const styles = {
      'Entregado': 'bg-[#017E49] text-white',
      'Agendado': 'bg-[#FF9F55] text-white',
      'Pendiente': 'bg-[#6B6B6B] text-white',
      'Vencido': 'bg-[#E12019] text-white',
      'Intento Duplicado': 'bg-[#E12019] text-white',
    };
    return styles[status as keyof typeof styles] || 'bg-[#6B6B6B] text-white';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Entregado':
        return <CheckCircle className="w-4 h-4" />;
      case 'Agendado':
        return <Calendar className="w-4 h-4" />;
      case 'Pendiente':
        return <Clock className="w-4 h-4" />;
      case 'Vencido':
      case 'Intento Duplicado':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'delivered':
        return <Package className="w-4 h-4 text-white" />;
      case 'validated':
        return <CheckCircle className="w-4 h-4 text-white" />;
      case 'generated':
        return <QrCode className="w-4 h-4 text-white" />;
      case 'assigned':
        return <Package className="w-4 h-4 text-white" />;
      default:
        return <CheckCircle className="w-4 h-4 text-white" />;
    }
  };

  if (view === 'detail' && selectedQR) {
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
              <h2 className="text-[#333333] mb-2">Detalle de Trazabilidad</h2>
              <p className="text-[#6B6B6B]">Código QR: {selectedQR.qrCode}</p>
            </div>
            <div className="flex gap-3">
              <Badge className={getStatusBadge(selectedQR.status)}>
                {getStatusIcon(selectedQR.status)}
                <span className="ml-2">{selectedQR.status}</span>
              </Badge>
              <Button
                variant="outline"
                className="border-2 border-[#E0E0E0] h-11 px-6 rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* QR Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#F8F8F8] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <QrCode className="w-4 h-4 text-[#6B6B6B]" />
                <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Código QR</p>
              </div>
              <p className="text-[#333333]">{selectedQR.qrCode}</p>
            </div>
            <div className="bg-[#F8F8F8] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-[#6B6B6B]" />
                <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>ID de Caja</p>
              </div>
              <p className="text-[#333333]">{selectedQR.boxId}</p>
            </div>
            <div className="bg-[#F8F8F8] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-[#6B6B6B]" />
                <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Tipo de Beneficio</p>
              </div>
              <p className="text-[#333333]">{selectedQR.benefitType}</p>
            </div>
          </div>
        </div>

        {/* Worker & Guard Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#E12019] rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-[#333333]">Información del Trabajador</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>RUT</p>
                <p className="text-[#333333]">{selectedQR.workerRut}</p>
              </div>
              <div>
                <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Nombre</p>
                <p className="text-[#333333]">{selectedQR.workerName}</p>
              </div>
              <div>
                <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Sucursal</p>
                <p className="text-[#333333]">{selectedQR.branch}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#017E49] rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-[#333333]">Información del Guardia</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Guardia</p>
                <p className="text-[#333333]">{selectedQR.guardName || 'Sin asignar'}</p>
              </div>
              <div>
                <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Fecha de Entrega</p>
                <p className="text-[#333333]">{selectedQR.deliveredDate || 'Pendiente'}</p>
              </div>
              {selectedQR.scheduledDate && (
                <div>
                  <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Fecha Agendada</p>
                  <p className="text-[#FF9F55]">{selectedQR.scheduledDate}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
          <h3 className="text-[#333333] mb-6">Línea de Tiempo Completa</h3>
          <div className="space-y-4">
            {mockQRTimeline.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#017E49] flex items-center justify-center">
                    {getTimelineIcon(event.type)}
                  </div>
                  {index < mockQRTimeline.length - 1 && (
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
                  <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>
                    {event.description}
                  </p>
                  <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>
                    Usuario: {event.user}
                  </p>
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
            <h2 className="text-[#333333] mb-2">Trazabilidad Caja → QR → Trabajador</h2>
            <p className="text-[#6B6B6B]">
              Seguimiento completo desde generación hasta entrega de beneficios
            </p>
          </div>
          <Button
            onClick={() => setShowGenerateModal(true)}
            className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generar QR
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B6B6B] w-5 h-5" />
              <Input
                placeholder="Buscar por código QR, caja, RUT o nombre..."
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
              <SelectItem value="Entregado">Entregado</SelectItem>
              <SelectItem value="Agendado">Agendado</SelectItem>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="Vencido">Vencido</SelectItem>
              <SelectItem value="Intento Duplicado">Intento Duplicado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Total QR</p>
            <QrCode className="w-5 h-5 text-[#6B6B6B]" />
          </div>
          <p className="text-[#333333]" style={{ fontSize: '24px', fontWeight: 500 }}>1,234</p>
        </div>
        <div className="bg-white border-2 border-[#017E49] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Entregados</p>
            <CheckCircle className="w-5 h-5 text-[#017E49]" />
          </div>
          <p className="text-[#017E49]" style={{ fontSize: '24px', fontWeight: 500 }}>1,045</p>
        </div>
        <div className="bg-white border-2 border-[#FF9F55] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Agendados</p>
            <Calendar className="w-5 h-5 text-[#FF9F55]" />
          </div>
          <p className="text-[#FF9F55]" style={{ fontSize: '24px', fontWeight: 500 }}>98</p>
        </div>
        <div className="bg-white border-2 border-[#6B6B6B] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Pendientes</p>
            <Clock className="w-5 h-5 text-[#6B6B6B]" />
          </div>
          <p className="text-[#6B6B6B]" style={{ fontSize: '24px', fontWeight: 500 }}>76</p>
        </div>
        <div className="bg-white border-2 border-[#E12019] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Vencidos</p>
            <XCircle className="w-5 h-5 text-[#E12019]" />
          </div>
          <p className="text-[#E12019]" style={{ fontSize: '24px', fontWeight: 500 }}>15</p>
        </div>
      </div>

      {/* QR Table */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8F8F8] border-b-2 border-[#E0E0E0]">
                <th className="text-left p-4 text-[#333333]">Código QR</th>
                <th className="text-left p-4 text-[#333333]">ID Caja</th>
                <th className="text-left p-4 text-[#333333]">Trabajador</th>
                <th className="text-left p-4 text-[#333333]">Guardia</th>
                <th className="text-left p-4 text-[#333333]">Generado</th>
                <th className="text-left p-4 text-[#333333]">Entregado</th>
                <th className="text-left p-4 text-[#333333]">Estado</th>
                <th className="text-left p-4 text-[#333333]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {mockQRCodes.map((qr) => (
                <tr key={qr.id} className="border-b border-[#E0E0E0] hover:bg-[#F8F8F8]">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-[#6B6B6B]" />
                      <span className="text-[#333333]">{qr.qrCode}</span>
                    </div>
                  </td>
                  <td className="p-4 text-[#6B6B6B]">{qr.boxId}</td>
                  <td className="p-4">
                    <div>
                      <p className="text-[#333333]">{qr.workerName}</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>{qr.workerRut}</p>
                    </div>
                  </td>
                  <td className="p-4 text-[#6B6B6B]">{qr.guardName || '—'}</td>
                  <td className="p-4 text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                    {qr.generatedDate}
                  </td>
                  <td className="p-4 text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                    {qr.deliveredDate || '—'}
                  </td>
                  <td className="p-4">
                    <Badge className={getStatusBadge(qr.status)}>
                      {getStatusIcon(qr.status)}
                      <span className="ml-2">{qr.status}</span>
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedQR(qr);
                        setView('detail');
                      }}
                      className="h-9 px-3 rounded-lg border-2 border-[#E0E0E0]"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate QR Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#333333]">Generar Nuevo Código QR</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">QR Individual</TabsTrigger>
              <TabsTrigger value="batch">QR por Lote</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4">
              <div>
                <Label htmlFor="box-id" className="text-[#333333]">ID de Caja</Label>
                <Input
                  id="box-id"
                  placeholder="BOX-PRM-0000"
                  className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2"
                />
              </div>
              <div>
                <Label htmlFor="benefit-type" className="text-[#333333]">Tipo de Beneficio</Label>
                <Select>
                  <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="estandar">Estándar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-[#F8F8F8] rounded-xl p-4">
                <p className="text-[#6B6B6B] mb-2" style={{ fontSize: '14px' }}>
                  Vista previa del código QR
                </p>
                <div className="w-32 h-32 bg-white border-2 border-[#E0E0E0] rounded-xl flex items-center justify-center mx-auto">
                  <QrCode className="w-16 h-16 text-[#6B6B6B]" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowGenerateModal(false)}
                  className="h-11 px-6 rounded-xl border-2 border-[#E0E0E0]"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => setShowGenerateModal(false)}
                  className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Generar QR
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="batch" className="space-y-4">
              <div>
                <Label htmlFor="quantity" className="text-[#333333]">Cantidad de QR</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="100"
                  className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2"
                />
              </div>
              <div>
                <Label htmlFor="batch-benefit" className="text-[#333333]">Tipo de Beneficio</Label>
                <Select>
                  <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="estandar">Estándar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="prefix" className="text-[#333333]">Prefijo (Opcional)</Label>
                <Input
                  id="prefix"
                  placeholder="BOX-PRM-"
                  className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2"
                />
              </div>
              <div className="bg-[#FFF4E6] border-2 border-[#FF9F55] rounded-xl p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-[#FF9F55] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#333333] mb-1">Generación por Lote</p>
                    <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                      Se generarán códigos QR únicos para cada caja. El proceso puede tardar unos minutos.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowGenerateModal(false)}
                  className="h-11 px-6 rounded-xl border-2 border-[#E0E0E0]"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => setShowGenerateModal(false)}
                  className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Generar Lote
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
