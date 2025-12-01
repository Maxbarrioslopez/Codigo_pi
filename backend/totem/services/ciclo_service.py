# -*- coding: utf-8 -*-
"""
Servicio de lógica de negocio para Ciclos Bimensuales.
Gestiona períodos de retiro de beneficios.
"""
import structlog
from django.db import transaction
from django.utils import timezone
from datetime import date
from ..models import Ciclo, Ticket

logger = structlog.get_logger(__name__)


class CicloService:
    """
    Servicio para gestión de ciclos bimensuales.
    Controla períodos de vigencia de beneficios.
    """

    @staticmethod
    def obtener_ciclo_activo():
        """
        Obtiene el ciclo actualmente activo.
        
        Returns:
            Ciclo or None: Ciclo activo o None si no existe
        """
        try:
            return Ciclo.objects.get(activo=True)
        except Ciclo.DoesNotExist:
            logger.warning("no_hay_ciclo_activo")
            return None
        except Ciclo.MultipleObjectsReturned:
            logger.error("multiples_ciclos_activos")
            # Desactivar todos menos el más reciente
            ciclos = Ciclo.objects.filter(activo=True).order_by('-id')
            ultimo = ciclos.first()
            Ciclo.objects.filter(activo=True).exclude(id=ultimo.id).update(activo=False)
            return ultimo

    @staticmethod
    def listar_ciclos(limit=None):
        """
        Lista todos los ciclos ordenados por fecha (más recientes primero).
        
        Args:
            limit (int): Máximo de resultados (opcional)
        
        Returns:
            QuerySet: Ciclos ordenados
        """
        qs = Ciclo.objects.all().order_by('-fecha_inicio', '-id')
        if limit:
            qs = qs[:limit]
        return qs

    @staticmethod
    def validar_fechas_ciclo(fecha_inicio, fecha_fin):
        """
        Valida que las fechas del ciclo sean coherentes.
        
        Args:
            fecha_inicio (date): Fecha de inicio
            fecha_fin (date): Fecha de fin
        
        Returns:
            tuple: (valid: bool, error_message: str or None)
        """
        if not fecha_inicio or not fecha_fin:
            return False, "Fechas inicio y fin son requeridas"
        
        if fecha_fin <= fecha_inicio:
            return False, "Fecha fin debe ser posterior a fecha inicio"
        
        # Verificar que no sea un período muy corto (menos de 7 días)
        duracion = (fecha_fin - fecha_inicio).days
        if duracion < 7:
            logger.warning("ciclo_muy_corto", dias=duracion)
            # No bloqueamos, solo advertimos
        
        return True, None

    @staticmethod
    @transaction.atomic
    def crear_ciclo(fecha_inicio, fecha_fin, desactivar_previo=True):
        """
        Crea un nuevo ciclo bimensual.
        
        Args:
            fecha_inicio (date): Fecha de inicio del ciclo
            fecha_fin (date): Fecha de fin del ciclo
            desactivar_previo (bool): Si True, desactiva ciclo activo anterior
        
        Returns:
            tuple: (ciclo: Ciclo or None, error: str or None)
        """
        logger.info("crear_ciclo", fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
        
        # Validar fechas
        valid, error = CicloService.validar_fechas_ciclo(fecha_inicio, fecha_fin)
        if not valid:
            logger.warning("validacion_fallida", error=error)
            return None, error
        
        # Desactivar ciclo activo anterior
        if desactivar_previo:
            Ciclo.objects.filter(activo=True).update(activo=False)
            logger.info("ciclo_anterior_desactivado")
        
        # Crear nuevo ciclo
        ciclo = Ciclo.objects.create(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            activo=True
        )
        
        logger.info("ciclo_creado", ciclo_id=ciclo.id)
        return ciclo, None

    @staticmethod
    def obtener_ciclo_por_id(ciclo_id):
        """
        Obtiene ciclo por ID.
        
        Args:
            ciclo_id (int): ID del ciclo
        
        Returns:
            Ciclo or None: Ciclo encontrado o None
        """
        try:
            return Ciclo.objects.get(id=ciclo_id)
        except Ciclo.DoesNotExist:
            logger.warning("ciclo_no_encontrado", ciclo_id=ciclo_id)
            return None

    @staticmethod
    @transaction.atomic
    def actualizar_ciclo(ciclo, fecha_inicio=None, fecha_fin=None, activo=None):
        """
        Actualiza un ciclo existente.
        
        Args:
            ciclo (Ciclo): Instancia a actualizar
            fecha_inicio (date): Nueva fecha inicio (opcional)
            fecha_fin (date): Nueva fecha fin (opcional)
            activo (bool): Nuevo estado activo (opcional)
        
        Returns:
            tuple: (ciclo: Ciclo, error: str or None)
        """
        logger.info("actualizar_ciclo", ciclo_id=ciclo.id)
        
        if fecha_inicio is not None:
            ciclo.fecha_inicio = fecha_inicio
        if fecha_fin is not None:
            ciclo.fecha_fin = fecha_fin
        
        # Validar fechas actualizadas
        valid, error = CicloService.validar_fechas_ciclo(ciclo.fecha_inicio, ciclo.fecha_fin)
        if not valid:
            return ciclo, error
        
        if activo is not None:
            ciclo.activo = activo
            if activo:
                # Si se activa este ciclo, desactivar otros
                Ciclo.objects.filter(activo=True).exclude(id=ciclo.id).update(activo=False)
        
        ciclo.save()
        logger.info("ciclo_actualizado", ciclo_id=ciclo.id)
        return ciclo, None

    @staticmethod
    @transaction.atomic
    def cerrar_ciclo(ciclo):
        """
        Cierra un ciclo (lo desactiva).
        
        Args:
            ciclo (Ciclo): Instancia a cerrar
        
        Returns:
            Ciclo: Ciclo cerrado
        """
        logger.info("cerrar_ciclo", ciclo_id=ciclo.id)
        
        ciclo.activo = False
        ciclo.save()
        
        logger.info("ciclo_cerrado", ciclo_id=ciclo.id)
        return ciclo

    @staticmethod
    def obtener_estadisticas_ciclo(ciclo):
        """
        Calcula estadísticas de tickets para un ciclo.
        
        Args:
            ciclo (Ciclo): Ciclo a analizar
        
        Returns:
            dict: Estadísticas consolidadas
        """
        logger.info("obtener_estadisticas_ciclo", ciclo_id=ciclo.id)
        
        tickets = Ticket.objects.filter(ciclo=ciclo)
        total = tickets.count()
        
        entregados = tickets.filter(estado='entregado').count()
        pendientes = tickets.filter(estado='pendiente').count()
        expirados = tickets.filter(estado='expirado').count()
        anulados = tickets.filter(estado='anulado').count()
        
        tasa_entrega = (entregados / total * 100) if total > 0 else 0
        tasa_expiracion = (expirados / total * 100) if total > 0 else 0
        
        return {
            'id': ciclo.id,
            'fecha_inicio': ciclo.fecha_inicio,
            'fecha_fin': ciclo.fecha_fin,
            'activo': ciclo.activo,
            'total_tickets': total,
            'entregados': entregados,
            'pendientes': pendientes,
            'expirados': expirados,
            'anulados': anulados,
            'tasa_entrega': round(tasa_entrega, 2),
            'tasa_expiracion': round(tasa_expiracion, 2),
        }

    @staticmethod
    def verificar_ciclo_vigente(fecha=None):
        """
        Verifica si existe un ciclo vigente para una fecha dada.
        
        Args:
            fecha (date): Fecha a verificar (default: hoy)
        
        Returns:
            Ciclo or None: Ciclo vigente o None
        """
        if fecha is None:
            fecha = timezone.now().date()
        
        try:
            return Ciclo.objects.get(
                activo=True,
                fecha_inicio__lte=fecha,
                fecha_fin__gte=fecha
            )
        except Ciclo.DoesNotExist:
            logger.warning("no_hay_ciclo_vigente", fecha=fecha)
            return None
        except Ciclo.MultipleObjectsReturned:
            logger.error("multiples_ciclos_vigentes", fecha=fecha)
            # Retornar el más reciente
            return Ciclo.objects.filter(
                activo=True,
                fecha_inicio__lte=fecha,
                fecha_fin__gte=fecha
            ).order_by('-id').first()

    @staticmethod
    def dias_restantes_ciclo(ciclo):
        """
        Calcula días restantes hasta el fin del ciclo.
        
        Args:
            ciclo (Ciclo): Ciclo a evaluar
        
        Returns:
            int: Días restantes (0 si ya finalizó)
        """
        hoy = timezone.now().date()
        if ciclo.fecha_fin < hoy:
            return 0
        return (ciclo.fecha_fin - hoy).days
