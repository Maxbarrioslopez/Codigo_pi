"""Vistas del módulo Guardia: validación de tickets y métricas de portería.
Separadas de totem/views.py para modularización por dominio.
"""
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from totem.models import Ticket, TicketEvent, CajaFisica, Incidencia
from totem.serializers import TicketSerializer
from totem.permissions import IsGuardia, IsGuardiaOrAdmin
from totem.exceptions import TotemBaseException
from .services.guardia_service import GuardiaService
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsGuardia])
def validar_ticket_guardia(request, uuid):
    """
    POST /api/guardia/tickets/{uuid}/validar
    Body: {"qr_payload": "uuid:firma", "codigo_caja": "CAJA001"} (opcional)
    
    Valida ticket con QR firmado, TTL, estado y asigna caja física.
    Usa GuardiaService para transaccionalidad y locks.
    """
    try:
        qr_payload = request.data.get('qr_payload', f"{uuid}:")
        codigo_caja = request.data.get('codigo_caja')
        guardia_username = request.user.username if (request.user and request.user.is_authenticated) else ''
        
        service = GuardiaService()
        ticket = service.validar_y_entregar_ticket(
            qr_payload=qr_payload,
            caja_codigo=codigo_caja,
            guardia_username=guardia_username or ''
        )
        
        return Response(TicketSerializer(ticket).data, status=status.HTTP_200_OK)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en validar_ticket_guardia: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsGuardiaOrAdmin])
def metricas_guardia(request):
    """
    GET /api/guardia/metricas
    
    Retorna métricas de operación en portería: tickets por estado e incidencias.
    """
    try:
        service = GuardiaService()
        metricas = service.obtener_metricas()
        return Response(metricas, status=status.HTTP_200_OK)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en metricas_guardia: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsGuardia])
def tickets_pendientes(request):
    """
    GET /api/guardia/tickets/pendientes
    
    Lista tickets pendientes para entrega.
    """
    try:
        service = GuardiaService()
        tickets = service.obtener_tickets_pendientes()
        return Response(TicketSerializer(tickets, many=True).data, status=status.HTTP_200_OK)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en tickets_pendientes: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsGuardia])
def verificar_tiempo_restante(request, uuid):
    """
    GET /api/guardia/tickets/{uuid}/tiempo-restante
    
    Verifica cuánto tiempo le queda a un ticket antes de expirar.
    """
    try:
        service = GuardiaService()
        resultado = service.verificar_ticket_tiempo_restante(uuid)
        return Response(resultado, status=status.HTTP_200_OK)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en verificar_tiempo_restante: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
