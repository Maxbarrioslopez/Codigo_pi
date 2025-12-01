/**
 * Hook para manejar inputs de RUT chileno
 * Incluye validación, formato automático y manejo de errores
 */

import { useState, useMemo, useCallback } from 'react';
import { RUTValidator } from '@/utils/rut/RUTValidator';

export interface UseRUTInputReturn {
    /** Valor raw sin formato */
    value: string;
    /** Valor formateado con puntos y guión */
    formatted: string;
    /** Si el RUT es válido (formato + dígito verificador) */
    isValid: boolean;
    /** Mensaje de error si el RUT es inválido */
    error: string | null;
    /** Función para actualizar el valor */
    onChange: (value: string) => void;
    /** Función para resetear el input */
    reset: () => void;
    /** Función para establecer un valor inicial */
    setValue: (value: string) => void;
}

/**
 * Hook para manejar inputs de RUT chileno con validación automática
 * @param initialValue - Valor inicial del RUT (opcional)
 * @returns Objeto con estado y funciones del input
 * 
 * @example
 * const { value, formatted, isValid, error, onChange, reset } = useRUTInput();
 * 
 * <input
 *   value={formatted}
 *   onChange={(e) => onChange(e.target.value)}
 * />
 */
export function useRUTInput(initialValue: string = ''): UseRUTInputReturn {
    const [rawValue, setRawValue] = useState(initialValue);

    // Formatear automáticamente el valor
    const formatted = useMemo(() => {
        if (!rawValue) return '';
        return RUTValidator.format(rawValue);
    }, [rawValue]);

    // Validar RUT completo (formato + dígito verificador)
    const isValid = useMemo(() => {
        if (!rawValue) return false;
        return RUTValidator.validate(rawValue);
    }, [rawValue]);

    // Generar mensaje de error
    const error = useMemo(() => {
        if (!rawValue) return null;

        // Verificar formato básico
        if (!RUTValidator.hasRUTFormat(rawValue)) {
            return 'Formato de RUT inválido. Debe ser 12345678-9';
        }

        // Verificar dígito verificador
        if (!isValid) {
            return 'RUT inválido. Verifica el dígito verificador';
        }

        return null;
    }, [rawValue, isValid]);

    // Manejar cambios en el input
    const handleChange = useCallback((value: string) => {
        // Permitir solo números, K/k y guión
        const cleaned = value.replace(/[^\dkK-]/g, '');
        setRawValue(cleaned);
    }, []);

    // Resetear a valor inicial
    const reset = useCallback(() => {
        setRawValue('');
    }, []);

    // Establecer valor manualmente
    const setValue = useCallback((value: string) => {
        setRawValue(value);
    }, []);

    return {
        value: rawValue,
        formatted,
        isValid,
        error,
        onChange: handleChange,
        reset,
        setValue,
    };
}
