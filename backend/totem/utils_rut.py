import re

def clean_rut(rut: str) -> str:
    """Limpia un RUT eliminando puntos y espacios, y dejando guion si está presente.
    Ej: '12.345.678-5' -> '12345678-5'
    """
    if not isinstance(rut, str):
        return ''
    return re.sub(r"[^0-9kK-]", "", rut)


def valid_rut(rut: str) -> bool:
    """Valida formato y dígito verificador del RUT chileno.
    Retorna True si el RUT es válido.
    Nota: Esta implementación asume RUT con guion: 12345678-5 o 12345678-K
    """
    rut_c = clean_rut(rut)
    if '-' not in rut_c:
        return False
    body, dv = rut_c.split('-')
    if not body.isdigit():
        return False
    try:
        dv = dv.upper()
        reversed_digits = map(int, reversed(body))
        factors = [2,3,4,5,6,7]
        s = 0
        factor_index = 0
        for d in reversed_digits:
            s += d * factors[factor_index]
            factor_index = (factor_index + 1) % len(factors)
        mod = 11 - (s % 11)
        if mod == 11:
            computed = '0'
        elif mod == 10:
            computed = 'K'
        else:
            computed = str(mod)
        return computed == dv
    except Exception:
        return False
