// Utilidad para parsear cédula chilena desde PDF417
// Retorna al menos el RUT validado (Módulo 11) y campos opcionales si se detectan

export type ChileanID = {
    rut: string;
    nombres?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    fechaNacimiento?: string; // ISO o DD/MM/YYYY según disponibilidad
};

export function parseChileanIDFromPdf417(raw: string): ChileanID | null {
    if (!raw) return null;
    const text = normalize(raw);

    // Buscar candidatos de RUT en el texto
    const rutRegex = /(\b\d{7,8}-[\dkK]\b)/g;
    const candidates = Array.from(text.matchAll(rutRegex)).map(m => m[1]);
    const unique = Array.from(new Set(candidates));

    for (const candidate of unique) {
        const rut = candidate.toUpperCase();
        if (isValidRut(rut)) {
            // Campos opcionales: heurísticas básicas
            const nombres = extractToken(text, /(NOMBRES?:?)([^\n]+)/i);
            const apPat = extractToken(text, /(APELLIDO\s*PATERNO:?)([^\n]+)/i);
            const apMat = extractToken(text, /(APELLIDO\s*MATERNO:?)([^\n]+)/i);
            const birth = extractDate(text);
            return {
                rut: formatRut(rut),
                ...(nombres ? { nombres: nombres.trim() } : {}),
                ...(apPat ? { apellidoPaterno: apPat.trim() } : {}),
                ...(apMat ? { apellidoMaterno: apMat.trim() } : {}),
                ...(birth ? { fechaNacimiento: birth } : {}),
            };
        }
    }

    return null;
}

function normalize(s: string): string {
    return s.replace(/[\r\t]/g, ' ').replace(/[\u0000-\u001F]/g, ' ').replace(/ +/g, ' ').trim();
}

function extractToken(text: string, re: RegExp): string | null {
    const m = text.match(re);
    if (!m) return null;
    const value = (m[2] || '').replace(/\s{2,}/g, ' ').trim();
    return value || null;
}

function extractDate(text: string): string | null {
    // Heurísticas comunes: DD/MM/YYYY o YYYY-MM-DD
    const m1 = text.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
    if (m1) return `${m1[1]}/${m1[2]}/${m1[3]}`;
    const m2 = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
    return null;
}

// Importar validación desde rut.ts para evitar duplicación
import { validateRut as validateRutBase } from './rut';

function isValidRut(rut: string): boolean {
    return validateRutBase(rut);
}

// Exportar para uso externo
export { isValidRut };

function formatRut(rut: string): string {
    // Formatea RUT limpiando y aplicando formato XX-XX (sin puntos para PDF417)
    let clean = rut.replace(/[^\dkK]/g, '').toUpperCase();

    if (clean.length === 0) return '';

    // Si ya tiene el dígito verificador
    if (clean.length > 1) {
        const body = clean.slice(0, -1);
        const dv = clean.slice(-1);
        return `${body}-${dv}`;
    }

    return clean;
}

// Exportar para uso externo
export { formatRut };
