import { useState, useEffect } from 'react';
import { Scan, CheckCircle2, XCircle, FileText, AlertCircle, ArrowLeft, Printer, AlertTriangle, Calendar, ChevronLeft, ChevronRight, Info, Search } from 'lucide-react';
import { api } from '../services/api';

type TotemScreen = 'initial' | 'validating' | 'success' | 'success-choice' | 'no-stock' | 'schedule-select' | 'schedule-confirm' | 'no-benefit' | 'error' | 'incident-form' | 'incident-sent' | 'incident-scan' | 'incident-status';

export function TotemModule() {
  const [currentScreen, setCurrentScreen] = useState<TotemScreen>('initial');
  const [selectedIncidentType, setSelectedIncidentType] = useState<string>('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [isWeekend, setIsWeekend] = useState(false); // Simulates if current day is weekend
  const [rutEscaneado, setRutEscaneado] = useState<string>('12345678-5'); // Placeholder del RUT detectado en escáner
  const [beneficio, setBeneficio] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  function calcularFechaDesdeNombre(nombre: string): string {
    const mapping: Record<string, number> = {
      lunes: 1,
      martes: 2,
      miercoles: 3,
      jueves: 4,
      viernes: 5,
    };
    const targetDow = mapping[nombre.toLowerCase()] ?? 1;
    const now = new Date();
    const dow = now.getDay(); // 0-6, Sunday=0
    const mondayBasedDow = dow === 0 ? 7 : dow; // treat Sunday as 7
    let diff = targetDow - mondayBasedDow;
    if (diff < 0) diff += 7; // next occurrence in upcoming week
    const target = new Date(now);
    target.setDate(now.getDate() + diff);
    target.setHours(9, 0, 0, 0); // default 09:00 local time
    return target.toISOString();
  }

  // Cuando entramos a pantalla 'validating' hacemos la llamada al backend
  useEffect(() => {
    if (currentScreen === 'validating') {
      setLoading(true);
      setErrorMsg('');
      api.getBeneficio(rutEscaneado)
        .then(res => {
          setBeneficio(res.beneficio);
          // Decidir ruta siguiente según beneficio y stock simulado
          const stock = res.beneficio?.beneficio_disponible?.stock ?? 10; // default
          if (!res.beneficio) {
            setCurrentScreen('no-benefit');
          } else if (stock <= 0) {
            setCurrentScreen('no-stock');
          } else {
            setCurrentScreen('success-choice');
          }
        })
        .catch(err => {
          setErrorMsg(err.detail || 'Error validando beneficio');
          setCurrentScreen('error');
        })
        .finally(() => setLoading(false));
    }
  }, [currentScreen, rutEscaneado]);

  const generarTicket = async () => {
    if (!rutEscaneado) return;
    setLoading(true); setErrorMsg('');
    try {
      const t = await api.crearTicket(rutEscaneado, { sucursal: 'Central' });
      setTicket(t);
      setCurrentScreen('success');
    } catch (e: any) {
      setErrorMsg(e.detail || 'Error generando ticket');
      setCurrentScreen('error');
    } finally { setLoading(false); }
  };

  const agendarRetiro = async (fechaISO: string) => {
    setLoading(true); setErrorMsg('');
    try {
      await api.crearAgendamiento(rutEscaneado, fechaISO);
      setCurrentScreen('schedule-confirm');
    } catch (e: any) {
      setErrorMsg(e.detail || 'Error agendando');
      setCurrentScreen('error');
    } finally { setLoading(false); }
  };

  const reportarIncidencia = async () => {
    if (!selectedIncidentType) return;
    setLoading(true); setErrorMsg('');
    try {
      await api.crearIncidencia({ trabajador_rut: rutEscaneado, tipo: selectedIncidentType, descripcion: incidentDescription, origen: 'totem' });
      setCurrentScreen('incident-sent');
    } catch (e: any) {
      setErrorMsg(e.detail || 'Error reportando incidencia');
      setCurrentScreen('error');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[#333333] mb-2">Tótem de Autoservicio</h2>
        <p className="text-[#6B6B6B]">
          Pantallas del kiosko de autoservicio (1080×1920, vertical, sin login). Navegue entre las pantallas para ver el flujo completo.
        </p>
      </div>

      {/* Screen Selector */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setCurrentScreen('initial')}
          className={`px-6 py-3 rounded-xl transition-colors ${currentScreen === 'initial'
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          Pantalla Inicial
        </button>
        <button
          onClick={() => setCurrentScreen('validating')}
          className={`px-6 py-3 rounded-xl transition-colors ${currentScreen === 'validating'
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          Validando
        </button>
        <button
          onClick={() => {
            setCurrentScreen('success-choice');
            setIsWeekend(false);
          }}
          className={`px-6 py-3 rounded-xl transition-colors ${currentScreen === 'success-choice'
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          Éxito - Elegir Retiro
        </button>
        <button
          onClick={() => {
            setCurrentScreen('success-choice');
            setIsWeekend(true);
          }}
          className={`px-6 py-3 rounded-xl transition-colors ${currentScreen === 'success-choice' && isWeekend
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          Éxito (Fin de Semana)
        </button>
        <button
          onClick={() => setCurrentScreen('success')}
          className={`px-6 py-3 rounded-xl transition-colors ${currentScreen === 'success'
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          Ticket Generado
        </button>
        <button
          onClick={() => setCurrentScreen('no-stock')}
          className={`px-6 py-3 rounded-xl transition-colors ${currentScreen === 'no-stock'
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          Sin Stock
        </button>
        <button
          onClick={() => setCurrentScreen('error')}
          className={`px-6 py-3 rounded-xl transition-colors ${currentScreen === 'error'
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          Error
        </button>
        <button
          onClick={() => setCurrentScreen('incident-scan')}
          className={`px-6 py-3 rounded-xl transition-colors ${currentScreen === 'incident-scan'
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          Consultar Incidencia
        </button>
        <button
          onClick={() => setCurrentScreen('incident-status')}
          className={`px-6 py-3 rounded-xl transition-colors ${currentScreen === 'incident-status'
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          Estado Incidencia
        </button>
        <button
          onClick={() => setCurrentScreen('incident-form')}
          className={`px-6 py-3 rounded-xl transition-colors ${currentScreen === 'incident-form'
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          Reportar Incidencia
        </button>
        <button
          onClick={() => {
            setCurrentScreen('schedule-select');
            setSelectedDay('');
          }}
          className={`px-6 py-3 rounded-xl transition-colors ${currentScreen === 'schedule-select'
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          Agendar Retiro
        </button>
        <button
          onClick={() => {
            setSelectedDay('jueves');
            setCurrentScreen('schedule-confirm');
          }}
          className={`px-6 py-3 rounded-xl transition-colors ${currentScreen === 'schedule-confirm'
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          Confirmar Agendamiento
        </button>
        <button
          onClick={() => setCurrentScreen('no-benefit')}
          className={`px-6 py-3 rounded-xl transition-colors ${currentScreen === 'no-benefit'
            ? 'bg-[#E12019] text-white'
            : 'bg-white text-[#333333] border-2 border-[#E0E0E0] hover:bg-[#F8F8F8]'
            }`}
          style={{ fontSize: '16px', fontWeight: 500 }}
        >
          Sin Beneficio
        </button>
      </div>

      {/* Totem Screen Display */}
      <div className="bg-[#333333] p-8 rounded-xl">
        <div className="max-w-2xl mx-auto bg-[#F8F8F8] rounded-xl shadow-2xl overflow-hidden" style={{ aspectRatio: '9/16' }}>
          {currentScreen === 'initial' && (
            <TotemInitialScreen
              onScan={() => setCurrentScreen('validating')}
              onConsultIncident={() => setCurrentScreen('incident-scan')}
              onReportIncident={() => setCurrentScreen('incident-form')}
            />
          )}
          {currentScreen === 'validating' && <TotemValidatingScreen loading={loading} errorMsg={errorMsg} />}
          {currentScreen === 'success-choice' && (
            <TotemSuccessChoice
              isWeekend={isWeekend}
              beneficio={beneficio}
              onSameDay={generarTicket}
              onSchedule={() => setCurrentScreen('schedule-select')}
            />
          )}
          {currentScreen === 'success' && (
            <TotemSuccessScreen
              ticket={ticket}
              onFinish={() => {
                setTicket(null);
                setBeneficio(null);
                setCurrentScreen('initial');
              }}
            />
          )}
          {currentScreen === 'no-stock' && <TotemNoStockScreen onSchedule={() => setCurrentScreen('schedule-select')} onBack={() => setCurrentScreen('initial')} />}
          {currentScreen === 'schedule-select' && (
            <TotemScheduleSelect
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onConfirm={() => { if (selectedDay) { const fecha = calcularFechaDesdeNombre(selectedDay); agendarRetiro(fecha); } }}
              onBack={() => setCurrentScreen('success-choice')}
            />
          )}
          {currentScreen === 'schedule-confirm' && (
            <TotemScheduleConfirm
              selectedDay={selectedDay}
              onConfirm={() => setCurrentScreen('initial')}
              onCancel={() => setCurrentScreen('schedule-select')}
            />
          )}
          {currentScreen === 'no-benefit' && <TotemNoBenefitScreen onBack={() => setCurrentScreen('initial')} />}
          {currentScreen === 'error' && <TotemErrorScreen onReportIncident={() => setCurrentScreen('incident-form')} onRetry={() => setCurrentScreen('initial')} />}
          {currentScreen === 'incident-scan' && (
            <TotemIncidentScan
              onScan={() => setCurrentScreen('incident-status')}
              onBack={() => setCurrentScreen('initial')}
            />
          )}
          {currentScreen === 'incident-status' && (
            <TotemIncidentStatus onBack={() => setCurrentScreen('initial')} />
          )}
          {currentScreen === 'incident-form' && (
            <TotemIncidentForm
              selectedType={selectedIncidentType}
              onSelectType={setSelectedIncidentType}
              description={incidentDescription}
              onDescriptionChange={setIncidentDescription}
              submitting={loading}
              errorMsg={errorMsg}
              onSubmit={reportarIncidencia}
              onCancel={() => setCurrentScreen('initial')}
            />
          )}
          {currentScreen === 'incident-sent' && <TotemIncidentSent onBack={() => setCurrentScreen('initial')} />}
        </div>
      </div>
    </div>
  );
}

function TotemInitialScreen({ onScan, onConsultIncident, onReportIncident }: {
  onScan: () => void;
  onConsultIncident: () => void;
  onReportIncident: () => void;
}) {
  return (
    <div className="h-full flex flex-col p-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-[#E12019] to-[#B51810] rounded-xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white" style={{ fontSize: '32px', fontWeight: 700 }}>TML</span>
        </div>
        <h3 className="text-[#333333] mb-2" style={{ fontSize: '24px', fontWeight: 500 }}>
          Sistema de Retiro Digital de Beneficios
        </h3>
      </div>

      {/* Central Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div style={{ fontSize: '32px', fontWeight: 700 }} className="text-[#333333] mb-3 text-center">
          Escanea tu cédula o código QR
        </div>
        <p className="text-[#6B6B6B] mb-8 text-center max-w-md" style={{ fontSize: '16px', lineHeight: '1.5' }}>
          Acerca tu documento al lector para verificar tu beneficio
        </p>

        {/* Scan Area */}
        <div className="bg-white border-4 border-dashed border-[#E12019] rounded-xl p-10 mb-8 w-full max-w-md relative">
          <div className="flex flex-col items-center">
            <Scan className="w-28 h-28 text-[#E12019] mb-3 animate-pulse" />
            <p className="text-[#333333]" style={{ fontSize: '18px', fontWeight: 500 }}>
              Modo escáner activo
            </p>
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
              Listo para escanear
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="space-y-3 mb-6">
        <button
          onClick={onScan}
          className="w-full px-8 py-5 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          Escanear Beneficio
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onConsultIncident}
            className="px-6 py-4 bg-white text-[#333333] border-2 border-[#E0E0E0] rounded-xl hover:bg-[#F8F8F8] transition-colors flex flex-col items-center justify-center gap-2"
            style={{ fontSize: '14px', fontWeight: 500, minHeight: '64px' }}
          >
            <Search className="w-5 h-5" />
            Consultar Incidencia
          </button>
          <button
            onClick={onReportIncident}
            className="px-6 py-4 bg-white text-[#333333] border-2 border-[#E0E0E0] rounded-xl hover:bg-[#F8F8F8] transition-colors flex flex-col items-center justify-center gap-2"
            style={{ fontSize: '14px', fontWeight: 500, minHeight: '64px' }}
          >
            <AlertCircle className="w-5 h-5" />
            Reportar Incidencia
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
          Versión Tótem Digital v1.0
        </p>
      </div>
    </div>
  );
}

function TotemValidatingScreen({ loading, errorMsg }: { loading?: boolean; errorMsg?: string }) {
  const steps = [
    { label: 'Verificando nómina', status: 'complete' as const },
    { label: 'Revisando turno', status: 'active' as const },
    { label: 'Aplicando seguridad', status: 'pending' as const },
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center p-12">
      <div className="mb-12">
        <div className="w-32 h-32 bg-gradient-to-br from-[#E12019] to-[#B51810] rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Scan className="w-16 h-16 text-white" />
        </div>
        <div style={{ fontSize: '36px', fontWeight: 700 }} className="text-[#333333] text-center mb-4">
          Validando tu beneficio...
        </div>
      </div>

      <div className="w-full max-w-md space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${step.status === 'complete' ? 'bg-[#017E49]' :
              step.status === 'active' ? 'bg-[#FF9F55]' :
                'bg-[#E0E0E0]'
              }`}>
              {step.status === 'complete' ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <span className="text-white" style={{ fontSize: '18px', fontWeight: 700 }}>
                  {index + 1}
                </span>
              )}
            </div>
            <p className="text-[#333333]" style={{ fontSize: '18px', fontWeight: step.status === 'active' ? 500 : 400 }}>
              {step.label}
            </p>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mt-12">
        <div className="h-3 bg-[#E0E0E0] rounded-full overflow-hidden">
          <div className="h-full bg-[#E12019] rounded-full animate-pulse" style={{ width: '66%' }} />
        </div>
      </div>
      {errorMsg && (
        <div className="bg-white border-2 border-[#E12019] rounded-xl p-4 w-full max-w-md mt-6">
          <p className="text-[#E12019] text-center" style={{ fontSize: '14px' }}>{errorMsg}</p>
        </div>
      )}
    </div>
  );
}

function TotemSuccessChoice({ isWeekend, onSameDay, onSchedule, beneficio }: {
  isWeekend: boolean;
  onSameDay: () => void;
  onSchedule: () => void;
  beneficio?: any;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12">
      <div className="w-32 h-32 bg-[#017E49] rounded-full flex items-center justify-center mb-8">
        <CheckCircle2 className="w-20 h-20 text-white" />
      </div>

      <div style={{ fontSize: '36px', fontWeight: 700 }} className="text-[#333333] text-center mb-4">
        Beneficio disponible
      </div>
      <p className="text-[#6B6B6B] text-center mb-12 max-w-md" style={{ fontSize: '16px', lineHeight: '1.5' }}>
        {isWeekend
          ? 'En fines de semana solo puedes retirar el mismo día.'
          : 'Elige cuándo deseas retirar tu beneficio.'}
      </p>

      {/* Benefit Info Card (optional) */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6 w-full max-w-md mb-12">
        <div className="space-y-2">
          <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Beneficio</p>
          <p className="text-[#333333]" style={{ fontSize: '18px', fontWeight: 500 }}>
            {beneficio?.beneficio_disponible?.nombre || 'Caja de beneficio'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-md space-y-4">
        <button
          onClick={onSameDay}
          className="w-full px-8 py-6 bg-[#017E49] text-white rounded-xl hover:bg-[#015A34] transition-colors flex items-center justify-center gap-3"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          Retirar Hoy
        </button>

        {!isWeekend && (
          <button
            onClick={onSchedule}
            className="w-full px-8 py-6 bg-white text-[#333333] border-2 border-[#FF9F55] rounded-xl hover:bg-[#F8F8F8] transition-colors flex items-center justify-center gap-3"
            style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
          >
            <Calendar className="w-6 h-6" />
            Agendar para Otro Día
          </button>
        )}

        {isWeekend && (
          <div className="bg-[#FFF4E6] border-2 border-[#FF9F55] rounded-xl p-4">
            <p className="text-[#333333] text-center" style={{ fontSize: '14px', lineHeight: '1.5' }}>
              Durante fines de semana no está disponible la opción de agendamiento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TotemSuccessScreen({ ticket, onFinish }: { ticket: any; onFinish: () => void }) {
  const nombreTrabajador = ticket?.trabajador?.nombre ?? '';
  const rutTrabajador = ticket?.trabajador?.rut ?? '';
  const codigoTicket = ticket?.uuid ?? '';
  const expiraISO = ticket?.ttl_expira_at ? new Date(ticket.ttl_expira_at) : null;
  const minutosRestantes = expiraISO ? Math.max(0, Math.floor((expiraISO.getTime() - Date.now()) / 60000)) : null;
  return (
    <div className="h-full flex flex-col items-center justify-center p-12">
      <div className="w-32 h-32 bg-[#017E49] rounded-full flex items-center justify-center mb-8">
        <CheckCircle2 className="w-20 h-20 text-white" />
      </div>

      <div style={{ fontSize: '36px', fontWeight: 700 }} className="text-[#333333] text-center mb-4">
        Ticket generado exitosamente
      </div>
      <p className="text-[#6B6B6B] text-center mb-12" style={{ fontSize: '16px', lineHeight: '1.5' }}>
        Dirígete a portería para retirar tu beneficio.
      </p>

      {/* Ticket Card */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-8 w-full max-w-md mb-12 shadow-lg">
        <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-[#E0E0E0]">
          <FileText className="w-12 h-12 text-[#E12019]" />
          <span className="px-4 py-2 bg-[#017E49] text-white rounded-full uppercase" style={{ fontSize: '14px', fontWeight: 700 }}>
            Aprobado
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Nombre trabajador</p>
            <p className="text-[#333333]" style={{ fontSize: '18px', fontWeight: 500 }}>
              {nombreTrabajador}
            </p>
          </div>
          <div>
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>RUT</p>
            <p className="text-[#333333]" style={{ fontSize: '18px', fontWeight: 500 }}>
              {rutTrabajador}
            </p>
          </div>
          <div>
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Código de retiro</p>
            <div className="bg-[#F8F8F8] rounded-lg p-4 mt-2">
              <p className="text-[#E12019] text-center" style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '0.1em' }}>
                {codigoTicket ? codigoTicket.slice(0, 8) : '—'}
              </p>
            </div>
          </div>
          {minutosRestantes !== null && (
            <div>
              <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Expira en</p>
              <p className="text-[#333333]" style={{ fontSize: '18px', fontWeight: 500 }}>
                {minutosRestantes} min
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-4 w-full max-w-md mb-8">
        <p className="text-[#6B6B6B] text-center" style={{ fontSize: '14px', lineHeight: '1.5' }}>
          Tu ticket es válido hasta la expiración indicada. Si expira, puedes reimprimir desde este mismo tótem.
        </p>
      </div>

      {/* Actions */}
      <div className="w-full max-w-md space-y-4">
        <button
          className="w-full px-8 py-6 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors flex items-center justify-center gap-3"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          <Printer className="w-6 h-6" />
          Generar Ticket Ahora
        </button>
        <button
          onClick={onFinish}
          className="w-full px-8 py-6 bg-white text-[#333333] border-2 border-[#E12019] rounded-xl hover:bg-[#F8F8F8] transition-colors"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          Finalizar
        </button>
      </div>
    </div>
  );
}

function TotemNoStockScreen({ onSchedule, onBack }: { onSchedule: () => void; onBack: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12">
      <div className="w-32 h-32 bg-[#FF9F55] rounded-full flex items-center justify-center mb-8">
        <AlertTriangle className="w-20 h-20 text-white" />
      </div>

      <div style={{ fontSize: '36px', fontWeight: 700 }} className="text-[#333333] text-center mb-4">
        Hoy no hay stock disponible
      </div>
      <p className="text-[#6B6B6B] text-center mb-12 max-w-md" style={{ fontSize: '16px', lineHeight: '1.5' }}>
        Lamentamos informarte que no hay cajas de beneficio disponibles en este momento.
      </p>

      {/* Actions */}
      <div className="w-full max-w-md space-y-4 mb-8">
        <button
          onClick={onSchedule}
          className="w-full px-8 py-6 bg-[#FF9F55] text-white rounded-xl hover:bg-[#E68843] transition-colors flex items-center justify-center gap-3"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          <Calendar className="w-6 h-6" />
          Agendar retiro para otro día
        </button>
        <button
          onClick={onBack}
          className="w-full px-8 py-6 bg-white text-[#333333] border-2 border-[#FF9F55] rounded-xl hover:bg-[#F8F8F8] transition-colors"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          Volver al inicio
        </button>
      </div>

      {/* Note */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-4 max-w-md">
        <p className="text-[#6B6B6B] text-center" style={{ fontSize: '14px', lineHeight: '1.5' }}>
          Puedes reservar tu retiro de lunes a viernes según disponibilidad.
        </p>
      </div>
    </div>
  );
}

function TotemScheduleSelect({
  selectedDay,
  onSelectDay,
  onConfirm,
  onBack
}: {
  selectedDay: string;
  onSelectDay: (day: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}) {
  // Compute current week's Monday to Friday labels and dates dynamically
  const monthShortEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const labelById: Record<string, string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
  };
  const ids = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'] as const;
  const today = new Date();
  const day = today.getDay(); // 0=Sun..6=Sat
  const monday = new Date(today);
  const daysToMonday = (day + 6) % 7; // Sun->6, Mon->0, Tue->1, ...
  monday.setDate(today.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);
  const weekDays = ids.map((id, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const displayDate = `${d.getDate()} ${monthShortEs[d.getMonth()]}`;
    return {
      id,
      label: labelById[id],
      dateNum: d.getDate(),
      displayDate,
      available: true,
    };
  });

  return (
    <div className="h-full flex flex-col p-12">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#333333] hover:text-[#E12019] transition-colors mb-8 self-start"
        style={{ fontSize: '16px', fontWeight: 500 }}
      >
        <ArrowLeft className="w-5 h-5" />
        Volver
      </button>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-[#FF9F55] rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-12 h-12 text-white" />
        </div>
        <div style={{ fontSize: '36px', fontWeight: 700 }} className="text-[#333333] mb-4">
          Selecciona día para tu retiro
        </div>
        <p className="text-[#6B6B6B] text-center max-w-md mx-auto" style={{ fontSize: '16px', lineHeight: '1.5' }}>
          Disponible de lunes a viernes de esta semana.
        </p>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-xl space-y-4 mb-8">
          {weekDays.map((day) => (
            <button
              key={day.id}
              onClick={() => onSelectDay(day.id)}
              disabled={!day.available}
              className={`w-full px-8 py-6 rounded-xl transition-colors border-2 ${selectedDay === day.id
                ? 'bg-[#FF9F55] border-[#FF9F55] text-white'
                : day.available
                  ? 'bg-white border-[#E0E0E0] text-[#333333] hover:border-[#FF9F55]'
                  : 'bg-[#F8F8F8] border-[#E0E0E0] text-[#6B6B6B] cursor-not-allowed'
                }`}
              style={{ fontSize: '18px', fontWeight: 700, minHeight: '72px' }}
            >
              <div className="flex items-center justify-between">
                <span>{day.label}</span>
                <span className={selectedDay === day.id ? 'text-white' : 'text-[#6B6B6B]'}>
                  {day.displayDate}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Weekend Note */}
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-4 max-w-md mb-8">
          <p className="text-[#6B6B6B] text-center" style={{ fontSize: '14px', lineHeight: '1.5' }}>
            Fines de semana disponibles solo para retiros previamente programados.
          </p>
        </div>

        {/* Confirm Button */}
        <button
          onClick={onConfirm}
          disabled={!selectedDay}
          className={`w-full max-w-md px-8 py-6 rounded-xl transition-colors ${selectedDay
            ? 'bg-[#FF9F55] text-white hover:bg-[#E68843]'
            : 'bg-[#E0E0E0] text-[#6B6B6B] cursor-not-allowed'
            }`}
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

function TotemScheduleConfirm({
  selectedDay,
  onConfirm,
  onCancel
}: {
  selectedDay: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Compute the concrete date number for the selected weekday (current week)
  const labelById: Record<string, string> = {
    lunes: 'lunes',
    martes: 'martes',
    miercoles: 'miércoles',
    jueves: 'jueves',
    viernes: 'viernes',
  };
  const indexById: Record<string, number> = {
    lunes: 0,
    martes: 1,
    miercoles: 2,
    jueves: 3,
    viernes: 4,
  };
  const today = new Date();
  const day = today.getDay(); // 0..6
  const monday = new Date(today);
  const daysToMonday = (day + 6) % 7;
  monday.setDate(today.getDate() - daysToMonday);
  const idx = indexById[selectedDay] ?? 0;
  const target = new Date(monday);
  target.setDate(monday.getDate() + idx);
  const dayNames: Record<string, string> = {
    lunes: `lunes ${target.getDate()}`,
    martes: `martes ${target.getDate()}`,
    miercoles: `miércoles ${target.getDate()}`,
    jueves: `jueves ${target.getDate()}`,
    viernes: `viernes ${target.getDate()}`,
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-12">
      {/* Success Icon */}
      <div className="w-32 h-32 bg-[#017E49] rounded-full flex items-center justify-center mb-8">
        <CheckCircle2 className="w-20 h-20 text-white" />
      </div>

      {/* Message */}
      <div style={{ fontSize: '36px', fontWeight: 700 }} className="text-[#333333] text-center mb-4">
        Tu retiro ha sido agendado
      </div>
      <p className="text-[#333333] text-center mb-4" style={{ fontSize: '20px', fontWeight: 500 }}>
        para el {dayNames[selectedDay] || selectedDay}
      </p>

      {/* Info Card */}
      <div className="bg-white border-2 border-[#017E49] rounded-xl p-8 w-full max-w-md mb-12">
        <div className="flex items-start gap-4">
          <Info className="w-6 h-6 text-[#017E49] flex-shrink-0 mt-1" />
          <p className="text-[#333333]" style={{ fontSize: '16px', lineHeight: '1.5' }}>
            Ese día deberás volver al tótem para generar tu ticket (válido por 30 minutos). El ticket te permitirá retirar tu beneficio en portería.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-md space-y-4">
        <button
          onClick={onConfirm}
          className="w-full px-8 py-6 bg-[#017E49] text-white rounded-xl hover:bg-[#015A34] transition-colors"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          Confirmar
        </button>
        <button
          onClick={onCancel}
          className="w-full px-8 py-6 bg-white text-[#333333] border-2 border-[#017E49] rounded-xl hover:bg-[#F8F8F8] transition-colors"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function TotemNoBenefitScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12">
      {/* Icon */}
      <div className="w-32 h-32 bg-[#6B6B6B] rounded-full flex items-center justify-center mb-8">
        <XCircle className="w-20 h-20 text-white" />
      </div>

      {/* Message */}
      <div style={{ fontSize: '36px', fontWeight: 700 }} className="text-[#333333] text-center mb-4">
        No posee beneficio disponible
      </div>

      {/* Info Card */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-8 w-full max-w-md mb-12">
        <p className="text-[#333333] text-center" style={{ fontSize: '16px', lineHeight: '1.5' }}>
          Tu cuenta no tiene un beneficio activo en este momento. Consulta con Recursos Humanos para más información.
        </p>
      </div>

      {/* Action */}
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="w-full px-8 py-6 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

function TotemWeekendBlockedScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12">
      {/* Icon */}
      <div className="w-32 h-32 bg-[#FF9F55] rounded-full flex items-center justify-center mb-8">
        <AlertTriangle className="w-20 h-20 text-white" />
      </div>

      {/* Message */}
      <div style={{ fontSize: '36px', fontWeight: 700 }} className="text-[#333333] text-center mb-4">
        Retiro no disponible
      </div>

      {/* Info Card */}
      <div className="bg-white border-2 border-[#FF9F55] rounded-xl p-8 w-full max-w-md mb-12">
        <p className="text-[#333333] text-center" style={{ fontSize: '16px', lineHeight: '1.5' }}>
          Solo los retiros programados pueden realizarse durante fines de semana o feriados. Si agendaste tu retiro previamente, podrás generar tu ticket de forma normal.
        </p>
      </div>

      {/* Action */}
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="w-full px-8 py-6 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

function TotemErrorScreen({ onReportIncident, onRetry }: { onReportIncident: () => void; onRetry: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12">
      <div className="w-32 h-32 bg-[#E12019] rounded-full flex items-center justify-center mb-8">
        <XCircle className="w-20 h-20 text-white" />
      </div>

      <div style={{ fontSize: '36px', fontWeight: 700 }} className="text-[#333333] text-center mb-4">
        No es posible emitir tu beneficio
      </div>

      {/* Error Details Card */}
      <div className="bg-white border-2 border-[#E12019] rounded-xl p-8 w-full max-w-md mb-12">
        <div className="flex items-start gap-4 mb-4">
          <AlertCircle className="w-6 h-6 text-[#E12019] flex-shrink-0 mt-1" />
          <div>
            <p className="text-[#333333] mb-2" style={{ fontSize: '18px', fontWeight: 500 }}>
              Motivo del rechazo:
            </p>
            <p className="text-[#6B6B6B]" style={{ fontSize: '16px', lineHeight: '1.5' }}>
              El trabajador se encuentra fuera de su turno asignado. El beneficio solo puede ser retirado durante el horario de trabajo.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-md space-y-4">
        <button
          onClick={onReportIncident}
          className="w-full px-8 py-6 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          Reportar incidencia
        </button>
        <button
          onClick={onRetry}
          className="w-full px-8 py-6 bg-white text-[#333333] border-2 border-[#E12019] rounded-xl hover:bg-[#F8F8F8] transition-colors"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          Intentar nuevamente
        </button>
      </div>
    </div>
  );
}

function TotemIncidentForm({
  selectedType,
  onSelectType,
  description,
  onDescriptionChange,
  onSubmit,
  onCancel,
  submitting,
  errorMsg,
}: {
  selectedType: string;
  onSelectType: (type: string) => void;
  description: string;
  onDescriptionChange: (desc: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting?: boolean;
  errorMsg?: string;
}) {
  const incidentTypes = [
    'Documento ilegible',
    'Ticket dañado',
    'Datos incorrectos',
    'Otro problema'
  ];

  return (
    <div className="h-full flex flex-col p-12 overflow-y-auto">
      <button
        onClick={onCancel}
        className="flex items-center gap-2 text-[#333333] mb-8 hover:text-[#E12019] transition-colors"
        style={{ fontSize: '16px' }}
      >
        <ArrowLeft className="w-5 h-5" />
        Volver
      </button>

      <div style={{ fontSize: '30px', fontWeight: 700 }} className="text-[#333333] mb-4">
        Reportar incidencia
      </div>
      <p className="text-[#6B6B6B] mb-8" style={{ fontSize: '16px' }}>
        Selecciona el tipo de problema y describe la situación
      </p>

      {/* Incident Type Selection */}
      <div className="mb-8">
        <p className="text-[#333333] mb-4" style={{ fontSize: '18px', fontWeight: 500 }}>
          Tipo de incidencia:
        </p>
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
                onChange={(e) => onSelectType(e.target.value)}
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
      <div className="mb-8 flex-1">
        <p className="text-[#333333] mb-4" style={{ fontSize: '18px', fontWeight: 500 }}>
          Descripción adicional:
        </p>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe el problema con más detalle..."
          className="w-full h-32 px-4 py-3 bg-white border-2 border-[#E0E0E0] rounded-xl text-[#333333] placeholder:text-[#6B6B6B] focus:border-[#E12019] focus:outline-none resize-none"
          style={{ fontSize: '16px' }}
        />
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <button
          onClick={onSubmit}
          disabled={!selectedType || submitting}
          className="w-full px-8 py-6 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          Enviar incidencia
        </button>
        <button
          onClick={onCancel}
          className="w-full px-8 py-6 bg-white text-[#333333] border-2 border-[#E12019] rounded-xl hover:bg-[#F8F8F8] transition-colors"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          Cancelar
        </button>
      </div>
      {errorMsg && (
        <div className="bg-white border-2 border-[#E12019] rounded-xl p-4 w-full max-w-md mt-6">
          <p className="text-[#E12019] text-center" style={{ fontSize: '14px' }}>{errorMsg}</p>
        </div>
      )}
    </div>
  );
}

function TotemIncidentSent({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12">
      <div className="w-32 h-32 bg-[#017E49] rounded-full flex items-center justify-center mb-8">
        <CheckCircle2 className="w-20 h-20 text-white" />
      </div>

      <div style={{ fontSize: '36px', fontWeight: 700 }} className="text-[#333333] text-center mb-4">
        Incidencia enviada
      </div>
      <p className="text-[#6B6B6B] text-center mb-12" style={{ fontSize: '16px', lineHeight: '1.5' }}>
        Hemos notificado a RRHH. Guarda tu número de seguimiento.
      </p>

      {/* Incident ID Card */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-8 w-full max-w-md mb-12 shadow-lg">
        <p className="text-[#6B6B6B] text-center mb-2" style={{ fontSize: '14px' }}>
          Número de seguimiento
        </p>
        <div className="bg-[#F8F8F8] rounded-lg p-6">
          <p className="text-[#E12019] text-center" style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '0.1em' }}>
            INC-0001
          </p>
        </div>
        <div className="mt-4 pt-4 border-t-2 border-[#E0E0E0]">
          <p className="text-[#6B6B6B] text-center" style={{ fontSize: '14px' }}>
            Puedes consultar el estado escaneando el QR en el tótem
          </p>
        </div>
      </div>

      {/* Action */}
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="w-full px-8 py-6 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

function TotemIncidentScan({ onScan, onBack }: { onScan: () => void; onBack: () => void }) {
  return (
    <div className="h-full flex flex-col p-12">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#333333] hover:text-[#E12019] transition-colors mb-8 self-start"
        style={{ fontSize: '16px', fontWeight: 500 }}
      >
        <ArrowLeft className="w-5 h-5" />
        Volver
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-[#FF9F55] rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-12 h-12 text-white" />
        </div>
        <div style={{ fontSize: '32px', fontWeight: 700 }} className="text-[#333333] mb-4">
          Consultar estado de incidencia
        </div>
        <p className="text-[#6B6B6B] text-center max-w-md mx-auto" style={{ fontSize: '16px', lineHeight: '1.5' }}>
          Escanea el código QR de tu incidencia para ver su estado
        </p>
      </div>

      {/* Central Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Scan Area */}
        <div className="bg-white border-4 border-dashed border-[#FF9F55] rounded-xl p-12 w-full max-w-md mb-8">
          <div className="flex flex-col items-center">
            <Scan className="w-32 h-32 text-[#FF9F55] mb-4 animate-pulse" />
            <p className="text-[#333333]" style={{ fontSize: '18px', fontWeight: 500 }}>
              Zona de escaneo
            </p>
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
              Escanea tu código QR de incidencia
            </p>
          </div>
        </div>

        {/* Info Note */}
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-4 max-w-md">
          <p className="text-[#6B6B6B] text-center" style={{ fontSize: '14px', lineHeight: '1.5' }}>
            Si no tienes el código QR, puedes ingresar el número de seguimiento manualmente.
          </p>
        </div>
      </div>

      {/* Action */}
      <div className="w-full max-w-md mx-auto">
        <button
          onClick={onScan}
          className="w-full px-8 py-6 bg-[#FF9F55] text-white rounded-xl hover:bg-[#E68843] transition-colors"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          Escanear código QR
        </button>
      </div>
    </div>
  );
}

function TotemIncidentStatus({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-full flex flex-col p-12 overflow-y-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#333333] hover:text-[#E12019] transition-colors mb-8 self-start"
        style={{ fontSize: '16px', fontWeight: 500 }}
      >
        <ArrowLeft className="w-5 h-5" />
        Volver
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div style={{ fontSize: '32px', fontWeight: 700 }} className="text-[#333333] mb-2">
          Estado de tu incidencia
        </div>
      </div>

      {/* Incident Details Card */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-8 w-full max-w-md mx-auto mb-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-[#E0E0E0]">
          <div>
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Número de incidencia</p>
            <p className="text-[#E12019]" style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '0.05em' }}>
              INC-0001
            </p>
          </div>
          <span className="px-4 py-2 bg-[#FF9F55] text-white rounded-full uppercase" style={{ fontSize: '14px', fontWeight: 700 }}>
            En proceso
          </span>
        </div>

        {/* Details */}
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Tipo de incidencia</p>
            <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>
              Documento ilegible
            </p>
          </div>
          <div>
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Fecha de reporte</p>
            <p className="text-[#333333]" style={{ fontSize: '16px', fontWeight: 500 }}>
              09 Nov 2025, 14:32
            </p>
          </div>
          <div>
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Descripción</p>
            <p className="text-[#333333]" style={{ fontSize: '16px', lineHeight: '1.5' }}>
              La cédula está dañada y el escáner no puede leer el código de barras.
            </p>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="pt-6 border-t-2 border-[#E0E0E0]">
          <p className="text-[#333333] mb-4" style={{ fontSize: '16px', fontWeight: 500 }}>
            Estado actual
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#017E49] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>
                  Incidencia recibida
                </p>
                <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>
                  09 Nov, 14:32
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF9F55] flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>
                  En revisión por RRHH
                </p>
                <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>
                  Estimado: 24-48 hrs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-[#F8F8F8] border-2 border-[#E0E0E0] rounded-xl p-4 max-w-md mx-auto mb-8">
        <p className="text-[#6B6B6B] text-center" style={{ fontSize: '14px', lineHeight: '1.5' }}>
          Recibirás una notificación cuando tu incidencia sea resuelta.
        </p>
      </div>

      {/* Action */}
      <div className="w-full max-w-md mx-auto">
        <button
          onClick={onBack}
          className="w-full px-8 py-6 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors"
          style={{ fontSize: '18px', fontWeight: 700, minHeight: '64px' }}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
