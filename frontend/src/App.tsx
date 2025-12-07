import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginModule from './components/LoginModule';
import { useState } from 'react';
import { TotemModule } from './components/TotemModule';
import { GuardiaModule } from './components/GuardiaModule';
import { RRHHModuleNew } from './components/RRHHModuleNew';
import { AdministradorModule } from './components/AdministradorModule';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { Toaster } from './components/ui/toaster';
import { StockModule } from './components/StockModule';
import { BackendStatusBanner } from './components/BackendStatusBanner';
import { Menu, X, LogOut, MonitorSmartphone, Shield, BarChart3, Boxes, Settings } from 'lucide-react';

// Layout principal con sidebar para usuarios autenticados
function DashboardLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Determinar qué secciones mostrar según el rol
  const getSections = () => {
    const allSections = [
      { id: 'totem' as const, label: 'Tótem Autoservicio', Icon: MonitorSmartphone, roles: ['admin'] },
      { id: 'guardia' as const, label: 'Panel Guardia', Icon: Shield, roles: ['guardia', 'admin'] },
      { id: 'rrhh' as const, label: 'Dashboard RRHH', Icon: BarChart3, roles: ['rrhh', 'admin', 'supervisor'] },
      { id: 'stock' as const, label: 'Gestión de Stock', Icon: Boxes, roles: ['rrhh', 'guardia'] },
      { id: 'admin' as const, label: 'Administración', Icon: Settings, roles: ['admin'] },
    ];

    return allSections.filter(s => s.roles.includes(user?.rol || ''));
  };

  const sections = getSections();

  // Determinar sección inicial según el rol del usuario
  const getInitialSection = () => {
    if (user?.rol === 'admin') return 'admin';
    if (sections.length === 1) return sections[0].id;
    return 'rrhh';
  };

  const [currentSection, setCurrentSection] = useState(getInitialSection());

  const handleLogout = () => {
    logout();
  };

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
                <p className="text-xs text-[#6B6B6B] hidden sm:block">{user?.rol?.toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm text-[#E12019] hover:bg-[#FFE5E5] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 hover:bg-[#F8F8F8] rounded-lg"
              >
                {menuOpen ? <X className="w-5 h-5 text-[#333333]" /> : <Menu className="w-5 h-5 text-[#333333]" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation - Solo mostrar si hay múltiples secciones */}
        {sections.length > 1 && (
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
                      aria-label={section.label}
                    >
                      <span className="inline-flex items-center gap-2">
                        <section.Icon className={`w-4 h-4 ${currentSection === section.id ? 'text-white' : 'text-[#6B6B6B]'}`} />
                        <span className="font-medium">{section.label}</span>
                      </span>
                    </button>
                  </li>
                ))}
                {/* Botón de salir en móvil */}
                <li className="md:hidden mt-4 pt-4 border-t border-[#E0E0E0]">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#E12019] hover:bg-[#FFE5E5] transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Salir
                  </button>
                </li>
              </ul>
            </nav>
          </aside>
        )}

        {/* Main Content - Responsive */}
        <main className="flex-1 p-3 md:p-6 lg:p-8">
          {currentSection === 'totem' && <TotemModule />}
          {currentSection === 'guardia' && <GuardiaModule />}
          {currentSection === 'rrhh' && <RRHHModuleNew />}
          {currentSection === 'stock' && <StockModule />}
          {currentSection === 'admin' && <AdministradorModule />}
        </main>
      </div>
    </div>
  );
}

// Wrapper para usar el hook de Auth
function DashboardLayoutWrapper() {
  const { user, logout } = useAuth();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(
    user?.debe_cambiar_contraseña === true
  );

  const handlePasswordChangeSuccess = () => {
    setShowChangePasswordModal(false);
  };

  return (
    <>
      <DashboardLayout />
      {showChangePasswordModal && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onSuccess={handlePasswordChangeSuccess}
          requireChange={true}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Banner de estado del backend - se muestra solo si está caído */}
        <BackendStatusBanner />

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
                <DashboardLayoutWrapper />
              </ProtectedRoute>
            }
          />

          {/* Rutas específicas que redirigen al dashboard */}
          <Route
            path="/guardia"
            element={
              <ProtectedRoute allowedRoles={['guardia', 'admin']}>
                <DashboardLayoutWrapper />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rrhh"
            element={
              <ProtectedRoute allowedRoles={['rrhh', 'admin', 'supervisor']}>
                <DashboardLayoutWrapper />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayoutWrapper />
              </ProtectedRoute>
            }
          />

          {/* Ruta por defecto - Redirige al Tótem */}
          <Route path="/" element={<Navigate to="/totem" replace />} />

          {/* Ruta 404 - Redirige al Tótem */}
          <Route path="*" element={<Navigate to="/totem" replace />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}