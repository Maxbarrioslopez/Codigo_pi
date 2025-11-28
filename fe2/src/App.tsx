import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MainMenu } from './pages/MainMenu';
import { AdminModule } from './pages/AdminModule';
import { GuardiaModule } from './pages/GuardiaModule';
import { RRHHModule } from './pages/RRHHModule';
import { TotemModule } from './pages/TotemModule';
import { TotemHome } from './pages/totem/TotemHome';
import { TotemValidacion } from './pages/totem/TotemValidacion';
import { TotemTicket } from './pages/totem/TotemTicket';
import { TotemAgendar } from './pages/totem/TotemAgendar';
import { TotemSinBeneficio } from './pages/totem/TotemSinBeneficio';
import { TotemIncidenciasConsultar } from './pages/totem/TotemIncidenciasConsultar';
import { TotemIncidenciasReportar } from './pages/totem/TotemIncidenciasReportar';
import { GuardiaDashboard } from './pages/guardia/GuardiaDashboard';
import { GuardiaScanQR } from './pages/guardia/GuardiaScanQR';
import { GuardiaIncidencias } from './pages/guardia/GuardiaIncidencias';
import { GuardiaMetricas } from './pages/guardia/GuardiaMetricas';
import { PortalDashboard } from './pages/portal/PortalDashboard';
import { NominaModule } from './pages/portal/NominaModule';
import { RetirosModule } from './pages/portal/RetirosModule';
import { IncidenciasModule } from './pages/portal/IncidenciasModule';
import { ReportesModule } from './pages/portal/ReportesModule';
import { TrabajadoresModule } from './pages/portal/TrabajadoresModule';
import { CiclosModule } from './pages/portal/CiclosModule';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/totem" element={<TotemModule />} />
          <Route path="/totem/home" element={<TotemHome />} />
          <Route path="/totem/validacion" element={<TotemValidacion />} />
          <Route path="/totem/ticket" element={<TotemTicket />} />
          <Route path="/totem/agendar" element={<TotemAgendar />} />
          <Route path="/totem/sin-beneficio" element={<TotemSinBeneficio />} />
          <Route path="/totem/incidencias/consultar" element={<TotemIncidenciasConsultar />} />
          <Route path="/totem/incidencias/reportar" element={<TotemIncidenciasReportar />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/menu"
            element={
              <ProtectedRoute>
                <MainMenu />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminModule />
              </ProtectedRoute>
            }
          />

          <Route
            path="/guardia"
            element={
              <ProtectedRoute allowedRoles={['admin', 'guardia']}>
                <GuardiaDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guardia/escanear"
            element={
              <ProtectedRoute allowedRoles={['admin', 'guardia']}>
                <GuardiaScanQR />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guardia/incidencias"
            element={
              <ProtectedRoute allowedRoles={['admin', 'guardia']}>
                <GuardiaIncidencias />
              </ProtectedRoute>
            }
          />
          <Route
            path="/guardia/metricas"
            element={
              <ProtectedRoute allowedRoles={['admin', 'guardia']}>
                <GuardiaMetricas />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rrhh"
            element={
              <ProtectedRoute allowedRoles={['admin', 'rrhh', 'supervisor']}>
                <PortalDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rrhh/nomina"
            element={
              <ProtectedRoute allowedRoles={['admin', 'rrhh']}>
                <NominaModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rrhh/retiros"
            element={
              <ProtectedRoute allowedRoles={['admin', 'rrhh', 'supervisor']}>
                <RetirosModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rrhh/incidencias"
            element={
              <ProtectedRoute allowedRoles={['admin', 'rrhh']}>
                <IncidenciasModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rrhh/reportes"
            element={
              <ProtectedRoute allowedRoles={['admin', 'rrhh', 'supervisor']}>
                <ReportesModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rrhh/trabajadores"
            element={
              <ProtectedRoute allowedRoles={['admin', 'rrhh', 'supervisor']}>
                <TrabajadoresModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rrhh/ciclos"
            element={
              <ProtectedRoute allowedRoles={['admin', 'rrhh', 'supervisor']}>
                <CiclosModule />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
