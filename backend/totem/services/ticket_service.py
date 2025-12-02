"""
Servicio de lógica de negocio para Tickets.
Implementa patrón Service Layer para encapsular operaciones complejas.
"""
import logging
import uuid as uuid_lib
from datetime import timedelta
from io import BytesIO
from typing import Dict, Optional

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
import qrcode

from totem.models import Ticket, TicketEvent, Trabajador, Ciclo, CajaFisica, StockSucursal
from totem.security import QRSecurity
from totem.validators import TicketValidator, RUTValidator
from totem.exceptions import (
    TicketNotFoundException,
    TicketExpiredException,
    TicketInvalidStateException,
    TrabajadorNotFoundException,
    NoBeneficioException,
    NoStockException,
    QRInvalidException,
    ConcurrencyException,
    NoCicloActivoException
)

logger = logging.getLogger(__name__)


class TicketService:
    """
    Servicio para gestión de tickets.
    Encapsula toda la lógica de creación, validación y gestión del ciclo de vida.
    """
    
    def __init__(self):
        self.qr_security = QRSecurity()
    
    @transaction.atomic
    def crear_ticket(
        self,
        trabajador_rut: str,
        sucursal_nombre: str = 'Central',
        ciclo_id: Optional[int] = None
    ) -> Ticket:
        """
        Crea un ticket con QR firmado para retiro de beneficio.
        
        Args:
            trabajador_rut: RUT del trabajador
            sucursal_nombre: Nombre de la sucursal
            ciclo_id: ID del ciclo (opcional, se detecta automáticamente)
            
        Returns:
            Ticket creado
            
        Raises:
            TrabajadorNotFoundException: Si el trabajador no existe
            NoBeneficioException: Si no tiene beneficio disponible
            NoStockException: Si no hay stock
        """
        logger.info(f"Iniciando creación de ticket para RUT: {trabajador_rut}")
        
        # Validar y limpiar RUT
        rut_limpio = RUTValidator.limpiar_rut(trabajador_rut)
        es_valido, error = RUTValidator.validar_formato(rut_limpio)
        if not es_valido:
            raise TrabajadorNotFoundException(error)
        
        # Obtener trabajador
        try:
            trabajador = Trabajador.objects.select_for_update().get(rut=rut_limpio)
        except Trabajador.DoesNotExist:
            logger.warning(f"Trabajador no encontrado: {rut_limpio}")
            raise TrabajadorNotFoundException()
        
        # Verificar beneficio disponible
        if not trabajador.beneficio_disponible:
            logger.warning(f"Trabajador {rut_limpio} sin beneficio disponible")
            raise NoBeneficioException()
        
        # Obtener ciclo activo
        if not ciclo_id:
            ciclo = self._obtener_ciclo_activo()
        else:
            ciclo = Ciclo.objects.get(id=ciclo_id)
        
        # Verificar que no haya ticket pendiente existente en el ciclo
        es_valido, error = TicketValidator.validar_unicidad_retiro(rut_limpio, ciclo.id)
        if not es_valido:
            raise TicketInvalidStateException(error)
        pendiente_existente = Ticket.objects.filter(
            trabajador=trabajador,
            ciclo=ciclo,
            estado='pendiente'
        ).exists()
        if pendiente_existente:
            raise TicketInvalidStateException('Ya existe un ticket pendiente para este trabajador en el ciclo actual')
        
        # Verificar stock
        stock = StockSucursal.objects.filter(
            sucursal=sucursal_nombre,
            cantidad__gt=0
        ).first()
        
        if not stock:
            logger.warning(f"Sin stock en sucursal {sucursal_nombre}")
            raise NoStockException()
        
        # Generar UUID y payload firmado
        ticket_uuid = str(uuid_lib.uuid4())
        payload_firmado = self.qr_security.crear_payload_firmado(ticket_uuid)
        
        # Calcular TTL
        ttl_minutos = settings.QR_TTL_MINUTES
        ttl_expira_at = timezone.now() + timedelta(minutes=ttl_minutos)
        
        # Crear ticket
        ticket = Ticket.objects.create(
            trabajador=trabajador,
            uuid=ticket_uuid,
            ciclo=ciclo,
            estado='pendiente',
            ttl_expira_at=ttl_expira_at,
            data={
                'sucursal': sucursal_nombre,
                'beneficio': trabajador.beneficio_disponible,
                'ttl_minutos': ttl_minutos
            }
        )
        
        # Generar imagen QR
        qr_image_file = self._generar_imagen_qr(payload_firmado, ticket_uuid)
        ticket.qr_image.save(f'ticket_{ticket_uuid}.png', qr_image_file, save=True)
        
        # Decrementar stock
        stock.cantidad -= 1
        stock.save()
        
        # Crear evento
        TicketEvent.objects.create(
            ticket=ticket,
            tipo='generado',
            metadata={
                'sucursal': sucursal_nombre,
                'ttl_expira_at': ttl_expira_at.isoformat()
            }
        )
        
        logger.info(f"Ticket {ticket_uuid} creado exitosamente para {rut_limpio}")
        return ticket
    
    @transaction.atomic
    def validar_ticket_guardia(
        self,
        qr_payload: str,
        caja_codigo: str,
        guardia_username: Optional[str] = None
    ) -> Ticket:
        """
        Valida un ticket en guardia y marca como entregado.
        
        Args:
            qr_payload: Payload del QR escaneado
            caja_codigo: Código de la caja física
            guardia_username: Usuario guardia que valida
            
        Returns:
            Ticket validado
            
        Raises:
            QRInvalidException: Si el QR es inválido
            TicketNotFoundException: Si el ticket no existe
            TicketExpiredException: Si el ticket expiró
            TicketInvalidStateException: Si el ticket no está pendiente
        """
        logger.info(f"Validando ticket en guardia con payload QR")
        
        # Validar firma del QR
        es_valido, resultado = self.qr_security.validar_payload(qr_payload)
        if not es_valido:
            logger.warning(f"QR inválido detectado: {resultado}")
            raise QRInvalidException(resultado)
        
        ticket_uuid = resultado
        
        # Obtener ticket con lock
        try:
            ticket = Ticket.objects.select_for_update().get(uuid=ticket_uuid)
        except Ticket.DoesNotExist:
            logger.warning(f"Ticket no encontrado: {ticket_uuid}")
            raise TicketNotFoundException()
        
        # Validar TTL
        es_valido, error = TicketValidator.validar_ttl(ticket.ttl_expira_at)
        if not es_valido:
            ticket.estado = 'expirado'
            ticket.save()
            TicketEvent.objects.create(ticket=ticket, tipo='expirado')
            raise TicketExpiredException()
        
        # Validar estado
        es_valido, error = TicketValidator.validar_estado(ticket.estado, ['pendiente'])
        if not es_valido:
            logger.warning(f"Intento de validar ticket {ticket_uuid} en estado {ticket.estado}")
            TicketEvent.objects.create(
                ticket=ticket,
                tipo='intento_duplicado',
                metadata={'estado_actual': ticket.estado}
            )
            raise TicketInvalidStateException(error)
        
        # Verificar y asignar caja física
        try:
            caja = CajaFisica.objects.select_for_update().get(codigo=caja_codigo, usado=False)
        except CajaFisica.DoesNotExist:
            logger.error(f"Caja {caja_codigo} no disponible")
            raise NoStockException("Caja física no disponible")
        
        caja.usado = True
        caja.asignada_ticket = ticket
        caja.save()
        
        # Marcar como entregado
        ticket.estado = 'entregado'
        ticket.save()
        
        # Registrar eventos
        TicketEvent.objects.create(
            ticket=ticket,
            tipo='validado_guardia',
            metadata={'guardia': guardia_username or 'unknown'}
        )
        TicketEvent.objects.create(
            ticket=ticket,
            tipo='caja_verificada',
            metadata={'caja_codigo': caja_codigo, 'caja_tipo': caja.tipo}
        )
        TicketEvent.objects.create(
            ticket=ticket,
            tipo='entregado',
            metadata={'guardia': guardia_username or 'unknown'}
        )
        
        logger.info(f"Ticket {ticket_uuid} validado y entregado correctamente")
        return ticket
    
    def anular_ticket(self, ticket_uuid: str, razon: str = '') -> Ticket:
        """
        Anula un ticket pendiente.
        
        Args:
            ticket_uuid: UUID del ticket
            razon: Razón de anulación
            
        Returns:
            Ticket anulado
        """
        try:
            ticket = Ticket.objects.get(uuid=ticket_uuid)
        except Ticket.DoesNotExist:
            raise TicketNotFoundException()
        
        if ticket.estado != 'pendiente':
            raise TicketInvalidStateException("Solo se pueden anular tickets pendientes")
        
        ticket.estado = 'anulado'
        ticket.save()
        
        TicketEvent.objects.create(
            ticket=ticket,
            tipo='anulado',
            metadata={'razon': razon}
        )
        
        logger.info(f"Ticket {ticket_uuid} anulado: {razon}")
        return ticket
    
    def reimprimir_ticket(self, ticket_uuid: str) -> Ticket:
        """
        Reimprime un ticket (genera nuevo QR con TTL renovado).
        
        Args:
            ticket_uuid: UUID del ticket
            
        Returns:
            Ticket con QR renovado
        """
        try:
            ticket = Ticket.objects.get(uuid=ticket_uuid)
        except Ticket.DoesNotExist:
            raise TicketNotFoundException()
        
        if ticket.estado != 'pendiente':
            raise TicketInvalidStateException("Solo se pueden reimprimir tickets pendientes")
        
        # Renovar TTL
        ttl_minutos = settings.QR_TTL_MINUTES
        ticket.ttl_expira_at = timezone.now() + timedelta(minutes=ttl_minutos)
        
        # Regenerar QR con nueva firma
        payload_firmado = self.qr_security.crear_payload_firmado(ticket_uuid)
        qr_image_file = self._generar_imagen_qr(payload_firmado, ticket_uuid)
        ticket.qr_image.save(f'ticket_{ticket_uuid}_reimpreso.png', qr_image_file, save=True)
        ticket.save()
        
        TicketEvent.objects.create(
            ticket=ticket,
            tipo='reimpreso',
            metadata={'nuevo_ttl': ticket.ttl_expira_at.isoformat()}
        )
        
        logger.info(f"Ticket {ticket_uuid} reimpreso con TTL renovado")
        return ticket
    
    def obtener_estado_ticket(self, ticket_uuid: str) -> Dict:
        """
        Obtiene el estado actual de un ticket con su timeline.
        
        Args:
            ticket_uuid: UUID del ticket
            
        Returns:
            Diccionario con estado y eventos
        """
        try:
            ticket = Ticket.objects.prefetch_related('eventos').get(uuid=ticket_uuid)
        except Ticket.DoesNotExist:
            raise TicketNotFoundException()
        
        eventos = ticket.eventos.all().order_by('-timestamp')
        
        return {
            'uuid': ticket.uuid,
            'estado': ticket.estado,
            'trabajador': {
                'rut': ticket.trabajador.rut,
                'nombre': ticket.trabajador.nombre
            },
            'created_at': ticket.created_at,
            'ttl_expira_at': ticket.ttl_expira_at,
            'eventos': [
                {
                    'tipo': e.tipo,
                    'timestamp': e.timestamp,
                    'metadata': e.metadata
                }
                for e in eventos
            ]
        }
    
    def _obtener_ciclo_activo(self) -> Ciclo:
        """Obtiene el ciclo activo actual o lanza excepción si no existe."""
        ciclo = Ciclo.objects.filter(activo=True).first()
        if not ciclo:
            raise NoCicloActivoException('No hay ciclo activo configurado')
        return ciclo
    
    def _generar_imagen_qr(self, payload: str, identificador: str) -> ContentFile:
        """
        Genera imagen QR.
        
        Args:
            payload: Contenido del QR
            identificador: Identificador para logs
            
        Returns:
            ContentFile con la imagen
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(payload)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        logger.debug(f"Imagen QR generada para {identificador}")
        return ContentFile(buffer.read())
