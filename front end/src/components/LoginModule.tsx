import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Lock, User, AlertCircle, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';

const LoginModule: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [usernameHint, setUsernameHint] = useState<string | null>(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Validar formato de RUT/Usuario mientras escriben
    useEffect(() => {
        if (username.length > 0) {
            const hint = validateUsernameFormat(username);
            setUsernameHint(hint);
        } else {
            setUsernameHint(null);
        }
    }, [username]);

    // Validar formato de RUT (con o sin guión)
    const validateUsernameFormat = (input: string): string | null => {
        // Si contiene números, probablemente es un RUT
        if (/\d/.test(input)) {
            // RUT debe tener formato: 12345678-9 o 123456789
            const rutPattern = /^(\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk])?$/;
            if (rutPattern.test(input.replace(/\./g, ''))) {
                return null; // Formato válido
            } else {
                return 'Formato de RUT incorrecto. Usa: 12.345.678-9 o 123456789';
            }
        }
        // Si es username alfanumérico
        if (/^[a-zA-Z0-9_-]*$/.test(input)) {
            return null;
        }
        return 'Usuario debe contener solo letras, números, guiones o guiones bajos';
    };

    // Normalizar username/RUT para enviar al backend
    const normalizeUsername = (input: string): string => {
        // Solo eliminar puntos (para RUT), mantener lowercase para usernames
        return input.replace(/\./g, '').toLowerCase().trim();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validaciones básicas
        if (!username.trim()) {
            setError('El usuario es requerido');
            return;
        }
        if (!password.trim()) {
            setError('La contraseña es requerida');
            return;
        }

        setLoading(true);

        try {
            // Normalizar username (eliminar puntos de RUT, etc.)
            const normalizedUsername = normalizeUsername(username);

            await login(normalizedUsername, password);

            // Redirigir según el rol
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            switch (user.rol) {
                case 'admin':
                    navigate('/admin');
                    break;
                case 'guardia':
                    navigate('/guardia');
                    break;
                case 'rrhh':
                    navigate('/rrhh');
                    break;
                case 'supervisor':
                    navigate('/rrhh'); // Supervisores acceden al mismo panel que RRHH
                    break;
                default:
                    navigate('/');
            }
        } catch (err: any) {
            console.error('Error de login:', err);

            // Mensajes de error específicos
            if (err.response?.status === 401) {
                setError('Usuario o contraseña incorrectos');
            } else if (err.response?.status === 404) {
                setError('Usuario no encontrado');
            } else if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError(err.message || 'Error de autenticación. Intenta de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F8F8] to-[#E0E0E0] p-4">
            <Card className="w-full max-w-md shadow-2xl border-0">
                <CardHeader className="space-y-1 bg-gradient-to-br from-[#E12019] to-[#B51810] text-white rounded-t-lg">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-2xl font-bold text-[#E12019]">TML</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">
                        Sistema Retiro Digital
                    </CardTitle>
                    <CardDescription className="text-center text-[#FFE5E5]">
                        Ingresa tus credenciales para acceder
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4 pt-6">
                        {error && (
                            <Alert variant="destructive" className="border-[#E12019] bg-[#FFF5F5]">
                                <AlertCircle className="h-4 w-4 text-[#E12019]" />
                                <AlertDescription className="text-[#E12019]">{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-[#333333] font-medium">
                                Usuario o RUT
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-[#6B6B6B]" />
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="ej: usuario o 12.345.678-9"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className={`pl-10 border-2 ${usernameHint && usernameHint.includes('incorrecto')
                                        ? 'border-[#E12019]'
                                        : username.length > 0
                                            ? 'border-[#017E49]'
                                            : 'border-[#E0E0E0]'
                                        } rounded-lg`}
                                    required
                                    disabled={loading}
                                    autoComplete="username"
                                />
                                {username.length > 0 && !usernameHint && (
                                    <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-[#017E49]" />
                                )}
                            </div>
                            {usernameHint && (
                                <p className="text-xs text-[#E12019]">{usernameHint}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-[#333333] font-medium">
                                Contraseña
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-[#6B6B6B]" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Ingresa tu contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10 border-2 border-[#E0E0E0] rounded-lg"
                                    required
                                    disabled={loading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-[#6B6B6B] hover:text-[#333333]"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 border-t border-[#E0E0E0]">
                        <Button
                            type="submit"
                            className="w-full bg-[#E12019] hover:bg-[#B51810] text-white font-semibold py-2 h-10 rounded-lg"
                            disabled={loading || !username.trim() || !password.trim()}
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

                        <div className="text-sm text-center text-[#6B6B6B]">
                            <p>Roles disponibles: Admin, RRHH, Guardia, Supervisor</p>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default LoginModule;
