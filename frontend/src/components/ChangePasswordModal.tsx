import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';
import { authService } from '@/services/auth.service';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onSuccess?: () => void;
    requireChange?: boolean; // Si es true, no permite cerrar sin cambiar
}

export function ChangePasswordModal({ isOpen, onSuccess, requireChange = false }: ChangePasswordModalProps) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    // Validar contraseña
    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return 'La contraseña debe tener al menos 8 caracteres';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Debe contener al menos una mayúscula';
        }
        if (!/[a-z]/.test(password)) {
            return 'Debe contener al menos una minúscula';
        }
        if (!/[0-9]/.test(password)) {
            return 'Debe contener al menos un número';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        // Validaciones
        if (!currentPassword) {
            setError('Debes ingresar tu contraseña actual');
            return;
        }

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (currentPassword === newPassword) {
            setError('La nueva contraseña debe ser diferente a la actual');
            return;
        }

        setLoading(true);
        try {
            await authService.changePassword({
                old_password: currentPassword,
                new_password: newPassword,
                new_password_confirm: confirmPassword
            });

            setSuccess(true);
            setTimeout(() => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                if (onSuccess) onSuccess();
            }, 2000);
        } catch (err: any) {
            if (err.response?.data?.old_password) {
                setError('La contraseña actual es incorrecta');
            } else {
                setError(err.message || 'Error al cambiar la contraseña');
            }
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = newPassword ? validatePassword(newPassword) === null : false;

    return (
        <Dialog open={isOpen} onOpenChange={!requireChange ? undefined : () => { }}>
            <DialogContent className="max-w-md" onPointerDownOutside={requireChange ? (e) => e.preventDefault() : undefined}>
                <DialogHeader>
                    <DialogTitle className="text-[#333333] flex items-center gap-2">
                        <Lock className="w-5 h-5 text-[#E12019]" />
                        Cambiar Contraseña
                    </DialogTitle>
                    <DialogDescription className="text-[#6B6B6B]">
                        {requireChange
                            ? 'Debes cambiar tu contraseña temporal antes de continuar'
                            : 'Actualiza tu contraseña de forma segura'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <Alert variant="destructive" className="border-[#E12019] bg-[#FFF5F5]">
                            <AlertCircle className="h-4 w-4 text-[#E12019]" />
                            <AlertDescription className="text-[#E12019]">{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="border-[#017E49] bg-[#F0F9F7]">
                            <CheckCircle2 className="h-4 w-4 text-[#017E49]" />
                            <AlertDescription className="text-[#017E49]">
                                Contraseña cambiada exitosamente
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="current-password" className="text-base font-semibold text-[#333333]">
                            Contraseña Actual
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-[#6B6B6B]" />
                            <Input
                                id="current-password"
                                type={showCurrentPassword ? 'text' : 'password'}
                                placeholder="Ingresa tu contraseña actual"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="pl-10 pr-10 border-2 border-[#E0E0E0] rounded-lg"
                                disabled={loading || success}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-3 text-[#6B6B6B] hover:text-[#333333]"
                            >
                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="new-password" className="text-base font-semibold text-[#333333]">
                            Nueva Contraseña
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-[#6B6B6B]" />
                            <Input
                                id="new-password"
                                type={showNewPassword ? 'text' : 'password'}
                                placeholder="Ingresa tu nueva contraseña"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={`pl-10 pr-10 border-2 rounded-lg ${newPassword.length > 0
                                        ? passwordStrength
                                            ? 'border-[#017E49]'
                                            : 'border-[#E12019]'
                                        : 'border-[#E0E0E0]'
                                    }`}
                                disabled={loading || success}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-3 text-[#6B6B6B] hover:text-[#333333]"
                            >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {newPassword && (
                            <p className={`text-xs ${passwordStrength ? 'text-[#017E49]' : 'text-[#6B6B6B]'}`}>
                                {passwordStrength
                                    ? '✓ Contraseña segura'
                                    : 'Min. 8 caracteres, mayúscula, minúscula y número'}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-base font-semibold text-[#333333]">
                            Confirmar Contraseña
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-[#6B6B6B]" />
                            <Input
                                id="confirm-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirma tu nueva contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`pl-10 pr-10 border-2 rounded-lg ${confirmPassword.length > 0
                                        ? confirmPassword === newPassword
                                            ? 'border-[#017E49]'
                                            : 'border-[#E12019]'
                                        : 'border-[#E0E0E0]'
                                    }`}
                                disabled={loading || success}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-3 text-[#6B6B6B] hover:text-[#333333]"
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        {!requireChange && (
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 border-2 border-[#E0E0E0] text-[#333333] hover:bg-[#F8F8F8]"
                                disabled={loading || success}
                                onClick={() => {
                                    setCurrentPassword('');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                    setError(null);
                                    setSuccess(false);
                                }}
                            >
                                Cancelar
                            </Button>
                        )}
                        <Button
                            type="submit"
                            className={`flex-1 ${!requireChange ? 'flex-1' : 'w-full'
                                } bg-[#E12019] hover:bg-[#B51810] text-white font-semibold`}
                            disabled={
                                loading ||
                                success ||
                                !currentPassword ||
                                !newPassword ||
                                !confirmPassword ||
                                !passwordStrength
                            }
                        >
                            {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                        </Button>
                    </div>

                    {requireChange && (
                        <p className="text-xs text-center text-[#6B6B6B] pt-4">
                            Esta acción es obligatoria para acceder al sistema
                        </p>
                    )}
                </form>
            </DialogContent>
        </Dialog>
    );
}
