import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginModule from './components/LoginModule';
import { useState } from 'react';
import { DesignSystem } from './components/DesignSystem';
import { TotemModule } from './components/TotemModule';
import { GuardiaModule } from './components/GuardiaModule';
import { RRHHModuleNew } from './components/RRHHModuleNew';
import { AdministradorModule } from './components/AdministradorModule';
import { Menu, X } from 'lucide-react';

// Layout principal con sidebar para usuarios autenticados
function DashboardLayout() {
  const [currentSection, setCurrentSection] = useState<'design-system' | 'totem' | 'guardia' | 'rrhh' | 'admin'>('design-system');
  const [menuOpen, setMenuOpen] = useState(false);

  const sections = [
    { id: 'design-system', label: 'Design System', icon: '🎨' },
    { id: 'totem', label: 'Tótem Autoservicio', icon: '🖥️' },
    { id: 'guardia', label: 'Panel Guardia', icon: '👮' },
    { id: 'rrhh', label: 'Dashboard RRHH', icon: '📊' },
    { id: 'admin', label: 'Administración', icon: '⚙️' },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Top Navigation - Responsive */}
      <header className="bg-white border-b-2 border-[#E0E0E0] sticky top-0 z-50">
        <div className="px-3 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#E12019] to-[#B51810] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs md:text-sm font-bold">TML</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm md:text-base font-bold text-[#333333] truncate">Sistema Retiro Digital</h1>
                <p className="text-xs text-[#6B6B6B] hidden sm:block">Tres Montes Lucchetti</p>
              </div>
            </div>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 hover:bg-[#F8F8F8] rounded-lg"
            >
              {menuOpen ? <X className="w-5 h-5 text-[#333333]" /> : <Menu className="w-5 h-5 text-[#333333]" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation - Responsive */}
        <aside className={`${menuOpen ? 'block' : 'hidden'} lg:block w-48 md:w-64 bg-white border-r-2 border-[#E0E0E0] min-h-[calc(100vh-80px)] sticky top-[80px] overflow-y-auto`}>
          <nav className="p-2 md:p-4">
            <ul className="space-y-1 md:space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => {
                      setCurrentSection(section.id);
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl transition-all text-sm md:text-base ${currentSection === section.id
                      ? 'bg-[#E12019] text-white'
                      : 'text-[#333333] hover:bg-[#F8F8F8]'
                      }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content - Responsive */}
        <main className="flex-1 p-3 md:p-6 lg:p-8">
          {currentSection === 'design-system' && <DesignSystem />}
          {currentSection === 'totem' && <TotemModule />}
          {currentSection === 'guardia' && <GuardiaModule />}
          {currentSection === 'rrhh' && <RRHHModuleNew />}
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

          {/* Rutas protegidas para usuario autenticado */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['rrhh', 'guardia', 'admin', 'supervisor']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />

          {/* Rutas específicas que redirigen al dashboard */}
          <Route
            path="/guardia"
            element={
              <ProtectedRoute allowedRoles={['guardia', 'admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rrhh"
            element={
              <ProtectedRoute allowedRoles={['rrhh', 'admin', 'supervisor']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />

          {/* Ruta por defecto - Redirige al Tótem */}
          <Route path="/" element={<Navigate to="/totem" replace />} />

          {/* Ruta 404 - Redirige al Tótem */}
          <Route path="*" element={<Navigate to="/totem" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}