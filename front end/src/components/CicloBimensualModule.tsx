import { useState } from 'react';
import { Calendar, Clock, Settings, History, Unlock, AlertCircle, CheckCircle, XCircle, Package, User } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const currentCycle = {
  id: 'CYCLE-2025-01',
  startDate: '2025-01-01',
  endDate: '2025-03-01',
  duration: 60,
  daysRemaining: 46,
  progress: 23,
  status: 'Activo',
  totalWorkers: 245,
  deliveredBenefits: 189,
  pendingBenefits: 42,
  blockedWorkers: 14,
};

const cycleHistory = [
  {
    id: 'CYCLE-2024-06',
    startDate: '2024-11-01',
    endDate: '2024-12-31',
    duration: 60,
    status: 'Finalizado',
    totalWorkers: 238,
    delivered: 225,
    pending: 8,
    blocked: 5,
    completionRate: 95,
  },
  {
    id: 'CYCLE-2024-05',
    startDate: '2024-09-01',
    endDate: '2024-10-31',
    duration: 60,
    status: 'Finalizado',
    totalWorkers: 230,
    delivered: 218,
    pending: 7,
    blocked: 5,
    completionRate: 95,
  },
  {
    id: 'CYCLE-2024-04',
    startDate: '2024-07-01',
    endDate: '2024-08-31',
    duration: 60,
    status: 'Finalizado',
    totalWorkers: 225,
    delivered: 210,
    pending: 10,
    blocked: 5,
    completionRate: 93,
  },
  {
    id: 'CYCLE-2024-03',
    startDate: '2024-05-01',
    endDate: '2024-06-30',
    duration: 60,
    status: 'Vencido',
    totalWorkers: 220,
    delivered: 198,
    pending: 15,
    blocked: 7,
    completionRate: 90,
  },
];

const blockedWorkers = [
  {
    id: 1,
    rut: '12.345.678-9',
    name: 'Ana Martínez López',
    reason: 'Ya retiró beneficio en ciclo actual',
    blockedDate: '2025-01-10',
    nextEligible: '2025-03-02',
  },
  {
    id: 2,
    rut: '23.456.789-0',
    name: 'Pedro Sánchez Torres',
    reason: 'Incidencia sin resolver',
    blockedDate: '2025-01-08',
    nextEligible: 'Pendiente resolución',
  },
  {
    id: 3,
    rut: '34.567.890-1',
    name: 'Carmen Rojas Silva',
    reason: 'Beneficio agendado no retirado',
    blockedDate: '2025-01-05',
    nextEligible: '2025-03-02',
  },
];

export function CicloBimensualModule() {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [cycleDuration, setCycleDuration] = useState(60);

  const getStatusBadge = (status: string) => {
    const styles = {
      'Activo': 'bg-[#017E49] text-white',
      'Finalizado': 'bg-[#6B6B6B] text-white',
      'Vencido': 'bg-[#E12019] text-white',
    };
    return styles[status as keyof typeof styles] || 'bg-[#6B6B6B] text-white';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[#333333] mb-2">Gestión de Ciclo Bimensual</h2>
            <p className="text-[#6B6B6B]">
              Control de ciclos de beneficios cada 60 días
            </p>
          </div>
          <Button
            onClick={() => setShowConfigModal(true)}
            className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurar Ciclo
          </Button>
        </div>
      </div>

      {/* Current Cycle Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cycle Timer */}
        <div className="lg:col-span-2 bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#E12019] to-[#B51810] rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-[#333333]">Ciclo Actual</h3>
                <p className="text-[#6B6B6B]">{currentCycle.id}</p>
              </div>
            </div>
            <Badge className={getStatusBadge(currentCycle.status)}>
              {currentCycle.status}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Progreso del ciclo</span>
              <span className="text-[#333333]">{currentCycle.progress}%</span>
            </div>
            <Progress value={currentCycle.progress} className="h-3" />
          </div>

          {/* Cycle Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#F8F8F8] rounded-xl p-4">
              <p className="text-[#6B6B6B] mb-2" style={{ fontSize: '14px' }}>Fecha Inicio</p>
              <p className="text-[#333333]">{currentCycle.startDate}</p>
            </div>
            <div className="bg-[#F8F8F8] rounded-xl p-4">
              <p className="text-[#6B6B6B] mb-2" style={{ fontSize: '14px' }}>Fecha Fin</p>
              <p className="text-[#333333]">{currentCycle.endDate}</p>
            </div>
            <div className="bg-[#F8F8F8] rounded-xl p-4">
              <p className="text-[#6B6B6B] mb-2" style={{ fontSize: '14px' }}>Duración</p>
              <p className="text-[#333333]">{currentCycle.duration} días</p>
            </div>
            <div className="bg-[#F8F8F8] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#E12019]" />
                <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Restantes</p>
              </div>
              <p className="text-[#E12019]">{currentCycle.daysRemaining} días</p>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
          <h3 className="text-[#333333] mb-4">Estadísticas</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Total Trabajadores</span>
                <span className="text-[#333333]">{currentCycle.totalWorkers}</span>
              </div>
              <div className="h-2 bg-[#F8F8F8] rounded-full overflow-hidden">
                <div className="h-full bg-[#017E49]" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Beneficios Entregados</span>
                <span className="text-[#017E49]">{currentCycle.deliveredBenefits}</span>
              </div>
              <div className="h-2 bg-[#F8F8F8] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#017E49]" 
                  style={{ width: `${(currentCycle.deliveredBenefits / currentCycle.totalWorkers) * 100}%` }} 
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Beneficios Pendientes</span>
                <span className="text-[#FF9F55]">{currentCycle.pendingBenefits}</span>
              </div>
              <div className="h-2 bg-[#F8F8F8] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#FF9F55]" 
                  style={{ width: `${(currentCycle.pendingBenefits / currentCycle.totalWorkers) * 100}%` }} 
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Trabajadores Bloqueados</span>
                <span className="text-[#E12019]">{currentCycle.blockedWorkers}</span>
              </div>
              <div className="h-2 bg-[#F8F8F8] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#E12019]" 
                  style={{ width: `${(currentCycle.blockedWorkers / currentCycle.totalWorkers) * 100}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blocked Workers */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#333333]">Trabajadores Bloqueados en Ciclo Actual</h3>
          <Badge className="bg-[#E12019] text-white">
            {blockedWorkers.length} bloqueados
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8F8F8] border-b-2 border-[#E0E0E0]">
                <th className="text-left p-4 text-[#333333]">RUT</th>
                <th className="text-left p-4 text-[#333333]">Nombre</th>
                <th className="text-left p-4 text-[#333333]">Motivo de Bloqueo</th>
                <th className="text-left p-4 text-[#333333]">Fecha Bloqueo</th>
                <th className="text-left p-4 text-[#333333]">Próximo Elegible</th>
                <th className="text-left p-4 text-[#333333]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {blockedWorkers.map((worker) => (
                <tr key={worker.id} className="border-b border-[#E0E0E0] hover:bg-[#F8F8F8]">
                  <td className="p-4 text-[#333333]">{worker.rut}</td>
                  <td className="p-4 text-[#333333]">{worker.name}</td>
                  <td className="p-4 text-[#6B6B6B]">{worker.reason}</td>
                  <td className="p-4 text-[#6B6B6B]">{worker.blockedDate}</td>
                  <td className="p-4 text-[#6B6B6B]">{worker.nextEligible}</td>
                  <td className="p-4">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedWorker(worker);
                        setShowUnlockModal(true);
                      }}
                      className="bg-[#017E49] text-white hover:bg-[#016339] h-9 px-4 rounded-lg"
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      Desbloquear
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cycle History */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <History className="w-6 h-6 text-[#E12019]" />
          <h3 className="text-[#333333]">Historial de Ciclos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8F8F8] border-b-2 border-[#E0E0E0]">
                <th className="text-left p-4 text-[#333333]">ID Ciclo</th>
                <th className="text-left p-4 text-[#333333]">Fecha Inicio</th>
                <th className="text-left p-4 text-[#333333]">Fecha Fin</th>
                <th className="text-left p-4 text-[#333333]">Duración</th>
                <th className="text-left p-4 text-[#333333]">Trabajadores</th>
                <th className="text-left p-4 text-[#333333]">Entregados</th>
                <th className="text-left p-4 text-[#333333]">Pendientes</th>
                <th className="text-left p-4 text-[#333333]">Bloqueados</th>
                <th className="text-left p-4 text-[#333333]">Tasa Completitud</th>
                <th className="text-left p-4 text-[#333333]">Estado</th>
              </tr>
            </thead>
            <tbody>
              {cycleHistory.map((cycle) => (
                <tr key={cycle.id} className="border-b border-[#E0E0E0] hover:bg-[#F8F8F8]">
                  <td className="p-4 text-[#333333]">{cycle.id}</td>
                  <td className="p-4 text-[#6B6B6B]">{cycle.startDate}</td>
                  <td className="p-4 text-[#6B6B6B]">{cycle.endDate}</td>
                  <td className="p-4 text-[#6B6B6B]">{cycle.duration} días</td>
                  <td className="p-4 text-[#333333]">{cycle.totalWorkers}</td>
                  <td className="p-4 text-[#017E49]">{cycle.delivered}</td>
                  <td className="p-4 text-[#FF9F55]">{cycle.pending}</td>
                  <td className="p-4 text-[#E12019]">{cycle.blocked}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[#F8F8F8] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#017E49]" 
                          style={{ width: `${cycle.completionRate}%` }} 
                        />
                      </div>
                      <span className="text-[#333333] min-w-[45px]">{cycle.completionRate}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge className={getStatusBadge(cycle.status)}>
                      {cycle.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Config Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#333333]">Configurar Ciclo Bimensual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-[#FFF4E6] border-2 border-[#FF9F55] rounded-xl p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-[#FF9F55] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#333333] mb-1">Advertencia</p>
                  <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                    Cambiar la duración del ciclo afectará a todos los ciclos futuros. Los ciclos en curso no se verán afectados.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="cycle-duration" className="text-[#333333]">
                Duración del ciclo (días)
              </Label>
              <Input
                id="cycle-duration"
                type="number"
                min="45"
                max="90"
                value={cycleDuration}
                onChange={(e) => setCycleDuration(parseInt(e.target.value))}
                className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2"
              />
              <p className="text-[#6B6B6B] mt-2" style={{ fontSize: '14px' }}>
                Rango permitido: 45 - 90 días
              </p>
            </div>

            <div className="bg-[#F8F8F8] rounded-xl p-4">
              <p className="text-[#6B6B6B] mb-2" style={{ fontSize: '14px' }}>Vista previa</p>
              <p className="text-[#333333]">
                Próximo ciclo: {cycleDuration} días
              </p>
              <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                Fecha estimada: {new Date(Date.now() + cycleDuration * 24 * 60 * 60 * 1000).toLocaleDateString('es-CL')}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowConfigModal(false)}
                className="h-11 px-6 rounded-xl border-2 border-[#E0E0E0]"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => setShowConfigModal(false)}
                className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
              >
                <Settings className="w-4 h-4 mr-2" />
                Aplicar Configuración
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unlock Worker Modal */}
      <Dialog open={showUnlockModal} onOpenChange={setShowUnlockModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#333333]">Desbloquear Trabajador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedWorker && (
              <>
                <div className="bg-[#F8F8F8] rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>RUT</p>
                      <p className="text-[#333333]">{selectedWorker.rut}</p>
                    </div>
                    <div>
                      <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Nombre</p>
                      <p className="text-[#333333]">{selectedWorker.name}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFF4E6] border-2 border-[#FF9F55] rounded-xl p-4">
                  <p className="text-[#333333] mb-2">Motivo de Bloqueo</p>
                  <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                    {selectedWorker.reason}
                  </p>
                </div>

                <div>
                  <Label htmlFor="unlock-reason" className="text-[#333333]">
                    Justificación del desbloqueo *
                  </Label>
                  <Input
                    id="unlock-reason"
                    placeholder="Ej: Autorización excepcional por RRHH"
                    className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2"
                  />
                  <p className="text-[#6B6B6B] mt-2" style={{ fontSize: '14px' }}>
                    Esta acción quedará registrada en el historial del trabajador
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUnlockModal(false);
                      setSelectedWorker(null);
                    }}
                    className="h-11 px-6 rounded-xl border-2 border-[#E0E0E0]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      setShowUnlockModal(false);
                      setSelectedWorker(null);
                    }}
                    className="bg-[#017E49] text-white hover:bg-[#016339] h-11 px-6 rounded-xl"
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    Desbloquear
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
