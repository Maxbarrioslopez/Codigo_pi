/**
 * Componente de input para RUT chileno con validación automática
 * Incluye feedback visual, formato automático y validación de dígito verificador
 */

import { useRUTInput } from '@/hooks/useRUTInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useEffect } from 'react';

export interface RUTInputProps {
    /** Label del input */
    label?: string;
    /** Placeholder del input */
    placeholder?: string;
    /** Callback cuando el RUT es válido (al blur) */
    onValidRUT?: (rut: string) => void;
    /** Si el campo es requerido */
    required?: boolean;
    /** Valor inicial del RUT */
    initialValue?: string;
    /** Clase CSS adicional */
    className?: string;
    /** Si está deshabilitado */
    disabled?: boolean;
    /** Tamaño del input */
    size?: 'default' | 'sm' | 'lg';
    /** Variante visual */
    variant?: 'default' | 'totem';
}

/**
 * Input de RUT chileno con validación automática
 * 
 * @example
 * <RUTInput
 *   label="RUT del trabajador"
 *   placeholder="12.345.678-9"
 *   onValidRUT={(rut) => console.log('RUT válido:', rut)}
 *   required
 * />
 */
export function RUTInput({
    label,
    placeholder = '12.345.678-9',
    onValidRUT,
    required = false,
    initialValue = '',
    className = '',
    disabled = false,
    size = 'default',
    variant = 'default',
}: RUTInputProps) {
    const { value, formatted, isValid, error, onChange, setValue } = useRUTInput(initialValue);

    // Actualizar valor si cambia initialValue
    useEffect(() => {
        if (initialValue && initialValue !== value) {
            setValue(initialValue);
        }
    }, [initialValue, value, setValue]);

    // Manejar blur: llamar a onValidRUT si el RUT es válido
    const handleBlur = () => {
        if (isValid && onValidRUT) {
            onValidRUT(formatted);
        }
    };

    // Clases para tamaño
    const sizeClasses = {
        default: 'h-10 text-base',
        sm: 'h-8 text-sm',
        lg: variant === 'totem' ? 'h-20 text-3xl' : 'h-12 text-lg',
    };

    // Clases para variante
    const variantClasses = variant === 'totem'
        ? 'text-center font-bold tracking-wider'
        : '';

    // Clases para estado de validación
    const validationClasses = value
        ? error
            ? 'border-red-500 focus-visible:ring-red-500'
            : isValid
                ? 'border-green-500 focus-visible:ring-green-500'
                : ''
        : '';

    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <Label className={variant === 'totem' ? 'text-2xl font-semibold' : ''}>
                    {label} {required && <span className="text-red-500">*</span>}
                </Label>
            )}

            <div className="relative">
                <Input
                    type="text"
                    value={formatted}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`
            ${sizeClasses[size]}
            ${variantClasses}
            ${validationClasses}
            pr-12
          `}
                    aria-label={label || 'RUT'}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'rut-error' : undefined}
                />

                {/* Ícono de validación */}
                {value && !disabled && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {isValid ? (
                            <CheckCircle2
                                className={`${size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'} text-green-500`}
                                aria-label="RUT válido"
                            />
                        ) : (
                            <AlertCircle
                                className={`${size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'} text-red-500`}
                                aria-label="RUT inválido"
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Mensaje de error */}
            {error && (
                <p
                    id="rut-error"
                    className={`text-red-500 ${variant === 'totem' ? 'text-lg' : 'text-sm'} flex items-center gap-1`}
                    role="alert"
                >
                    <AlertCircle className={variant === 'totem' ? 'w-5 h-5' : 'w-4 h-4'} />
                    {error}
                </p>
            )}
        </div>
    );
}
