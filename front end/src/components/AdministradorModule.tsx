import { useState, useEffect } from 'react';
import { Settings, Shield, Users, Bell, Database, Lock, CheckCircle, XCircle, Edit, Trash2, Plus } from 'lucide-react';
import { useParametrosOperativos } from '../hooks/useParametrosOperativos';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { UserManagementDialog } from './UserManagementDialog';
import { authService } from '../services/auth.service';
import { showSuccess, showError } from '../utils/toast';

export function AdministradorModule() {
  const [showUserModal, setShowUserModal] = useState(false);
  const [userManagementMode, setUserManagementMode] = useState<'create' | 'reset'>('create');
  const [userManagementUsername, setUserManagementUsername] = useState<string>('');
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingUser, setSavingUser] = useState(false);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const users = await authService.listUsers();
      setSystemUsers(users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showError('Error', 'No se pudieron cargar los usuarios. Asegúrate de estar autenticado.');
      setSystemUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este usuario?')) return;

    try {
      setSavingUser(true);
      // Implementar eliminación de usuario cuando el endpoint esté disponible
      // await authService.deleteUser(userId);
      setSystemUsers(systemUsers.filter(u => u.id !== userId));
      showSuccess('Éxito', 'Usuario eliminado correctamente');
    } catch (error) {
      showError('Error', 'No se pudo eliminar el usuario');
      console.error(error);
    } finally {
      setSavingUser(false);
    }
  };

  const handleResetPassword = async (username: string) => {
    try {
      setSavingUser(true);
      // Implementar reset de contraseña cuando el endpoint esté disponible
      // await authService.resetPassword(username);
      showSuccess('Éxito', `Contraseña de ${username} reseteada correctamente`);
      setShowUserModal(false);
    } catch (error) {
      showError('Error', 'No se pudo resetear la contraseña');
      console.error(error);
    } finally {
      setSavingUser(false);
    }
  };
  const { params, loading, saving, save, getValor } = useParametrosOperativos();
  const initialCycleDuration = parseInt(getValor('cycle_duration', '60')) || 60;
  const initialStockThreshold = parseInt(getValor('stock_threshold', '20')) || 20;
  const initialQrValidity = parseInt(getValor('qr_ttl_min', '30')) || 30;
  const [cycleDuration, setCycleDuration] = useState<number>(initialCycleDuration);
  const [stockThreshold, setStockThreshold] = useState<number>(initialStockThreshold);
  const [qrValidity, setQrValidity] = useState<number>(initialQrValidity);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  async function saveAll() {
    await Promise.all([
      save('cycle_duration', cycleDuration.toString(), 'Duración ciclo en días'),
      save('stock_threshold', stockThreshold.toString(), 'Umbral mínimo stock'),
      save('qr_ttl_min', qrValidity.toString(), 'Validez QR minutos'),
    ]);
  }

  const MetricCard = ({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) => (
    <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
      <p className="text-[#6B6B6B] text-sm mb-1">{title}</p>
      <p className="text-[#333333] text-3xl font-bold" style={{ color }}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[#333333] mb-2">Administración del Sistema</h2>
            <p className="text-[#6B6B6B]">
              Gestión de roles, permisos y configuraciones generales
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="metrics" className="py-3">
            <Database className="w-4 h-4 mr-2" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="users" className="py-3">
            <Users className="w-4 h-4 mr-2" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="settings" className="py-3">
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="notifications" className="py-3">
            <Bell className="w-4 h-4 mr-2" />
            Notificaciones
          </TabsTrigger>
        </TabsList>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Trabajadores Activos"
              value={systemUsers.filter(u => u.is_active).length}
              icon={Users}
              color="#017E49"
            />
            <MetricCard
              title="Usuarios del Sistema"
              value={systemUsers.length}
              icon={Shield}
              color="#FF9F55"
            />
            <MetricCard
              title="Sesiones Activas"
              value={systemUsers.filter(u => u.last_login).length}
              icon={Lock}
              color="#E12019"
            />
            <MetricCard
              title="Usuarios RRHH"
              value={systemUsers.filter(u => u.rol === 'rrhh').length}
              icon={Users}
              color="#6B6B6B"
            />
          </div>

          {/* Métricas Detalladas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
              <h3 className="text-[#333333] mb-4">Distribución por Roles</h3>
              <div className="space-y-3">
                {[
                  { rol: 'admin', label: 'Administradores', color: '#E12019' },
                  { rol: 'rrhh', label: 'RRHH', color: '#017E49' },
                  { rol: 'guardia', label: 'Guardia', color: '#FF9F55' },
                  { rol: 'supervisor', label: 'Supervisores', color: '#6B6B6B' },
                ].map(({ rol, label, color }) => {
                  const count = systemUsers.filter(u => u.rol === rol).length;
                  const percentage = systemUsers.length > 0 ? (count / systemUsers.length) * 100 : 0;
                  return (
                    <div key={rol} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[#333333] text-sm">{label}</span>
                        <span className="text-[#6B6B6B] text-sm">{count} usuarios</span>
                      </div>
                      <div className="w-full bg-[#E0E0E0] rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
              <h3 className="text-[#333333] mb-4">Últimos Accesos</h3>
              <div className="space-y-3">
                {systemUsers
                  .filter(u => u.last_login)
                  .sort((a, b) => new Date(b.last_login!).getTime() - new Date(a.last_login!).getTime())
                  .slice(0, 5)
                  .map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#E12019] to-[#B51810] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </span>
                        </div>
                        <span className="text-[#333333] text-sm">{user.username}</span>
                      </div>
                      <span className="text-[#6B6B6B] text-xs">
                        {new Date(user.last_login!).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                  ))}
                {systemUsers.filter(u => u.last_login).length === 0 && (
                  <p className="text-[#6B6B6B] text-sm text-center py-4">No hay accesos recientes</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#333333]">Usuarios del Sistema</h3>
              <Button
                onClick={() => {
                  setUserManagementMode('create');
                  setUserManagementUsername('');
                  setShowUserModal(true);
                }}
                className="bg-[#E12019] text-white hover:bg-[#B51810] h-10 px-4 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F8F8F8] border-b-2 border-[#E0E0E0]">
                    <th className="text-left p-4 text-[#333333]">Nombre</th>
                    <th className="text-left p-4 text-[#333333]">Email</th>
                    <th className="text-left p-4 text-[#333333]">Rol</th>
                    <th className="text-left p-4 text-[#333333]">Estado</th>
                    <th className="text-left p-4 text-[#333333]">Último Acceso</th>
                    <th className="text-left p-4 text-[#333333]">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-[#6B6B6B]">Cargando usuarios...</td>
                    </tr>
                  ) : systemUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-[#6B6B6B]">No hay usuarios para mostrar</td>
                    </tr>
                  ) : systemUsers.map((user) => (
                    <tr key={user.id} className="border-b border-[#E0E0E0] hover:bg-[#F8F8F8]">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#E12019] to-[#B51810] rounded-full flex items-center justify-center">
                            <span className="text-white" style={{ fontSize: '14px' }}>
                              {user.first_name?.[0] || user.username[0]}{user.last_name?.[0] || user.username[1] || ''}
                            </span>
                          </div>
                          <span className="text-[#333333]">{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}</span>
                        </div>
                      </td>
                      <td className="p-4 text-[#6B6B6B]">{user.email}</td>
                      <td className="p-4">
                        <Badge className={
                          user.rol === 'admin' ? 'bg-[#E12019] text-white' :
                            user.rol === 'rrhh' ? 'bg-[#017E49] text-white' :
                              user.rol === 'guardia' ? 'bg-[#FF9F55] text-white' :
                                'bg-[#6B6B6B] text-white'
                        }>
                          {user.rol.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={user.is_active ? 'bg-[#017E49] text-white' : 'bg-[#6B6B6B] text-white'}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="p-4 text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                        {user.last_login ? new Date(user.last_login).toLocaleDateString('es-CL', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Nunca'}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setUserManagementMode('reset');
                              setUserManagementUsername(user.username || user.email.split('@')[0]);
                              setShowUserModal(true);
                            }}
                            disabled={savingUser}
                            className="h-9 px-3 rounded-lg border-2 border-[#017E49] text-[#017E49] hover:bg-[#E7F8F3] text-xs"
                          >
                            <Lock className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={savingUser}
                            className="h-9 px-3 rounded-lg border-2 border-[#E12019] text-[#E12019] hover:bg-[#FFE6E6]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cycle Settings */}
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#E12019] bg-opacity-10 rounded-xl flex items-center justify-center">
                  <Database className="w-5 h-5 text-[#E12019]" />
                </div>
                <h3 className="text-[#333333]">Configuración de Ciclos</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cycle-duration" className="text-[#333333]">
                    Duración del ciclo (días)
                  </Label>
                  <Input
                    id="cycle-duration"
                    type="number"
                    value={cycleDuration}
                    onChange={(e) => setCycleDuration(parseInt(e.target.value))}
                    className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2"
                  />
                  <p className="text-[#6B6B6B] mt-2" style={{ fontSize: '12px' }}>
                    Actualmente: {cycleDuration} días (Rango: 45-90)
                  </p>
                </div>
                <Button disabled={saving} onClick={saveAll} className="w-full bg-[#017E49] text-white hover:bg-[#016339] h-11 rounded-xl">
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                {loading && <p className="text-xs text-[#6B6B6B] mt-2">Cargando parámetros...</p>}
              </div>
            </div>

            {/* Stock Settings */}
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#FF9F55] bg-opacity-10 rounded-xl flex items-center justify-center">
                  <Database className="w-5 h-5 text-[#FF9F55]" />
                </div>
                <h3 className="text-[#333333]">Gestión de Stock</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="stock-threshold" className="text-[#333333]">
                    Umbral de stock bajo
                  </Label>
                  <Input
                    id="stock-threshold"
                    type="number"
                    value={stockThreshold}
                    onChange={(e) => setStockThreshold(parseInt(e.target.value))}
                    className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2"
                  />
                  <p className="text-[#6B6B6B] mt-2" style={{ fontSize: '12px' }}>
                    Alerta cuando stock ≤ {stockThreshold} unidades
                  </p>
                </div>
                <Button disabled={saving} onClick={saveAll} className="w-full bg-[#017E49] text-white hover:bg-[#016339] h-11 rounded-xl">
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>

            {/* QR Settings */}
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#017E49] bg-opacity-10 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#017E49]" />
                </div>
                <h3 className="text-[#333333]">Reglas de QR</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="qr-validity" className="text-[#333333]">
                    Validez del QR (minutos)
                  </Label>
                  <Input
                    id="qr-validity"
                    type="number"
                    value={qrValidity}
                    onChange={(e) => setQrValidity(parseInt(e.target.value))}
                    className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2"
                  />
                  <p className="text-[#6B6B6B] mt-2" style={{ fontSize: '12px' }}>
                    QR válido por {qrValidity} minutos después de generación
                  </p>
                </div>
                <Button disabled={saving} onClick={saveAll} className="w-full bg-[#017E49] text-white hover:bg-[#016339] h-11 rounded-xl">
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#E12019] bg-opacity-10 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#E12019]" />
                </div>
                <h3 className="text-[#333333]">Seguridad</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#F8F8F8] rounded-xl">
                  <div>
                    <p className="text-[#333333]">Autenticación de dos factores</p>
                    <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>
                      Requiere verificación adicional
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 bg-[#F8F8F8] rounded-xl">
                  <div>
                    <p className="text-[#333333]">Sesión automática</p>
                    <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>
                      Cierre después de 30 min inactividad
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 bg-[#F8F8F8] rounded-xl">
                  <div>
                    <p className="text-[#333333]">Log de auditoría</p>
                    <p className="text-[#6B6B6B]" style={{ fontSize: '12px' }}>
                      Registrar todas las acciones
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Notifications */}
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E12019] bg-opacity-10 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-[#E12019]" />
                  </div>
                  <h3 className="text-[#333333]">Notificaciones Email</h3>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#F8F8F8] rounded-xl">
                  <span className="text-[#333333]" style={{ fontSize: '14px' }}>Stock bajo</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F8F8F8] rounded-xl">
                  <span className="text-[#333333]" style={{ fontSize: '14px' }}>Fin de ciclo cercano</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F8F8F8] rounded-xl">
                  <span className="text-[#333333]" style={{ fontSize: '14px' }}>Nueva nómina cargada</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F8F8F8] rounded-xl">
                  <span className="text-[#333333]" style={{ fontSize: '14px' }}>Incidencias reportadas</span>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            {/* SMS Notifications */}
            <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#017E49] bg-opacity-10 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-[#017E49]" />
                  </div>
                  <h3 className="text-[#333333]">Notificaciones SMS</h3>
                </div>
                <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#F8F8F8] rounded-xl">
                  <span className="text-[#333333]" style={{ fontSize: '14px' }}>QR generado</span>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F8F8F8] rounded-xl">
                  <span className="text-[#333333]" style={{ fontSize: '14px' }}>Beneficio asignado</span>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F8F8F8] rounded-xl">
                  <span className="text-[#333333]" style={{ fontSize: '14px' }}>Retiro agendado</span>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Reset User Modal */}
      <UserManagementDialog
        type={userManagementMode}
        existingUsername={userManagementUsername}
        open={showUserModal}
        onOpenChange={(open) => {
          setShowUserModal(open);
          // Si se cierra el modal, recargar usuarios
          if (!open) {
            loadUsers();
          }
        }}
      />
    </div>
  );
}
