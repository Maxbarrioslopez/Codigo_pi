import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginModule from './components/LoginModule';
import { useState } from 'react';
import { DesignSystem } from './components/DesignSystem';
import { TotemModule } from './components/TotemModule';
import { GuardiaModule } from './components/GuardiaModule';
import { RRHHModule } from './components/RRHHModule';
import { TrabajadoresModule } from './components/TrabajadoresModule';
import { CicloBimensualModule } from './components/CicloBimensualModule';
import { TrazabilidadModule } from './components/TrazabilidadModule';
import { NominaModule } from './components/NominaModule';
import { ReportesModule } from './components/ReportesModule';
import { AdministradorModule } from './components/AdministradorModule';
import { GuardiaFlowScreens } from './components/GuardiaFlowScreens';
import { Menu, X } from 'lucide-react';

// Layout principal con sidebar para usuarios autenticados
function DashboardLayout() {
  const [currentSection, setCurrentSection] = useState<'design-system' | 'totem' | 'guardia' | 'rrhh' | 'trabajadores' | 'ciclo' | 'trazabilidad' | 'nomina' | 'reportes' | 'admin' | 'guardia-flow'>('design-system');
  const [menuOpen, setMenuOpen] = useState(false);

  const sections = [
    { id: 'design-system', label: 'Design System', icon: '🎨' },
    { id: 'totem', label: 'Tótem Autoservicio', icon: '🖥️' },
    { id: 'guardia', label: 'Panel Guardia', icon: '👮' },
    { id: 'guardia-flow', label: 'Guardia - Flujo Escaneo', icon: '📷' },
    { id: 'rrhh', label: 'Dashboard RRHH', icon: '📊' },
    { id: 'trabajadores', label: 'Gestión Trabajadores', icon: '👥' },
    { id: 'ciclo', label: 'Ciclo Bimensual', icon: '📅' },
    { id: 'trazabilidad', label: 'Trazabilidad QR', icon: '📦' },
    { id: 'nomina', label: 'Nómina Cíclica', icon: '📋' },
    { id: 'reportes', label: 'Reportes y Análisis', icon: '📈' },
    { id: 'admin', label: 'Administración', icon: '⚙️' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Top Navigation */}
      <header className="bg-white border-b-2 border-[#E0E0E0] sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#E12019] to-[#B51810] rounded-lg flex items-center justify-center">
                <span className="text-white">TML</span>
              </div>
              <div>
                <h1 className="text-[#333333]">Sistema de Retiro Digital de Beneficios</h1>
                <p className="text-[#6B6B6B]">Tres Montes Lucchetti (TMLUC)</p>
              </div>
            </div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 hover:bg-[#F8F8F8] rounded-lg"
            >
              {menuOpen ? <X className="w-6 h-6 text-[#333333]" /> : <Menu className="w-6 h-6 text-[#333333]" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex max-w-[1440px] mx-auto">
        {/* Sidebar Navigation */}
        <aside className={`${menuOpen ? 'block' : 'hidden'} lg:block w-64 bg-white border-r-2 border-[#E0E0E0] min-h-[calc(100vh-80px)] sticky top-[80px]`}>
          <nav className="p-4">
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => {
                      setCurrentSection(section.id);
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${currentSection === section.id
                      ? 'bg-[#E12019] text-white'
                      : 'text-[#333333] hover:bg-[#F8F8F8]'
                      }`}
                  >
                    <span className="mr-3">{section.icon}</span>
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {currentSection === 'design-system' && <DesignSystem />}
          {currentSection === 'totem' && <TotemModule />}
          {currentSection === 'guardia' && <GuardiaModule />}
          {currentSection === 'guardia-flow' && <GuardiaFlowScreens />}
          {currentSection === 'rrhh' && <RRHHModule />}
          {currentSection === 'trabajadores' && <TrabajadoresModule />}
          {currentSection === 'ciclo' && <CicloBimensualModule />}
          {currentSection === 'trazabilidad' && <TrazabilidadModule />}
          {currentSection === 'nomina' && <NominaModule />}
          {currentSection === 'reportes' && <ReportesModule />}
          {currentSection === 'admin' && <AdministradorModule />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta pública de Login */}
          <Route path="/login" element={<LoginModule />} />

          {/* Ruta pública del Tótem (sin autenticación) */}
          <Route path="/totem" element={<TotemModule />} />

          {/* Rutas protegidas para Guardia */}
          <Route
            path="/guardia"
            element={
              <ProtectedRoute allowedRoles={['guardia', 'admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />

          {/* Rutas protegidas para RRHH */}
          <Route
            path="/rrhh"
            element={
              <ProtectedRoute allowedRoles={['rrhh', 'admin', 'supervisor']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />

          {/* Rutas protegidas para Administrador */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />

          {/* Ruta por defecto - Redirige al login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Ruta 404 - Redirige al login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}