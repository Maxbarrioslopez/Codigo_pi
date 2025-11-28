import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Filter, Download, Calendar, TrendingUp, Package, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';

// Mock data para charts
const deliveriesPerCycleData = [
  { cycle: 'CYCLE-2024-03', entregas: 198, pendientes: 22 },
  { cycle: 'CYCLE-2024-04', entregas: 210, pendientes: 15 },
  { cycle: 'CYCLE-2024-05', entregas: 218, pendientes: 12 },
  { cycle: 'CYCLE-2024-06', entregas: 225, pendientes: 13 },
  { cycle: 'CYCLE-2025-01', entregas: 189, pendientes: 56 },
];

const contractDistributionData = [
  { name: 'Indefinido', value: 145, color: '#017E49' },
  { name: 'Plazo fijo', value: 62, color: '#FF9F55' },
  { name: 'Part time', value: 28, color: '#E12019' },
  { name: 'Honorarios', value: 7, color: '#6B6B6B' },
  { name: 'Practicante', value: 3, color: '#333333' },
];

const branchDistributionData = [
  { name: 'Planta Santiago', value: 178, color: '#E12019' },
  { name: 'Planta Rancagua', value: 67, color: '#017E49' },
];

const monthlyTrendData = [
  { month: 'Jul', entregas: 210, agendados: 15, bloqueados: 5 },
  { month: 'Ago', entregas: 205, agendados: 18, bloqueados: 7 },
  { month: 'Sep', entregas: 218, agendados: 12, bloqueados: 5 },
  { month: 'Oct', entregas: 220, agendados: 10, bloqueados: 5 },
  { month: 'Nov', entregas: 225, agendados: 13, bloqueados: 5 },
  { month: 'Dic', entregas: 198, agendados: 22, bloqueados: 8 },
  { month: 'Ene', entregas: 189, agendados: 42, bloqueados: 14 },
];

const mockReportData = {
  totalWorkers: 245,
  activeWorkers: 231,
  totalDeliveries: 1265,
  pendingDeliveries: 56,
  completionRate: 94.3,
  averagePickupTime: '2.4 días',
};

export function ReportesModule() {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dateRange, setDateRange] = useState('last-6-months');
  const [selectedCycle, setSelectedCycle] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[#333333] mb-2">Reportes y Análisis</h2>
            <p className="text-[#6B6B6B]">
              Dashboard de analytics con métricas y reportes personalizados
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowFilterModal(true)}
              variant="outline"
              className="border-2 border-[#E0E0E0] h-11 px-6 rounded-xl"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button
              onClick={() => setShowExportModal(true)}
              className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#E12019] bg-opacity-10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-[#E12019]" />
            </div>
            <Badge className="bg-[#017E49] text-white">
              +5.2%
            </Badge>
          </div>
          <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Total Trabajadores</p>
          <p className="text-[#333333]" style={{ fontSize: '32px', fontWeight: 500 }}>
            {mockReportData.totalWorkers}
          </p>
          <p className="text-[#017E49] mt-2" style={{ fontSize: '14px' }}>
            {mockReportData.activeWorkers} activos
          </p>
        </div>

        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#017E49] bg-opacity-10 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-[#017E49]" />
            </div>
            <Badge className="bg-[#017E49] text-white">
              +12.3%
            </Badge>
          </div>
          <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Total Entregas</p>
          <p className="text-[#333333]" style={{ fontSize: '32px', fontWeight: 500 }}>
            {mockReportData.totalDeliveries}
          </p>
          <p className="text-[#6B6B6B] mt-2" style={{ fontSize: '14px' }}>
            Últimos 6 meses
          </p>
        </div>

        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#FF9F55] bg-opacity-10 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-[#FF9F55]" />
            </div>
            <Badge className="bg-[#FF9F55] text-white">
              +8 esta semana
            </Badge>
          </div>
          <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Entregas Pendientes</p>
          <p className="text-[#333333]" style={{ fontSize: '32px', fontWeight: 500 }}>
            {mockReportData.pendingDeliveries}
          </p>
          <p className="text-[#6B6B6B] mt-2" style={{ fontSize: '14px' }}>
            Ciclo actual
          </p>
        </div>

        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#017E49] bg-opacity-10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#017E49]" />
            </div>
            <Badge className="bg-[#017E49] text-white">
              Óptimo
            </Badge>
          </div>
          <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Tasa de Completitud</p>
          <p className="text-[#333333]" style={{ fontSize: '32px', fontWeight: 500 }}>
            {mockReportData.completionRate}%
          </p>
          <p className="text-[#6B6B6B] mt-2" style={{ fontSize: '14px' }}>
            Promedio: {mockReportData.averagePickupTime}
          </p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deliveries per Cycle */}
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
          <h3 className="text-[#333333] mb-6">Entregas por Ciclo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deliveriesPerCycleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="cycle" tick={{ fill: '#6B6B6B', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B6B6B', fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="entregas" fill="#017E49" name="Entregas" />
              <Bar dataKey="pendientes" fill="#FF9F55" name="Pendientes" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
          <h3 className="text-[#333333] mb-6">Tendencia Mensual</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="month" tick={{ fill: '#6B6B6B', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B6B6B', fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="entregas" stroke="#017E49" strokeWidth={2} name="Entregas" />
              <Line type="monotone" dataKey="agendados" stroke="#FF9F55" strokeWidth={2} name="Agendados" />
              <Line type="monotone" dataKey="bloqueados" stroke="#E12019" strokeWidth={2} name="Bloqueados" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Distribution */}
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
          <h3 className="text-[#333333] mb-6">Distribución por Tipo de Contrato</h3>
          <div className="flex items-center justify-between">
            <ResponsiveContainer width="50%" height={250}>
              <PieChart>
                <Pie
                  data={contractDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {contractDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {contractDistributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>{item.name}</span>
                  </div>
                  <span className="text-[#333333]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Branch Distribution */}
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
          <h3 className="text-[#333333] mb-6">Distribución por Sucursal</h3>
          <div className="flex items-center justify-between">
            <ResponsiveContainer width="50%" height={250}>
              <PieChart>
                <Pie
                  data={branchDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {branchDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {branchDistributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>{item.name}</span>
                  </div>
                  <span className="text-[#333333]">{item.value}</span>
                </div>
              ))}
              <div className="pt-3 mt-3 border-t-2 border-[#E0E0E0]">
                <div className="flex items-center justify-between">
                  <span className="text-[#333333]">Total</span>
                  <span className="text-[#333333]">
                    {branchDistributionData.reduce((acc, item) => acc + item.value, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workers Without Pickup Table */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
        <h3 className="text-[#333333] mb-6">Trabajadores Sin Retiro (Ciclo Actual)</h3>
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
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#E0E0E0]">
                <td className="p-4 text-[#333333]">23.456.789-0</td>
                <td className="p-4 text-[#333333]">Carlos Rodríguez Silva</td>
                <td className="p-4 text-[#6B6B6B]">Logística</td>
                <td className="p-4 text-[#6B6B6B]">Plazo fijo</td>
                <td className="p-4 text-[#6B6B6B]">Planta Rancagua</td>
                <td className="p-4 text-[#6B6B6B]">Estándar</td>
                <td className="p-4">
                  <Badge className="bg-[#FF9F55] text-white">Agendado</Badge>
                </td>
              </tr>
              <tr className="border-b border-[#E0E0E0]">
                <td className="p-4 text-[#333333]">34.567.890-1</td>
                <td className="p-4 text-[#333333]">Ana Martínez López</td>
                <td className="p-4 text-[#6B6B6B]">Administración</td>
                <td className="p-4 text-[#6B6B6B]">Indefinido</td>
                <td className="p-4 text-[#6B6B6B]">Planta Santiago</td>
                <td className="p-4 text-[#6B6B6B]">Premium</td>
                <td className="p-4">
                  <Badge className="bg-[#E12019] text-white">Bloqueado</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter Modal */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#333333]">Configurar Filtros</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#333333]">Rango de Fechas</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-month">Último mes</SelectItem>
                    <SelectItem value="last-3-months">Últimos 3 meses</SelectItem>
                    <SelectItem value="last-6-months">Últimos 6 meses</SelectItem>
                    <SelectItem value="last-year">Último año</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#333333]">Ciclo</Label>
                <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                  <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los ciclos</SelectItem>
                    <SelectItem value="CYCLE-2025-01">CYCLE-2025-01</SelectItem>
                    <SelectItem value="CYCLE-2024-06">CYCLE-2024-06</SelectItem>
                    <SelectItem value="CYCLE-2024-05">CYCLE-2024-05</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#333333]">Sucursal</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las sucursales</SelectItem>
                    <SelectItem value="santiago">Planta Santiago</SelectItem>
                    <SelectItem value="rancagua">Planta Rancagua</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#333333]">Tipo de Contrato</Label>
                <Select>
                  <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                    <SelectValue placeholder="Todos los contratos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los contratos</SelectItem>
                    <SelectItem value="indefinido">Indefinido</SelectItem>
                    <SelectItem value="plazo-fijo">Plazo fijo</SelectItem>
                    <SelectItem value="part-time">Part time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#333333]">Tipo de Beneficio</Label>
                <Select>
                  <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                    <SelectValue placeholder="Todos los beneficios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los beneficios</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="estandar">Estándar</SelectItem>
                    <SelectItem value="sin-beneficio">Sin beneficio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#333333]">Estado</Label>
                <Select>
                  <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="entregado">Entregado</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowFilterModal(false)}
                className="h-11 px-6 rounded-xl border-2 border-[#E0E0E0]"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => setShowFilterModal(false)}
                className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
              >
                <Filter className="w-4 h-4 mr-2" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#333333]">Exportar Reporte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[#333333]">Formato de Exportación</Label>
              <Select defaultValue="excel">
                <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[#333333]">Contenido del Reporte</Label>
              <div className="space-y-2 mt-2">
                <label className="flex items-center gap-2 p-3 border-2 border-[#E0E0E0] rounded-xl cursor-pointer hover:bg-[#F8F8F8]">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-[#333333]">KPIs y métricas generales</span>
                </label>
                <label className="flex items-center gap-2 p-3 border-2 border-[#E0E0E0] rounded-xl cursor-pointer hover:bg-[#F8F8F8]">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-[#333333]">Gráficos y tendencias</span>
                </label>
                <label className="flex items-center gap-2 p-3 border-2 border-[#E0E0E0] rounded-xl cursor-pointer hover:bg-[#F8F8F8]">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-[#333333]">Listado detallado de trabajadores</span>
                </label>
                <label className="flex items-center gap-2 p-3 border-2 border-[#E0E0E0] rounded-xl cursor-pointer hover:bg-[#F8F8F8]">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-[#333333]">Historial de ciclos</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowExportModal(false)}
                className="h-11 px-6 rounded-xl border-2 border-[#E0E0E0]"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => setShowExportModal(false)}
                className="bg-[#017E49] text-white hover:bg-[#016339] h-11 px-6 rounded-xl"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
