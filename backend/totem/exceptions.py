"""
Excepciones personalizadas y handler para respuestas consistentes.
Incluye logging estructurado y contexto enriquecido.
"""
import logging
import traceback
from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException, ValidationError, PermissionDenied, NotAuthenticated
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404
import structlog

logger = structlog.get_logger(__name__)


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


class TrabajadorBloqueadoException(TotemBaseException):
    """Trabajador bloqueado."""
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = 'Trabajador bloqueado. Contacte a RRHH.'
    default_code = 'trabajador_bloqueado'


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


class QRReplayAttackException(TotemBaseException):
    """QR ya fue usado (replay attack)."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Este QR ya fue validado anteriormente'
    default_code = 'qr_replay_attack'


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


class CicloNotFoundException(TotemBaseException):
    """Ciclo no encontrado."""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Ciclo no encontrado'
    default_code = 'ciclo_not_found'


class NoCicloActivoException(TotemBaseException):
    """No hay ciclo activo."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'No hay ciclo activo. Contacte al administrador.'
    default_code = 'no_ciclo_activo'


class ValidationException(TotemBaseException):
    """Error de validación de datos."""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Datos inválidos'
    default_code = 'validation_error'


class BusinessRuleException(TotemBaseException):
    """Violación de regla de negocio."""
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = 'Operación viola reglas de negocio'
    default_code = 'business_rule_violation'


def custom_exception_handler(exc, context):
    """
    Handler personalizado para excepciones de DRF.
    Asegura respuestas consistentes y logging estructurado.
    
    Formato de respuesta:
    {
        "error": {
            "message": "mensaje legible",
            "code": "codigo_error",
            "status": 400,
            "details": {...}  # Opcional, solo si hay datos adicionales
        }
    }
    """
    # Llamar al handler por defecto primero
    response = exception_handler(exc, context)
    
    # Obtener información del request
    request = context.get('request')
    view = context.get('view')
    
    # Extraer metadata para logging
    log_context = {
        'exception_type': type(exc).__name__,
        'path': request.path if request else None,
        'method': request.method if request else None,
        'user': request.user.username if request and hasattr(request, 'user') and request.user.is_authenticated else 'anonymous',
    }
    
    # Si response es None, es una excepción no manejada por DRF
    if response is None:
        # Manejar excepciones de Django
        if isinstance(exc, ObjectDoesNotExist):
            response_data = {
                'error': {
                    'message': 'Recurso no encontrado',
                    'code': 'not_found',
                    'status': 404,
                }
            }
            from rest_framework.response import Response
            response = Response(response_data, status=404)
        elif isinstance(exc, Http404):
            response_data = {
                'error': {
                    'message': str(exc) or 'Recurso no encontrado',
                    'code': 'not_found',
                    'status': 404,
                }
            }
            from rest_framework.response import Response
            response = Response(response_data, status=404)
        else:
            # Error interno del servidor
            logger.error(
                "unhandled_exception",
                **log_context,
                exception=str(exc),
                traceback=traceback.format_exc()
            )
            response_data = {
                'error': {
                    'message': 'Error interno del servidor',
                    'code': 'internal_server_error',
                    'status': 500,
                }
            }
            from rest_framework.response import Response
            response = Response(response_data, status=500)
            return response
    
    # Normalizar respuesta a formato consistente
    if response is not None:
        custom_response_data = {
            'error': {
                'message': None,
                'code': getattr(exc, 'default_code', 'error'),
                'status': response.status_code,
            }
        }
        
        # Extraer mensaje
        if isinstance(response.data, dict):
            if 'detail' in response.data:
                custom_response_data['error']['message'] = response.data['detail']
            elif 'message' in response.data:
                custom_response_data['error']['message'] = response.data['message']
            else:
                # Campos de validación múltiples
                custom_response_data['error']['message'] = 'Error de validación'
                custom_response_data['error']['details'] = response.data
        elif isinstance(response.data, list):
            custom_response_data['error']['message'] = response.data[0] if response.data else 'Error'
        else:
            custom_response_data['error']['message'] = str(response.data)
        
        # Agregar detalles si es ValidationError
        if isinstance(exc, ValidationError) and hasattr(exc, 'detail'):
            custom_response_data['error']['details'] = exc.detail
        
        response.data = custom_response_data
        
        # Logging estructurado por severidad
        if response.status_code >= 500:
            logger.error(
                "server_error",
                **log_context,
                status_code=response.status_code,
                error_message=custom_response_data['error']['message'],
                exception=str(exc),
                traceback=traceback.format_exc() if response.status_code >= 500 else None
            )
        elif response.status_code >= 400:
            if isinstance(exc, (PermissionDenied, NotAuthenticated)):
                logger.warning(
                    "auth_error",
                    **log_context,
                    status_code=response.status_code,
                    error_code=custom_response_data['error']['code']
                )
            else:
                logger.info(
                    "client_error",
                    **log_context,
                    status_code=response.status_code,
                    error_code=custom_response_data['error']['code'],
                    error_message=custom_response_data['error']['message']
                )
    
    return response
