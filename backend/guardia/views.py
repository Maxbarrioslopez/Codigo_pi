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
from totem.exceptions import TotemBaseException, QRInvalidException, TicketExpiredException, TicketInvalidStateException, TicketNotFoundException, NoStockException
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
    except QRInvalidException as e:
        return Response({'code': 'qr_invalid', 'message': str(e) or 'QR inválido o manipulado'}, status=status.HTTP_400_BAD_REQUEST)
    except TicketExpiredException:
        return Response({'code': 'ticket_expired', 'message': 'Ticket expirado'}, status=status.HTTP_410_GONE)
    except TicketInvalidStateException as e:
        return Response({'code': 'ticket_already_used', 'message': str(e) or 'Ticket ya entregado/anulado'}, status=status.HTTP_409_CONFLICT)
    except NoStockException as e:
        return Response({'code': 'no_stock', 'message': str(e) or 'Caja física no disponible'}, status=status.HTTP_409_CONFLICT)
    except TicketNotFoundException:
        return Response({'code': 'ticket_not_found', 'message': 'Ticket no encontrado'}, status=status.HTTP_404_NOT_FOUND)
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
    except TicketNotFoundException:
        return Response({'code': 'ticket_not_found', 'message': 'Ticket no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    except TicketExpiredException:
        return Response({'code': 'ticket_expired', 'message': 'Ticket expirado'}, status=status.HTTP_410_GONE)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en verificar_tiempo_restante: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# NUEVAS VISTAS: Validación y Entrega de Beneficios (BeneficioTrabajador)
# ============================================================================

@api_view(['POST'])
@permission_classes([IsGuardia])
def validar_beneficio(request, beneficio_id):
    """
    POST /api/guardia/beneficios/{beneficio_id}/validar/
    
    Valida un beneficio escaneado por el guardia.
    Verifica firma HMAC contra payload persistido.
    Cambia estado de PENDIENTE a VALIDADO si es exitoso.
    
    PERMISOS: IsGuardia
    
    BODY (JSON):
        {
            "codigo_escaneado": "ABC123"  # Código del QR escaneado
        }
    
    RESPUESTA (200):
        {
            "exitoso": true,
            "beneficio_id": 5,
            "estado": "validado",
            "trabajador": {
                "rut": "12345678-9",
                "nombre": "Juan Pérez López"
            },
            "tipo_beneficio": "Caja de Navidad",
            "message": "Beneficio validado exitosamente"
        }
    
    RESPUESTA (400):
        {
            "exitoso": false,
            "beneficio_id": 5,
            "razones": ["Firma HMAC inválida", "..."]
        }
    
    ERRORES:
        401: No autenticado
        403: Sin permisos
        404: Beneficio no encontrado
        500: Error interno
    """
    from totem.models import BeneficioTrabajador
    from totem.services.beneficio_service import BeneficioService
    from django.core.exceptions import ValidationError
    
    try:
        # Obtener beneficio
        try:
            beneficio = BeneficioTrabajador.objects.get(id=beneficio_id)
        except BeneficioTrabajador.DoesNotExist:
            return Response(
                {'detail': 'Beneficio no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener código escaneado del request
        codigo_escaneado = request.data.get('codigo_escaneado', '')
        if not codigo_escaneado:
            return Response(
                {'detail': 'codigo_escaneado es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar beneficio usando servicio
        exitoso, resultado = BeneficioService.validar_beneficio(
            beneficio=beneficio,
            codigo_escaneado=codigo_escaneado,
            guardia_usuario=request.user
        )
        
        if not exitoso:
            return Response(resultado, status=status.HTTP_400_BAD_REQUEST)
        
        # Preparar respuesta exitosa
        respuesta = {
            'exitoso': True,
            'beneficio_id': beneficio.id,
            'estado': beneficio.estado,
            'trabajador': {
                'rut': beneficio.trabajador.rut,
                'nombre': beneficio.trabajador.nombre
            },
            'tipo_beneficio': beneficio.tipo_beneficio.nombre,
            'ciclo': beneficio.ciclo.nombre if beneficio.ciclo.nombre else f"Ciclo {beneficio.ciclo.id}",
            'message': 'Beneficio validado exitosamente. Proceder a confirmar-entrega.'
        }
        
        return Response(respuesta, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error en validar_beneficio: {e}", exc_info=True)
        return Response(
            {'detail': 'Error interno del servidor'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsGuardia])
def confirmar_entrega(request, beneficio_id):
    """
    POST /api/guardia/beneficios/{beneficio_id}/confirmar-entrega/
    
    Confirma la entrega física del beneficio.
    Solo posible si estado es VALIDADO (transición VALIDADO → RETIRADO).
    
    PERMISOS: IsGuardia
    
    BODY (JSON):
        {
            "caja_fisica_codigo": "CAJA001"  # OPCIONAL: código de caja física entregada
        }
    
    RESPUESTA (200):
        {
            "exitoso": true,
            "beneficio_id": 5,
            "estado_anterior": "validado",
            "estado_final": "retirado",
            "trabajador": {
                "rut": "12345678-9",
                "nombre": "Juan Pérez López"
            },
            "type_beneficio": "Caja de Navidad",
            "message": "Entrega confirmada. Beneficio retirado."
        }
    
    RESPUESTA (400):
        {
            "exitoso": false,
            "beneficio_id": 5,
            "razones": ["Estado debe ser VALIDADO (actual: pendiente)", "..."]
        }
    
    ERRORES:
        401: No autenticado
        403: Sin permisos
        404: Beneficio no encontrado
        500: Error interno
    """
    from totem.models import BeneficioTrabajador
    from totem.services.beneficio_service import BeneficioService
    
    try:
        # Obtener beneficio
        try:
            beneficio = BeneficioTrabajador.objects.get(id=beneficio_id)
        except BeneficioTrabajador.DoesNotExist:
            return Response(
                {'detail': 'Beneficio no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        estado_anterior = beneficio.estado
        
        # Obtener código de caja opcional
        caja_fisica_codigo = request.data.get('caja_fisica_codigo', '')
        
        # Confirmar entrega usando servicio
        exitoso, resultado = BeneficioService.confirmar_entrega(
            beneficio=beneficio,
            guardia_usuario=request.user,
            caja_fisica_codigo=caja_fisica_codigo
        )
        
        if not exitoso:
            return Response(resultado, status=status.HTTP_400_BAD_REQUEST)
        
        # Preparar respuesta exitosa
        respuesta = {
            'exitoso': True,
            'beneficio_id': beneficio.id,
            'estado_anterior': estado_anterior,
            'estado_final': beneficio.estado,
            'trabajador': {
                'rut': beneficio.trabajador.rut,
                'nombre': beneficio.trabajador.nombre
            },
            'tipo_beneficio': beneficio.tipo_beneficio.nombre,
            'ciclo': beneficio.ciclo.nombre if beneficio.ciclo.nombre else f"Ciclo {beneficio.ciclo.id}",
            'caja_entregada': caja_fisica_codigo,
            'message': 'Entrega confirmada. Beneficio retirado.'
        }
        
        return Response(respuesta, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error en confirmar_entrega: {e}", exc_info=True)
        return Response(
            {'detail': 'Error interno del servidor'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
