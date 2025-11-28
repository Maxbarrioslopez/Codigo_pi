"""
Excepciones personalizadas y handler para respuestas consistentes.
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException
from rest_framework import status

logger = logging.getLogger(__name__)


class TotemBaseException(APIException):
    """Excepción base para el sistema Tótem."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Error en operación del sistema'
    default_code = 'error'


class TicketNotFoundException(TotemBaseException):
    """Ticket no encontrado."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Ticket no encontrado'
    default_code = 'ticket_not_found'


class TicketExpiredException(TotemBaseException):
    """Ticket expirado."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'El ticket ha expirado'
    default_code = 'ticket_expired'


class TicketInvalidStateException(TotemBaseException):
    """Ticket en estado inválido."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Ticket en estado inválido para esta operación'
    default_code = 'ticket_invalid_state'


class TrabajadorNotFoundException(TotemBaseException):
    """Trabajador no encontrado."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Trabajador no encontrado en el sistema'
    default_code = 'trabajador_not_found'


class NoBeneficioException(TotemBaseException):
    """Trabajador sin beneficio disponible."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'No tienes beneficio disponible'
    default_code = 'no_beneficio'


class NoStockException(TotemBaseException):
    """Sin stock disponible."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'No hay stock disponible'
    default_code = 'no_stock'


class AgendamientoInvalidException(TotemBaseException):
    """Agendamiento inválido."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'El agendamiento no es válido'
    default_code = 'agendamiento_invalid'


class CupoExcedidoException(TotemBaseException):
    """Cupo de agendamientos excedido."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'No hay cupos disponibles para esa fecha'
    default_code = 'cupo_excedido'


class QRInvalidException(TotemBaseException):
    """QR inválido o falsificado."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Código QR inválido o falsificado'
    default_code = 'qr_invalid'


class RUTInvalidException(TotemBaseException):
    """RUT inválido."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'RUT inválido'
    default_code = 'rut_invalid'


class ConcurrencyException(TotemBaseException):
    """Error de concurrencia."""
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'Conflicto de concurrencia. Intenta nuevamente.'
    default_code = 'concurrency_error'


def custom_exception_handler(exc, context):
    """
    Handler personalizado para excepciones de DRF.
    Asegura respuestas consistentes en formato:
    {
        "detail": "mensaje de error",
        "code": "codigo_error",
        "status": 400
    }
    """
    # Llamar al handler por defecto primero
    response = exception_handler(exc, context)
    
    if response is not None:
        # Estructura consistente
        custom_response_data = {
            'detail': response.data.get('detail', str(exc)),
            'code': getattr(exc, 'default_code', 'error'),
            'status': response.status_code
        }
        
        # Si hay campos adicionales (como en ValidationError)
        if isinstance(response.data, dict) and len(response.data) > 1:
            custom_response_data['errors'] = {
                k: v for k, v in response.data.items() if k != 'detail'
            }
        
        response.data = custom_response_data
        
        # Logging
        if response.status_code >= 500:
            logger.error(f"Server error: {exc}", exc_info=True)
        elif response.status_code >= 400:
            logger.warning(f"Client error: {exc}")
    
    return response
