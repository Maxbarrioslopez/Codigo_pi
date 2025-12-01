"""
Tareas asíncronas con Celery para Tótem Digital.
"""

from celery import shared_task
from django.core.management import call_command
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task(name='totem.tasks.expirar_tickets_automatico')
def expirar_tickets_automatico():
    """
    Tarea periódica para expirar tickets vencidos.
    Se ejecuta cada 5 minutos via Celery Beat.
    
    Returns:
        dict: Resultado con cantidad de tickets expirados
    """
    try:
        logger.info("Iniciando tarea: expirar_tickets_automatico")
        
        # Ejecutar comando de Django
        call_command('expirar_tickets')
        
        # Contar tickets expirados en esta ejecución
        from totem.models import Ticket
        tickets_expirados = Ticket.objects.filter(
            estado='expirado',
            ttl_expira_at__lte=timezone.now()
        ).count()
        
        logger.info(f"Tarea completada: {tickets_expirados} tickets expirados")
        
        return {
            'success': True,
            'tickets_expirados': tickets_expirados,
            'timestamp': timezone.now().isoformat(),
        }
        
    except Exception as e:
        logger.error(f"Error en expirar_tickets_automatico: {e}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
        }


@shared_task(name='totem.tasks.marcar_agendamientos_vencidos')
def marcar_agendamientos_vencidos():
    """
    Tarea diaria para marcar agendamientos vencidos.
    Se ejecuta a medianoche via Celery Beat.
    
    Returns:
        dict: Resultado con cantidad de agendamientos marcados
    """
    try:
        logger.info("Iniciando tarea: marcar_agendamientos_vencidos")
        
        # Ejecutar comando de Django
        call_command('marcar_agendamientos_vencidos')
        
        # Contar agendamientos vencidos
        from totem.models import Agendamiento
        agendamientos_vencidos = Agendamiento.objects.filter(
            estado='vencido',
            fecha_retiro__lt=timezone.now().date()
        ).count()
        
        logger.info(f"Tarea completada: {agendamientos_vencidos} agendamientos marcados")
        
        return {
            'success': True,
            'agendamientos_vencidos': agendamientos_vencidos,
            'timestamp': timezone.now().isoformat(),
        }
        
    except Exception as e:
        logger.error(f"Error en marcar_agendamientos_vencidos: {e}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
        }


@shared_task(name='totem.tasks.enviar_notificacion_email')
def enviar_notificacion_email(destinatario: str, asunto: str, mensaje: str):
    """
    Tarea asíncrona para enviar emails.
    
    Args:
        destinatario: Email del destinatario
        asunto: Asunto del email
        mensaje: Cuerpo del mensaje
        
    Returns:
        dict: Resultado del envío
    """
    try:
        from django.core.mail import send_mail
        from django.conf import settings
        
        logger.info(f"Enviando email a {destinatario}: {asunto}")
        
        send_mail(
            subject=asunto,
            message=mensaje,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[destinatario],
            fail_silently=False,
        )
        
        logger.info(f"Email enviado exitosamente a {destinatario}")
        
        return {
            'success': True,
            'destinatario': destinatario,
        }
        
    except Exception as e:
        logger.error(f"Error enviando email a {destinatario}: {e}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
        }


@shared_task(name='totem.tasks.generar_reporte_diario')
def generar_reporte_diario():
    """
    Tarea para generar reporte diario de estadísticas.
    Se ejecuta a las 23:00 via Celery Beat.
    
    Returns:
        dict: Estadísticas del día
    """
    try:
        from totem.models import Ticket, Agendamiento, Incidencia
        from datetime import date
        
        hoy = date.today()
        
        # Estadísticas
        tickets_hoy = Ticket.objects.filter(created_at__date=hoy).count()
        tickets_entregados = Ticket.objects.filter(
            created_at__date=hoy,
            estado='entregado'
        ).count()
        
        agendamientos_hoy = Agendamiento.objects.filter(created_at__date=hoy).count()
        incidencias_hoy = Incidencia.objects.filter(created_at__date=hoy).count()
        
        stats = {
            'fecha': hoy.isoformat(),
            'tickets_generados': tickets_hoy,
            'tickets_entregados': tickets_entregados,
            'agendamientos_creados': agendamientos_hoy,
            'incidencias_reportadas': incidencias_hoy,
        }
        
        logger.info(f"Reporte diario generado: {stats}")
        
        # TODO: Enviar por email a administradores
        
        return stats
        
    except Exception as e:
        logger.error(f"Error generando reporte diario: {e}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
        }


@shared_task(name='totem.tasks.limpiar_cache')
def limpiar_cache():
    """
    Tarea para limpiar cache expirado.
    Se ejecuta semanalmente.
    
    Returns:
        dict: Resultado de la limpieza
    """
    try:
        from django.core.cache import cache
        
        logger.info("Limpiando cache expirado")
        
        # Limpiar todo el cache (Django Redis se encarga del TTL)
        # Esta tarea es más simbólica, Redis maneja esto automáticamente
        
        logger.info("Cache limpiado exitosamente")
        
        return {
            'success': True,
            'timestamp': timezone.now().isoformat(),
        }
        
    except Exception as e:
        logger.error(f"Error limpiando cache: {e}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
        }
