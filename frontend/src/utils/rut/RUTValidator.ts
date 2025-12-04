/**
 * Validador de RUT chileno
 * Implementa algoritmo módulo 11 para validación de dígito verificador
 */

export class RUTValidator {
    private static readonly RUT_REGEX = /^(\d{1,2})\.?(\d{3})\.?(\d{3})-?([0-9kK])$/;

    /**
     * Limpia un RUT removiendo puntos, guiones y espacios
     * @param rut - RUT a limpiar (ej: "12.345.678-5")
     * @returns RUT limpio sin formato (ej: "12345678-5")
     * @example
     * RUTValidator.clean('12.345.678-5') // => '12345678-5'
     * RUTValidator.clean('  12345678-5  ') // => '12345678-5'
     */
    static clean(rut: string): string {
        if (!rut) return '';
        return rut
            .replace(/\./g, '')   // Remover puntos
            .replace(/^0+/, '')   // Remover ceros iniciales
            .trim()               // Remover espacios
            .toUpperCase();       // K mayúscula
    }

    /**
     * Formatea un RUT con puntos y guión
     * @param rut - RUT sin formato o parcialmente formateado
     * @returns RUT formateado (ej: "12.345.678-5")
     * @example
     * RUTValidator.format('123456785') // => '12.345.678-5'
     * RUTValidator.format('12345678-5') // => '12.345.678-5'
     */
    static format(rut: string): string {
        const cleaned = this.clean(rut);
        const match = cleaned.match(/^(\d{1,8})(\d|K)$/);

        if (!match) return rut; // Si no coincide, retornar original

        const [, num, dv] = match;

        // Agregar puntos cada 3 dígitos desde la derecha
        const formatted = num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        return `${formatted}-${dv}`;
    }

    /**
     * Valida formato y dígito verificador de RUT chileno
     * Usa algoritmo módulo 11
     * @param rut - RUT a validar
     * @returns true si el RUT es válido
     * @example
     * RUTValidator.validate('12.345.678-5') // => true/false
     * RUTValidator.validate('11111111-1') // => true
     */
    static validate(rut: string): boolean {
        if (!rut || typeof rut !== 'string') return false;

        const cleaned = this.clean(rut);
        const match = cleaned.match(/^(\d{1,8})(\d|K)$/);

        if (!match) return false;

        const [, rutNum, dv] = match;

        // Calcular dígito verificador con algoritmo módulo 11
        let sum = 0;
        let multiplier = 2;

        // Iterar desde el último dígito hacia el primero
        for (let i = rutNum.length - 1; i >= 0; i--) {
            sum += parseInt(rutNum[i], 10) * multiplier;
            multiplier = multiplier === 7 ? 2 : multiplier + 1;
        }

        const expectedDV = 11 - (sum % 11);
        const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : String(expectedDV);

        return dv === calculatedDV;
    }

    /**
     * Parsea un RUT y retorna sus componentes
     * @param rut - RUT a parsear
     * @returns Objeto con número, dv y formato completo, o null si es inválido
     * @example
     * RUTValidator.parse('12.345.678-5')
     * // => { number: '12345678', dv: '5', formatted: '12.345.678-5' }
     */
    static parse(rut: string): { number: string; dv: string; formatted: string } | null {
        const cleaned = this.clean(rut);
        const match = cleaned.match(/^(\d{1,8})(\d|K)$/);

        if (!match) return null;

        const [, number, dv] = match;

        return {
            number,
            dv,
            formatted: this.format(rut),
        };
    }

    /**
     * Verifica si un string tiene formato de RUT (sin validar dígito verificador)
     * @param rut - String a verificar
     * @returns true si tiene formato de RUT
     */
    static hasRUTFormat(rut: string): boolean {
        if (!rut) return false;
        const cleaned = this.clean(rut);
        return /^(\d{1,8})(\d|K)$/.test(cleaned);
    }
}
