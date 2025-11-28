import { useState, useEffect } from 'react';
import { Scan, Package, Clock, AlertOctagon, History, User, Eye, EyeOff, AlertCircle, BarChart3, CheckCircle2 } from 'lucide-react';
import { estadoTicket, validarTicketGuardia, TicketDTO, MetricasGuardiaDTO } from '../services/api';
import { useMetricasGuardia } from '../hooks/useMetricasGuardia';

type GuardiaScreen = 'login' | 'dashboard';
type DashboardTab = 'scanner' | 'incidents' | 'metrics';

export function GuardiaModule() {
  const [currentScreen, setCurrentScreen] = useState<GuardiaScreen>('login');
  const [currentTab, setCurrentTab] = useState<DashboardTab>('scanner');
  const [showPassword, setShowPassword] = useState(false);
  const [hasScannedTicket, setHasScannedTicket] = useState(false);
  const [isExpiredTicket, setIsExpiredTicket] = useState(false);
  const [ticketUUID, setTicketUUID] = useState('');
  const [ticketData, setTicketData] = useState<TicketDTO | null>(null);
  const [validating, setValidating] = useState(false);
  // Poll métricas cada 15s solo si estamos en dashboard (hook maneja ciclo interno)
  const { metricas } = useMetricasGuardia(15000);

  const handleLogin = () => {
    setCurrentScreen('dashboard');
  };

  if (currentScreen === 'login') {
    return <GuardiaLogin onLogin={handleLogin} showPassword={showPassword} setShowPassword={setShowPassword} />;
  }

  return (
    <GuardiaDashboard
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      hasScannedTicket={hasScannedTicket}
      setHasScannedTicket={setHasScannedTicket}
      isExpiredTicket={isExpiredTicket}
      setIsExpiredTicket={setIsExpiredTicket}
      ticketUUID={ticketUUID}
      setTicketUUID={setTicketUUID}
      ticketData={ticketData}
      setTicketData={setTicketData}
      validating={validating}
      setValidating={setValidating}
      metrics={metricas}
      onLogout={() => setCurrentScreen('login')}
    />
  );
}

function GuardiaLogin({
  onLogin,
  showPassword,
  setShowPassword
}: {
  onLogin: () => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[#333333] mb-2">Panel de Guardia - Login</h2>
        <p className="text-[#6B6B6B]">
          Vista de inicio de sesión para el personal de portería (1440×900)
        </p>
      </div>

      {/* Login Screen */}
      <div className="bg-[#F8F8F8] rounded-xl p-12 min-h-[600px] flex items-center justify-center">
        <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-12 w-full max-w-md shadow-lg">
          {/* Logo */}
          <div className="w-20 h-20 bg-gradient-to-br from-[#E12019] to-[#B51810] rounded-xl flex items-center justify-center mx-auto mb-8">
            <span className="text-white" style={{ fontSize: '24px', fontWeight: 700 }}>TML</span>
          </div>

          <h2 className="text-[#333333] text-center mb-8" style={{ fontSize: '30px', fontWeight: 700 }}>
            Panel de Guardia
          </h2>

          {/* Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-[#333333] mb-2" style={{ fontSize: '16px', fontWeight: 500 }}>
                Usuario
              </label>
              <input
                type="text"
                placeholder="Ingrese su usuario"
                className="w-full px-4 py-3 bg-white border-2 border-[#E0E0E0] rounded-xl text-[#333333] placeholder:text-[#6B6B6B] focus:border-[#E12019] focus:outline-none"
                style={{ fontSize: '16px' }}
              />
            </div>

            <div>
              <label className="block text-[#333333] mb-2" style={{ fontSize: '16px', fontWeight: 500 }}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingrese su contraseña"
                  className="w-full px-4 py-3 bg-white border-2 border-[#E0E0E0] rounded-xl text-[#333333] placeholder:text-[#6B6B6B] focus:border-[#E12019] focus:outline-none pr-12"
                  style={{ fontSize: '16px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#333333]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={onLogin}
              className="w-full px-8 py-4 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors"
              style={{ fontSize: '18px', fontWeight: 700, minHeight: '56px' }}
            >
              Iniciar sesión
            </button>

            <div className="text-center">
              <a href="#" className="text-[#E12019] hover:text-[#B51810]" style={{ fontSize: '14px' }}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GuardiaDashboard({
  currentTab,
  setCurrentTab,
  hasScannedTicket,
  setHasScannedTicket,
  isExpiredTicket,
  setIsExpiredTicket,
  ticketUUID,
  setTicketUUID,
  ticketData,
  setTicketData,
  validating,
  setValidating,
  metrics,
  onLogout
}: {
  currentTab: DashboardTab;
  setCurrentTab: (tab: DashboardTab) => void;
  hasScannedTicket: boolean;
  setHasScannedTicket: (scanned: boolean) => void;
  isExpiredTicket: boolean;
  setIsExpiredTicket: (expired: boolean) => void;
  ticketUUID: string;
  setTicketUUID: (v: string) => void;
  ticketData: TicketDTO | null;
  setTicketData: (d: TicketDTO | null) => void;
  validating: boolean;
  setValidating: (b: boolean) => void;
  metrics: MetricasGuardiaDTO | null;
  onLogout: () => void;
}) {
  const tabs = [
    { id: 'scanner', label: 'Escanear Ticket', icon: Scan },
    { id: 'incidents', label: 'Reportar Incidencia', icon: AlertCircle },
    { id: 'metrics', label: 'Métricas y Gestión', icon: BarChart3 },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[#333333] mb-2">Panel de Guardia - Dashboard</h2>
        <p className="text-[#6B6B6B]">
          Panel principal para el personal de portería (1440×900)
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
                Tres Montes Lucchetti – Portería Digital
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#E0E0E0] rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-[#6B6B6B]" />
                </div>
                <span className="text-[#333333]" style={{ fontSize: '16px' }}>
                  Juan Pérez (Guardia)
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

        {/* Tabs */}
        <div className="bg-[#F8F8F8] border-b-2 border-[#E0E0E0]">
          <div className="flex px-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 border-b-4 transition-all ${isActive
                    ? 'border-[#E12019] bg-white text-[#333333]'
                    : 'border-transparent text-[#6B6B6B] hover:text-[#333333] hover:bg-white/50'
                    }`}
                  style={{ fontSize: '16px', fontWeight: isActive ? 500 : 400 }}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#E12019]' : 'text-[#6B6B6B]'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <main className="p-8 min-h-[600px]">
          {currentTab === 'scanner' && (
            <ScannerView
              hasScannedTicket={hasScannedTicket}
              isExpiredTicket={isExpiredTicket}
              ticketUUID={ticketUUID}
              setTicketUUID={setTicketUUID}
              ticketData={ticketData}
              validating={validating}
              onValidate={async () => {
                if (!ticketUUID) return;
                setValidating(true);
                try {
                  const data = await validarTicketGuardia(ticketUUID);
                  setTicketData(data);
                  setHasScannedTicket(true);
                  setIsExpiredTicket(false);
                } catch (e: any) {
                  if (e.detail?.includes('expirado')) {
                    setIsExpiredTicket(true);
                  }
                } finally {
                  setValidating(false);
                }
              }}
              onFetchEstado={async () => {
                if (!ticketUUID) return;
                try {
                  const data = await estadoTicket(ticketUUID);
                  setTicketData(data);
                  setHasScannedTicket(true);
                  if (data.estado === 'expirado') setIsExpiredTicket(true);
                } catch {
                  setTicketData(null);
                }
              }}
              onReset={() => {
                setHasScannedTicket(false);
                setIsExpiredTicket(false);
                setTicketUUID('');
                setTicketData(null);
              }}
            />
          )}
          {currentTab === 'incidents' && <IncidentReportView />}
          {currentTab === 'metrics' && <MetricsPanel />}
        </main>
      </div>
    </div>
  );
}

function ScannerView({
  hasScannedTicket,
  isExpiredTicket,
  ticketUUID,
  setTicketUUID,
  ticketData,
  validating,
  onValidate,
  onFetchEstado,
  onReset
}: {
  hasScannedTicket: boolean;
  isExpiredTicket: boolean;
  ticketUUID: string;
  setTicketUUID: (v: string) => void;
  ticketData: TicketDTO | null;
  validating: boolean;
  onValidate: () => void;
  onFetchEstado: () => void;
  onReset: () => void;
}) {
  const [ticketCode, setTicketCode] = useState('');
  const [timeLeftSec, setTimeLeftSec] = useState<number | null>(null);

  // Countdown dinámico basado en ttl_expira_at del ticket.
  useEffect(() => {
    if (!ticketData?.ttl_expira_at) {
      setTimeLeftSec(null);
      return;
    }
    const expMs = Date.parse(ticketData.ttl_expira_at);
    function calc() {
      const diff = Math.max(0, Math.floor((expMs - Date.now()) / 1000));
      setTimeLeftSec(diff);
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [ticketData?.ttl_expira_at]);

  const formattedCountdown = timeLeftSec !== null
    ? `${String(Math.floor(timeLeftSec / 60)).padStart(2, '0')}:${String(timeLeftSec % 60).padStart(2, '0')}`
    : null;

  if (isExpiredTicket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-full max-w-2xl">
          {/* Expired Ticket Card */}
          <div className="bg-white border-4 border-[#FF9F55] rounded-xl p-12 mb-6 text-center">
            <div className="w-32 h-32 bg-[#FF9F55] rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-16 h-16 text-white" />
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700 }} className="text-[#333333] mb-4">
              Ticket Caducado
            </div>
            <p className="text-[#6B6B6B] mb-6 max-w-md mx-auto" style={{ fontSize: '16px', lineHeight: '1.5' }}>
              Este ticket ha expirado y ya no es válido para retiro. El trabajador debe generar un nuevo ticket desde el tótem.
            </p>

            {/* Ticket Details */}
            <div className="bg-[#FFF4E6] border-2 border-[#FF9F55] rounded-xl p-6 mb-8">
              <div className="grid grid-cols-2 gap-6 text-left">
                <div>
                  <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Código del ticket</p>
                  <p className="text-[#333333]" style={{ fontSize: '18px', fontWeight: 700 }}>TML-2025-0042</p>
                </div>
                <div>
                  <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Trabajador</p>
                  <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Carlos Ramírez</p>
                </div>
                <div>
                  <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Fecha de generación</p>
                  <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>08/11/2025 10:30</p>
                </div>
                <div>
                  <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Fecha de vencimiento</p>
                  <p className="text-[#E12019]" style={{ fontSize: '16px', fontWeight: 700 }}>08/11/2025 18:00</p>
                </div>
                <div>
                  <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Tipo de beneficio</p>
                  <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Caja Premium</p>
                </div>
                <div>
                  <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Estado</p>
                  <span className="inline-block px-3 py-1 bg-[#FF9F55] text-white rounded-full uppercase" style={{ fontSize: '12px', fontWeight: 700 }}>
                    CADUCADO
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Notice */}
            <div className="bg-[#FFF4E6] border-2 border-[#FF9F55] rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#FF9F55] flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-[#333333] mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Razón de caducidad
                  </p>
                  <p className="text-[#6B6B6B]" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                    Los tickets tienen validez solo para el día de generación. Este ticket fue generado para el día 08/11/2025 y no puede ser utilizado después de las 18:00 hrs.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={onReset}
                className="px-8 py-4 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors"
                style={{ fontSize: '16px', fontWeight: 700 }}
              >
                Escanear otro ticket
              </button>
            </div>
          </div>

          {/* Help Notice */}
          <div className="bg-[#F8F8F8] border-2 border-[#E0E0E0] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#017E49] flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-[#333333] mb-1" style={{ fontSize: '14px', fontWeight: 500 }}>
                  ¿Qué debe hacer el trabajador?
                </p>
                <p className="text-[#6B6B6B]" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                  El trabajador debe acercarse al tótem de autoservicio y generar un nuevo ticket válido para hoy. Si tiene problemas, puede reportar una incidencia desde el tótem.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasScannedTicket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-full max-w-2xl">
          {/* Scanner Area */}
          <div className="bg-white border-4 border-dashed border-[#017E49] rounded-xl p-16 mb-6">
            <div className="flex flex-col items-center">
              <Scan className="w-40 h-40 text-[#017E49] mb-6 animate-pulse" />
              <div style={{ fontSize: '32px', fontWeight: 700 }} className="text-[#333333] mb-3 text-center">
                Escanea el ticket QR
              </div>
              <p className="text-[#6B6B6B] text-center max-w-md" style={{ fontSize: '16px', lineHeight: '1.5' }}>
                Coloca el código QR del ticket frente al lector para validar el retiro
              </p>
            </div>
          </div>

          {/* Manual Code Entry */}
          <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6 mb-6">
            <p className="text-[#333333] mb-4" style={{ fontSize: '18px', fontWeight: 500 }}>
              O ingresa el código del ticket impreso
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={ticketUUID}
                onChange={(e) => setTicketUUID(e.target.value.trim())}
                placeholder="UUID Ticket"
                className="flex-1 px-4 py-3 bg-white border-2 border-[#E0E0E0] rounded-xl text-[#333333] placeholder:text-[#6B6B6B] focus:border-[#017E49] focus:outline-none"
                style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '0.05em' }}
              />
              <button
                onClick={onFetchEstado}
                disabled={!ticketUUID || validating}
                className="px-6 py-3 bg-[#6B6B6B] text-white rounded-xl hover:bg-[#4B4B4B] transition-colors disabled:opacity-50"
                style={{ fontSize: '14px', fontWeight: 700 }}
              >
                Estado
              </button>
              <button
                onClick={onValidate}
                disabled={!ticketUUID || validating}
                className="px-6 py-3 bg-[#017E49] text-white rounded-xl hover:bg-[#015A34] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontSize: '14px', fontWeight: 700 }}
              >
                {validating ? 'Validando...' : 'Validar'}
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-[#F8F8F8] rounded-xl p-6 border-2 border-[#E0E0E0]">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-[#017E49] flex-shrink-0 mt-1" />
              <div>
                <p className="text-[#333333] mb-2" style={{ fontSize: '16px', fontWeight: 500 }}>
                  Instrucciones
                </p>
                <ul className="space-y-1 text-[#6B6B6B]" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                  <li>• Verifica que el ticket esté dentro del plazo de validez (30 minutos)</li>
                  <li>• Al escanear, se mostrará la información del trabajador y tipo de beneficio</li>
                  <li>• Entrega el beneficio solo si el ticket es aprobado</li>
                  <li>• Si el QR no funciona, ingresa manualmente el código impreso en el ticket</li>
                </ul>
                {ticketData && (
                  <div className="mt-4 p-4 bg-white border rounded-xl">
                    <p className="text-[#333333]" style={{ fontSize: '14px', fontWeight: 600 }}>Datos Ticket:</p>
                    <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Estado: {ticketData.estado}</p>
                    <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>Trabajador: {ticketData.trabajador?.nombre} ({ticketData.trabajador?.rut})</p>
                    <button onClick={onReset} className="mt-2 text-[#E12019] text-sm underline">Limpiar</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Countdown dinámico si existe TTL */}
          {ticketData?.ttl_expira_at && (
            <div className="mt-6 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl flex items-center justify-between">
              <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Tiempo restante de validez:</p>
              <span className={`px-4 py-2 rounded-full text-white font-bold text-sm ${timeLeftSec !== null && timeLeftSec <= 60 ? 'bg-[#E12019]' : 'bg-[#017E49]'}`}>{formattedCountdown}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Ticket scanned - show validation result
  function MetricsView({ metrics }: { metrics: MetricasGuardiaDTO | null }) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-[#017E49]" />
                <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Tickets Validados</p>
              </div>
              <p className="text-[#333333]" style={{ fontSize: '36px', fontWeight: 700 }}>{metrics?.entregados ?? '-'}</p>
            </div>
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-6 h-6 text-[#FF9F55]" />
                <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Pendientes</p>
              </div>
              <p className="text-[#333333]" style={{ fontSize: '36px', fontWeight: 700 }}>{metrics?.pendientes ?? '-'}</p>
            </div>
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertOctagon className="w-6 h-6 text-[#E12019]" />
                <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>Incidencias abiertas</p>
              </div>
              <p className="text-[#333333]" style={{ fontSize: '36px', fontWeight: 700 }}>{metrics?.incidencias_pendientes ?? '-'}</p>
            </div>
          </div>
          <div className="bg-[#F8F8F8] rounded-xl p-4 border-2 border-[#E0E0E0]">
            <div className="flex items-start gap-3">
              <History className="w-5 h-5 text-[#017E49] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[#333333] mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                  Notas sobre métricas
                </p>
                <p className="text-[#6B6B6B]" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                  Datos obtenidos en tiempo real desde el endpoint /api/metricas/guardia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // (Bloque de detalles estático eliminado en integración API)
}

function IncidentReportView() {
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');

  const incidentTypes = [
    'Ticket ilegible o dañado',
    'Trabajador sin ticket',
    'Beneficio incorrecto',
    'Sistema caído',
    'Otro problema'
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h3 className="text-[#333333] mb-6" style={{ fontSize: '24px', fontWeight: 500 }}>
        Reportar Incidencia
      </h3>

      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-8">
        {/* Type Selection */}
        <div className="mb-8">
          <label className="block text-[#333333] mb-4" style={{ fontSize: '18px', fontWeight: 500 }}>
            Tipo de incidencia
          </label>
          <div className="space-y-3">
            {incidentTypes.map((type) => (
              <label
                key={type}
                className="flex items-center gap-4 p-4 bg-white border-2 border-[#E0E0E0] rounded-xl hover:border-[#E12019] cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="incident-type"
                  value={type}
                  checked={selectedType === type}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-6 h-6 text-[#E12019] focus:ring-[#E12019]"
                />
                <span className="text-[#333333]" style={{ fontSize: '16px' }}>
                  {type}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <label className="block text-[#333333] mb-4" style={{ fontSize: '18px', fontWeight: 500 }}>
            Descripción del problema
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe la situación con el mayor detalle posible..."
            className="w-full h-32 px-4 py-3 bg-white border-2 border-[#E0E0E0] rounded-xl text-[#333333] placeholder:text-[#6B6B6B] focus:border-[#E12019] focus:outline-none resize-none"
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Worker Info (Optional) */}
        <div className="mb-8">
          <label className="block text-[#333333] mb-4" style={{ fontSize: '18px', fontWeight: 500 }}>
            RUT del trabajador (opcional)
          </label>
          <input
            type="text"
            placeholder="Ej: 12.345.678-9"
            className="w-full px-4 py-3 bg-white border-2 border-[#E0E0E0] rounded-xl text-[#333333] placeholder:text-[#6B6B6B] focus:border-[#E12019] focus:outline-none"
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            disabled={!selectedType}
            className="flex-1 px-8 py-4 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontSize: '18px', fontWeight: 700, minHeight: '56px' }}
          >
            Enviar Incidencia
          </button>
          <button
            className="px-8 py-4 bg-white text-[#333333] border-2 border-[#E12019] rounded-xl hover:bg-[#F8F8F8] transition-colors"
            style={{ fontSize: '18px', fontWeight: 700, minHeight: '56px' }}
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-6 bg-[#F8F8F8] rounded-xl p-4 border-2 border-[#E0E0E0]">
        <p className="text-[#6B6B6B]" style={{ fontSize: '14px', lineHeight: '1.5' }}>
          La incidencia será enviada inmediatamente a RRHH. Recibirás un número de seguimiento para consultar el estado.
        </p>
      </div>
    </div>
  );
}

function MetricsPanel() {
  const [selectedView, setSelectedView] = useState<'stock' | 'shift' | 'history' | 'sos'>('stock');

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex gap-3 border-b-2 border-[#E0E0E0] pb-4">
        <button
          onClick={() => setSelectedView('stock')}
          className={`px-6 py-3 rounded-xl transition-colors ${selectedView === 'stock'
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          Stock
        </button>
        <button
          onClick={() => setSelectedView('shift')}
          className={`px-6 py-3 rounded-xl transition-colors ${selectedView === 'shift'
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          Mi Turno
        </button>
        <button
          onClick={() => setSelectedView('history')}
          className={`px-6 py-3 rounded-xl transition-colors ${selectedView === 'history'
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          Historial
        </button>
        <button
          onClick={() => setSelectedView('sos')}
          className={`px-6 py-3 rounded-xl transition-colors ${selectedView === 'sos'
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          SOS
        </button>
      </div>

      {/* Content */}
      {selectedView === 'stock' && <StockView />}
      {selectedView === 'shift' && <ShiftView />}
      {selectedView === 'history' && <HistoryView />}
      {selectedView === 'sos' && <SOSView />}
    </div>
  );
}

function StockView() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedBoxType, setSelectedBoxType] = useState<'Estándar' | 'Premium'>('Estándar');
  const [quantity, setQuantity] = useState('');
  const [observation, setObservation] = useState('');

  const stockData = [
    { label: 'Disponible', value: '142', color: '#017E49' },
    { label: 'Entregadas hoy', value: '58', color: '#E12019' },
    { label: 'Reservadas', value: '23', color: '#FF9F55' },
    { label: 'Total mes', value: '1,247', color: '#333333' },
  ];

  const stockLog = [
    { fecha: '09/11/2025', hora: '14:30', tipo: 'Premium', accion: 'Agregado', cantidad: '+20', motivo: 'Reabastecimiento semanal programado', usuario: 'Juan Pérez' },
    { fecha: '09/11/2025', hora: '11:15', tipo: 'Estándar', accion: 'Retirado', cantidad: '-5', motivo: 'Cajas dañadas durante transporte', usuario: 'Juan Pérez' },
    { fecha: '08/11/2025', hora: '16:45', tipo: 'Premium', accion: 'Agregado', cantidad: '+15', motivo: 'Ajuste por inventario físico', usuario: 'María Silva' },
    { fecha: '08/11/2025', hora: '09:00', tipo: 'Estándar', accion: 'Agregado', cantidad: '+50', motivo: 'Ingreso de nueva carga', usuario: 'María Silva' },
  ];

  const handleSubmit = (action: 'add' | 'remove') => {
    // Here would be the logic to submit
    setShowAddModal(false);
    setShowRemoveModal(false);
    setQuantity('');
    setObservation('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[#333333]" style={{ fontSize: '24px', fontWeight: 500 }}>
          Gestión de Stock
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-[#017E49] text-white rounded-xl hover:bg-[#015A34] transition-colors"
            style={{ fontSize: '16px', fontWeight: 700 }}
          >
            + Agregar Stock
          </button>
          <button
            onClick={() => setShowRemoveModal(true)}
            className="px-6 py-3 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors"
            style={{ fontSize: '16px', fontWeight: 700 }}
          >
            - Retirar Stock
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stockData.map((item, index) => (
          <div key={index} className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
            <p className="text-[#6B6B6B] mb-2" style={{ fontSize: '14px' }}>
              {item.label}
            </p>
            <p className="text-[#333333]" style={{ fontSize: '36px', fontWeight: 700, color: item.color }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
        <h4 className="text-[#333333] mb-4" style={{ fontSize: '18px', fontWeight: 500 }}>
          Stock por tipo de caja
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#F8F8F8] rounded-xl">
            <span className="text-[#333333]" style={{ fontSize: '16px' }}>Caja Estándar</span>
            <span className="text-[#333333]" style={{ fontSize: '20px', fontWeight: 700 }}>87</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#F8F8F8] rounded-xl">
            <span className="text-[#333333]" style={{ fontSize: '16px' }}>Caja Premium</span>
            <span className="text-[#333333]" style={{ fontSize: '20px', fontWeight: 700 }}>55</span>
          </div>
        </div>
      </div>

      {/* Stock Log Table */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b-2 border-[#E0E0E0] flex items-center justify-between">
          <h4 className="text-[#333333]" style={{ fontSize: '18px', fontWeight: 500 }}>
            Historial de movimientos de stock
          </h4>
          <button className="px-4 py-2 text-[#E12019] hover:bg-[#F8F8F8] rounded-lg transition-colors" style={{ fontSize: '14px', fontWeight: 500 }}>
            Exportar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8F8F8]">
              <tr>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Fecha</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Hora</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Tipo</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Acción</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Cantidad</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Motivo</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {stockLog.map((item, index) => (
                <tr key={index} className="border-t border-[#E0E0E0]">
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{item.fecha}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{item.hora}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{item.tipo}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full uppercase ${item.accion === 'Agregado' ? 'bg-[#017E49]' : 'bg-[#E12019]'
                      } text-white`} style={{ fontSize: '12px', fontWeight: 700 }}>
                      {item.accion}
                    </span>
                  </td>
                  <td className="px-6 py-4" style={{ fontSize: '14px' }}>
                    <span className={item.cantidad.startsWith('+') ? 'text-[#017E49]' : 'text-[#E12019]'} style={{ fontWeight: 700 }}>
                      {item.cantidad}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{item.motivo}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{item.usuario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-[#333333] mb-6" style={{ fontSize: '24px', fontWeight: 700 }}>
              Agregar Stock
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[#333333] mb-2" style={{ fontSize: '16px', fontWeight: 500 }}>
                  Tipo de caja
                </label>
                <select
                  value={selectedBoxType}
                  onChange={(e) => setSelectedBoxType(e.target.value as 'Estándar' | 'Premium')}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E0E0E0] rounded-xl text-[#333333] focus:border-[#017E49] focus:outline-none"
                  style={{ fontSize: '16px' }}
                >
                  <option value="Estándar">Caja Estándar</option>
                  <option value="Premium">Caja Premium</option>
                </select>
              </div>

              <div>
                <label className="block text-[#333333] mb-2" style={{ fontSize: '16px', fontWeight: 500 }}>
                  Cantidad a agregar
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ej: 20"
                  className="w-full px-4 py-3 bg-white border-2 border-[#E0E0E0] rounded-xl text-[#333333] placeholder:text-[#6B6B6B] focus:border-[#017E49] focus:outline-none"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <label className="block text-[#333333] mb-2" style={{ fontSize: '16px', fontWeight: 500 }}>
                  Motivo / Observación
                </label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ej: Reabastecimiento semanal programado"
                  className="w-full h-24 px-4 py-3 bg-white border-2 border-[#E0E0E0] rounded-xl text-[#333333] placeholder:text-[#6B6B6B] focus:border-[#017E49] focus:outline-none resize-none"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit('add')}
                disabled={!quantity || !observation}
                className="flex-1 px-6 py-3 bg-[#017E49] text-white rounded-xl hover:bg-[#015A34] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontSize: '16px', fontWeight: 700 }}
              >
                Confirmar
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setQuantity('');
                  setObservation('');
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

      {/* Remove Stock Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-[#333333] mb-6" style={{ fontSize: '24px', fontWeight: 700 }}>
              Retirar Stock
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[#333333] mb-2" style={{ fontSize: '16px', fontWeight: 500 }}>
                  Tipo de caja
                </label>
                <select
                  value={selectedBoxType}
                  onChange={(e) => setSelectedBoxType(e.target.value as 'Estándar' | 'Premium')}
                  className="w-full px-4 py-3 bg-white border-2 border-[#E0E0E0] rounded-xl text-[#333333] focus:border-[#E12019] focus:outline-none"
                  style={{ fontSize: '16px' }}
                >
                  <option value="Estándar">Caja Estándar</option>
                  <option value="Premium">Caja Premium</option>
                </select>
              </div>

              <div>
                <label className="block text-[#333333] mb-2" style={{ fontSize: '16px', fontWeight: 500 }}>
                  Cantidad a retirar
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ej: 5"
                  className="w-full px-4 py-3 bg-white border-2 border-[#E0E0E0] rounded-xl text-[#333333] placeholder:text-[#6B6B6B] focus:border-[#E12019] focus:outline-none"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <label className="block text-[#333333] mb-2" style={{ fontSize: '16px', fontWeight: 500 }}>
                  Motivo / Observación (Requerido)
                </label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ej: Cajas dañadas durante transporte"
                  className="w-full h-24 px-4 py-3 bg-white border-2 border-[#E0E0E0] rounded-xl text-[#333333] placeholder:text-[#6B6B6B] focus:border-[#E12019] focus:outline-none resize-none"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div className="bg-[#FFF4E6] border-2 border-[#FF9F55] rounded-xl p-4">
                <p className="text-[#333333]" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                  <strong>Importante:</strong> El retiro de stock requiere justificación obligatoria y quedará registrado en el historial.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit('remove')}
                disabled={!quantity || !observation}
                className="flex-1 px-6 py-3 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontSize: '16px', fontWeight: 700 }}
              >
                Confirmar
              </button>
              <button
                onClick={() => {
                  setShowRemoveModal(false);
                  setQuantity('');
                  setObservation('');
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

function ShiftView() {
  return (
    <div className="space-y-6">
      <h3 className="text-[#333333]" style={{ fontSize: '24px', fontWeight: 500 }}>
        Turno actual
      </h3>

      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-[#017E49] rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-[#333333]" style={{ fontSize: '20px', fontWeight: 500 }}>
              Turno en curso
            </h4>
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
              Guardia: Juan Pérez
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Hora de inicio</p>
            <p className="text-[#333333]" style={{ fontSize: '18px', fontWeight: 500 }}>08:00</p>
          </div>
          <div>
            <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Hora de término</p>
            <p className="text-[#333333]" style={{ fontSize: '18px', fontWeight: 500 }}>16:00</p>
          </div>
          <div>
            <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Retiros realizados</p>
            <p className="text-[#333333]" style={{ fontSize: '18px', fontWeight: 500 }}>58</p>
          </div>
          <div>
            <p className="text-[#6B6B6B] mb-1" style={{ fontSize: '14px' }}>Incidencias</p>
            <p className="text-[#333333]" style={{ fontSize: '18px', fontWeight: 500 }}>2</p>
          </div>
        </div>

        <div className="bg-[#F8F8F8] rounded-xl p-4">
          <p className="text-[#333333] mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
            Notas del turno:
          </p>
          <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
            Turno normal. Dos trabajadores reportaron problemas con sus tickets, incidencias registradas como INC-0001 e INC-0002.
          </p>
        </div>
      </div>
    </div>
  );
}

function SOSView() {
  return (
    <div className="space-y-6">
      <h3 className="text-[#333333]" style={{ fontSize: '24px', fontWeight: 500 }}>
        Sistema de Alertas SOS
      </h3>

      <div className="bg-white border-2 border-[#E12019] rounded-xl p-8 text-center">
        <div className="w-32 h-32 bg-[#E12019] rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertOctagon className="w-20 h-20 text-white" />
        </div>

        <h4 className="text-[#333333] mb-4" style={{ fontSize: '24px', fontWeight: 500 }}>
          Enviar Alerta SOS
        </h4>
        <p className="text-[#6B6B6B] mb-8 max-w-md mx-auto" style={{ fontSize: '16px', lineHeight: '1.5' }}>
          Presiona el botón solo en caso de emergencia. Se notificará inmediatamente a seguridad y RRHH.
        </p>

        <button className="px-12 py-6 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors" style={{ fontSize: '18px', fontWeight: 700 }}>
          ENVIAR ALERTA SOS
        </button>
      </div>

      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
        <h4 className="text-[#333333] mb-4" style={{ fontSize: '18px', fontWeight: 500 }}>
          Historial de alertas
        </h4>
        <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
          No hay alertas registradas en este turno
        </p>
      </div>
    </div>
  );
}

function HistoryView() {
  const history = [
    { fecha: '09/11/2025', hora: '14:32', rut: '12.345.678-9', nombre: 'María González', tipo: 'Premium', estado: 'Entregado' },
    { fecha: '09/11/2025', hora: '14:15', rut: '98.765.432-1', nombre: 'Carlos Muñoz', tipo: 'Estándar', estado: 'Entregado' },
    { fecha: '09/11/2025', hora: '13:58', rut: '11.222.333-4', nombre: 'Ana Vargas', tipo: 'Premium', estado: 'Rechazado' },
    { fecha: '09/11/2025', hora: '13:45', rut: '55.666.777-8', nombre: 'Pedro Soto', tipo: 'Estándar', estado: 'Entregado' },
    { fecha: '09/11/2025', hora: '13:20', rut: '99.888.777-6', nombre: 'Laura Díaz', tipo: 'Premium', estado: 'Entregado' },
    { fecha: '09/11/2025', hora: '12:55', rut: '44.555.666-7', nombre: 'Roberto Morales', tipo: 'Estándar', estado: 'Entregado' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[#333333]" style={{ fontSize: '24px', fontWeight: 500 }}>
          Historial de retiros
        </h3>
        <button className="px-6 py-3 bg-white text-[#333333] border-2 border-[#E12019] rounded-xl hover:bg-[#F8F8F8] transition-colors" style={{ fontSize: '14px', fontWeight: 700 }}>
          Exportar
        </button>
      </div>

      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8F8F8]">
              <tr>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Fecha</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Hora</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>RUT</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Nombre</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Tipo</th>
                <th className="px-6 py-3 text-left text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={index} className="border-t border-[#E0E0E0]">
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{item.fecha}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{item.hora}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{item.rut}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{item.nombre}</td>
                  <td className="px-6 py-4 text-[#333333]" style={{ fontSize: '14px' }}>{item.tipo}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full uppercase ${item.estado === 'Entregado' ? 'bg-[#017E49]' : 'bg-[#E12019]'
                      } text-white`} style={{ fontSize: '12px', fontWeight: 700 }}>
                      {item.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t-2 border-[#E0E0E0] flex items-center justify-between">
          <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
            Mostrando 6 de 58 registros
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
