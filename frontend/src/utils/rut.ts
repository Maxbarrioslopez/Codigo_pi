/**
 * Utilidades para validación y formato de RUT chileno
 */

/**
 * Limpia un RUT eliminando puntos y guiones
 */
export function cleanRut(rut: string): string {
    return rut.replace(/[.-]/g, '').toUpperCase();
}

/**
 * Calcula el dígito verificador de un RUT
 */
export function calculateDV(rutBody: string): string {
    let sum = 0;
    let multiplier = 2;

    for (let i = rutBody.length - 1; i >= 0; i--) {
        sum += parseInt(rutBody[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = sum % 11;
    const dv = 11 - remainder;

    if (dv === 11) return '0';
    if (dv === 10) return 'K';
    return dv.toString();
}

/**
 * Valida un RUT chileno con su dígito verificador
 */
export function validateRut(rut: string): boolean {
    const cleaned = cleanRut(rut);

    if (cleaned.length < 2) return false;

    const rutBody = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);

    // Verificar que el cuerpo solo contenga dígitos
    if (!/^\d+$/.test(rutBody)) return false;

    // Calcular y verificar dígito verificador
    return calculateDV(rutBody) === dv;
}

/**
 * Formatea un RUT con puntos y guión
 * Ejemplo: 12345678-9 -> 12.345.678-9
 */
export function formatRut(rut: string): string {
    const cleaned = cleanRut(rut);

    if (cleaned.length < 2) return rut;

    const rutBody = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);

    // Agregar puntos cada 3 dígitos de derecha a izquierda
    const formatted = rutBody.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${formatted}-${dv}`;
}

/**
 * Formatea un RUT mientras el usuario escribe
 * Retorna el RUT formateado y limita a formato válido
 */
export function formatRutOnType(value: string): string {
    // Eliminar todo excepto números y K
    const cleaned = value.replace(/[^0-9kK]/g, '').toUpperCase();

    if (cleaned.length === 0) return '';
    if (cleaned.length === 1) return cleaned;

    // Separar cuerpo y dígito verificador
    const rutBody = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);

    // Limitar a máximo 8 dígitos en el cuerpo
    const limitedBody = rutBody.slice(0, 8);

    // Formatear con puntos
    const formatted = limitedBody.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${formatted}-${dv}`;
}
