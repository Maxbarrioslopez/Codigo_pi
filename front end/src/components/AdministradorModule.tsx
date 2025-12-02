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

const roles = [
  { id: 1, name: 'Administrador', users: 3, color: '#E12019', description: 'Acceso total al sistema' },
  { id: 2, name: 'RRHH', users: 5, color: '#017E49', description: 'Gestión de nómina y beneficios' },
  { id: 3, name: 'Guardia', users: 12, color: '#FF9F55', description: 'Validación de tickets y entregas' },
  { id: 4, name: 'Supervisor', users: 4, color: '#6B6B6B', description: 'Solo lectura y reportes' },
];

const permissions = [
  {
    module: 'Trabajadores',
    admin: { create: true, read: true, update: true, delete: true },
    rrhh: { create: true, read: true, update: true, delete: false },
    guardia: { create: false, read: true, update: false, delete: false },
    supervisor: { create: false, read: true, update: false, delete: false },
  },
  {
    module: 'Ciclo Bimensual',
    admin: { create: true, read: true, update: true, delete: true },
    rrhh: { create: true, read: true, update: true, delete: false },
    guardia: { create: false, read: true, update: false, delete: false },
    supervisor: { create: false, read: true, update: false, delete: false },
  },
  {
    module: 'Trazabilidad QR',
    admin: { create: true, read: true, update: true, delete: true },
    rrhh: { create: true, read: true, update: false, delete: false },
    guardia: { create: false, read: true, update: true, delete: false },
    supervisor: { create: false, read: true, update: false, delete: false },
  },
  {
    module: 'Nómina',
    admin: { create: true, read: true, update: true, delete: true },
    rrhh: { create: true, read: true, update: true, delete: false },
    guardia: { create: false, read: false, update: false, delete: false },
    supervisor: { create: false, read: true, update: false, delete: false },
  },
  {
    module: 'Reportes',
    admin: { create: true, read: true, update: true, delete: true },
    rrhh: { create: false, read: true, update: false, delete: false },
    guardia: { create: false, read: true, update: false, delete: false },
    supervisor: { create: false, read: true, update: false, delete: false },
  },
  {
    module: 'Configuración',
    admin: { create: true, read: true, update: true, delete: true },
    rrhh: { create: false, read: true, update: false, delete: false },
    guardia: { create: false, read: false, update: false, delete: false },
    supervisor: { create: false, read: false, update: false, delete: false },
  },
];

export function AdministradorModule() {
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userManagementMode, setUserManagementMode] = useState<'create' | 'reset'>('create');
  const [userManagementUsername, setUserManagementUsername] = useState<string>('');
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const users = await authService.listUsers();
        setSystemUsers(users || []);
      } catch (error) {
        console.error('Error loading users:', error);
        setSystemUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);
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

  const getStatusBadge = (status: string) => {
    return status === 'Activo' ? 'bg-[#017E49] text-white' : 'bg-[#6B6B6B] text-white';
  };

  const PermissionCell = ({ allowed }: { allowed: boolean }) => (
    <div className="flex justify-center">
      {allowed ? (
        <CheckCircle className="w-5 h-5 text-[#017E49]" />
      ) : (
        <XCircle className="w-5 h-5 text-[#E0E0E0]" />
      )}
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

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="roles" className="py-3">
            <Shield className="w-4 h-4 mr-2" />
            Roles y Permisos
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

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          {/* Roles Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role) => (
              <div key={role.id} className="bg-white border-2 border-[#E0E0E0] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: role.color }}>
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 rounded-lg border-2 border-[#E0E0E0]"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
                <h4 className="text-[#333333] mb-1">{role.name}</h4>
                <p className="text-[#6B6B6B] mb-3" style={{ fontSize: '12px' }}>
                  {role.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                    {role.users} usuarios
                  </span>
                  <Badge style={{ backgroundColor: role.color, color: 'white' }}>
                    Activo
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Permission Matrix */}
          <div className="bg-white border-2 border-[#E0E0E0] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[#333333]">Matriz de Permisos (CRUD)</h3>
              <Button
                onClick={() => setShowRoleModal(true)}
                className="bg-[#E12019] text-white hover:bg-[#B51810] h-10 px-4 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Rol
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F8F8F8] border-b-2 border-[#E0E0E0]">
                    <th className="text-left p-4 text-[#333333]">Módulo</th>
                    <th className="text-center p-4 text-[#333333]" colSpan={4}>Administrador</th>
                    <th className="text-center p-4 text-[#333333]" colSpan={4}>RRHH</th>
                    <th className="text-center p-4 text-[#333333]" colSpan={4}>Guardia</th>
                    <th className="text-center p-4 text-[#333333]" colSpan={4}>Supervisor</th>
                  </tr>
                  <tr className="bg-[#F8F8F8] border-b-2 border-[#E0E0E0]">
                    <th></th>
                    <th className="text-center p-2 text-[#6B6B6B]" style={{ fontSize: '12px' }}>C</th>
                    <th className="text-center p-2 text-[#6B6B6B]" style={{ fontSize: '12px' }}>R</th>
                    <th className="text-center p-2 text-[#6B6B6B]" style={{ fontSize: '12px' }}>U</th>
                    <th className="text-center p-2 text-[#6B6B6B]" style={{ fontSize: '12px' }}>D</th>
                    <th className="text-center p-2 text-[#6B6B6B]" style={{ fontSize: '12px' }}>C</th>
                    <th className="text-center p-2 text-[#6B6B6B]" style={{ fontSize: '12px' }}>R</th>
                    <th className="text-center p-2 text-[#6B6B6B]" style={{ fontSize: '12px' }}>U</th>
                    <th className="text-center p-2 text-[#6B6B6B]" style={{ fontSize: '12px' }}>D</th>
                    <th className="text-center p-2 text-[#6B6B6B]" style={{ fontSize: '12px' }}>C</th>
                    <th className="text-center p-2 text-[#6B6B6B]" style={{ fontSize: '12px' }}>R</th>
                    <th className="text-center p-2 text-[#6B6B6B]" style={{ fontSize: '12px' }}>U</th>
                    <th className="text-center p-2 text-[#6B6B6B]" style={{ fontSize: '12px' }}>D</th>
                    <th className="text-center p-2 text-[#6B6B6B]" style={{ fontSize: '12px' }}>C</th>
                    <th className="text-center p-2 text-[#6B6B6B]" style={{ fontSize: '12px' }}>R</th>
                    <th className="text-center p-2 text-[#6B6B6B]" style={{ fontSize: '12px' }}>U</th>
                    <th className="text-center p-2 text-[#6B6B6B]" style={{ fontSize: '12px' }}>D</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((perm, index) => (
                    <tr key={index} className="border-b border-[#E0E0E0] hover:bg-[#F8F8F8]">
                      <td className="p-4 text-[#333333]">{perm.module}</td>
                      <td className="p-2"><PermissionCell allowed={perm.admin.create} /></td>
                      <td className="p-2"><PermissionCell allowed={perm.admin.read} /></td>
                      <td className="p-2"><PermissionCell allowed={perm.admin.update} /></td>
                      <td className="p-2"><PermissionCell allowed={perm.admin.delete} /></td>
                      <td className="p-2"><PermissionCell allowed={perm.rrhh.create} /></td>
                      <td className="p-2"><PermissionCell allowed={perm.rrhh.read} /></td>
                      <td className="p-2"><PermissionCell allowed={perm.rrhh.update} /></td>
                      <td className="p-2"><PermissionCell allowed={perm.rrhh.delete} /></td>
                      <td className="p-2"><PermissionCell allowed={perm.guardia.create} /></td>
                      <td className="p-2"><PermissionCell allowed={perm.guardia.read} /></td>
                      <td className="p-2"><PermissionCell allowed={perm.guardia.update} /></td>
                      <td className="p-2"><PermissionCell allowed={perm.guardia.delete} /></td>
                      <td className="p-2"><PermissionCell allowed={perm.supervisor.create} /></td>
                      <td className="p-2"><PermissionCell allowed={perm.supervisor.read} /></td>
                      <td className="p-2"><PermissionCell allowed={perm.supervisor.update} /></td>
                      <td className="p-2"><PermissionCell allowed={perm.supervisor.delete} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[#6B6B6B] mt-4" style={{ fontSize: '12px' }}>
              C = Crear | R = Leer | U = Actualizar | D = Eliminar
            </p>
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
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="text-[#333333]">{user.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-[#6B6B6B]">{user.email}</td>
                      <td className="p-4">
                        <Badge className={
                          user.role === 'Administrador' ? 'bg-[#E12019] text-white' :
                            user.role === 'RRHH' ? 'bg-[#017E49] text-white' :
                              user.role === 'Guardia' ? 'bg-[#FF9F55] text-white' :
                                'bg-[#6B6B6B] text-white'
                        }>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusBadge(user.status)}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-[#6B6B6B]" style={{ fontSize: '14px' }}>
                        {user.lastAccess}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setUserManagementMode('reset');
                              setUserManagementUsername(user.email.split('@')[0]);
                              setShowUserModal(true);
                            }}
                            className="h-9 px-3 rounded-lg border-2 border-[#017E49] text-[#017E49] hover:bg-[#E7F8F3] text-xs"
                          >
                            <Lock className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
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

      {/* Create Role Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#333333]">Crear Nuevo Rol</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-name" className="text-[#333333]">Nombre del Rol</Label>
              <Input
                id="role-name"
                placeholder="Ej: Supervisor de Planta"
                className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2"
              />
            </div>
            <div>
              <Label htmlFor="role-description" className="text-[#333333]">Descripción</Label>
              <Input
                id="role-description"
                placeholder="Breve descripción del rol"
                className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2"
              />
            </div>
            <div>
              <Label className="text-[#333333]">Color Identificador</Label>
              <Select>
                <SelectTrigger className="h-11 border-2 border-[#E0E0E0] rounded-xl mt-2">
                  <SelectValue placeholder="Seleccionar color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">Rojo (#E12019)</SelectItem>
                  <SelectItem value="green">Verde (#017E49)</SelectItem>
                  <SelectItem value="orange">Naranja (#FF9F55)</SelectItem>
                  <SelectItem value="gray">Gris (#6B6B6B)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRoleModal(false)}
                className="h-11 px-6 rounded-xl border-2 border-[#E0E0E0]"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => setShowRoleModal(false)}
                className="bg-[#E12019] text-white hover:bg-[#B51810] h-11 px-6 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Rol
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Reset User Modal */}
      <UserManagementDialog
        type={userManagementMode}
        existingUsername={userManagementUsername}
        trigger={showUserModal}
        onSuccess={() => {
          setShowUserModal(false);
          // Aquí podrías refrescar la lista de usuarios
        }}
      />
    </div>
  );
}
