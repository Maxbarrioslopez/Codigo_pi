"""
Test package para backend Totem + Guardia.

Módulos:
- conftest.py: Fixtures pytest compartidas
- test_totem_flow.py: Tests de flujo Totem (escaneo, asignación, idempotencia)
- test_guardia_validation.py: Tests de validación Guardia (TTL, race conditions, seguridad)
- helpers.py: Builders y helpers reutilizables
- README_TESTS.md: Documentación completa

Ejecución:
    pytest tests/ -v
    pytest tests/test_totem_flow.py -v
    pytest tests/test_guardia_validation.py -v
"""

__version__ = '1.0.0'
__author__ = 'Senior Backend Engineer'
