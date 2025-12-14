import { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, AlertCircle, Upload, UserPlus, User, Eye, EyeOff, Download, Filter, CheckCircle2, Info, Package, Gift } from 'lucide-react';
import { listarIncidencias, listarAgendamientosPorRut, listarTickets, reportesRetirosPorDia, resolverIncidencia, cambiarEstadoIncidencia, TicketDTO, IncidenciaDTO, AgendamientoDTO, CicloDTO, RetirosDiaDTO } from '../services/api';
import { useCicloActivo } from '../hooks/useCicloActivo';
import RRHHCrearTipoBeneficio from './rrhh/RRHHCrearTipoBeneficio';
import RRHHAsignarBeneficio from './rrhh/RRHHAsignarBeneficio';
import RRHHAsignarBeneficiosMasivo from './rrhh/RRHHAsignarBeneficiosMasivo';

type DashboardTab = 'dashboard' | 'nomina' | 'retiros' | 'incidencias' | 'crear-tipo' | 'asignar' | 'asignar-masivo';

export function RRHHModule() {
  const [currentTab, setCurrentTab] = useState<DashboardTab>('dashboard');
  const { ciclo } = useCicloActivo();
  const [incidencias, setIncidencias] = useState<IncidenciaDTO[]>([]);
  const [agendamientos, setAgendamientos] = useState<AgendamientoDTO[]>([]);
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [retirosDia, setRetirosDia] = useState<RetirosDiaDTO[]>([]);
  const [rutFilter, setRutFilter] = useState<string>('12345678-5');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [inc, ag, tks, rep] = await Promise.all([
          listarIncidencias().catch(() => [] as IncidenciaDTO[]),
          listarAgendamientosPorRut(rutFilter).catch(() => [] as AgendamientoDTO[]),
          listarTickets(rutFilter).catch(() => [] as TicketDTO[]),
          reportesRetirosPorDia(7).catch(() => [] as RetirosDiaDTO[])
        ]);
        if (!active) return;
        setIncidencias(inc);
        setAgendamientos(ag);
        setTickets(tks);
        setRetirosDia(rep);
      } catch {/* silencioso */ }
    })();
    return () => { active = false; };
  }, [rutFilter]);

  return (
    <RRHHDashboard
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      onLogout={() => { /* cierre de sesión gestionado por App/Auth */ }}
      ciclo={ciclo}
      tickets={tickets}
      incidencias={incidencias}
      retirosDia={retirosDia}
      rutFilter={rutFilter}
      setRutFilter={setRutFilter}
    />
  );
}

function RRHHDashboard({
  currentTab,
  setCurrentTab,
  onLogout,
  ciclo,
  tickets,
  incidencias,
  retirosDia,
  rutFilter,
  setRutFilter,
}: {
  currentTab: DashboardTab;
  setCurrentTab: (tab: DashboardTab) => void;
  onLogout: () => void;
  ciclo: CicloDTO | null;
  tickets: TicketDTO[];
  incidencias: IncidenciaDTO[];
  retirosDia: RetirosDiaDTO[];
  rutFilter: string;
  setRutFilter: (rut: string) => void;
}) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'nomina', label: 'Nómina', icon: Users },
    { id: 'crear-tipo', label: 'Crear Tipo Beneficio', icon: Package },
    { id: 'asignar', label: 'Asignar Beneficio', icon: Gift },
    { id: 'asignar-masivo', label: 'Asignar Masivo', icon: Users },
    { id: 'retiros', label: 'Detalle de retiros', icon: FileText },
    { id: 'incidencias', label: 'Incidencias', icon: AlertCircle },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[#333333] mb-2">Dashboard RRHH - Panel de Administración</h2>
        <p className="text-[#6B6B6B]">
          Panel principal para Recursos Humanos y administración (1440×900)
        </p>
      </div>

      {/* Dashboard Layout */}
      <div className="bg-white rounded-xl border-2 border-[#E0E0E0] overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b-2 border-[#E0E0E0] px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#E12019] to-[#B51810] rounded-lg flex items-center justify-center">
                <span className="text-white" style={{ fontSize: '16px', fontWeight: 700 }}>TML</span>
              </div>
              <h3 className="text-[#333333]" style={{ fontSize: '20px', fontWeight: 500 }}>
                Dashboard Beneficios – TMLUC
              </h3>
            </div>
            <div className="flex items-center gap-4">
              {/* Filtro por RUT para datos */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={rutFilter}
                  onChange={(e) => setRutFilter(e.target.value)}
                  placeholder="RUT trabajador (ej: 12345678-5)"
                  className="px-3 py-2 bg-white border-2 border-[#E0E0E0] rounded-lg text-[#333333] placeholder:text-[#6B6B6B] focus:border-[#E12019] focus:outline-none"
                  style={{ fontSize: '14px', minWidth: '220px' }}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#E0E0E0] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-[#6B6B6B]" />
                </div>
                <span className="text-[#333333]" style={{ fontSize: '16px' }}>
                  Patricia Silva (RRHH)
                </span>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-[#E12019] hover:bg-[#F8F8F8] rounded-lg transition-colors"
                style={{ fontSize: '14px' }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-[#F8F8F8] border-b-2 border-[#E0E0E0] px-8">
          <div className="flex gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 transition-all ${isActive
                    ? 'bg-white text-[#E12019] border-b-4 border-[#E12019]'
                    : 'text-[#6B6B6B] hover:text-[#333333]'
                    }`}
                  style={{ fontSize: '16px', fontWeight: isActive ? 500 : 400 }}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          {/* Quick actions: Nuevo Beneficio (crear tipo) y Asignar Beneficio */}
          <div className="flex items-center gap-3 mt-3 pb-4">
            <button
              onClick={() => setCurrentTab('crear-tipo')}
              className="flex items-center gap-2 px-4 py-2 bg-[#FDF2E9] text-[#333333] border-2 border-[#D9D9D9] rounded-lg hover:bg-[#FFF7F2] transition-colors font-semibold"
              style={{ fontSize: '14px', letterSpacing: '0.2px' }}
            >
              <Package className="w-4 h-4 text-[#9C27B0]" />
              Nuevo Beneficio
            </button>
            <button
              onClick={() => setCurrentTab('asignar')}
              className="flex items-center gap-2 px-4 py-2 bg-[#E8F5F1] text-[#017E49] border-2 border-[#CFE9E1] rounded-lg hover:bg-[#F2FBF7] transition-colors font-semibold"
              style={{ fontSize: '14px', letterSpacing: '0.2px' }}
            >
              <Gift className="w-4 h-4" />
              Crear Beneficio
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <main className="p-8">
          {currentTab === 'dashboard' && <DashboardView ciclo={ciclo} tickets={tickets} incidencias={incidencias} retirosDia={retirosDia} />}
          {currentTab === 'nomina' && <NominaView />}
          {currentTab === 'crear-tipo' && <RRHHCrearTipoBeneficio />}
          {currentTab === 'asignar' && <RRHHAsignarBeneficio />}
          {currentTab === 'asignar-masivo' && <RRHHAsignarBeneficiosMasivo />}
          {currentTab === 'retiros' && <RetirosView />}
          {currentTab === 'incidencias' && <IncidenciasView />}
        </main>
      </div>
    </div>
  );
}

function DashboardView({ ciclo, tickets, incidencias, retirosDia }: { ciclo: CicloDTO | null; tickets: TicketDTO[]; incidencias: IncidenciaDTO[]; retirosDia: RetirosDiaDTO[] }) {
  const kpis = [
    { label: 'Tickets entregados', value: tickets.filter(t => t.estado === 'entregado').length.toString(), color: '#E12019', icon: FileText },
    { label: 'Tickets pendientes', value: tickets.filter(t => t.estado === 'pendiente').length.toString(), color: '#017E49', icon: BarChart3 },
    { label: 'Incidencias abiertas', value: incidencias.filter(i => i.estado === 'pendiente' || i.estado === 'abierta').length.toString(), color: '#FF9F55', icon: AlertCircle },
    { label: 'Ciclo días restantes', value: ciclo?.dias_restantes?.toString() ?? '-', color: '#333333', icon: BarChart3 },
  ];

  const lastRetiros = [
    { fecha: '09/11/2025', hora: '14:32', trabajador: 'María González', tipo: 'Premium', estado: 'Entregado' },
    { fecha: '09/11/2025', hora: '14:15', trabajador: 'Carlos Muñoz', tipo: 'Estándar', estado: 'Entregado' },
    { fecha: '09/11/2025', hora: '13:58', trabajador: 'Ana Vargas', tipo: 'Premium', estado: 'Rechazado' },
    { fecha: '09/11/2025', hora: '13:45', trabajador: 'Pedro Soto', tipo: 'Estándar', estado: 'Entregado' },
    { fecha: '09/11/2025', hora: '13:20', trabajador: 'Laura Díaz', tipo: 'Premium', estado: 'Entregado' },
  ];

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Icon className="w-8 h-8 text-[#6B6B6B]" />
              </div>
              <p className="text-[#6B6B6B] mb-2" style={{ fontSize: '14px' }}>
                {kpi.label}
              </p>
              <p className="text-[#333333]" style={{ fontSize: '36px', fontWeight: 700, color: kpi.color }}>
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Chart dinámico simple usando retirosDia */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
        <h4 className="text-[#333333] mb-6" style={{ fontSize: '20px', fontWeight: 500 }}>
          Retiros por día (última semana)
        </h4>
        <div className="grid grid-cols-7 gap-4">
          {retirosDia.map(d => {
            const total = d.entregados + d.pendientes + d.expirados;
            const entregadosPct = total ? (d.entregados / total) * 100 : 0;
            return (
              <div key={d.fecha} className="flex flex-col items-center">
                <div className="w-full h-40 bg-[#F8F8F8] rounded flex items-end overflow-hidden">
                  <div className="w-full" style={{ height: `${entregadosPct}%` }}>
                    <div className="w-full h-full bg-[#E12019] rounded-t" title={`Entregados: ${d.entregados}`}></div>
                  </div>
                </div>
                <p className="text-[#6B6B6B] mt-2" style={{ fontSize: '12px' }}>{d.fecha.slice(5)}</p>
              </div>
            );
          })}
          {retirosDia.length === 0 && (
            <div className="col-span-7 h-40 bg-[#F8F8F8] rounded flex items-center justify-center text-[#6B6B6B]" style={{ fontSize: '14px' }}>
              Sin datos de retiros
            </div>
          )}
        </div>
      </div>

      {/* Last Retiros */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-[#E0E0E0]">
          <h4 className="text-[#333333]" style={{ fontSize: '18px', fontWeight: 500 }}>
            Últimos retiros
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8F8F8]">
              <tr>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Fecha</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Hora</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Trabajador</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Tipo</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {lastRetiros.map((retiro, index) => (
                <tr key={index} className="border-t border-[#E0E0E0]">
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{retiro.fecha}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{retiro.hora}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{retiro.trabajador}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{retiro.tipo}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full uppercase ${retiro.estado === 'Entregado' ? 'bg-[#017E49]' : 'bg-[#E12019]'
                      } text-white`} style={{ fontSize: '12px', fontWeight: 700 }}>
                      {retiro.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NominaView() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBenefitRulesModal, setShowBenefitRulesModal] = useState(false);
  const [showNewBenefitModal, setShowNewBenefitModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [benefitRules, setBenefitRules] = useState({
    indefinido: 'Premium',
    plazoFijo: 'Estándar',
    partTime: 'Estándar',
    honorarios: '',
    practicante: ''
  });
  const [customBenefits, setCustomBenefits] = useState([
    { id: 'paseos', name: 'Paseos', color: '#8B5CF6' },
  ]);
  const [newBenefitName, setNewBenefitName] = useState('');
  const [newBenefitColor, setNewBenefitColor] = useState('#3B82F6');

  const nomina = [
    { rut: '12.345.678-9', nombre: 'María González Pérez', area: 'Producción', sede: 'Santiago', beneficio: 'Premium', estado: 'Activo' },
    { rut: '98.765.432-1', nombre: 'Carlos Muñoz Silva', area: 'Logística', sede: 'Santiago', beneficio: 'Estándar', estado: 'Activo' },
    { rut: '11.222.333-4', nombre: 'Ana Vargas López', area: 'Producción', sede: 'Valparaíso', beneficio: 'Premium', estado: 'Activo' },
    { rut: '55.666.777-8', nombre: 'Pedro Soto Rojas', area: 'Administración', sede: 'Santiago', beneficio: 'Estándar', estado: 'Activo' },
    { rut: '99.888.777-6', nombre: 'Laura Díaz Fuentes', area: 'Calidad', sede: 'Santiago', beneficio: null, estado: 'Inactivo' },
    { rut: '44.555.666-7', nombre: 'Roberto Morales Torres', area: 'Producción', sede: 'Concepción', beneficio: 'Premium', estado: 'Activo' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[#333333]" style={{ fontSize: '24px', fontWeight: 500 }}>
          Gestión de Nómina y Beneficios
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewBenefitModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-[#6B6B6B] border-2 border-[#E0E0E0] rounded-xl hover:bg-[#F8F8F8] transition-colors"
            style={{ fontSize: '16px', fontWeight: 700 }}
          >
            <UserPlus className="w-5 h-5" />
            Agregar tipo de beneficio
          </button>
          <button
            onClick={() => setShowBenefitRulesModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-[#333333] border-2 border-[#E12019] rounded-xl hover:bg-[#F8F8F8] transition-colors"
            style={{ fontSize: '16px', fontWeight: 700 }}
          >
            <AlertCircle className="w-5 h-5" />
            Configurar reglas de beneficios
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors"
            style={{ fontSize: '16px', fontWeight: 700 }}
          >
            <Upload className="w-5 h-5" />
            Cargar nómina
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#F8F8F8] rounded-xl p-4 border-2 border-[#E0E0E0]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#017E49] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[#333333] mb-1" style={{ fontSize: '14px', fontWeight: 500 }}>
                Asignación automática de beneficios
              </p>
              <p className="text-[#6B6B6B]" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                Al cargar la nómina, los beneficios se asignan automáticamente según el tipo de contrato configurado en las reglas.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#FFF4E6] rounded-xl p-4 border-2 border-[#FF9F55]">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#FF9F55] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[#333333] mb-1" style={{ fontSize: '14px', fontWeight: 500 }}>
                Sin beneficio = Sin acceso al tótem
              </p>
              <p className="text-[#6B6B6B]" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                Los trabajadores sin beneficio asignado no podrán generar tickets de retiro.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8F8F8]">
              <tr>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>RUT</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Nombre</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Área</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Sede</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Beneficio asignado</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Estado</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {nomina.map((trabajador, index) => (
                <tr key={index} className="border-t border-[#E0E0E0]">
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{trabajador.rut}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{trabajador.nombre}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{trabajador.area}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{trabajador.sede}</td>
                  <td className="px-6 py-4">
                    {trabajador.beneficio ? (
                      <span className={`px-3 py-1 rounded-full ${trabajador.beneficio === 'Premium' ? 'bg-[#017E49]' : 'bg-[#FF9F55]'
                        } text-white`} style={{ fontSize: '12px', fontWeight: 700 }}>
                        {trabajador.beneficio}
                      </span>
                    ) : (
                      <span className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Sin asignar</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full uppercase ${trabajador.estado === 'Activo' ? 'bg-[#017E49]' : 'bg-[#6B6B6B]'
                      } text-white`} style={{ fontSize: '12px', fontWeight: 700 }}>
                      {trabajador.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        setSelectedWorker(trabajador);
                        setShowAssignModal(true);
                      }}
                      className="text-[#E12019] hover:text-[#B51810]"
                      style={{ fontSize: '14px', fontWeight: 500 }}
                    >
                      Asignar beneficio
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t-2 border-[#E0E0E0] flex items-center justify-between">
          <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
            Mostrando 6 de 247 trabajadores
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border-2 border-[#E0E0E0] rounded-lg text-[#333333] hover:bg-[#F8F8F8]" style={{ fontSize: '14px' }}>
              Anterior
            </button>
            <button className="px-4 py-2 bg-[#E12019] text-white rounded-lg" style={{ fontSize: '14px', fontWeight: 500 }}>
              1
            </button>
            <button className="px-4 py-2 bg-white border-2 border-[#E0E0E0] rounded-lg text-[#333333] hover:bg-[#F8F8F8]" style={{ fontSize: '14px' }}>
              2
            </button>
            <button className="px-4 py-2 bg-white border-2 border-[#E0E0E0] rounded-lg text-[#333333] hover:bg-[#F8F8F8]" style={{ fontSize: '14px' }}>
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* New Benefit Type Modal */}
      {showNewBenefitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-[#333333] mb-4" style={{ fontSize: '24px', fontWeight: 700 }}>
              Crear Nuevo Tipo de Beneficio
            </h3>
            <p className="text-[#6B6B6B] mb-6" style={{ fontSize: '16px', lineHeight: '1.5' }}>
              Define un nuevo tipo de beneficio que podrás asignar a los trabajadores (ej: Paseos, Caja Navidad, etc.)
            </p>

            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-[#333333] mb-3" style={{ fontSize: '16px', fontWeight: 500 }}>
                  Nombre del beneficio
                </label>
                <input
                  type="text"
                  value={newBenefitName}
                  onChange={(e) => setNewBenefitName(e.target.value)}
                  placeholder="Ej: Paseos, Caja Navidad, Kit Escolar..."
                  className="w-full px-4 py-3 bg-white border-2 border-[#E0E0E0] rounded-xl text-[#333333] placeholder:text-[#6B6B6B] focus:border-[#E12019] focus:outline-none"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <label className="block text-[#333333] mb-3" style={{ fontSize: '16px', fontWeight: 500 }}>
                  Color identificador
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { color: '#3B82F6', name: 'Azul' },
                    { color: '#8B5CF6', name: 'Morado' },
                    { color: '#EC4899', name: 'Rosa' },
                    { color: '#F59E0B', name: 'Amarillo' },
                    { color: '#10B981', name: 'Verde' },
                  ].map((colorOption) => (
                    <button
                      key={colorOption.color}
                      onClick={() => setNewBenefitColor(colorOption.color)}
                      className={`w-full aspect-square rounded-xl border-4 transition-all ${newBenefitColor === colorOption.color
                        ? 'border-[#333333] scale-110'
                        : 'border-white hover:border-[#E0E0E0]'
                        }`}
                      style={{ backgroundColor: colorOption.color }}
                      title={colorOption.name}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-[#F8F8F8] rounded-xl p-4 border-2 border-[#E0E0E0]">
                <p className="text-[#333333] mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                  Vista previa:
                </p>
                <div className="flex items-center gap-3">
                  <span
                    className="px-4 py-2 rounded-full text-white"
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      backgroundColor: newBenefitColor
                    }}
                  >
                    {newBenefitName || 'Nombre del beneficio'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (newBenefitName.trim()) {
                    setCustomBenefits([
                      ...customBenefits,
                      {
                        id: newBenefitName.toLowerCase().replace(/\s+/g, '-'),
                        name: newBenefitName,
                        color: newBenefitColor
                      }
                    ]);
                    setNewBenefitName('');
                    setNewBenefitColor('#3B82F6');
                    setShowNewBenefitModal(false);
                  }
                }}
                disabled={!newBenefitName.trim()}
                className="flex-1 px-6 py-3 bg-[#017E49] text-white rounded-xl hover:bg-[#015A34] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontSize: '16px', fontWeight: 700 }}
              >
                Crear Beneficio
              </button>
              <button
                onClick={() => {
                  setShowNewBenefitModal(false);
                  setNewBenefitName('');
                  setNewBenefitColor('#3B82F6');
                }}
                className="px-6 py-3 bg-white text-[#333333] border-2 border-[#E0E0E0] rounded-xl hover:bg-[#F8F8F8] transition-colors"
                style={{ fontSize: '16px', fontWeight: 700 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Benefit Rules Configuration Modal */}
      {showBenefitRulesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-3xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-[#333333] mb-4" style={{ fontSize: '24px', fontWeight: 700 }}>
              Configurar Reglas de Asignación de Beneficios
            </h3>
            <p className="text-[#6B6B6B] mb-6" style={{ fontSize: '16px', lineHeight: '1.5' }}>
              Define qué tipo de beneficio se asignará automáticamente según el tipo de contrato del trabajador. Esto se aplicará al cargar la nómina.
            </p>

            {/* Show Custom Benefits */}
            {customBenefits.length > 0 && (
              <div className="bg-[#E8F5F1] rounded-xl p-4 border-2 border-[#017E49] mb-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#017E49] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#333333] mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                      Beneficios personalizados disponibles:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {customBenefits.map((benefit) => (
                        <span
                          key={benefit.id}
                          className="px-3 py-1 rounded-full text-white"
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            backgroundColor: benefit.color
                          }}
                        >
                          {benefit.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6 mb-8">
              {/* Indefinido */}
              <div className="bg-[#F8F8F8] rounded-xl p-6 border-2 border-[#E0E0E0]">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-[#333333] mb-1" style={{ fontSize: '18px', fontWeight: 500 }}>
                      Contrato Indefinido
                    </h4>
                    <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                      Trabajadores con contrato permanente a tiempo completo
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-[#017E49] text-white rounded-full" style={{ fontSize: '12px', fontWeight: 700 }}>
                    RECOMENDADO
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#017E49] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="indefinido"
                      value="Premium"
                      checked={benefitRules.indefinido === 'Premium'}
                      onChange={(e) => setBenefitRules({ ...benefitRules, indefinido: e.target.value })}
                      className="w-5 h-5 text-[#017E49] focus:ring-[#017E49]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Caja Premium</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Mayor valor</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#FF9F55] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="indefinido"
                      value="Estándar"
                      checked={benefitRules.indefinido === 'Estándar'}
                      onChange={(e) => setBenefitRules({ ...benefitRules, indefinido: e.target.value })}
                      className="w-5 h-5 text-[#FF9F55] focus:ring-[#FF9F55]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Caja Estándar</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Valor estándar</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#6B6B6B] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="indefinido"
                      value=""
                      checked={benefitRules.indefinido === ''}
                      onChange={(e) => setBenefitRules({ ...benefitRules, indefinido: e.target.value })}
                      className="w-5 h-5 text-[#6B6B6B] focus:ring-[#6B6B6B]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Sin beneficio</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>No aplica</p>
                    </div>
                  </label>
                  {customBenefits.map((benefit) => (
                    <label key={benefit.id} className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl cursor-pointer transition-colors" style={{ borderColor: benefitRules.indefinido === benefit.name ? benefit.color : '#E0E0E0' }}>
                      <input
                        type="radio"
                        name="indefinido"
                        value={benefit.name}
                        checked={benefitRules.indefinido === benefit.name}
                        onChange={(e) => setBenefitRules({ ...benefitRules, indefinido: e.target.value })}
                        className="w-5 h-5"
                        style={{ accentColor: benefit.color }}
                      />
                      <div>
                        <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>{benefit.name}</p>
                        <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Personalizado</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Plazo Fijo */}
              <div className="bg-[#F8F8F8] rounded-xl p-6 border-2 border-[#E0E0E0]">
                <div className="mb-4">
                  <h4 className="text-[#333333] mb-1" style={{ fontSize: '18px', fontWeight: 500 }}>
                    Contrato a Plazo Fijo
                  </h4>
                  <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                    Trabajadores con contrato temporal a tiempo completo
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#017E49] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="plazoFijo"
                      value="Premium"
                      checked={benefitRules.plazoFijo === 'Premium'}
                      onChange={(e) => setBenefitRules({ ...benefitRules, plazoFijo: e.target.value })}
                      className="w-5 h-5 text-[#017E49] focus:ring-[#017E49]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Caja Premium</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Mayor valor</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#FF9F55] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="plazoFijo"
                      value="Estándar"
                      checked={benefitRules.plazoFijo === 'Estándar'}
                      onChange={(e) => setBenefitRules({ ...benefitRules, plazoFijo: e.target.value })}
                      className="w-5 h-5 text-[#FF9F55] focus:ring-[#FF9F55]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Caja Estándar</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Valor estándar</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#6B6B6B] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="plazoFijo"
                      value=""
                      checked={benefitRules.plazoFijo === ''}
                      onChange={(e) => setBenefitRules({ ...benefitRules, plazoFijo: e.target.value })}
                      className="w-5 h-5 text-[#6B6B6B] focus:ring-[#6B6B6B]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Sin beneficio</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>No aplica</p>
                    </div>
                  </label>
                  {customBenefits.map((benefit) => (
                    <label key={benefit.id} className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl cursor-pointer transition-colors" style={{ borderColor: benefitRules.plazoFijo === benefit.name ? benefit.color : '#E0E0E0' }}>
                      <input
                        type="radio"
                        name="plazoFijo"
                        value={benefit.name}
                        checked={benefitRules.plazoFijo === benefit.name}
                        onChange={(e) => setBenefitRules({ ...benefitRules, plazoFijo: e.target.value })}
                        className="w-5 h-5"
                        style={{ accentColor: benefit.color }}
                      />
                      <div>
                        <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>{benefit.name}</p>
                        <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Personalizado</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Part Time */}
              <div className="bg-[#F8F8F8] rounded-xl p-6 border-2 border-[#E0E0E0]">
                <div className="mb-4">
                  <h4 className="text-[#333333] mb-1" style={{ fontSize: '18px', fontWeight: 500 }}>
                    Jornada Parcial (Part Time)
                  </h4>
                  <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                    Trabajadores con jornada reducida (menos de 40 horas semanales)
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#017E49] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="partTime"
                      value="Premium"
                      checked={benefitRules.partTime === 'Premium'}
                      onChange={(e) => setBenefitRules({ ...benefitRules, partTime: e.target.value })}
                      className="w-5 h-5 text-[#017E49] focus:ring-[#017E49]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Caja Premium</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Mayor valor</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#FF9F55] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="partTime"
                      value="Estándar"
                      checked={benefitRules.partTime === 'Estándar'}
                      onChange={(e) => setBenefitRules({ ...benefitRules, partTime: e.target.value })}
                      className="w-5 h-5 text-[#FF9F55] focus:ring-[#FF9F55]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Caja Estándar</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Valor estándar</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#6B6B6B] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="partTime"
                      value=""
                      checked={benefitRules.partTime === ''}
                      onChange={(e) => setBenefitRules({ ...benefitRules, partTime: e.target.value })}
                      className="w-5 h-5 text-[#6B6B6B] focus:ring-[#6B6B6B]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Sin beneficio</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>No aplica</p>
                    </div>
                  </label>
                  {customBenefits.map((benefit) => (
                    <label key={benefit.id} className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl cursor-pointer transition-colors" style={{ borderColor: benefitRules.partTime === benefit.name ? benefit.color : '#E0E0E0' }}>
                      <input
                        type="radio"
                        name="partTime"
                        value={benefit.name}
                        checked={benefitRules.partTime === benefit.name}
                        onChange={(e) => setBenefitRules({ ...benefitRules, partTime: e.target.value })}
                        className="w-5 h-5"
                        style={{ accentColor: benefit.color }}
                      />
                      <div>
                        <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>{benefit.name}</p>
                        <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Personalizado</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Honorarios */}
              <div className="bg-[#F8F8F8] rounded-xl p-6 border-2 border-[#E0E0E0]">
                <div className="mb-4">
                  <h4 className="text-[#333333] mb-1" style={{ fontSize: '18px', fontWeight: 500 }}>
                    Por Honorarios
                  </h4>
                  <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                    Trabajadores con boleta de honorarios (independientes)
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#017E49] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="honorarios"
                      value="Premium"
                      checked={benefitRules.honorarios === 'Premium'}
                      onChange={(e) => setBenefitRules({ ...benefitRules, honorarios: e.target.value })}
                      className="w-5 h-5 text-[#017E49] focus:ring-[#017E49]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Caja Premium</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Mayor valor</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#FF9F55] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="honorarios"
                      value="Estándar"
                      checked={benefitRules.honorarios === 'Estándar'}
                      onChange={(e) => setBenefitRules({ ...benefitRules, honorarios: e.target.value })}
                      className="w-5 h-5 text-[#FF9F55] focus:ring-[#FF9F55]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Caja Estándar</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Valor estándar</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#6B6B6B] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="honorarios"
                      value=""
                      checked={benefitRules.honorarios === ''}
                      onChange={(e) => setBenefitRules({ ...benefitRules, honorarios: e.target.value })}
                      className="w-5 h-5 text-[#6B6B6B] focus:ring-[#6B6B6B]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Sin beneficio</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>No aplica</p>
                    </div>
                  </label>
                  {customBenefits.map((benefit) => (
                    <label key={benefit.id} className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl cursor-pointer transition-colors" style={{ borderColor: benefitRules.honorarios === benefit.name ? benefit.color : '#E0E0E0' }}>
                      <input
                        type="radio"
                        name="honorarios"
                        value={benefit.name}
                        checked={benefitRules.honorarios === benefit.name}
                        onChange={(e) => setBenefitRules({ ...benefitRules, honorarios: e.target.value })}
                        className="w-5 h-5"
                        style={{ accentColor: benefit.color }}
                      />
                      <div>
                        <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>{benefit.name}</p>
                        <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Personalizado</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Practicante */}
              <div className="bg-[#F8F8F8] rounded-xl p-6 border-2 border-[#E0E0E0]">
                <div className="mb-4">
                  <h4 className="text-[#333333] mb-1" style={{ fontSize: '18px', fontWeight: 500 }}>
                    Practicante / Pasantía
                  </h4>
                  <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                    Estudiantes en práctica profesional o pasantía
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#017E49] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="practicante"
                      value="Premium"
                      checked={benefitRules.practicante === 'Premium'}
                      onChange={(e) => setBenefitRules({ ...benefitRules, practicante: e.target.value })}
                      className="w-5 h-5 text-[#017E49] focus:ring-[#017E49]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Caja Premium</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Mayor valor</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#FF9F55] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="practicante"
                      value="Estándar"
                      checked={benefitRules.practicante === 'Estándar'}
                      onChange={(e) => setBenefitRules({ ...benefitRules, practicante: e.target.value })}
                      className="w-5 h-5 text-[#FF9F55] focus:ring-[#FF9F55]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Caja Estándar</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Valor estándar</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#6B6B6B] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="practicante"
                      value=""
                      checked={benefitRules.practicante === ''}
                      onChange={(e) => setBenefitRules({ ...benefitRules, practicante: e.target.value })}
                      className="w-5 h-5 text-[#6B6B6B] focus:ring-[#6B6B6B]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Sin beneficio</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>No aplica</p>
                    </div>
                  </label>
                  {customBenefits.map((benefit) => (
                    <label key={benefit.id} className="flex items-center gap-3 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl cursor-pointer transition-colors" style={{ borderColor: benefitRules.practicante === benefit.name ? benefit.color : '#E0E0E0' }}>
                      <input
                        type="radio"
                        name="practicante"
                        value={benefit.name}
                        checked={benefitRules.practicante === benefit.name}
                        onChange={(e) => setBenefitRules({ ...benefitRules, practicante: e.target.value })}
                        className="w-5 h-5"
                        style={{ accentColor: benefit.color }}
                      />
                      <div>
                        <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>{benefit.name}</p>
                        <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Personalizado</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#E8F5F1] border-2 border-[#017E49] rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[#017E49] flex-shrink-0 mt-0.5" />
                <p className="text-[#333333]" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                  <strong>Importante:</strong> Estas reglas se aplicarán automáticamente al cargar la nómina. El sistema leerá la columna "Tipo de Contrato" del Excel y asignará el beneficio correspondiente.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBenefitRulesModal(false)}
                className="flex-1 px-6 py-3 bg-[#017E49] text-white rounded-xl hover:bg-[#015A34] transition-colors"
                style={{ fontSize: '16px', fontWeight: 700 }}
              >
                Guardar Configuración
              </button>
              <button
                onClick={() => setShowBenefitRulesModal(false)}
                className="px-6 py-3 bg-white text-[#333333] border-2 border-[#E0E0E0] rounded-xl hover:bg-[#F8F8F8] transition-colors"
                style={{ fontSize: '16px', fontWeight: 700 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl">
            <h3 className="text-[#333333] mb-6" style={{ fontSize: '24px', fontWeight: 700 }}>
              Cargar Nómina
            </h3>

            <div className="space-y-6 mb-6">
              <div className="border-2 border-dashed border-[#E0E0E0] rounded-xl p-8 text-center hover:border-[#E12019] transition-colors cursor-pointer">
                <Upload className="w-16 h-16 text-[#6B6B6B] mx-auto mb-4" />
                <p className="text-[#333333] mb-2" style={{ fontSize: '16px', fontWeight: 500 }}>
                  Arrastra tu archivo Excel aquí
                </p>
                <p className="text-[#6B6B6B] mb-4" style={{ fontSize: '14px' }}>
                  o haz clic para seleccionar
                </p>
                <button className="px-6 py-3 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors" style={{ fontSize: '16px', fontWeight: 700 }}>
                  Seleccionar archivo
                </button>
              </div>

              <div className="bg-[#E8F5F1] rounded-xl p-4 border-2 border-[#017E49] mb-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#017E49] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#333333] mb-1" style={{ fontSize: '14px', fontWeight: 500 }}>
                      Asignación automática de beneficios activada
                    </p>
                    <p className="text-[#6B6B6B]" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                      Los beneficios se asignarán automáticamente según las reglas configuradas para cada tipo de contrato.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#F8F8F8] rounded-xl p-4 border-2 border-[#E0E0E0]">
                <p className="text-[#333333] mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                  Formato requerido del archivo Excel:
                </p>
                <ul className="space-y-1 text-[#6B6B6B]" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                  <li>• Columna A: RUT (formato 12.345.678-9)</li>
                  <li>• Columna B: Nombre completo</li>
                  <li>• Columna C: Área</li>
                  <li>• Columna D: Sede</li>
                  <li>• <strong>Columna E: Tipo de contrato</strong> (Indefinido/Plazo Fijo/Part Time/Honorarios/Practicante)</li>
                  <li>• Columna F: Estado (Activo/Inactivo)</li>
                </ul>
                <p className="text-[#017E49] mt-3" style={{ fontSize: '13px', fontWeight: 500 }}>
                  ✓ El beneficio se asignará automáticamente según el tipo de contrato
                </p>
              </div>

              <button className="w-full text-[#E12019] hover:text-[#B51810]" style={{ fontSize: '14px', fontWeight: 500 }}>
                Descargar plantilla de ejemplo
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-6 py-3 bg-white text-[#333333] border-2 border-[#E0E0E0] rounded-xl hover:bg-[#F8F8F8] transition-colors"
                style={{ fontSize: '16px', fontWeight: 700 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Benefit Modal */}
      {showAssignModal && selectedWorker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-[#333333] mb-6" style={{ fontSize: '24px', fontWeight: 700 }}>
              Asignar Beneficio
            </h3>

            <div className="space-y-4 mb-6">
              <div className="bg-[#F8F8F8] rounded-xl p-4">
                <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Trabajador</p>
                <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>{selectedWorker.nombre}</p>
                <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>RUT: {selectedWorker.rut}</p>
              </div>

              <div>
                <label className="block text-[#333333] mb-3" style={{ fontSize: '16px', fontWeight: 500 }}>
                  Selecciona el tipo de beneficio
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-4 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#017E49] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="benefit"
                      value="Premium"
                      className="w-5 h-5 text-[#017E49] focus:ring-[#017E49]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Caja Premium</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '13px' }}>Productos seleccionados de mayor valor</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-4 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#FF9F55] cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="benefit"
                      value="Estándar"
                      className="w-5 h-5 text-[#FF9F55] focus:ring-[#FF9F55]"
                    />
                    <div>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Caja Estándar</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '13px' }}>Productos estándar de la empresa</p>
                    </div>
                  </label>
                  {customBenefits.map((benefit) => (
                    <label key={benefit.id} className="flex items-center gap-4 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl cursor-pointer transition-colors" style={{ borderColor: '#E0E0E0' }}>
                      <input
                        type="radio"
                        name="benefit"
                        value={benefit.name}
                        className="w-5 h-5"
                        style={{ accentColor: benefit.color }}
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>{benefit.name}</p>
                          <p className="text-[#6B6B6B]" style={{ fontSize: '13px' }}>Beneficio personalizado</p>
                        </div>
                        <span
                          className="px-3 py-1 rounded-full text-white text-center"
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            backgroundColor: benefit.color,
                            minWidth: '80px'
                          }}
                        >
                          {benefit.name}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 px-6 py-3 bg-[#017E49] text-white rounded-xl hover:bg-[#015A34] transition-colors"
                style={{ fontSize: '16px', fontWeight: 700 }}
              >
                Confirmar
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedWorker(null);
                }}
                className="flex-1 px-6 py-3 bg-white text-[#333333] border-2 border-[#E0E0E0] rounded-xl hover:bg-[#F8F8F8] transition-colors"
                style={{ fontSize: '16px', fontWeight: 700 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RetirosView() {
  const retiros = [
    { fecha: '09/11/2025', rut: '12.345.678-9', nombre: 'María González', tipo: 'Premium', guardia: 'Juan Pérez', estado: 'Entregado' },
    { fecha: '09/11/2025', rut: '98.765.432-1', nombre: 'Carlos Muñoz', tipo: 'Estándar', guardia: 'Juan Pérez', estado: 'Entregado' },
    { fecha: '09/11/2025', rut: '11.222.333-4', nombre: 'Ana Vargas', tipo: 'Premium', guardia: 'Juan Pérez', estado: 'Rechazado' },
    { fecha: '09/11/2025', rut: '55.666.777-8', nombre: 'Pedro Soto', tipo: 'Estándar', guardia: 'Juan Pérez', estado: 'Entregado' },
    { fecha: '09/11/2025', rut: '99.888.777-6', nombre: 'Laura Díaz', tipo: 'Premium', guardia: 'Juan Pérez', estado: 'Entregado' },
    { fecha: '08/11/2025', rut: '44.555.666-7', nombre: 'Roberto Morales', tipo: 'Estándar', guardia: 'María Torres', estado: 'Entregado' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[#333333]" style={{ fontSize: '24px', fontWeight: 500 }}>
          Detalle de retiros
        </h3>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white text-[#333333] border-2 border-[#E12019] rounded-xl hover:bg-[#F8F8F8] transition-colors" style={{ fontSize: '16px', fontWeight: 700 }}>
            <Filter className="w-5 h-5" />
            Filtros
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors" style={{ fontSize: '16px', fontWeight: 700 }}>
            <Download className="w-5 h-5" />
            Exportar
          </button>
        </div>
      </div>

      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8F8F8]">
              <tr>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Fecha</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>RUT</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Nombre</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Tipo de caja</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Guardia</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {retiros.map((retiro, index) => (
                <tr key={index} className="border-t border-[#E0E0E0]">
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{retiro.fecha}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{retiro.rut}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{retiro.nombre}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{retiro.tipo}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{retiro.guardia}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full uppercase ${retiro.estado === 'Entregado' ? 'bg-[#017E49]' : 'bg-[#E12019]'
                      } text-white`} style={{ fontSize: '12px', fontWeight: 700 }}>
                      {retiro.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t-2 border-[#E0E0E0] flex items-center justify-between">
          <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
            Mostrando 6 de 1,247 retiros
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border-2 border-[#E0E0E0] rounded-lg text-[#333333] hover:bg-[#F8F8F8]" style={{ fontSize: '14px' }}>
              Anterior
            </button>
            <button className="px-4 py-2 bg-[#E12019] text-white rounded-lg" style={{ fontSize: '14px', fontWeight: 500 }}>
              1
            </button>
            <button className="px-4 py-2 bg-white border-2 border-[#E0E0E0] rounded-lg text-[#333333] hover:bg-[#F8F8F8]" style={{ fontSize: '14px' }}>
              2
            </button>
            <button className="px-4 py-2 bg-white border-2 border-[#E0E0E0] rounded-lg text-[#333333] hover:bg-[#F8F8F8]" style={{ fontSize: '14px' }}>
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IncidenciasView() {
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [loading, setLoading] = useState(false);
  const [incidencias, setIncidencias] = useState<IncidenciaDTO[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listarIncidencias();
        if (active) setIncidencias(data);
      } catch { /* silencioso */ }
    })();
    return () => { active = false; };
  }, []);

  const handleResolve = async (codigo: string, nuevoEstado: 'en_proceso' | 'resuelta') => {
    setLoading(true);
    try {
      if (nuevoEstado === 'resuelta' && !resolution.trim()) {
        alert('Por favor ingresa una resolución antes de marcar como resuelta.');
        return;
      }
      if (nuevoEstado === 'resuelta') {
        await resolverIncidencia(codigo, resolution);
      } else {
        await cambiarEstadoIncidencia(codigo, nuevoEstado);
      }
      // Actualizar lista
      const updated = await listarIncidencias();
      setIncidencias(updated);
      setShowResolveModal(false);
      setSelectedIncident(null);
      setResolution('');
    } catch (err: any) {
      alert(`Error: ${err.detail || 'No se pudo actualizar la incidencia'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[#333333]" style={{ fontSize: '24px', fontWeight: 500 }}>
          Gestión y Resolución de Incidencias
        </h3>
        <button className="flex items-center gap-2 px-6 py-3 bg-white text-[#333333] border-2 border-[#E12019] rounded-xl hover:bg-[#F8F8F8] transition-colors" style={{ fontSize: '16px', fontWeight: 700 }}>
          <Filter className="w-5 h-5" />
          Filtros
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-4">
          <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Abiertas</p>
          <p className="text-[#E12019]" style={{ fontSize: '28px', fontWeight: 700 }}>{incidencias.filter(i => i.estado === 'abierta' || i.estado === 'pendiente').length}</p>
        </div>
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-4">
          <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>En proceso</p>
          <p className="text-[#FF9F55]" style={{ fontSize: '28px', fontWeight: 700 }}>{incidencias.filter(i => i.estado === 'en_proceso').length}</p>
        </div>
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-4">
          <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Resueltas hoy</p>
          <p className="text-[#017E49]" style={{ fontSize: '28px', fontWeight: 700 }}>{incidencias.filter(i => i.estado === 'resuelta' && i.resolved_at && new Date(i.resolved_at).toDateString() === new Date().toDateString()).length}</p>
        </div>
      </div>

      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8F8F8]">
              <tr>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Código</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Tipo</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Descripción</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Estado</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Fecha</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Creada por</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {incidencias.map((inc, index) => (
                <tr key={index} className="border-t border-[#E0E0E0] hover:bg-[#F8F8F8]">
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>{inc.codigo}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{inc.tipo}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px', maxWidth: '300px' }} title={inc.descripcion}>
                    {inc.descripcion?.slice(0, 60)}{inc.descripcion && inc.descripcion.length > 60 ? '...' : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full uppercase ${inc.estado === 'resuelta' ? 'bg-[#017E49]' :
                      inc.estado === 'en_proceso' ? 'bg-[#FF9F55]' :
                        'bg-[#E12019]'
                      } text-white`} style={{ fontSize: '12px', fontWeight: 700 }}>
                      {inc.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[#333333]" style={{ fontSize: '14px' }}>{new Date(inc.created_at).toLocaleDateString('es-CL')}</p>
                    <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>{new Date(inc.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{inc.creada_por}</td>
                  <td className="px-6 py-4">
                    {inc.estado !== 'resuelta' && (
                      <button
                        onClick={() => {
                          setSelectedIncident(inc);
                          setShowResolveModal(true);
                        }}
                        className="text-[#E12019] hover:text-[#B51810]"
                        style={{ fontSize: '14px', fontWeight: 500 }}
                      >
                        Resolver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t-2 border-[#E0E0E0] flex items-center justify-between">
          <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
            Mostrando 5 de 47 incidencias
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border-2 border-[#E0E0E0] rounded-lg text-[#333333] hover:bg-[#F8F8F8]" style={{ fontSize: '14px' }}>
              Anterior
            </button>
            <button className="px-4 py-2 bg-[#E12019] text-white rounded-lg" style={{ fontSize: '14px', fontWeight: 500 }}>
              1
            </button>
            <button className="px-4 py-2 bg-white border-2 border-[#E0E0E0] rounded-lg text-[#333333] hover:bg-[#F8F8F8]" style={{ fontSize: '14px' }}>
              2
            </button>
            <button className="px-4 py-2 bg-white border-2 border-[#E0E0E0] rounded-lg text-[#333333] hover:bg-[#F8F8F8]" style={{ fontSize: '14px' }}>
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Resolve Incident Modal */}
      {
        showResolveModal && selectedIncident && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-[#333333] mb-6" style={{ fontSize: '24px', fontWeight: 700 }}>
                Resolver Incidencia {selectedIncident.id}
              </h3>

              <div className="space-y-6 mb-6">
                {/* Incident Details */}
                <div className="bg-[#F8F8F8] rounded-xl p-6 border-2 border-[#E0E0E0]">
                  <h4 className="text-[#333333] mb-4" style={{ fontSize: '18px', fontWeight: 500 }}>
                    Detalles de la incidencia
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Tipo</p>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>{selectedIncident.tipo}</p>
                    </div>
                    <div>
                      <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Estado actual</p>
                      <span className={`inline-block px-3 py-1 rounded-full uppercase ${selectedIncident.estado === 'En proceso' ? 'bg-[#FF9F55]' : 'bg-[#E12019]'
                        } text-white`} style={{ fontSize: '12px', fontWeight: 700 }}>
                        {selectedIncident.estado}
                      </span>
                    </div>
                    <div>
                      <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Trabajador afectado</p>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>{selectedIncident.trabajador}</p>
                      {selectedIncident.rut !== 'N/A' && (
                        <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>{selectedIncident.rut}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Reportado por</p>
                      <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>{selectedIncident.guardia}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Descripción</p>
                      <p className="text-[#333333]" style={{ fontSize: '16px' }}>{selectedIncident.descripcion}</p>
                    </div>
                  </div>
                </div>

                {/* Resolution Section */}
                <div>
                  <label className="block text-[#333333] mb-3" style={{ fontSize: '18px', fontWeight: 500 }}>
                    Resolución de la incidencia
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Describe la solución aplicada y las acciones tomadas..."
                    className="w-full h-32 px-4 py-3 bg-white border-2 border-[#E0E0E0] rounded-xl text-[#333333] placeholder:text-[#6B6B6B] focus:border-[#017E49] focus:outline-none resize-none"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                {/* Quick Actions for Common Issues */}
                <div>
                  <p className="text-[#333333] mb-3" style={{ fontSize: '16px', fontWeight: 500 }}>
                    Acciones rápidas
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-3 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#017E49] transition-colors text-left">
                      <p className="text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Reenviar ticket</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Enviar nuevo ticket al trabajador</p>
                    </button>
                    <button className="p-3 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#017E49] transition-colors text-left">
                      <p className="text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Cambiar beneficio</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Modificar asignación de beneficio</p>
                    </button>
                    <button className="p-3 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#017E49] transition-colors text-left">
                      <p className="text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Autorizar retiro manual</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Aprobar entrega sin ticket</p>
                    </button>
                    <button className="p-3 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#017E49] transition-colors text-left">
                      <p className="text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Escalar a TI</p>
                      <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Problema técnico del sistema</p>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleResolve(selectedIncident.codigo, 'resuelta')}
                  disabled={loading || !resolution.trim()}
                  className="flex-1 px-6 py-4 bg-[#017E49] text-white rounded-xl hover:bg-[#015A34] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontSize: '18px', fontWeight: 700 }}
                >
                  {loading ? 'Guardando...' : 'Marcar como Resuelta'}
                </button>
                <button
                  onClick={() => handleResolve(selectedIncident.codigo, 'en_proceso')}
                  disabled={loading}
                  className="px-6 py-4 bg-[#FF9F55] text-white rounded-xl hover:bg-[#E88D44] transition-colors disabled:opacity-50"
                  style={{ fontSize: '18px', fontWeight: 700 }}
                >
                  {loading ? 'Guardando...' : 'En Proceso'}
                </button>
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setSelectedIncident(null);
                    setResolution('');
                  }}
                  disabled={loading}
                  className="px-6 py-4 bg-white text-[#333333] border-2 border-[#E0E0E0] rounded-xl hover:bg-[#F8F8F8] transition-colors disabled:opacity-50"
                  style={{ fontSize: '18px', fontWeight: 700 }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
