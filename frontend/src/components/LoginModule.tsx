import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Lock, User, AlertCircle, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';

// ============================================================================
// Types y Constantes
// ============================================================================

interface LoginCredentials {
    username: string;
    password: string;
}

interface User {
    rol: 'admin' | 'guardia' | 'rrhh' | 'supervisor';
}

const AVAILABLE_ROLES = ['Admin', 'RRHH', 'Guardia', 'Supervisor'];

const ROLE_ROUTES: Record<string, string> = {
    admin: '/admin',
    guardia: '/guardia',
    rrhh: '/rrhh',
    supervisor: '/rrhh',
};

// ============================================================================
// Validadores y Utilidades
// ============================================================================

/**
 * Valida el formato de RUT (con o sin guión) o usuario alfanumérico
 */
const validateUsernameFormat = (input: string): string | null => {
    if (!input) return null;

    // Si contiene números, probablemente es un RUT
    if (/\d/.test(input)) {
        const rutPattern = /^(\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk])?$/;
        if (!rutPattern.test(input.replace(/\./g, ''))) {
            return 'Formato de RUT incorrecto. Usa: 12.345.678-9 o 123456789';
        }
    }
    // Si es username alfanumérico
    else if (!/^[a-zA-Z0-9_-]*$/.test(input)) {
        return 'Usuario debe contener solo letras, números, guiones o guiones bajos';
    }

    return null;
};

/**
 * Normaliza username/RUT para enviar al backend
 */
const normalizeUsername = (input: string): string => {
    return input.replace(/\./g, '').toLowerCase().trim();
};

/**
 * Obtiene el rol del usuario desde localStorage
 */
const getUserRole = (): User['rol'] | null => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.rol || null;
    } catch {
        return null;
    }
};

/**
 * Obtiene el mensaje de error apropiado según el status HTTP
 */
const getErrorMessage = (err: any): string => {
    if (err.response?.status === 401) {
        return 'Usuario o contraseña incorrectos';
    }
    if (err.response?.status === 404) {
        return 'Usuario no encontrado';
    }
    if (err.response?.data?.detail) {
        return err.response.data.detail;
    }
    return err.message || 'Error de autenticación. Intenta de nuevo.';
};

// ============================================================================
// Componentes
// ============================================================================

/**
 * Campo de entrada de usuario con validación en tiempo real
 */
interface UsernameInputProps {
    value: string;
    hint: string | null;
    loading: boolean;
    onChange: (value: string) => void;
}

const UsernameInput: React.FC<UsernameInputProps> = ({ value, hint, loading, onChange }) => {
    const hasError = hint && hint.includes('incorrecto');
    const isValid = value.length > 0 && !hint;

    return (
        <div className="space-y-2">
            <Label htmlFor="username" className="text-[#333333] font-medium">
                Usuario o RUT
            </Label>
            <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
                <Input
                    id="username"
                    type="text"
                    placeholder="ej: usuario o 12.345.678-9"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`pl-10 border-2 ${hasError ? 'border-[#E12019]' : isValid ? 'border-[#017E49]' : 'border-[#E0E0E0]'
                        } rounded-lg`}
                    required
                    disabled={loading}
                    autoComplete="username"
                />
            </div>
            {hint && <p className="text-xs text-[#E12019]">{hint}</p>}
        </div>
    );
};

/**
 * Campo de entrada de contraseña con toggle de visibilidad
 */
interface PasswordInputProps {
    value: string;
    showPassword: boolean;
    loading: boolean;
    onChange: (value: string) => void;
    onToggleVisibility: () => void;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
    value,
    showPassword,
    loading,
    onChange,
    onToggleVisibility,
}) => {
    return (
        <div className="space-y-2">
            <Label htmlFor="password" className="text-[#333333] font-medium">
                Contraseña
            </Label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6B6B6B]" />
                <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu contraseña"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="pl-10 pr-12 border-2 border-[#E0E0E0] rounded-lg"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                />
                <button
                    type="button"
                    onClick={onToggleVisibility}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#6B6B6B] hover:text-[#333333] transition-colors p-1"
                    aria-label="Toggle password visibility"
                >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            </div>
        </div>
    );
};

/**
 * Alert de error
 */
interface ErrorAlertProps {
    message: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => (
    <Alert variant="destructive" className="border-[#E12019] bg-[#FFF5F5]">
        <AlertCircle className="h-4 w-4 text-[#E12019]" />
        <AlertDescription className="text-[#E12019]">{message}</AlertDescription>
    </Alert>
);

/**
 * Componente Principal - LoginModule
 */
const LoginModule: React.FC = () => {
    // ========================================================================
    // Estado
    // ========================================================================

    const [credentials, setCredentials] = useState<LoginCredentials>({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [usernameHint, setUsernameHint] = useState<string | null>(null);

    const { login } = useAuth();
    const navigate = useNavigate();

    // ========================================================================
    // Efectos
    // ========================================================================

    /**
     * Validar formato de RUT/Usuario mientras escriben
     */
    useEffect(() => {
        if (credentials.username.length > 0) {
            const hint = validateUsernameFormat(credentials.username);
            setUsernameHint(hint);
        } else {
            setUsernameHint(null);
        }
    }, [credentials.username]);

    // ========================================================================
    // Manejadores
    // ========================================================================

    /**
     * Maneja cambios en el username
     */
    const handleUsernameChange = (value: string) => {
        setCredentials((prev) => ({ ...prev, username: value }));
    };

    /**
     * Maneja cambios en la contraseña
     */
    const handlePasswordChange = (value: string) => {
        setCredentials((prev) => ({ ...prev, password: value }));
    };

    /**
     * Navega al dashboard según el rol del usuario
     */
    const navigateByRole = () => {
        const role = getUserRole();
        if (role && ROLE_ROUTES[role]) {
            navigate(ROLE_ROUTES[role]);
        } else {
            navigate('/');
        }
    };

    /**
     * Maneja el envío del formulario
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validaciones
        if (!credentials.username.trim()) {
            setError('El usuario es requerido');
            return;
        }
        if (!credentials.password.trim()) {
            setError('La contraseña es requerida');
            return;
        }

        setLoading(true);

        try {
            const normalizedUsername = normalizeUsername(credentials.username);
            await login(normalizedUsername, credentials.password);
            navigateByRole();
        } catch (err: any) {
            console.error('Error de login:', err);
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    // ========================================================================
    // Validaciones
    // ========================================================================

    const isFormValid = credentials.username.trim() && credentials.password.trim();

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F8F8] to-[#E0E0E0] p-4">
            <Card className="w-full max-w-md shadow-2xl border-0">
                {/* Header */}
                <CardHeader className="space-y-1 bg-gradient-to-br from-[#E12019] to-[#B51810] text-white rounded-t-lg">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-2xl font-bold text-[#E12019]">TML</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">Sistema Retiro Digital</CardTitle>
                    <CardDescription className="text-center text-[#FFE5E5]">
                        Ingresa tus credenciales para acceder
                    </CardDescription>
                </CardHeader>

                {/* Formulario */}
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4 pt-6">
                        {/* Error Alert */}
                        {error && <ErrorAlert message={error} />}

                        {/* Username Input */}
                        <UsernameInput
                            value={credentials.username}
                            hint={usernameHint}
                            loading={loading}
                            onChange={handleUsernameChange}
                        />

                        {/* Password Input */}
                        <PasswordInput
                            value={credentials.password}
                            showPassword={showPassword}
                            loading={loading}
                            onChange={handlePasswordChange}
                            onToggleVisibility={() => setShowPassword(!showPassword)}
                        />
                    </CardContent>

                    {/* Footer */}
                    <CardFooter className="flex flex-col space-y-4 border-t border-[#E0E0E0]">
                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full bg-[#E12019] hover:bg-[#B51810] text-white font-semibold py-2 h-10 rounded-lg"
                            disabled={loading || !isFormValid}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default LoginModule;
