"""
Servicio de Guardia para validación de tickets.
"""
import logging
from django.db import transaction
from django.utils import timezone

from totem.models import Ticket, TicketEvent, CajaFisica
from totem.security import QRSecurity
from totem.validators import TicketValidator
from totem.exceptions import (
    QRInvalidException,
    TicketNotFoundException,
    TicketExpiredException,
    TicketInvalidStateException,
    NoStockException,
)

logger = logging.getLogger(__name__)


class GuardiaService:
    """
    Servicio para operaciones de Guardia (portería).
    """
    
    def __init__(self):
        self.qr_security = QRSecurity()
    
    @transaction.atomic
    def validar_y_entregar_ticket(
        self,
        qr_payload: str,
        caja_codigo: str,
        guardia_username: str = None
    ) -> Ticket:
        """
        Valida un ticket escaneado y marca como entregado.
        
        Args:
            qr_payload: Payload del QR escaneado
            caja_codigo: Código de la caja física a entregar
            guardia_username: Usuario guardia que valida
            
        Returns:
            Ticket validado y entregado
            
        Raises:
            QRInvalidException: Si el QR es inválido o falsificado
            TicketNotFoundException: Si el ticket no existe
            TicketExpiredException: Si el ticket expiró
            TicketInvalidStateException: Si el estado no es válido
            NoStockException: Si la caja no está disponible
        """
        logger.info(f"Guardia {guardia_username or 'unknown'} validando ticket")
        
        # 1. Validar firma del QR
        es_valido, resultado = self.qr_security.validar_payload(qr_payload)
        if not es_valido:
            logger.warning(f"QR inválido detectado: {resultado}")
            raise QRInvalidException(resultado)
        
        ticket_uuid = resultado
        
        # 2. Obtener ticket con lock para evitar condiciones de carrera
        try:
            ticket = Ticket.objects.select_for_update().get(uuid=ticket_uuid)
        except Ticket.DoesNotExist:
            logger.warning(f"Ticket no encontrado: {ticket_uuid}")
            raise TicketNotFoundException()
        
        # 3. Validar TTL
        es_valido, error = TicketValidator.validar_ttl(ticket.ttl_expira_at)
        if not es_valido:
            ticket.estado = 'expirado'
            ticket.save()
            TicketEvent.objects.create(
                ticket=ticket,
                tipo='expirado',
                metadata={'validado_por_guardia': guardia_username or 'unknown'}
            )
            logger.warning(f"Ticket {ticket_uuid} expirado")
            raise TicketExpiredException()
        
        # 4. Validar estado
        es_valido, error = TicketValidator.validar_estado(ticket.estado, ['pendiente'])
        if not es_valido:
            logger.warning(f"Intento de validar ticket {ticket_uuid} en estado {ticket.estado}")
            TicketEvent.objects.create(
                ticket=ticket,
                tipo='intento_duplicado',
                metadata={
                    'estado_actual': ticket.estado,
                    'guardia': guardia_username or 'unknown'
                }
            )
            raise TicketInvalidStateException(error)
        
        # 5. Verificar y asignar caja física con lock
        try:
            caja = CajaFisica.objects.select_for_update().get(
                codigo=caja_codigo,
                usado=False
            )
        except CajaFisica.DoesNotExist:
            logger.error(f"Caja {caja_codigo} no disponible")
            raise NoStockException("Caja física no disponible o ya usada")
        
        # 6. Marcar caja como usada
        caja.usado = True
        caja.asignada_ticket = ticket
        caja.save()
        
        # 7. Actualizar ticket a entregado
        ticket.estado = 'entregado'
        ticket.save()
        
        # 8. Registrar eventos
        TicketEvent.objects.create(
            ticket=ticket,
            tipo='validado_guardia',
            metadata={'guardia': guardia_username or 'unknown'}
        )
        TicketEvent.objects.create(
            ticket=ticket,
            tipo='caja_verificada',
            metadata={
                'caja_codigo': caja_codigo,
                'caja_tipo': caja.tipo,
                'guardia': guardia_username or 'unknown'
            }
        )
        TicketEvent.objects.create(
            ticket=ticket,
            tipo='entregado',
            metadata={'guardia': guardia_username or 'unknown'}
        )
        
        logger.info(
            f"Ticket {ticket_uuid} validado y entregado por guardia {guardia_username or 'unknown'}"
        )
        return ticket
    
    def obtener_metricas(self, sucursal_id: int = None) -> dict:
        """
        Obtiene métricas de portería.
        
        Args:
            sucursal_id: Filtrar por sucursal (opcional)
            
        Returns:
            Diccionario con métricas
        """
        from django.db.models import Count, Q
        
        filtros = Q(created_at__date=timezone.now().date())
        if sucursal_id:
            filtros &= Q(sucursal_id=sucursal_id)
        
        tickets_hoy = Ticket.objects.filter(filtros)
        
        metricas = {
            'fecha': timezone.now().date(),
            'total_tickets_hoy': tickets_hoy.count(),
            'pendientes': tickets_hoy.filter(estado='pendiente').count(),
            'entregados': tickets_hoy.filter(estado='entregado').count(),
            'expirados': tickets_hoy.filter(estado='expirado').count(),
            'anulados': tickets_hoy.filter(estado='anulado').count(),
        }
        
        # Contar incidencias del día si existen
        try:
            from totem.models import Incidencia
            metricas['incidencias_hoy'] = Incidencia.objects.filter(
                created_at__date=timezone.now().date(),
                creada_por='guardia'
            ).count()
        except ImportError:
            pass
        
        return metricas
    
    def obtener_tickets_pendientes(self, sucursal_id: int = None, limit: int = 50):
        """
        Obtiene lista de tickets pendientes para portería.
        
        Args:
            sucursal_id: Filtrar por sucursal
            limit: Límite de resultados
            
        Returns:
            QuerySet de tickets pendientes
        """
        filtros = {'estado': 'pendiente'}
        if sucursal_id:
            filtros['sucursal_id'] = sucursal_id
        
        return Ticket.objects.filter(**filtros).select_related(
            'trabajador', 'ciclo', 'sucursal'
        ).order_by('-created_at')[:limit]
    
    def verificar_ticket_tiempo_restante(self, ticket_uuid: str) -> dict:
        """
        Verifica el tiempo restante de un ticket.
        
        Args:
            ticket_uuid: UUID del ticket
            
        Returns:
            Diccionario con información de tiempo
        """
        try:
            ticket = Ticket.objects.get(uuid=ticket_uuid)
        except Ticket.DoesNotExist:
            raise TicketNotFoundException()
        
        ahora = timezone.now()
        if not ticket.ttl_expira_at:
            return {
                'uuid': ticket.uuid,
                'estado': ticket.estado,
                'expira_en_segundos': None,
                'expirado': False
            }
        
        diferencia = (ticket.ttl_expira_at - ahora).total_seconds()
        
        return {
            'uuid': ticket.uuid,
            'estado': ticket.estado,
            'ttl_expira_at': ticket.ttl_expira_at,
            'expira_en_segundos': max(0, int(diferencia)),
            'expira_en_minutos': max(0, round(diferencia / 60, 1)),
            'expirado': diferencia <= 0
        }
