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
    POST /api/guardia/tickets/{uuid}/validar/
    
    Valida y entrega un ticket en portería física.
    Verifica firma QR, TTL, estado del ticket y asigna caja física al trabajador.
    Operación transaccional con locks para evitar entregas duplicadas.
    
    ENDPOINT: POST /api/guardia/tickets/{uuid}/validar/
    MÉTODO: POST
    PERMISOS: IsGuardia (solo personal de guardia autenticado)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    PARÁMETROS URL:
        uuid (str): UUID único del ticket a validar
    
    BODY (JSON):
        {
            "qr_payload": "ABC123:firma_segura",  # REQUERIDO: Datos del QR escaneado
            "codigo_caja": "CAJA001"              # OPCIONAL: Código de caja física asignada
        }
    
    RESPUESTA EXITOSA (200):
        {
            "id": int,
            "uuid": "ABC123",
            "estado": "entregado",
            "trabajador": {
                "id": int,
                "rut": "12345678-9",
                "nombre": "Juan Pérez López"
            },
            "caja_asignada": {
                "codigo": "CAJA001",
                "tipo": "Estándar"
            },
            "validado_por": "guardia1",
            "validado_at": "2025-11-30T10:45:00Z",
            "created_at": "2025-11-30T10:30:00Z"
        }
    
    ERRORES:
        400: QR inválido, firma incorrecta o formato incorrecto
        401: No autenticado (falta token JWT)
        403: Sin permisos (no es Guardia)
        404: Ticket no encontrado en base de datos
        409: Ticket ya entregado, anulado o expirado
        410: Ticket expirado (TTL excedido)
        500: Error interno del servidor
    
    NOTAS:
        - La validación incluye verificación criptográfica de la firma QR
        - Se registra automáticamente evento de entrega con timestamp
        - TTL (Time To Live) se valida contra hora actual
        - Operación atómica: se usa select_for_update() para evitar race conditions
        - Si no se especifica codigo_caja, se asigna automáticamente una disponible
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
    GET /api/guardia/metricas/
    
    Obtiene métricas operativas de portería en tiempo real.
    Incluye estadísticas de tickets, incidencias y tiempos de entrega.
    
    ENDPOINT: GET /api/guardia/metricas/
    MÉTODO: GET
    PERMISOS: IsGuardiaOrAdmin (Guardia o Administrador autenticado)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    QUERY PARAMETERS: Ninguno
    
    RESPUESTA EXITOSA (200):
        {
            "tickets_hoy": {
                "total": 85,
                "pendientes": 25,
                "entregados": 55,
                "expirados": 3,
                "anulados": 2
            },
            "tickets_semana": {
                "total": 420,
                "entregados": 380,
                "tasa_entrega": 90.5  # Porcentaje
            },
            "incidencias_abiertas": 3,  # Pendientes + en proceso
            "tiempo_promedio_entrega_minutos": 12,
            "cajas_disponibles": 45,
            "ultimo_ticket_entregado": {
                "uuid": "ABC123",
                "trabajador": "Juan Pérez",
                "timestamp": "2025-11-30T10:45:00Z"
            }
        }
    
    ERRORES:
        401: No autenticado (falta token JWT)
        403: Sin permisos (no es Guardia ni Admin)
        500: Error interno del servidor
    
    NOTAS:
        - Métricas calculadas en tiempo real desde base de datos
        - "tickets_hoy" considera desde las 00:00 de hoy
        - "tickets_semana" considera últimos 7 días calendario
        - Tiempo promedio calculado entre creación y entrega del ticket
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
    GET /api/guardia/tickets/pendientes/
    
    Lista todos los tickets pendientes de retiro, ordenados por prioridad.
    Excluye tickets expirados, entregados o anulados.
    
    ENDPOINT: GET /api/guardia/tickets/pendientes/
    MÉTODO: GET
    PERMISOS: IsGuardia (solo personal de guardia autenticado)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    QUERY PARAMETERS: Ninguno
    
    RESPUESTA EXITOSA (200):
        [
            {
                "id": int,
                "uuid": "ABC123",
                "trabajador": {
                    "id": int,
                    "rut": "12345678-9",
                    "nombre": "Juan Pérez López"
                },
                "created_at": "2025-11-30T10:30:00Z",
                "expires_at": "2025-11-30T11:00:00Z",
                "tiempo_restante_minutos": 15,
                "sucursal": {"id": 1, "nombre": "Central"},
                "prioridad": "alta"  # Calculada según tiempo restante
            },
            ...
        ]
    
    ERRORES:
        401: No autenticado (falta token JWT)
        403: Sin permisos (no es Guardia)
        500: Error interno del servidor
    
    NOTAS:
        - Ordenamiento: tickets más antiguos primero (FIFO)
        - Solo incluye estado="pendiente"
        - Campo "prioridad" calculado dinámicamente:
          - alta: <10 minutos restantes
          - media: 10-20 minutos
          - baja: >20 minutos
        - Tickets próximos a expirar se destacan automáticamente
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
    GET /api/guardia/tickets/{uuid}/tiempo-restante/
    
    Verifica el tiempo restante antes de que expire un ticket.
    Útil para validar estado antes de iniciar proceso de entrega.
    
    ENDPOINT: GET /api/guardia/tickets/{uuid}/tiempo-restante/
    MÉTODO: GET
    PERMISOS: IsGuardia (solo personal de guardia autenticado)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    PARÁMETROS URL:
        uuid (str): UUID único del ticket a verificar
    
    RESPUESTA EXITOSA (200):
        {
            "uuid": "ABC123",
            "estado": "pendiente",
            "created_at": "2025-11-30T10:30:00Z",
            "expires_at": "2025-11-30T11:00:00Z",
            "tiempo_restante_minutos": 15,
            "tiempo_restante_segundos": 900,
            "esta_expirado": false,
            "esta_por_expirar": true,  # <5 minutos restantes
            "puede_validarse": true,
            "trabajador": {
                "rut": "12345678-9",
                "nombre": "Juan Pérez López"
            }
        }
    
    ERRORES:
        401: No autenticado (falta token JWT)
        403: Sin permisos (no es Guardia)
        404: Ticket no encontrado
        410: Ticket ya expirado (TTL vencido)
        500: Error interno del servidor
    
    NOTAS:
        - Cálculo basado en UTC timezone configurado en Django
        - "esta_por_expirar" = true cuando quedan menos de 5 minutos
        - "puede_validarse" = false si estado != pendiente o expirado
        - Recomendado verificar antes de escanear QR para evitar errores
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
