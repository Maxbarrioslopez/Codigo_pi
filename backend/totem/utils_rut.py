import re


def clean_rut(rut: str) -> str:
    """Normaliza el RUT al formato "12345678-9" aceptando entrada con o sin guion."""
    if not isinstance(rut, str):
        return ''

    # Mantener solo dígitos y K/k; el último carácter es el dígito verificador.
    sanitized = re.sub(r"[^0-9kK]", "", rut)
    if len(sanitized) < 2:
        return ''

    body, dv = sanitized[:-1], sanitized[-1].upper()
    return f"{body}-{dv}"


def valid_rut(rut: str) -> bool:
    """Valida formato y dígito verificador del RUT chileno, con o sin guion en la entrada."""
    rut_c = clean_rut(rut)
    if '-' not in rut_c:
        return False

    body, dv = rut_c.split('-')
    if not body.isdigit():
        return False

    try:
        dv = dv.upper()
        reversed_digits = map(int, reversed(body))
        factors = [2, 3, 4, 5, 6, 7]
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
