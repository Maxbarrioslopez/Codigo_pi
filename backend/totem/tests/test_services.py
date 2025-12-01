# -*- coding: utf-8 -*-
"""
Suite de tests unitarios para servicios del sistema Tótem.
Para ejecutar: pytest totem/tests/test_services.py -v --cov=totem.services
"""
import pytest
from django.test import TestCase
from django.utils import timezone
from datetime import date, timedelta
from totem.models import Trabajador, Ticket, Ciclo, StockSucursal, Sucursal
from totem.services import TrabajadorService, CicloService, StockService


@pytest.mark.django_db
class TestTrabajadorService:
    """Tests para TrabajadorService"""
    
    def test_buscar_trabajadores_por_rut(self):
        """Buscar trabajador por RUT debe retornar el correcto"""
        trabajador = Trabajador.objects.create(rut='12345678-9', nombre='Juan Pérez')
        resultado = TrabajadorService.buscar_trabajadores(rut='12345678-9')
        assert resultado.count() == 1
        assert resultado.first().rut == '12345678-9'
    
    def test_validar_rut_invalido(self):
        """Validar RUT inválido debe retornar False"""
        valido, error = TrabajadorService.validar_datos_trabajador('12345678-0', 'Juan Pérez')
        assert not valido
        assert 'inválido' in error.lower()
    
    def test_crear_trabajador_exitoso(self):
        """Crear trabajador con datos válidos debe funcionar"""
        trabajador, error = TrabajadorService.crear_trabajador('12345678-9', 'Juan Pérez')
        assert trabajador is not None
        assert error is None
        assert trabajador.rut == '12345678-9'
    
    def test_crear_trabajador_duplicado(self):
        """Crear trabajador duplicado debe fallar"""
        TrabajadorService.crear_trabajador('12345678-9', 'Juan Pérez')
        trabajador2, error = TrabajadorService.crear_trabajador('12345678-9', 'Pedro González')
        assert trabajador2 is None
        assert 'ya existe' in error.lower()
    
    def test_bloquear_trabajador(self):
        """Bloquear trabajador debe actualizar beneficio"""
        trabajador = Trabajador.objects.create(rut='12345678-9', nombre='Juan Pérez')
        TrabajadorService.bloquear_trabajador(trabajador, 'Suspensión')
        trabajador.refresh_from_db()
        assert trabajador.beneficio_disponible.get('tipo') == 'BLOQUEADO'


@pytest.mark.django_db
class TestCicloService:
    """Tests para CicloService"""
    
    def test_obtener_ciclo_activo(self):
        """Obtener ciclo activo debe retornar el correcto"""
        Ciclo.objects.create(fecha_inicio=date.today(), fecha_fin=date.today() + timedelta(days=30), activo=True)
        ciclo = CicloService.obtener_ciclo_activo()
        assert ciclo is not None
        assert ciclo.activo is True
    
    def test_crear_ciclo_desactiva_anterior(self):
        """Crear nuevo ciclo debe desactivar el anterior"""
        ciclo1 = Ciclo.objects.create(fecha_inicio=date.today(), fecha_fin=date.today() + timedelta(days=30), activo=True)
        ciclo2, error = CicloService.crear_ciclo(date.today() + timedelta(days=31), date.today() + timedelta(days=60))
        ciclo1.refresh_from_db()
        assert not ciclo1.activo
        assert ciclo2.activo
    
    def test_validar_fechas_invalidas(self):
        """Validar fechas donde fin < inicio debe fallar"""
        valido, error = CicloService.validar_fechas_ciclo(date.today(), date.today() - timedelta(days=1))
        assert not valido
        assert 'posterior' in error.lower()


@pytest.mark.django_db
class TestStockService:
    """Tests para StockService"""
    
    def test_registrar_movimiento_agregar(self):
        """Registrar movimiento de agregar stock debe funcionar"""
        sucursal = Sucursal.objects.create(nombre='Central', codigo='CENT')
        movimiento, error = StockService.registrar_movimiento('agregar', 'Estándar', 50, sucursal_codigo='CENT')
        assert movimiento is not None
        assert error is None
        assert movimiento.cantidad == 50
    
    def test_validar_cantidad_negativa(self):
        """Validar cantidad negativa debe fallar"""
        valido, error = StockService.validar_movimiento('agregar', 'Estándar', -10)
        assert not valido
        assert 'positivo' in error.lower()


# Continuar con más tests...
# TODO: Agregar tests para TicketService, AgendamientoService, IncidenciaService
# TODO: Agregar tests de integración
# TODO: Agregar tests para views
# TODO: Agregar tests para serializers
# TODO: Agregar tests para validators
# TODO: Agregar tests para signals
