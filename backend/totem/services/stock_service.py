# -*- coding: utf-8 -*-
"""
Servicio de lógica de negocio para Stock y Movimientos.
Gestiona inventario de cajas por sucursal.
"""
import structlog
from django.db import transaction
from django.db.models import Sum, Q
from django.utils import timezone
from ..models import StockSucursal, StockMovimiento, Sucursal

logger = structlog.get_logger(__name__)


class StockService:
    """
    Servicio para gestión de stock de cajas.
    Maneja inventario, movimientos y alertas.
    """

    @staticmethod
    def obtener_resumen_stock():
        """
        Obtiene resumen consolidado de todo el inventario.
        
        Returns:
            dict: Resumen con totales y distribución
        """
        logger.info("obtener_resumen_stock")
        
        stock_items = StockSucursal.objects.all()
        total_disponible = stock_items.aggregate(total=Sum('cantidad'))['total'] or 0
        
        # Por tipo de producto
        estandar = stock_items.filter(producto__iexact='Estándar').aggregate(s=Sum('cantidad'))['s'] or 0
        premium = stock_items.filter(producto__iexact='Premium').aggregate(s=Sum('cantidad'))['s'] or 0
        
        # Por sucursal
        por_sucursal = []
        sucursales = Sucursal.objects.all()
        for suc in sucursales:
            stock_suc = StockSucursal.objects.filter(sucursal=suc)
            total_suc = stock_suc.aggregate(t=Sum('cantidad'))['t'] or 0
            estandar_suc = stock_suc.filter(producto__iexact='Estándar').aggregate(s=Sum('cantidad'))['s'] or 0
            premium_suc = stock_suc.filter(producto__iexact='Premium').aggregate(s=Sum('cantidad'))['s'] or 0
            
            por_sucursal.append({
                'sucursal': suc.nombre,
                'codigo': suc.codigo,
                'total': total_suc,
                'estandar': estandar_suc,
                'premium': premium_suc
            })
        
        return {
            'disponible': total_disponible,
            'entregadas_hoy': 0,  # TODO: integrar con tickets del día
            'reservadas': 0,  # TODO: integrar con tickets pendientes
            'total_mes': total_disponible,
            'por_tipo': {
                'estandar': estandar,
                'premium': premium
            },
            'por_sucursal': por_sucursal
        }

    @staticmethod
    def listar_movimientos(fecha_desde=None, fecha_hasta=None, sucursal_id=None, tipo_caja=None, accion=None, limit=200):
        """
        Lista movimientos de stock con filtros.
        
        Args:
            fecha_desde (date): Filtro desde fecha (opcional)
            fecha_hasta (date): Filtro hasta fecha (opcional)
            sucursal_id (int): ID de sucursal (opcional)
            tipo_caja (str): Tipo de caja (opcional)
            accion (str): Acción (agregar/retirar) (opcional)
            limit (int): Máximo de resultados
        
        Returns:
            QuerySet: Movimientos ordenados
        """
        logger.info("listar_movimientos", fecha_desde=fecha_desde, fecha_hasta=fecha_hasta)
        
        qs = StockMovimiento.objects.select_related('sucursal').all()
        
        if fecha_desde:
            qs = qs.filter(fecha__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha__lte=fecha_hasta)
        if sucursal_id:
            qs = qs.filter(sucursal_id=sucursal_id)
        if tipo_caja:
            qs = qs.filter(tipo_caja__icontains=tipo_caja)
        if accion:
            qs = qs.filter(accion=accion)
        
        return qs.order_by('-fecha', '-hora')[:limit]

    @staticmethod
    def validar_movimiento(accion, tipo_caja, cantidad, sucursal=None):
        """
        Valida datos de un movimiento de stock.
        
        Args:
            accion (str): "agregar" o "retirar"
            tipo_caja (str): Tipo de caja
            cantidad (int): Cantidad a mover
            sucursal (Sucursal): Sucursal opcional
        
        Returns:
            tuple: (valid: bool, error_message: str or None)
        """
        if accion not in ['agregar', 'retirar']:
            return False, f"Acción inválida: {accion}. Debe ser 'agregar' o 'retirar'"
        
        if not tipo_caja or tipo_caja.strip() == '':
            return False, "Tipo de caja es requerido"
        
        if not isinstance(cantidad, int) or cantidad <= 0:
            return False, "Cantidad debe ser un entero positivo"
        
        # Si es retiro, verificar stock disponible
        if accion == 'retirar' and sucursal:
            stock_actual = StockService.obtener_stock_sucursal(sucursal, tipo_caja)
            if stock_actual < cantidad:
                return False, f"Stock insuficiente. Disponible: {stock_actual}, solicitado: {cantidad}"
        
        return True, None

    @staticmethod
    @transaction.atomic
    def registrar_movimiento(accion, tipo_caja, cantidad, motivo='', usuario='', sucursal_codigo=None):
        """
        Registra un movimiento de stock y actualiza inventario.
        
        Args:
            accion (str): "agregar" o "retirar"
            tipo_caja (str): Tipo de caja (Estándar, Premium)
            cantidad (int): Cantidad a mover
            motivo (str): Descripción del movimiento
            usuario (str): Usuario que realiza el movimiento
            sucursal_codigo (str): Código de sucursal (opcional)
        
        Returns:
            tuple: (movimiento: StockMovimiento or None, error: str or None)
        """
        logger.info("registrar_movimiento", accion=accion, tipo_caja=tipo_caja, cantidad=cantidad)
        
        # Obtener sucursal
        sucursal = None
        if sucursal_codigo:
            try:
                sucursal = Sucursal.objects.get(codigo=sucursal_codigo)
            except Sucursal.DoesNotExist:
                return None, f"Sucursal no encontrada: {sucursal_codigo}"
        else:
            # Usar sucursal por defecto
            sucursal = Sucursal.objects.first()
            if not sucursal:
                return None, "No hay sucursales configuradas"
        
        # Validar movimiento
        valid, error = StockService.validar_movimiento(accion, tipo_caja, cantidad, sucursal)
        if not valid:
            logger.warning("validacion_movimiento_fallida", error=error)
            return None, error
        
        # Crear registro de movimiento
        movimiento = StockMovimiento.objects.create(
            fecha=timezone.now().date(),
            hora=timezone.now().time(),
            tipo_caja=tipo_caja,
            accion=accion,
            cantidad=cantidad,
            motivo=motivo,
            usuario=usuario,
            sucursal=sucursal
        )
        
        # Actualizar stock
        StockService.actualizar_stock_sucursal(sucursal, tipo_caja, cantidad, accion)
        
        logger.info("movimiento_registrado", movimiento_id=movimiento.id)
        return movimiento, None

    @staticmethod
    def obtener_stock_sucursal(sucursal, tipo_caja):
        """
        Obtiene cantidad disponible de un tipo de caja en una sucursal.
        
        Args:
            sucursal (Sucursal): Sucursal a consultar
            tipo_caja (str): Tipo de caja
        
        Returns:
            int: Cantidad disponible
        """
        try:
            stock = StockSucursal.objects.get(sucursal=sucursal, producto__iexact=tipo_caja)
            return stock.cantidad
        except StockSucursal.DoesNotExist:
            return 0

    @staticmethod
    @transaction.atomic
    def actualizar_stock_sucursal(sucursal, tipo_caja, cantidad, accion):
        """
        Actualiza el stock de una sucursal (suma o resta).
        
        Args:
            sucursal (Sucursal): Sucursal a actualizar
            tipo_caja (str): Tipo de caja
            cantidad (int): Cantidad a sumar/restar
            accion (str): "agregar" o "retirar"
        
        Returns:
            StockSucursal: Stock actualizado
        """
        logger.info("actualizar_stock_sucursal", sucursal=sucursal.codigo, tipo=tipo_caja, cantidad=cantidad, accion=accion)
        
        stock, created = StockSucursal.objects.get_or_create(
            sucursal=sucursal,
            producto=tipo_caja,
            defaults={'cantidad': 0}
        )
        
        if accion == 'agregar':
            stock.cantidad += cantidad
        elif accion == 'retirar':
            stock.cantidad -= cantidad
            if stock.cantidad < 0:
                logger.warning("stock_negativo", sucursal=sucursal.codigo, cantidad=stock.cantidad)
                stock.cantidad = 0
        
        stock.save()
        logger.info("stock_actualizado", sucursal=sucursal.codigo, cantidad_final=stock.cantidad)
        return stock

    @staticmethod
    def obtener_alertas_stock_bajo(umbral=10):
        """
        Obtiene productos con stock bajo en todas las sucursales.
        
        Args:
            umbral (int): Cantidad mínima para alerta
        
        Returns:
            QuerySet: Productos con stock bajo
        """
        logger.info("obtener_alertas_stock_bajo", umbral=umbral)
        return StockSucursal.objects.filter(cantidad__lte=umbral).select_related('sucursal')

    @staticmethod
    def estadisticas_stock():
        """
        Calcula estadísticas generales de stock.
        
        Returns:
            dict: Estadísticas consolidadas
        """
        stock_items = StockSucursal.objects.all()
        
        total = stock_items.aggregate(t=Sum('cantidad'))['t'] or 0
        estandar = stock_items.filter(producto__iexact='Estándar').aggregate(s=Sum('cantidad'))['s'] or 0
        premium = stock_items.filter(producto__iexact='Premium').aggregate(s=Sum('cantidad'))['s'] or 0
        
        # Alertas
        alertas = StockService.obtener_alertas_stock_bajo(umbral=10).count()
        
        # Movimientos hoy
        hoy = timezone.now().date()
        movimientos_hoy = StockMovimiento.objects.filter(fecha=hoy).count()
        
        return {
            'total_disponible': total,
            'estandar': estandar,
            'premium': premium,
            'alertas_stock_bajo': alertas,
            'movimientos_hoy': movimientos_hoy,
            'sucursales_activas': Sucursal.objects.count()
        }
