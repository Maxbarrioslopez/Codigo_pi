import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertCircle, CheckCircle2, Copy, Eye, EyeOff, Lock, Plus, RefreshCw } from 'lucide-react';
import { authService, CreateUserRequest, CreateUserResponse, ResetPasswordResponse } from '@/services/auth.service';
import { formatRut, validateRut } from '@/utils/rut';
import { isValidRut } from '@/utils/parseChileanID';

interface UserManagementDialogProps {
    type: 'create' | 'reset'; // create: nuevo usuario | reset: cambiar contraseña existente
    existingUsername?: string; // Requerido si type === 'reset'
    availableUsers?: Array<{ username: string; email: string }>; // Lista de usuarios existentes para reset
    onSuccess?: (user?: CreateUserResponse | ResetPasswordResponse) => void;
    trigger?: React.ReactNode; // Elemento trigger personalizado
    open?: boolean; // Control externo del estado
    onOpenChange?: (open: boolean) => void; // Callback para cambio de estado
}

export function UserManagementDialog({ type, existingUsername, availableUsers = [], onSuccess, trigger, open: controlledOpen, onOpenChange }: UserManagementDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const [username, setUsername] = useState(existingUsername || '');
    const [rut, setRut] = useState('');
    const [email, setEmail] = useState('');
    const [rol, setRol] = useState<'rrhh' | 'guardia' | 'supervisor'>('guardia');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<CreateUserResponse | ResetPasswordResponse | null>(null);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        // Validaciones
        if (type === 'create') {
            if (!rut.trim()) {
                setError('El RUT es requerido');
                return;
            }
            if (!isValidRut(rut)) {
                setError('RUT inválido. Debe tener formato 12345678-9');
                return;
            }
            if (!email.trim()) {
                setError('El email es requerido');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setError('Email inválido');
                return;
            }
        } else {
            if (!username.trim()) {
                setError('El usuario es requerido');
                return;
            }
        }

        setLoading(true);
        try {
            if (type === 'create') {
                // Usar RUT sin guión como username
                const rutClean = rut.replace(/[.-]/g, '').toLowerCase();
                const createRequest: CreateUserRequest = {
                    username: rutClean,
                    email,
                    rol: rol as 'rrhh' | 'guardia' | 'supervisor',
                    first_name: firstName,
                    last_name: lastName
                };

                console.log('Enviando petición de crear usuario:', createRequest);
                const user = await authService.createUser(createRequest);
                console.log('Usuario creado exitosamente:', user);
                setResult(user);
                setSuccess(true);

                // Limpiar formulario
                setRut('');
                setEmail('');
                setRol('guardia');
                setFirstName('');
                setLastName('');
            } else {
                // Reset password
                if (!newPassword.trim()) {
                    setError('La nueva contraseña es requerida');
                    return;
                }
                if (newPassword.length < 8) {
                    setError('La contraseña debe tener al menos 8 caracteres');
                    return;
                }

                const resetResponse = await authService.resetPassword(username, newPassword);
                setResult(resetResponse as any);
                setSuccess(true);
                setNewPassword('');
            }
        } catch (err: any) {
            console.error('Error completo al crear/resetear usuario:', err);
            console.error('Error response:', err.response);
            console.error('Error data:', err.response?.data);
            if (err.response?.data?.username) {
                setError('El usuario ya existe');
            } else if (err.response?.data?.email) {
                setError('El email ya está registrado');
            } else {
                setError(err.message || `Error al ${type === 'create' ? 'crear' : 'resetear'} usuario`);
            }
        } finally {
            setLoading(false);
        }
    };

    const copyPassword = () => {
        if (result && 'password' in result && result.password) {
            navigator.clipboard.writeText(result.password);
            setCopiedPassword(true);
            setTimeout(() => setCopiedPassword(false), 2000);
        }
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (onOpenChange) {
            onOpenChange(newOpen);
        } else {
            setInternalOpen(newOpen);
        }

        // Resetear estado al cerrar
        if (!newOpen) {
            setError(null);
            setSuccess(false);
            setResult(null);
            setUsername(existingUsername || '');
            setRut('');
            setEmail('');
            setRol('guardia');
            setFirstName('');
            setLastName('');
            setNewPassword('');
            setShowPassword(false);
            setCopiedPassword(false);
        }
    };

    const defaultTrigger =
        type === 'reset' ? (
            <Button variant="outline" className="border-[#FF9F55] text-[#FF9F55] hover:bg-[#FFF5E8]">
                <RefreshCw className="w-4 h-4 mr-2" />
                Resetear Contraseña
            </Button>
        ) : null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-[#333333]">
                        {type === 'create' ? 'Crear Nuevo Usuario' : 'Resetear Contraseña'}
                    </DialogTitle>
                    <DialogDescription className="text-[#6B6B6B]">
                        {type === 'create'
                            ? 'Crea un nuevo usuario RRHH o Guardia usando su RUT. Se generará una contraseña temporal.'
                            : 'Asigna una nueva contraseña temporal al usuario'}
                    </DialogDescription>
                </DialogHeader>

                {success && result ? (
                    <div className="space-y-4 py-4">
                        <Alert className="border-[#017E49] bg-[#F0F9F7]">
                            <CheckCircle2 className="h-4 w-4 text-[#017E49]" />
                            <AlertDescription className="text-[#017E49]">
                                {type === 'create' ? 'Usuario creado exitosamente' : 'Contraseña reseteada exitosamente'}
                            </AlertDescription>
                        </Alert>

                        <div className="bg-[#F8F8F8] rounded-lg p-4 space-y-3">
                            {type === 'create' && (
                                <>
                                    <div>
                                        <p className="text-sm text-[#6B6B6B]">Usuario</p>
                                        <p className="font-mono font-semibold text-[#333333]">{(result as CreateUserResponse).username}</p>
                                    </div>
                                    {(result as CreateUserResponse).debe_cambiar_contraseña && (
                                        <div className="bg-[#FFF5E8] border border-[#FF9F55] rounded p-2">
                                            <p className="text-xs text-[#FF9F55]">
                                                ⚠ El usuario debe cambiar la contraseña en el primer ingreso
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {(result as CreateUserResponse).password && (
                                <div>
                                    <p className="text-sm text-[#6B6B6B]">Contraseña Temporal</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <code className="flex-1 bg-white rounded border border-[#E0E0E0] px-3 py-2 font-mono text-sm text-[#333333]">
                                            {showPassword
                                                ? (result as CreateUserResponse).password
                                                : '•'.repeat(((result as CreateUserResponse).password || '').length)}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="p-2 text-[#6B6B6B] hover:text-[#333333]"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={copyPassword}
                                            className={`p-2 rounded transition-colors ${copiedPassword
                                                ? 'bg-[#017E49] text-white'
                                                : 'text-[#6B6B6B] hover:text-[#333333] hover:bg-[#F0F0F0]'
                                                }`}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-[#6B6B6B] mt-2">
                                        Comparte esta contraseña de forma segura con el usuario
                                    </p>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={() => handleOpenChange(false)}
                            className="w-full bg-[#017E49] hover:bg-[#015A34] text-white"
                        >
                            Aceptar
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                        {error && (
                            <Alert variant="destructive" className="border-[#E12019] bg-[#FFF5F5]">
                                <AlertCircle className="h-4 w-4 text-[#E12019]" />
                                <AlertDescription className="text-[#E12019]">{error}</AlertDescription>
                            </Alert>
                        )}

                        {type === 'create' ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="rut" className="text-base font-semibold text-[#333333]">
                                        RUT (sin puntos, con guión)
                                    </Label>
                                    <Input
                                        id="rut"
                                        type="text"
                                        placeholder="ej: 12345678-9"
                                        value={rut}
                                        onChange={(e) => {
                                            const formatted = formatRut(e.target.value);
                                            setRut(formatted);
                                        }}
                                        className="border-2 border-[#E0E0E0] rounded-lg"
                                        disabled={loading}
                                        maxLength={12}
                                    />
                                    <p className="text-xs text-[#6B6B6B]">El RUT se usará como nombre de usuario</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-base font-semibold text-[#333333]">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="ej: juan.perez@tmluc.cl"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="border-2 border-[#E0E0E0] rounded-lg"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="first-name" className="text-base font-semibold text-[#333333]">
                                            Nombre
                                        </Label>
                                        <Input
                                            id="first-name"
                                            type="text"
                                            placeholder="Juan"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="border-2 border-[#E0E0E0] rounded-lg"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last-name" className="text-base font-semibold text-[#333333]">
                                            Apellido
                                        </Label>
                                        <Input
                                            id="last-name"
                                            type="text"
                                            placeholder="Pérez"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="border-2 border-[#E0E0E0] rounded-lg"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="rol" className="text-base font-semibold text-[#333333]">
                                        Rol
                                    </Label>
                                    <Select value={rol} onValueChange={(value: any) => setRol(value)} disabled={loading}>
                                        <SelectTrigger className="border-2 border-[#E0E0E0] rounded-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="rrhh">RRHH (Recursos Humanos)</SelectItem>
                                            <SelectItem value="guardia">Guardia (Portería)</SelectItem>
                                            <SelectItem value="supervisor">Supervisor (Lectura)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="reset-username" className="text-base font-semibold text-[#333333]">
                                        Usuario
                                    </Label>
                                    <Select value={username} onValueChange={(value) => setUsername(value)} disabled={loading}>
                                        <SelectTrigger className="border-2 border-[#E0E0E0] rounded-lg">
                                            <SelectValue placeholder="Seleccionar usuario..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableUsers.map(user => (
                                                <SelectItem key={user.username} value={user.username}>
                                                    {user.username} - {user.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="new-password" className="text-base font-semibold text-[#333333]">
                                        Nueva Contraseña Temporal
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-[#6B6B6B]" />
                                        <Input
                                            id="new-password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Generar una contraseña temporal"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="pl-10 border-2 border-[#E0E0E0] rounded-lg"
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-[#6B6B6B] hover:text-[#333333]"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <p className="text-sm text-[#555555] mt-2">Min. 8 caracteres, mayúsculas, minúsculas y números</p>
                                </div>
                            </>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 border-2 border-[#E0E0E0] text-[#333333] hover:bg-[#F8F8F8]"
                                disabled={loading}
                                onClick={() => handleOpenChange(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-[#E12019] hover:bg-[#B51810] text-white"
                                disabled={
                                    loading ||
                                    (type === 'create' && (!rut.trim() || !email.trim())) ||
                                    (type === 'reset' && (!username.trim() || !newPassword.trim()))
                                }
                            >
                                {loading
                                    ? 'Procesando...'
                                    : type === 'create'
                                        ? 'Guardar'
                                        : 'Resetear Contraseña'}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
