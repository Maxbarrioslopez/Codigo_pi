import { useState, useEffect, useRef } from 'react';
import { Scan, CheckCircle2, XCircle, FileText, AlertCircle, ArrowLeft, Printer, AlertTriangle, Calendar, ChevronLeft, ChevronRight, Info, Search, Camera, X, Star } from 'lucide-react';
import { trabajadorService } from '@/services/trabajador.service';
import { beneficioService } from '@/services/beneficio.service';
import { ticketService } from '@/services/ticket.service';
import { incidentService } from '@/services/incident.service';
import { scheduleService } from '@/services/schedule.service';
import { mapApiErrorToStateAndToast } from '@/lib/apiErrorMapping';
import { formatRut } from '@/utils/rut';
import { RUTInput } from './form/RUTInput';
import { IScannerControls } from '@zxing/browser';
import TotemScannerPanel from '@/components/TotemScannerPanel';
// Modular screens
import TotemInitialScreen from '@/components/totem/TotemInitialScreen';
import TotemBenefitScreen from '@/components/totem/TotemBenefitScreen';
import TotemValidatingScreen from '@/components/totem/TotemValidatingScreen';
import TotemSuccessScreen from '@/components/totem/TotemSuccessScreen';
import TotemNoStockScreen from '@/components/totem/TotemNoStockScreen';
import TotemIncidentForm from '@/components/totem/TotemIncidentForm';
import { TotemCheckIncidents } from '@/components/TotemCheckIncidents';

type TotemScreen = 'initial' | 'benefit' | 'validating' | 'success' | 'success-choice' | 'no-stock' | 'schedule-select' | 'schedule-confirm' | 'no-benefit' | 'error' | 'incident-form' | 'incident-sent' | 'check-incidents';

export function TotemModule() {
  const [currentScreen, setCurrentScreen] = useState<TotemScreen>('initial');
  const [selectedIncidentType, setSelectedIncidentType] = useState<string>('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [rutInput, setRutInput] = useState<string>('');
  const [rutEscaneado, setRutEscaneado] = useState<string>('');
  const [beneficio, setBeneficio] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [validationSteps, setValidationSteps] = useState<Array<{ label: string; status: 'pending' | 'active' | 'complete' | 'error'; }>>([
    { label: 'Validando beneficio', status: 'pending' },
  ]);
  const DEV_MODE = typeof window !== 'undefined' && window.location.search.includes('dev');
  const isWeekend = (() => { const d = new Date().getDay(); return d === 0 || d === 6; })();

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

  // Flujo de validación secuencial real - OPTIMIZADO
  useEffect(() => {
    let cancelled = false;
    async function runValidation() {
      if (currentScreen !== 'validating') return;
      setLoading(true);
      setErrorMsg('');
      setValidationSteps(prev => prev.map((s, i) => ({ ...s, status: i === 0 ? 'active' : 'pending' })));
      try {
        // Paso único: obtener beneficio del ciclo activo actual
        const formattedRut = formatRut(rutEscaneado);
        
        // Usar trabajadorService para obtener datos completos (mantiene compatibilidad con código antiguo)
        const res = await trabajadorService.getBeneficio(formattedRut);
        if (cancelled) return;
        setBeneficio(res.beneficio);

        setValidationSteps(prev => prev.map(s => ({ ...s, status: 'complete' })));

        // Pausa mínima visual (200ms)
        await new Promise(r => setTimeout(r, 200));
        if (cancelled) return;

        // Ir a pantalla de beneficio (muestra con o sin beneficio)
        setCurrentScreen('benefit');
      } catch (e: any) {
        if (cancelled) return;
        setValidationSteps(prev => prev.map(s => ({ ...s, status: 'error' })));
        setErrorMsg(e?.detail || 'Error validando beneficio');
        setCurrentScreen('error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    runValidation();
    return () => { cancelled = true; };
  }, [currentScreen, rutEscaneado]);

  // Polling para refrescar beneficio cuando requiere validación de guardia
  useEffect(() => {
    if (currentScreen !== 'benefit') return;
    if (!beneficio?.beneficio_disponible?.requiere_validacion_guardia) return;
    if (beneficio?.beneficio_disponible?.puede_retirarse) return; // Ya validado

    let cancelled = false;
    const interval = setInterval(async () => {
      if (cancelled) return;
      try {
        const formattedRut = formatRut(rutEscaneado);
        const res = await trabajadorService.getBeneficio(formattedRut);
        if (!cancelled) {
          setBeneficio(res.beneficio);
        }
      } catch (e) {
        // Ignorar errores en polling silencioso
      }
    }, 5000); // Refrescar cada 5 segundos

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentScreen, beneficio?.beneficio_disponible?.requiere_validacion_guardia, beneficio?.beneficio_disponible?.puede_retirarse, rutEscaneado]);

  const generarTicket = async () => {
    if (!rutEscaneado) return;
    setLoading(true); setErrorMsg('');
    try {
      // Validar que existe ciclo activo antes de generar ticket
      try {
        await fetch('/api/ciclo-activo/', { method: 'GET', headers: { 'Content-Type': 'application/json' } })
          .then(r => {
            if (!r.ok) throw new Error('No hay ciclo activo');
            return r.json();
          });
      } catch (e: any) {
        throw new Error('No hay ciclo de beneficios activo en este momento. Contacta a RRHH.');
      }

      const t = await ticketService.create(rutEscaneado, undefined);
      setTicket(t);
      setCurrentScreen('success');
    } catch (e: any) {
      mapApiErrorToStateAndToast(e, { setError: setErrorMsg, toState: (state: string) => setCurrentScreen(state as TotemScreen) });
    } finally { setLoading(false); }
  };

  const agendarRetiro = async (fechaISO: string) => {
    setLoading(true); setErrorMsg('');
    try {
      await scheduleService.crearAgendamiento(rutEscaneado, fechaISO);
      setCurrentScreen('schedule-confirm');
    } catch (e: any) {
      mapApiErrorToStateAndToast(e, { setError: setErrorMsg, toState: (state: string) => setCurrentScreen(state as TotemScreen) });
    } finally { setLoading(false); }
  };

  const reportarIncidencia = async (tipo: string, descripcion: string) => {
    if (!tipo || !rutEscaneado) {
      setErrorMsg('Falta información para reportar');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        trabajador_rut: rutEscaneado,
        tipo: tipo,
        descripcion: descripcion,
        origen: 'totem'
      };
      console.log('Enviando incidencia:', payload);
      await incidentService.crearIncidencia(payload as any);
      // Limpiar estados
      setSelectedIncidentType('');
      setIncidentDescription('');
      // Volver a beneficio
      setCurrentScreen('benefit');
    } catch (e: any) {
      console.error('Error reportando incidencia:', e);
      mapApiErrorToStateAndToast(e, { setError: setErrorMsg, toState: (state: string) => setCurrentScreen(state as TotemScreen) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-8">
      {DEV_MODE && (
        <div className="flex flex-wrap gap-2 p-4 bg-[#F8F8F8] border rounded-xl">
          <p className="text-xs text-[#6B6B6B] w-full">Modo desarrollador: navegación manual</p>
          {['initial', 'validating', 'success-choice', 'success', 'no-stock', 'schedule-select', 'schedule-confirm', 'no-benefit', 'error', 'incident-form', 'incident-sent', 'check-incidents'].map(s => (
            <button key={s} onClick={() => setCurrentScreen(s as TotemScreen)} className={`text-xs px-2 py-1 rounded border ${currentScreen === s ? 'bg-[#E12019] text-white border-[#E12019]' : 'bg-white text-[#333333] hover:bg-[#F0F0F0]'}`}>{s}</button>
          ))}
        </div>
      )}
      <div className="bg-[#333333] p-4 md:p-8 rounded-xl overflow-x-hidden">
        <div className="relative max-w-2xl mx-auto bg-[#F8F8F8] rounded-xl shadow-2xl overflow-hidden min-h-[600px] md:min-h-[800px]" style={{ aspectRatio: '9/16' }}>
          <button
            onClick={() => { window.location.href = '/login'; }}
            className="absolute top-3 left-3 p-3 rounded-full bg-white text-[#E12019] shadow-lg border border-[#E0E0E0] hover:bg-[#FFF5F5] transition-colors"
            aria-label="Ir a login"
          >
            <Star className="w-5 h-5" />
          </button>
          {currentScreen === 'initial' && (
            <TotemInitialScreen
              onRutDetected={(rut) => {
                setRutInput(rut);
                setRutEscaneado(rut);
                setCurrentScreen('validating');
              }}
              onCheckIncidents={() => setCurrentScreen('check-incidents')}
            />
          )}
          {currentScreen === 'validating' && (
            <TotemValidatingScreen />
          )}
          {currentScreen === 'benefit' && beneficio && (
            <TotemBenefitScreen
              rut={rutEscaneado}
              nombre={beneficio.nombre || 'Trabajador'}
              beneficio={beneficio.beneficio_disponible}
              onReportIncident={() => setCurrentScreen('incident-form')}
              onBack={() => setCurrentScreen('initial')}
            />
          )}
          {currentScreen === 'success-choice' && (
            <TotemSuccessChoice
              isWeekend={isWeekend}
              beneficio={beneficio}
              onSameDay={generarTicket}
              onSchedule={() => { setSelectedDay(''); setCurrentScreen('schedule-select'); }}
            />
          )}
          {currentScreen === 'success' && (
            <TotemSuccessScreen
              beneficio={beneficio}
              onGenerateTicket={generarTicket}
              loading={loading}
            />
          )}
          {currentScreen === 'no-stock' && (
            <TotemNoStockScreen
              onSchedule={() => { setSelectedDay(''); setCurrentScreen('schedule-select'); }}
            />
          )}
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
          {currentScreen === 'incident-form' && (
            <TotemIncidentForm
              onSubmit={(tipo, desc) => {
                reportarIncidencia(tipo, desc);
              }}
              onBack={() => setCurrentScreen('benefit')}
              loading={loading}
            />
          )}
          {currentScreen === 'incident-sent' && <TotemIncidentSent onBack={() => setCurrentScreen('initial')} />}
          {currentScreen === 'check-incidents' && (
            <TotemCheckIncidents
              onBack={() => setCurrentScreen('initial')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function LocalTotemInitialScreen({ onScan, onConsultIncident, onReportIncident, rutInput, onRutChange }: {
  onScan: (rut?: string) => void;
  onConsultIncident: () => void;
  onReportIncident: () => void;
  rutInput: string;
  onRutChange: (v: string) => void;
}) {
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState('');
  const controlsRef = useRef<IScannerControls | null>(null);

  // Activar cámara automáticamente al montar
  useEffect(() => {
    let mounted = true;
    let scanCount = 0;
    let warmupFrames = 10; // Ignorar primeros frames para estabilidad de cámara
    // El escaneo ahora lo maneja TotemScannerPanel con useScanner

    async function startScanner() {
      try {
        // El control de cámara lo gestiona TotemScannerPanel
      } catch (err: any) {
        if (mounted) {
          console.error('❌ Error starting camera:', err);
          setCameraError('No se pudo acceder a la cámara. Verifica los permisos.');
          setCameraActive(false);
        }
      }
    }

    if (cameraActive) {
      startScanner();
    }

    return () => {
      console.log('>> Limpiando scanner...');
      mounted = false;
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [cameraActive, onRutChange]);

  const toggleCamera = () => {
    if (cameraActive && controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    setCameraActive(!cameraActive);
    setCameraError('');
  };

  return (
    <div className="h-screen w-screen flex flex-col p-3 md:p-6 lg:p-12 bg-white">
      {/* Header */}
      <div className="text-center mb-4 md:mb-8">
        <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-[#E12019] to-[#B51810] rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-6">
          <span className="text-white text-xl md:text-3xl" style={{ fontWeight: 700 }}>TML</span>
        </div>
      </div>

      {/* Central Content */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto">
        <div style={{ fontSize: '20px', fontWeight: 700 }} className="text-[#333333] mb-2 md:mb-3 text-center">
          Escanea tu Cédula de Identidad
        </div>
        <p className="text-[#6B6B6B] mb-4 md:mb-8 text-center max-w-md text-sm md:text-base" style={{ lineHeight: '1.5' }}>
          Acerca la parte posterior de tu carnet
        </p>

        {/* Camera View + RUT Input */}
        <div className="bg-white border-4 border-dashed border-[#E12019] rounded-xl p-2 md:p-4 mb-4 md:mb-6 w-full max-w-lg md:max-w-2xl relative" style={{ minHeight: '400px' }}>
          <div className="flex flex-col items-center w-full h-full">
            {cameraActive ? (
              <div className="relative w-full flex-1 flex items-center justify-center">
                <div className="w-full h-full">
                  <TotemScannerPanel
                    onRutDetected={(rut: string) => {
                      onRutChange(rut);
                      setTimeout(() => onScan(rut), 100);
                    }}
                    onError={(msg: string) => setCameraError(msg)}
                  />
                </div>
                <button
                  onClick={toggleCamera}
                  className="absolute top-2 right-2 p-2 bg-[#E12019] text-white rounded-full hover:bg-[#B51810] transition-colors shadow-lg z-10"
                  title="Desactivar cámara"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                {/* Marco de guía para centrar el QR */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative">
                    {/* Esquinas del marco - responsive */}
                    <div className="w-40 h-40 md:w-64 md:h-64 lg:w-80 lg:h-80 relative">
                      {/* Esquina superior izquierda */}
                      <div className="absolute top-0 left-0 w-10 h-10 md:w-16 md:h-16 border-t-[4px] md:border-t-[6px] border-l-[4px] md:border-l-[6px] border-[#E12019] rounded-tl-lg"></div>
                      {/* Esquina superior derecha */}
                      <div className="absolute top-0 right-0 w-10 h-10 md:w-16 md:h-16 border-t-[4px] md:border-t-[6px] border-r-[4px] md:border-r-[6px] border-[#E12019] rounded-tr-lg"></div>
                      {/* Esquina inferior izquierda */}
                      <div className="absolute bottom-0 left-0 w-10 h-10 md:w-16 md:h-16 border-b-[4px] md:border-b-[6px] border-l-[4px] md:border-l-[6px] border-[#E12019] rounded-bl-lg"></div>
                      {/* Esquina inferior derecha */}
                      <div className="absolute bottom-0 right-0 w-10 h-10 md:w-16 md:h-16 border-b-[4px] md:border-b-[6px] border-r-[4px] md:border-r-[6px] border-[#E12019] rounded-br-lg"></div>
                      {/* Línea de escaneo animada */}
                      <div className="absolute inset-x-0 h-1 bg-[#E12019] animate-pulse" style={{
                        top: '50%',
                        boxShadow: '0 0 15px #E12019'
                      }}></div>
                      {/* Punto central de referencia */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 bg-[#E12019] rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Scan className="w-16 h-16 md:w-24 md:h-24 text-[#E12019] mb-4" />
                <button
                  onClick={toggleCamera}
                  className="mb-4 px-4 md:px-6 py-2 md:py-3 bg-[#E12019] text-white rounded-lg hover:bg-[#B51810] transition-colors flex items-center gap-2 shadow-md text-sm md:text-base"
                  style={{ fontWeight: 600 }}
                >
                  <Camera className="w-4 h-4 md:w-5 md:h-5" />
                  Activar Cámara
                </button>
              </>
            )}

            {cameraError && (
              <div className="mb-4 p-3 bg-[#FFE5E5] border border-[#E12019] rounded-lg w-full">
                <p className="text-[#E12019] text-center text-xs md:text-sm">
                  {cameraError}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => {
            onScan();
          }}
          disabled={!rutInput.trim()}
          className={`w-full px-6 md:px-8 py-4 md:py-5 rounded-xl transition-colors font-bold text-base md:text-lg ${rutInput.trim()
            ? 'bg-[#017E49] text-white hover:bg-[#015A34]'
            : 'bg-[#E0E0E0] text-[#6B6B6B] cursor-not-allowed'
            }`}
          style={{ minHeight: '56px' }}
        >
          ✓ Validar Beneficio
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={onConsultIncident}
            className="px-4 md:px-6 py-3 md:py-4 bg-[#0066CC] text-white rounded-xl hover:bg-[#0052A3] transition-colors flex flex-col items-center justify-center gap-2 shadow-md"
            style={{ fontSize: '14px', fontWeight: 600, minHeight: '56px' }}
          >
            <Search className="w-5 h-5" />
            Consultar Incidencia
          </button>
          <button
            onClick={onReportIncident}
            className="px-6 py-4 bg-[#FF8C00] text-white rounded-xl hover:bg-[#E67E00] transition-colors flex flex-col items-center justify-center gap-2 shadow-md"
            style={{ fontSize: '14px', fontWeight: 600, minHeight: '56px' }}
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

function LocalTotemValidatingScreen({ loading, errorMsg, steps }: { loading?: boolean; errorMsg?: string; steps: { label: string; status: 'pending' | 'active' | 'complete' | 'error'; }[] }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 md:p-12">
      <div className="mb-8 md:mb-12">
        <div className="w-20 h-20 md:w-32 md:h-32 bg-gradient-to-br from-[#E12019] to-[#B51810] rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 animate-spin">
          <Scan className="w-10 h-10 md:w-16 md:h-16 text-white" />
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700 }} className="text-[#333333] text-center md:text-3xl">
          Validando beneficio...
        </div>
      </div>

      {/* Paso simple y directo */}
      <div className="w-full max-w-sm mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-3 md:gap-4">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${step.status === 'complete' ? 'bg-[#017E49] scale-110' :
              step.status === 'active' ? 'bg-[#FF9F55]' :
                step.status === 'error' ? 'bg-[#E12019]' :
                  'bg-[#E0E0E0]'
              }`}>
              {step.status === 'complete' ? (
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
              ) : step.status === 'error' ? (
                <XCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
              ) : (
                <span className="text-white text-sm md:text-base font-bold">✓</span>
              )}
            </div>
            <p className="text-[#333333] text-sm md:text-lg" style={{ fontWeight: step.status === 'active' ? 600 : 400 }}>
              {step.label}
            </p>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="bg-[#FFE5E5] border-2 border-[#E12019] rounded-xl p-4 w-full max-w-sm">
          <p className="text-[#E12019] text-center text-sm md:text-base">{errorMsg}</p>
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
      <div className="bg-white border-2 border-[#E0E0E0] rounded-lg p-4 w-full max-w-md mb-8">
        <p className="text-[#6B6B6B] text-xs">Beneficio disponible</p>
        <p className="text-[#333333] font-semibold text-base">
          {beneficio?.beneficio_disponible?.nombre || 'Caja de beneficio'}
        </p>
      </div>

      {/* Actions */}
      <div className="w-full max-w-md space-y-3">
        <button
          onClick={onSameDay}
          className="w-full px-8 py-5 bg-[#017E49] text-white rounded-xl hover:bg-[#015A34] transition-colors font-bold text-lg"
          style={{ minHeight: '56px' }}
        >
          ✓ Retirar Hoy
        </button>

        {!isWeekend && (
          <button
            onClick={onSchedule}
            className="w-full px-8 py-5 bg-white text-[#333333] border-2 border-[#FF9F55] rounded-xl hover:bg-[#F8F8F8] transition-colors font-bold text-lg"
            style={{ minHeight: '56px' }}
          >
            📅 Agendar Otro Día
          </button>
        )}

        {isWeekend && (
          <div className="bg-[#FFF4E6] border-2 border-[#FF9F55] rounded-lg p-3 text-center text-sm">
            <p className="text-[#333333]">No hay agendamiento en fines de semana</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LocalTotemTicketScreen({ ticket, onFinish }: { ticket: any; onFinish: () => void }) {
  const nombreTrabajador = ticket?.trabajador?.nombre ?? '';
  const rutTrabajador = ticket?.trabajador?.rut ?? '';
  const codigoTicket = ticket?.uuid ?? '';

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 md:p-8">
      <div className="w-24 h-24 md:w-32 md:h-32 bg-[#017E49] rounded-full flex items-center justify-center mb-4 md:mb-6">
        <CheckCircle2 className="w-16 h-16 md:w-20 md:h-20 text-white" />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-[#333333] text-center mb-2">
        ✓ Ticket Generado
      </h1>
      <p className="text-[#6B6B6B] text-center mb-6 text-sm md:text-base">
        Dirígete a portería para retirar tu beneficio
      </p>

      {/* Ticket Card - Compacto */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-lg p-4 md:p-6 w-full max-w-sm mb-6 shadow-md">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E0E0E0]">
          <FileText className="w-8 h-8 md:w-10 md:h-10 text-[#E12019]" />
          <span className="px-3 py-1 bg-[#017E49] text-white rounded-full text-xs md:text-sm font-bold">
            APROBADO
          </span>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <p className="text-[#6B6B6B] text-xs">Trabajador</p>
            <p className="text-[#333333] font-semibold">{nombreTrabajador}</p>
          </div>
          <div>
            <p className="text-[#6B6B6B] text-xs">RUT</p>
            <p className="text-[#333333] font-semibold">{rutTrabajador}</p>
          </div>
          <div className="bg-[#F8F8F8] rounded-lg p-3 text-center">
            <p className="text-[#6B6B6B] text-xs mb-1">Código de retiro</p>
            <p className="text-[#E12019] text-2xl md:text-3xl font-bold tracking-wider">
              {codigoTicket ? codigoTicket.slice(0, 8).toUpperCase() : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions - Simplificado */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={onFinish}
          className="w-full px-6 py-4 md:py-5 bg-[#017E49] text-white rounded-xl hover:bg-[#015A34] font-bold text-base transition-colors"
          style={{ minHeight: '50px' }}
        >
          ✓ Finalizar
        </button>
      </div>
    </div>
  );
}

function LocalTotemNoStockScreen({ onSchedule, onBack }: { onSchedule: () => void; onBack: () => void }) {
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
                  : 'bg-[#C0C0C0] border-[#C0C0C0] text-[#6B6B6B] cursor-not-allowed'
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
              El trabajador no está registrado en el ciclo actual de beneficios.
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

function LocalTotemIncidentForm({
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
          className="w-full h-32 px-4 py-3 bg-white border-2 border-[#E0E0E0] rounded-xl text-[#333333] placeholder:text-[#999999] focus:border-[#E12019] focus:outline-none focus:ring-2 focus:ring-[#E12019]/20 resize-none"
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

