import { Check, AlertCircle, Info } from 'lucide-react';

export function DesignSystem() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-[#333333] mb-2">Design System</h2>
        <p className="text-[#6B6B6B]">
          Sistema de diseño completo con tokens, componentes y reglas de accesibilidad WCAG AA para el Sistema de Retiro Digital de Beneficios – Tres Montes Lucchetti (TMLUC)
        </p>
      </div>

      {/* Project Scope */}
      <section>
        <h3 className="text-[#333333] mb-6">Alcance Funcional</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#E12019] rounded-lg flex items-center justify-center">
                <span className="text-white" style={{ fontSize: '18px' }}>1</span>
              </div>
              <h4 className="text-[#333333]" style={{ fontSize: '18px', fontWeight: 500 }}>
                Tótem de Autoservicio
              </h4>
            </div>
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px', lineHeight: '1.5' }}>
              PRIORIDAD PRINCIPAL. Sin login. Identificación por cédula o QR. Validación de beneficio, agendamiento de retiros, generación de tickets. Pantallas: Inicial, Validando, Éxito, Sin stock, Agendar retiro, Sin beneficio, Fin de semana, Error, Reportar incidencia.
            </p>
          </div>

          <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#017E49] rounded-lg flex items-center justify-center">
                <span className="text-white" style={{ fontSize: '18px' }}>2</span>
              </div>
              <h4 className="text-[#333333]" style={{ fontSize: '18px', fontWeight: 500 }}>
                Panel de Guardia
              </h4>
            </div>
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px', lineHeight: '1.5' }}>
              Con login. Escaneo de tickets QR o código manual, gestión de stock con observaciones, reportar incidencias, turno actual, SOS e historial de retiros.
            </p>
          </div>

          <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-[#FF9F55] rounded-lg flex items-center justify-center">
                <span className="text-white" style={{ fontSize: '18px' }}>3</span>
              </div>
              <h4 className="text-[#333333]" style={{ fontSize: '18px', fontWeight: 500 }}>
                Panel RRHH / Administración
              </h4>
            </div>
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px', lineHeight: '1.5' }}>
              Con login. Dashboard con KPIs, carga de nómina con asignación de beneficios (Premium/Estándar), detalle de retiros y resolución de incidencias. Solo RRHH puede asignar beneficios y resolver incidencias.
            </p>
          </div>
        </div>
      </section>

      {/* Totem Flow Documentation */}
      <section>
        <h3 className="text-[#333333] mb-6">Flujo Tótem de Autoservicio</h3>
        <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-8">
          <div className="space-y-6">
            <div>
              <h4 className="text-[#333333] mb-3" style={{ fontSize: '18px', fontWeight: 500 }}>
                1. Identificación
              </h4>
              <p className="text-[#6B6B6B]" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                El usuario escanea su cédula (PDF417) o código QR en el lector del tótem.
              </p>
            </div>

            <div>
              <h4 className="text-[#333333] mb-3" style={{ fontSize: '18px', fontWeight: 500 }}>
                2. Validación de Beneficio
              </h4>
              <p className="text-[#6B6B6B] mb-3" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                El sistema valida: beneficio activo, disponibilidad de stock, y si ya fue retirado o reservado.
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="px-2 py-1 bg-[#017E49] text-white rounded" style={{ fontSize: '12px', fontWeight: 700 }}>
                    ACTIVO + STOCK
                  </span>
                  <p className="text-[#333333]" style={{ fontSize: '14px' }}>
                    → Beneficio disponible para retiro hoy. Genera ticket inmediatamente (válido 30 min).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="px-2 py-1 bg-[#FF9F55] text-white rounded" style={{ fontSize: '12px', fontWeight: 700 }}>
                    ACTIVO SIN STOCK
                  </span>
                  <p className="text-[#333333]" style={{ fontSize: '14px' }}>
                    → Permite agendar retiro de lunes a viernes de la semana actual.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="px-2 py-1 bg-[#6B6B6B] text-white rounded" style={{ fontSize: '12px', fontWeight: 700 }}>
                    SIN BENEFICIO
                  </span>
                  <p className="text-[#333333]" style={{ fontSize: '14px' }}>
                    → No posee beneficio disponible. Contactar RRHH.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[#333333] mb-3" style={{ fontSize: '18px', fontWeight: 500 }}>
                3. Flujo de Agendamiento
              </h4>
              <p className="text-[#6B6B6B] mb-3" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                Si no hay stock disponible hoy, el usuario puede agendar su retiro:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="text-[#333333]" style={{ fontSize: '14px' }}>
                  • Selecciona día de lunes a viernes en calendario
                </li>
                <li className="text-[#333333]" style={{ fontSize: '14px' }}>
                  • Confirma agendamiento
                </li>
                <li className="text-[#333333]" style={{ fontSize: '14px' }}>
                  • El día agendado, regresa al tótem para generar ticket
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[#333333] mb-3" style={{ fontSize: '18px', fontWeight: 500 }}>
                4. Fines de Semana y Feriados
              </h4>
              <p className="text-[#6B6B6B]" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                Solo pueden generar tickets los usuarios con retiro previamente programado. Si no tiene agendamiento, se bloquea la generación.
              </p>
            </div>

            <div>
              <h4 className="text-[#333333] mb-3" style={{ fontSize: '18px', fontWeight: 500 }}>
                5. Emisión de Ticket
              </h4>
              <p className="text-[#6B6B6B]" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                Ticket incluye: nombre, tipo de beneficio, código QR, fecha. Válido 30 minutos. Si expira, puede reimprimir (cancela el anterior). Stock se descuenta solo cuando Guardia valida el ticket.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Color Styles */}
      <section>
        <h3 className="text-[#333333] mb-6">Color Styles</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-[#333333] mb-4">Primario (Rojo Corporativo)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ColorSwatch color="#E12019" name="Primary / Main" textColor="#FFFFFF" />
              <ColorSwatch color="#B51810" name="Primary / Dark" textColor="#FFFFFF" />
              <ColorSwatch color="#FF4C42" name="Primary / Light" textColor="#FFFFFF" />
            </div>
          </div>

          <div>
            <h4 className="text-[#333333] mb-4">Secundario (Naranja)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ColorSwatch color="#FF9F55" name="Secondary / Main" textColor="#FFFFFF" />
              <ColorSwatch color="#E68843" name="Secondary / Dark" textColor="#FFFFFF" />
              <ColorSwatch color="#FFB97D" name="Secondary / Light" textColor="#FFFFFF" />
            </div>
          </div>

          <div>
            <h4 className="text-[#333333] mb-4">Éxito (Verde)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ColorSwatch color="#017E49" name="Success / Main" textColor="#FFFFFF" />
              <ColorSwatch color="#015A34" name="Success / Dark" textColor="#FFFFFF" />
              <ColorSwatch color="#02A85F" name="Success / Light" textColor="#FFFFFF" />
            </div>
          </div>

          <div>
            <h4 className="text-[#333333] mb-4">Neutros</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ColorSwatch color="#FFFFFF" name="Neutral / White" textColor="#333333" border />
              <ColorSwatch color="#F8F8F8" name="Neutral / Background" textColor="#333333" />
              <ColorSwatch color="#E0E0E0" name="Neutral / Border" textColor="#333333" />
              <ColorSwatch color="#333333" name="Neutral / Text Main" textColor="#FFFFFF" />
              <ColorSwatch color="#6B6B6B" name="Neutral / Text Secondary" textColor="#FFFFFF" />
              <ColorSwatch color="#0F0F0F" name="Neutral / Text Strong" textColor="#FFFFFF" />
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section>
        <h3 className="text-[#333333] mb-6">Typography (Roboto)</h3>
        <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-6 space-y-6">
          <div>
            <p className="text-[#6B6B6B] mb-2">Display / H1 - 36px Bold</p>
            <div style={{ fontSize: '36px', fontWeight: 700 }} className="text-[#333333]">
              The quick brown fox jumps
            </div>
          </div>
          <div>
            <p className="text-[#6B6B6B] mb-2">H2 - 30px Bold</p>
            <div style={{ fontSize: '30px', fontWeight: 700 }} className="text-[#333333]">
              The quick brown fox jumps over
            </div>
          </div>
          <div>
            <p className="text-[#6B6B6B] mb-2">H3 - 24px Medium</p>
            <div style={{ fontSize: '24px', fontWeight: 500 }} className="text-[#333333]">
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
          <div>
            <p className="text-[#6B6B6B] mb-2">H4 - 20px Medium</p>
            <div style={{ fontSize: '20px', fontWeight: 500 }} className="text-[#333333]">
              The quick brown fox jumps over the lazy dog
            </div>
          </div>
          <div>
            <p className="text-[#6B6B6B] mb-2">Body / Regular - 16px Regular</p>
            <div style={{ fontSize: '16px', fontWeight: 400 }} className="text-[#333333]">
              The quick brown fox jumps over the lazy dog. This is body text for regular content.
            </div>
          </div>
          <div>
            <p className="text-[#6B6B6B] mb-2">Body / Secondary - 14px Regular</p>
            <div style={{ fontSize: '14px', fontWeight: 400 }} className="text-[#6B6B6B]">
              The quick brown fox jumps over the lazy dog. This is secondary body text.
            </div>
          </div>
          <div>
            <p className="text-[#6B6B6B] mb-2">Button / Label - 18px Bold</p>
            <div style={{ fontSize: '18px', fontWeight: 700 }} className="text-[#FFFFFF] bg-[#E12019] inline-block px-8 py-4 rounded-xl">
              Button Text
            </div>
          </div>
        </div>
      </section>

      {/* Spacing & Radius */}
      <section>
        <h3 className="text-[#333333] mb-6">Spacing Scale</h3>
        <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-6">
          <div className="space-y-4">
            {[4, 8, 12, 16, 24, 32, 48, 64].map((size) => (
              <div key={size} className="flex items-center gap-4">
                <div className="w-16 text-[#6B6B6B]">{size}px</div>
                <div className="h-8 bg-[#E12019]" style={{ width: `${size}px` }} />
              </div>
            ))}
          </div>
        </div>

        <h3 className="text-[#333333] mt-8 mb-6">Border Radius</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border-2 border-[#E0E0E0] p-6 rounded-md">
            <p className="text-[#333333] mb-2">Small - 6px</p>
            <div className="w-24 h-24 bg-[#E12019] rounded-md" />
          </div>
          <div className="bg-white border-2 border-[#E0E0E0] p-6 rounded-xl">
            <p className="text-[#333333] mb-2">Medium - 12px</p>
            <div className="w-24 h-24 bg-[#E12019] rounded-xl" />
          </div>
          <div className="bg-white border-2 border-[#E0E0E0] p-6" style={{ borderRadius: '16px' }}>
            <p className="text-[#333333] mb-2">Large - 16px</p>
            <div className="w-24 h-24 bg-[#E12019]" style={{ borderRadius: '16px' }} />
          </div>
        </div>
      </section>

      {/* Base Components */}
      <section>
        <h3 className="text-[#333333] mb-6">Base Components</h3>

        <div className="space-y-8">
          {/* Buttons */}
          <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-6">
            <h4 className="text-[#333333] mb-4">Buttons</h4>
            <div className="flex flex-wrap gap-4">
              <button 
                className="px-8 py-4 bg-[#E12019] text-white rounded-xl hover:bg-[#B51810] transition-colors"
                style={{ fontSize: '18px', fontWeight: 700 }}
              >
                Primary Button
              </button>
              <button 
                className="px-8 py-4 bg-white text-[#333333] border-2 border-[#E12019] rounded-xl hover:bg-[#F8F8F8] transition-colors"
                style={{ fontSize: '18px', fontWeight: 700 }}
              >
                Secondary Button
              </button>
              <button 
                className="px-8 py-4 bg-[#017E49] text-white rounded-xl hover:bg-[#015A34] transition-colors"
                style={{ fontSize: '18px', fontWeight: 700 }}
              >
                Success Button
              </button>
              <button 
                className="px-8 py-4 bg-[#E12019] text-white rounded-xl opacity-50 cursor-not-allowed"
                style={{ fontSize: '18px', fontWeight: 700 }}
                disabled
              >
                Disabled
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-6">
            <h4 className="text-[#333333] mb-4">Card Component</h4>
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 max-w-md shadow-sm">
              <h3 className="text-[#333333] mb-2" style={{ fontSize: '24px', fontWeight: 500 }}>
                Card Title
              </h3>
              <p className="text-[#6B6B6B]" style={{ fontSize: '16px', lineHeight: '1.5' }}>
                This is a card component with a title and body text. Cards use white background with subtle borders and shadows.
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-6">
            <h4 className="text-[#333333] mb-4">Text Input</h4>
            <div className="space-y-4 max-w-md">
              <input
                type="text"
                placeholder="Enter text..."
                className="w-full px-4 py-3 bg-white border-2 border-[#E0E0E0] rounded-xl text-[#333333] placeholder:text-[#999999] focus:border-[#E12019] focus:outline-none focus:ring-2 focus:ring-[#E12019]/20 transition-colors"
                style={{ fontSize: '16px' }}
              />
              <input
                type="text"
                value="Focused state"
                readOnly
                className="w-full px-4 py-3 bg-white border-2 border-[#E12019] rounded-xl text-[#333333] focus:outline-none"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          {/* Status Chips */}
          <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-6">
            <h4 className="text-[#333333] mb-4">Status Chips / Badges</h4>
            <div className="flex flex-wrap gap-4">
              <span 
                className="px-3 py-1 bg-[#017E49] text-white rounded-full uppercase"
                style={{ fontSize: '14px', fontWeight: 700 }}
              >
                Aprobado
              </span>
              <span 
                className="px-3 py-1 bg-[#FF9F55] text-white rounded-full uppercase"
                style={{ fontSize: '14px', fontWeight: 700 }}
              >
                Pendiente
              </span>
              <span 
                className="px-3 py-1 bg-[#E12019] text-white rounded-full uppercase"
                style={{ fontSize: '14px', fontWeight: 700 }}
              >
                Error
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Accessibility Rules */}
      <section>
        <h3 className="text-[#333333] mb-6">Accessibility Rules (WCAG AA)</h3>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-6">
            <div className="flex items-start gap-4">
              <Check className="w-6 h-6 text-[#017E49] flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-[#333333] mb-2">White/Light Backgrounds</h4>
                <p className="text-[#6B6B6B]">
                  On white (#FFFFFF) or light backgrounds (#F8F8F8), always use dark text: Primary #333333, Secondary #6B6B6B. Minimum contrast ratio: 4.5:1.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-6">
            <div className="flex items-start gap-4">
              <Check className="w-6 h-6 text-[#017E49] flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-[#333333] mb-2">Colored Backgrounds</h4>
                <p className="text-[#6B6B6B]">
                  On colored backgrounds (Red #E12019, Green #017E49, Orange #FF9F55), always use white text (#FFFFFF) with medium or bold weight. Never use reduced opacity.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-6">
            <div className="flex items-start gap-4">
              <Check className="w-6 h-6 text-[#017E49] flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-[#333333] mb-2">Interactive Targets</h4>
                <p className="text-[#6B6B6B]">
                  Minimum interactive target size: 44×44px for buttons and touch targets. Line-height: 1.4–1.6 for readability.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-[#E12019] flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-[#333333] mb-2">Never Use</h4>
                <p className="text-[#6B6B6B]">
                  Never use light grey (#CCCCCC) on white, low-opacity text on colored backgrounds, or color text on slightly lighter/darker versions of the same color.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Example Layouts */}
      <section>
        <h3 className="text-[#333333] mb-6">Example Layouts</h3>
        <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-6">
          <div className="space-y-4 text-[#6B6B6B]">
            <div className="flex items-center gap-4">
              <Info className="w-5 h-5 text-[#E12019]" />
              <span>Desktop: 1440×900 - 12 columns, 24px gutter</span>
            </div>
            <div className="flex items-center gap-4">
              <Info className="w-5 h-5 text-[#E12019]" />
              <span>Tablet: 1024×768 - 8 columns, 20px gutter</span>
            </div>
            <div className="flex items-center gap-4">
              <Info className="w-5 h-5 text-[#E12019]" />
              <span>Mobile: 390×844 - 4 columns, 16px gutter</span>
            </div>
            <div className="flex items-center gap-4">
              <Info className="w-5 h-5 text-[#E12019]" />
              <span>Tótem: 1080×1920 (vertical, full screen)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Use Case Diagram */}
      <section>
        <h3 className="text-[#333333] mb-6">Diagrama de Casos de Uso</h3>
        <div className="bg-white rounded-xl border-2 border-[#E0E0E0] p-8">
          <p className="text-[#6B6B6B] mb-8">
            Representación de los actores del sistema y sus interacciones con los módulos principales de TMLUC.
          </p>
          
          {/* Module 1: Tótem de Autoservicio */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#E12019] rounded-lg flex items-center justify-center">
                <span className="text-white" style={{ fontSize: '18px' }}>1</span>
              </div>
              <h4 className="text-[#333333]" style={{ fontSize: '20px', fontWeight: 500 }}>
                Tótem de Autoservicio
              </h4>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 items-start">
              {/* Actor */}
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 border-2 border-[#E12019] rounded-full flex items-center justify-center bg-white">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#E12019]">
                    <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-[#333333] mt-3" style={{ fontWeight: 500 }}>Empleado / Trabajador</p>
                <p className="text-[#6B6B6B] text-center" style={{ fontSize: '12px' }}>(Sin autenticación)</p>
              </div>
              
              {/* Use Cases */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <UseCaseBox color="#E12019" text="Escanear Cédula / QR" />
                <UseCaseBox color="#E12019" text="Validar Beneficio" />
                <UseCaseBox color="#E12019" text="Generar Ticket de Retiro" />
                <UseCaseBox color="#E12019" text="Agendar Retiro Futuro" />
                <UseCaseBox color="#E12019" text="Reimprimir Ticket" />
                <UseCaseBox color="#E12019" text="Reportar Incidencia" />
              </div>
            </div>
          </div>

          {/* Module 2: Panel de Guardia */}
          <div className="mb-12 pt-8 border-t-2 border-[#E0E0E0]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#017E49] rounded-lg flex items-center justify-center">
                <span className="text-white" style={{ fontSize: '18px' }}>2</span>
              </div>
              <h4 className="text-[#333333]" style={{ fontSize: '20px', fontWeight: 500 }}>
                Panel de Guardia
              </h4>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 items-start">
              {/* Actor */}
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 border-2 border-[#017E49] rounded-full flex items-center justify-center bg-white">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#017E49]">
                    <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M15 8L17 10L21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-[#333333] mt-3" style={{ fontWeight: 500 }}>Personal de Guardia</p>
                <p className="text-[#6B6B6B] text-center" style={{ fontSize: '12px' }}>(Con autenticación)</p>
              </div>
              
              {/* Use Cases */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <UseCaseBox color="#017E49" text="Iniciar Sesión" />
                <UseCaseBox color="#017E49" text="Escanear Ticket QR" />
                <UseCaseBox color="#017E49" text="Validar Retiro" />
                <UseCaseBox color="#017E49" text="Gestionar Stock" />
                <UseCaseBox color="#017E49" text="Controlar Turno" />
                <UseCaseBox color="#017E49" text="Enviar SOS" />
                <UseCaseBox color="#017E49" text="Ver Historial de Retiros" />
                <UseCaseBox color="#017E49" text="Cerrar Turno" />
              </div>
            </div>
          </div>

          {/* Module 3: Panel RRHH / Administración */}
          <div className="mb-12 pt-8 border-t-2 border-[#E0E0E0]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#FF9F55] rounded-lg flex items-center justify-center">
                <span className="text-white" style={{ fontSize: '18px' }}>3</span>
              </div>
              <h4 className="text-[#333333]" style={{ fontSize: '20px', fontWeight: 500 }}>
                Panel RRHH / Administración
              </h4>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 items-start">
              {/* Actor */}
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 border-2 border-[#FF9F55] rounded-full flex items-center justify-center bg-white">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#FF9F55]">
                    <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 11V13M12 13L14 15M12 13L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-[#333333] mt-3" style={{ fontWeight: 500 }}>Administrador RRHH</p>
                <p className="text-[#6B6B6B] text-center" style={{ fontSize: '12px' }}>(Con autenticación)</p>
              </div>
              
              {/* Use Cases */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <UseCaseBox color="#FF9F55" text="Iniciar Sesión" />
                <UseCaseBox color="#FF9F55" text="Ver Dashboard KPIs" />
                <UseCaseBox color="#FF9F55" text="Gestionar Nómina" />
                <UseCaseBox color="#FF9F55" text="Asignar Beneficios" />
                <UseCaseBox color="#FF9F55" text="Ver Detalle de Retiros" />
                <UseCaseBox color="#FF9F55" text="Gestionar Incidencias" />
                <UseCaseBox color="#FF9F55" text="Generar Reportes" />
                <UseCaseBox color="#FF9F55" text="Exportar Datos" />
              </div>
            </div>
          </div>

          {/* Module 4: Cuenta de Usuario */}
          <div className="pt-8 border-t-2 border-[#E0E0E0]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#333333] rounded-lg flex items-center justify-center">
                <span className="text-white" style={{ fontSize: '18px' }}>4</span>
              </div>
              <h4 className="text-[#333333]" style={{ fontSize: '20px', fontWeight: 500 }}>
                Cuenta de Usuario
              </h4>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 items-start">
              {/* Actor */}
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 border-2 border-[#333333] rounded-full flex items-center justify-center bg-white">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-[#333333]">
                    <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-[#333333] mt-3" style={{ fontWeight: 500 }}>Usuario Autenticado</p>
                <p className="text-[#6B6B6B] text-center" style={{ fontSize: '12px' }}>(Guardia / RRHH)</p>
              </div>
              
              {/* Use Cases */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <UseCaseBox color="#333333" text="Ver Perfil Personal" />
                <UseCaseBox color="#333333" text="Editar Información" />
                <UseCaseBox color="#333333" text="Cambiar Contraseña" />
                <UseCaseBox color="#333333" text="Cerrar Sesión" />
              </div>
            </div>
          </div>

          {/* System Boundary Note */}
          <div className="mt-12 pt-8 border-t-2 border-[#E0E0E0]">
            <div className="bg-[#F8F8F8] rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-[#E12019] flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-[#333333] mb-2">Notas del Sistema</h4>
                  <ul className="space-y-2 text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                    <li>• El módulo <strong>Tótem</strong> es el único que no requiere autenticación previa</li>
                    <li>• Los módulos <strong>Guardia</strong> y <strong>RRHH</strong> requieren credenciales de acceso</li>
                    <li>• La <strong>Cuenta de Usuario</strong> es transversal a todos los usuarios autenticados</li>
                    <li>• Todas las operaciones críticas registran trazabilidad (timestamp, usuario, acción)</li>
                    <li>• El sistema cumple con WCAG AA para accesibilidad en todos los módulos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function UseCaseBox({ color, text }: { color: string; text: string }) {
  return (
    <div className="bg-white border-2 rounded-xl p-4 flex items-center justify-center text-center min-h-[60px] hover:shadow-md transition-shadow" style={{ borderColor: color }}>
      <p className="text-[#333333]" style={{ fontSize: '14px', fontWeight: 500 }}>
        {text}
      </p>
    </div>
  );
}

function ColorSwatch({ color, name, textColor, border }: { color: string; name: string; textColor: string; border?: boolean }) {
  return (
    <div className={`rounded-xl overflow-hidden ${border ? 'border-2 border-[#E0E0E0]' : ''}`}>
      <div className="h-24" style={{ backgroundColor: color }} />
      <div className="bg-white p-4 border-t-2 border-[#E0E0E0]">
        <p className="text-[#333333]">{name}</p>
        <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>{color}</p>
        <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Text: {textColor}</p>
      </div>
    </div>
  );
}
