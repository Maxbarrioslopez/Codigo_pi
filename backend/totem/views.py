import os
import io
import uuid
from django.conf import settings
from django.core.files.base import ContentFile
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django_ratelimit.decorators import ratelimit
from .models import (
    # Modelos núcleo (mantener aquí en módulo totem)
    Trabajador, Ticket, TicketEvent, Ciclo, Agendamiento, Incidencia, Sucursal, CajaFisica, ParametroOperativo
)
from .serializers import (
    TrabajadorSerializer, TicketSerializer, CicloSerializer, AgendamientoSerializer,
    IncidenciaSerializer, ParametroOperativoSerializer
)
from .permissions import AllowTotem
from .utils_rut import clean_rut, valid_rut
from .services.ticket_service import TicketService
from .services.agendamiento_service import AgendamientoService
from .services.incidencia_service import IncidenciaService
from .exceptions import (
    TotemBaseException, RUTInvalidException, TrabajadorNotFoundException,
    TicketNotFoundException, TicketInvalidStateException, CupoExcedidoException,
    AgendamientoInvalidException, NoCicloActivoException, ValidationException,
    TicketExpiredException, NoStockException, QRInvalidException
)
import qrcode
import logging

logger = logging.getLogger(__name__)

# NOTA MODULARIZACIÓN:
# Este archivo mantiene sólo lógica "core" del flujo Tótem / Ciclo / Incidencias generales.
# Lógica de Guardia (validar_ticket_guardia, metricas_guardia) y RRHH (listar_tickets) se movió
# a apps dedicadas: guardia/views.py y rrhh/views.py respectivamente.


@api_view(['GET'])
@permission_classes([AllowTotem])
@ratelimit(key='ip', rate='30/m', method='GET')
def obtener_beneficio(request, rut):
    """
    Obtiene información del beneficio disponible para un trabajador.
    Soporta búsqueda general o por ciclo específico.
    
    ENDPOINT: GET /api/beneficios/{rut}/?ciclo_id={id}
    PERMISOS: Público (tótem sin autenticación)
    RATE LIMIT: 30 peticiones por minuto por IP
    
    PARÁMETROS URL:
        rut (str): RUT del trabajador en formato 12345678-9 o 12345678-K
    
    PARÁMETROS QUERY:
        ciclo_id (int, opcional): ID del ciclo para filtrar beneficio
    
    RESPUESTA EXITOSA (200):
        {
            "beneficio": {
                "id": int,
                "rut": "12345678-9",
                "nombre": "Juan Pérez",
                "beneficio_disponible": {
                    "tipo": "Caja",
                    "categoria": "Estándar",
                    "ciclo_id": 8,
                    "activo": true,
                    "descripcion": "Caja de mercadería estándar"
                },
                "ciclo_id_filtrado": 8  # Solo si se pasó ciclo_id como parámetro
            }
        }
    
    ERRORES:
        400: RUT con formato inválido
        404: Trabajador no encontrado o sin beneficio en ciclo especificado
        429: Límite de peticiones excedido
        500: Error interno del servidor
    
    EJEMPLO:
        # Obtener beneficio general
        GET /api/beneficios/12345678-9/
        
        # Obtener beneficio específico del ciclo 8
        GET /api/beneficios/12345678-9/?ciclo_id=8
    """
    try:
        rut_c = clean_rut(rut)
        if not valid_rut(rut_c):
            raise RUTInvalidException('RUT inválido. Use formato 12345678-5.')
        
        try:
            trabajador = Trabajador.objects.get(rut__iexact=rut_c)
        except Trabajador.DoesNotExist:
            raise TrabajadorNotFoundException('No se encontró trabajador con ese RUT.')

        # Obtener ciclo_id de query params si está disponible
        ciclo_id = request.query_params.get('ciclo_id')
        
        result = TrabajadorSerializer(trabajador).data
        
        # Si se especifica ciclo_id, filtrar el beneficio para ese ciclo
        if ciclo_id:
            ciclo_id = int(ciclo_id)
            beneficio = result.get('beneficio_disponible', {})
            
            # Si el beneficio tiene ciclo_id, verificar que coincida
            if beneficio.get('ciclo_id') == ciclo_id:
                result['ciclo_id_filtrado'] = ciclo_id
                # Si el beneficio está bloqueado, retornar error 404
                if beneficio.get('tipo') == 'BLOQUEADO' or not beneficio.get('activo', False):
                    raise TrabajadorNotFoundException(
                        f'No hay beneficio activo para el ciclo {ciclo_id}.'
                    )
            else:
                # No hay beneficio para este ciclo
                raise TrabajadorNotFoundException(
                    f'No hay beneficio registrado para el ciclo {ciclo_id}.'
                )
        
        return Response({'beneficio': result}, status=status.HTTP_200_OK)
    except TotemBaseException:
        raise
    except ValueError:
        raise ValidationException(detail='ciclo_id debe ser un número entero válido.')
    except Exception as e:
        logger.error(f"Error inesperado en obtener_beneficio: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowTotem])
@ratelimit(key='ip', rate='30/m', method='GET')
def obtener_datos_trabajador(request, rut):
    """
    Obtiene datos básicos del trabajador (nombre, RUT) para verificación rápida.
    
    ENDPOINT: GET /api/trabajadores-datos/{rut}/
    PERMISOS: Público (tótem sin autenticación)
    
    RESPUESTA EXITOSA (200):
        {
            "existe": true,
            "rut": "12345678-9",
            "nombre": "Juan Pérez Rodríguez"
        }
    
    RESPUESTA SI NO EXISTE (200):
        {
            "existe": false,
            "rut": "12345678-9",
            "nombre": null
        }
    """
    try:
        rut_c = clean_rut(rut)
        if not valid_rut(rut_c):
            return Response({
                'existe': False,
                'rut': rut_c,
                'nombre': None,
                'error': 'RUT inválido'
            }, status=status.HTTP_200_OK)
        
        try:
            trabajador = Trabajador.objects.get(rut__iexact=rut_c)
            return Response({
                'existe': True,
                'rut': trabajador.rut,
                'nombre': trabajador.nombre
            }, status=status.HTTP_200_OK)
        except Trabajador.DoesNotExist:
            return Response({
                'existe': False,
                'rut': rut_c,
                'nombre': None
            }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error en obtener_datos_trabajador: {e}")
        return Response({
            'existe': False,
            'rut': rut,
            'nombre': None,
            'error': 'Error interno del servidor'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowTotem])
@ratelimit(key='ip', rate='10/m', method='POST')
def crear_ticket(request):
    """
    Crea un ticket de retiro para un trabajador.
    
    ENDPOINT: POST /api/tickets/
    PERMISOS: Público (tótem sin autenticación)
    RATE LIMIT: 10 peticiones por minuto por IP
    
    BODY (JSON):
        {
            "trabajador_rut": "12345678-9",  # REQUERIDO: RUT del trabajador
            "sucursal": "Central"            # OPCIONAL: Nombre de sucursal (default: "Central")
        }
    
    RESPUESTA EXITOSA (201):
        {
            "id": int,
            "uuid": "ABC123",
            "trabajador": {"id": int, "rut": str, "nombre": str},
            "estado": "pendiente",
            "qr_image": "/media/qr/ABC123.png",
            "created_at": "2025-11-30T10:30:00Z",
            "ttl_minutos": 30
        }
    
    ERRORES:
        400: RUT inválido o datos faltantes
        404: Trabajador no encontrado o sin beneficio
        409: Ticket duplicado (ya existe pendiente para este trabajador)
        429: Límite de peticiones excedido
        500: Error interno del servidor
    """
    try:
        payload = request.data
        rut = payload.get('trabajador_rut')
        sucursal = payload.get('sucursal', 'Central')
        
        # Usar servicio para crear ticket
        service = TicketService()
        ticket = service.crear_ticket(
            trabajador_rut=rut,
            sucursal_nombre=sucursal
        )
        
        serializer = TicketSerializer(ticket)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except TrabajadorNotFoundException as e:
        return Response({'code': 'rut_not_found', 'message': str(e) or 'Trabajador no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    except RUTInvalidException as e:
        return Response({'code': 'rut_invalid', 'message': str(e) or 'RUT inválido'}, status=status.HTTP_400_BAD_REQUEST)
    except NoStockException as e:
        return Response({'code': 'no_stock', 'message': str(e) or 'No hay stock disponible'}, status=status.HTTP_409_CONFLICT)
    except TicketInvalidStateException as e:
        return Response({'code': 'ticket_already_pending', 'message': str(e) or 'Ticket pendiente ya existe'}, status=status.HTTP_409_CONFLICT)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en crear_ticket: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowTotem])
def estado_ticket(request, uuid):
    """
    GET /api/tickets/{uuid}/estado/
    
    Consulta el estado actual de un ticket por su UUID único.
    Retorna información sobre validez, tiempos de expiración y estado de entrega.
    
    ENDPOINT: GET /api/tickets/{uuid}/estado/
    MÉTODO: GET
    PERMISOS: Público (tótem sin autenticación)
    RATE LIMIT: 30 peticiones por minuto por IP
    
    PARÁMETROS URL:
        uuid (str): UUID único del ticket generado (ej: "ABC123DEF456")
    
    RESPUESTA EXITOSA (200):
        {
            "id": int,
            "uuid": "ABC123DEF456",
            "estado": "pendiente",           # pendiente | entregado | expirado | anulado
            "trabajador": {
                "id": int,
                "rut": "12345678-9",
                "nombre": "Juan Pérez López"
            },
            "created_at": "2025-11-30T10:30:00Z",
            "expires_at": "2025-11-30T11:00:00Z",
            "tiempo_restante_minutos": 25,
            "puede_retirar": true,
            "sucursal": {"id": int, "nombre": "Central"},
            "qr_image": "/media/qr/ABC123.png"
        }
    
    ERRORES:
        404: Ticket no encontrado
        500: Error interno del servidor
    """
    try:
        service = TicketService()
        ticket = service.obtener_estado_ticket(uuid)
        return Response(TicketSerializer(ticket).data)
    except TicketNotFoundException:
        return Response({'code': 'ticket_not_found', 'message': 'Ticket no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en estado_ticket: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowTotem])
def anular_ticket(request, uuid):
    """
    POST /api/tickets/{uuid}/anular/
    
    Anula un ticket pendiente, invalidando su uso para retiro.
    Tickets anulados no pueden ser validados en portería.
    
    ENDPOINT: POST /api/tickets/{uuid}/anular/
    MÉTODO: POST
    PERMISOS: Público (tótem sin autenticación)
    RATE LIMIT: 10 peticiones por minuto por IP
    
    PARÁMETROS URL:
        uuid (str): UUID único del ticket a anular
    
    BODY (JSON) - OPCIONAL:
        {
            "motivo": "Trabajador cambió de opinión"  # OPCIONAL: Razón de anulación
        }
    
    RESPUESTA EXITOSA (200):
        {
            "id": int,
            "uuid": "ABC123DEF456",
            "estado": "anulado",
            "trabajador": {...},
            "motivo_anulacion": "Trabajador cambió de opinión",
            "anulado_at": "2025-11-30T10:35:00Z"
        }
    
    ERRORES:
        404: Ticket no encontrado
        409: Ticket ya fue entregado o anulado anteriormente
        500: Error interno del servidor
    """
    try:
        razon = request.data.get('motivo', 'No especificado')
        service = TicketService()
        ticket = service.anular_ticket(uuid, razon=razon)
        return Response(TicketSerializer(ticket).data)
    except TicketNotFoundException:
        return Response({'code': 'ticket_not_found', 'message': 'Ticket no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    except TicketInvalidStateException as e:
        return Response({'code': 'ticket_invalid_state', 'message': str(e) or 'Estado inválido para anulación'}, status=status.HTTP_409_CONFLICT)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en anular_ticket: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowTotem])
def reimprimir_ticket(request, uuid):
    """
    POST /api/tickets/{uuid}/reimprimir/
    
    Reimprime un ticket pendiente, renovando su tiempo de vida (TTL).
    Útil cuando el trabajador perdió o dañó su ticket físico.
    
    ENDPOINT: POST /api/tickets/{uuid}/reimprimir/
    MÉTODO: POST
    PERMISOS: Público (tótem sin autenticación)
    RATE LIMIT: 10 peticiones por minuto por IP
    
    PARÁMETROS URL:
        uuid (str): UUID único del ticket a reimprimir
    
    BODY: Vacío (no requiere datos)
    
    RESPUESTA EXITOSA (200):
        {
            "id": int,
            "uuid": "ABC123DEF456",
            "estado": "pendiente",
            "trabajador": {...},
            "qr_image": "/media/qr/ABC123_reprint.png",
            "created_at": "2025-11-30T10:30:00Z",  # Fecha original
            "expires_at": "2025-11-30T11:30:00Z",  # TTL renovado
            "reimpreso_at": "2025-11-30T10:50:00Z",
            "ttl_minutos": 30
        }
    
    ERRORES:
        404: Ticket no encontrado
        409: Ticket ya fue entregado, expirado o anulado (no se puede reimprimir)
        500: Error interno del servidor
    """
    try:
        service = TicketService()
        ticket = service.reimprimir_ticket(uuid)
        return Response(TicketSerializer(ticket).data)
    except TicketNotFoundException:
        return Response({'code': 'ticket_not_found', 'message': 'Ticket no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    except TicketInvalidStateException as e:
        return Response({'code': 'ticket_invalid_state', 'message': str(e) or 'No se puede reimprimir'}, status=status.HTTP_409_CONFLICT)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en reimprimir_ticket: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowTotem])
@ratelimit(key='ip', rate='10/m', method='POST')
def crear_agendamiento(request):
    """
    POST /api/agendamientos/
    
    Crea un agendamiento para retiro futuro de beneficio.
    El trabajador reserva una fecha específica para retirar su beneficio.
    
    ENDPOINT: POST /api/agendamientos/
    MÉTODO: POST
    PERMISOS: Público (tótem sin autenticación)
    RATE LIMIT: 10 peticiones por minuto por IP
    
    BODY (JSON):
        {
            "trabajador_rut": "12345678-9",  # REQUERIDO: RUT del trabajador
            "fecha_retiro": "2025-12-15"     # REQUERIDO: Fecha agendada (YYYY-MM-DD)
        }
    
    RESPUESTA EXITOSA (201):
        {
            "id": int,
            "codigo": "AGN-20251130-001",
            "trabajador": {
                "id": int,
                "rut": "12345678-9",
                "nombre": "Juan Pérez López"
            },
            "fecha_retiro": "2025-12-15",
            "ciclo": {
                "id": int,
                "fecha_inicio": "2025-11-01",
                "fecha_fin": "2025-12-31"
            },
            "created_at": "2025-11-30T10:30:00Z"
        }
    
    ERRORES:
        400: Datos inválidos o fecha fuera del ciclo activo
        404: Trabajador no encontrado o sin beneficio
        409: Ya existe agendamiento para esta fecha
        429: Límite de peticiones excedido
        500: Error interno del servidor
    """
    try:
        rut = request.data.get('trabajador_rut')
        fecha_retiro = request.data.get('fecha_retiro')
        
        service = AgendamientoService()
        agendamiento = service.crear_agendamiento(
            trabajador_rut=rut,
            fecha_retiro=fecha_retiro
        )
        return Response(AgendamientoSerializer(agendamiento).data, status=status.HTTP_201_CREATED)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en crear_agendamiento: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowTotem])
def listar_agendamientos_trabajador(request, rut):
    """
    GET /api/agendamientos/{rut}/
    
    Lista todos los agendamientos de un trabajador específico.
    Incluye agendamientos pasados y futuros.
    
    ENDPOINT: GET /api/agendamientos/{rut}/
    MÉTODO: GET
    PERMISOS: Público (tótem sin autenticación)
    RATE LIMIT: 30 peticiones por minuto por IP
    
    PARÁMETROS URL:
        rut (str): RUT del trabajador (formato: 12345678-9)
    
    RESPUESTA EXITOSA (200):
        [
            {
                "id": int,
                "codigo": "AGN-20251130-001",
                "trabajador": {"rut": "12345678-9", "nombre": "Juan Pérez"},
                "fecha_retiro": "2025-12-15",
                "ciclo": {...},
                "created_at": "2025-11-30T10:30:00Z"
            },
            ...
        ]
    
    ERRORES:
        404: Trabajador no encontrado
        500: Error interno del servidor
    """
    try:
        service = AgendamientoService()
        agendamientos = service.listar_agendamientos_trabajador(rut)
        return Response(AgendamientoSerializer(agendamientos, many=True).data)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en listar_agendamientos_trabajador: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowTotem])
def crear_incidencia(request):
    """
    POST /api/incidencias/
    
    Reporta una incidencia técnica, operacional o de usuario.
    Puede ser reportada desde el tótem o por personal de guardia.
    
    ENDPOINT: POST /api/incidencias/
    MÉTODO: POST
    PERMISOS: Público (tótem sin autenticación)
    RATE LIMIT: 20 peticiones por minuto por IP
    
    BODY (JSON):
        {
            "trabajador_rut": "12345678-9",    # OPCIONAL: RUT si involucra trabajador
            "tipo": "tecnica",                  # REQUERIDO: tecnica | operacional | usuario
            "descripcion": "Falla en impresora", # REQUERIDO: Descripción del problema
            "origen": "totem"                   # REQUERIDO: totem | guardia
        }
    
    RESPUESTA EXITOSA (201):
        {
            "id": int,
            "codigo": "INC-20251130-001",
            "trabajador": {"rut": "12345678-9", "nombre": "..."},  # null si no aplica
            "tipo": "tecnica",
            "descripcion": "Falla en impresora",
            "estado": "pendiente",             # pendiente | en_proceso | resuelta
            "origen": "totem",
            "created_at": "2025-11-30T10:30:00Z",
            "resolucion": null
        }
    
    ERRORES:
        400: Datos inválidos o tipo no permitido
        404: Trabajador no encontrado (si se especifica RUT)
        500: Error interno del servidor
    """
    try:
        rut = request.data.get('trabajador_rut')
        tipo = request.data.get('tipo', 'tecnica')
        descripcion = request.data.get('descripcion', '')
        origen = request.data.get('origen', 'totem')
        
        service = IncidenciaService()
        incidencia = service.crear_incidencia(
            trabajador_rut=rut,
            tipo=tipo,
            descripcion=descripcion,
            origen=origen
        )
        return Response(IncidenciaSerializer(incidencia).data, status=status.HTTP_201_CREATED)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en crear_incidencia: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowTotem])
def obtener_incidencia(request, codigo):
    """
    GET /api/incidencias/{codigo}/
    
    Obtiene el detalle completo de una incidencia por su código único.
    
    ENDPOINT: GET /api/incidencias/{codigo}/
    MÉTODO: GET
    PERMISOS: Público (tótem sin autenticación)
    RATE LIMIT: 30 peticiones por minuto por IP
    
    PARÁMETROS URL:
        codigo (str): Código único de la incidencia (ej: "INC-20251130-001")
    
    RESPUESTA EXITOSA (200):
        {
            "id": int,
            "codigo": "INC-20251130-001",
            "trabajador": {...},
            "tipo": "tecnica",
            "descripcion": "Falla en impresora",
            "estado": "pendiente",
            "origen": "totem",
            "resolucion": null,
            "created_at": "2025-11-30T10:30:00Z",
            "updated_at": "2025-11-30T10:30:00Z"
        }
    
    ERRORES:
        404: Incidencia no encontrada
        500: Error interno del servidor
    """
    try:
        service = IncidenciaService()
        incidencia = service.obtener_incidencia(codigo)
        return Response(IncidenciaSerializer(incidencia).data)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en obtener_incidencia: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowTotem])
def listar_incidencias(request):
    """
    GET /api/incidencias/
    
    Lista incidencias con filtros opcionales por estado, tipo y trabajador.
    Soporta paginación para grandes volúmenes de datos.
    
    ENDPOINT: GET /api/incidencias/
    MÉTODO: GET
    PERMISOS: Público (tótem sin autenticación)
    RATE LIMIT: 30 peticiones por minuto por IP
    
    QUERY PARAMETERS (todos opcionales):
        ?estado=pendiente       # Filtro: pendiente | en_proceso | resuelta
        ?tipo=tecnica           # Filtro: tecnica | operacional | usuario
        ?trabajador_rut=12345678-9  # Filtro por RUT de trabajador
    
    RESPUESTA EXITOSA (200):
        [
            {
                "id": int,
                "codigo": "INC-20251130-001",
                "trabajador": {...},
                "tipo": "tecnica",
                "estado": "pendiente",
                "descripcion": "Falla en impresora",
                "origen": "totem",
                "created_at": "2025-11-30T10:30:00Z"
            },
            ...
        ]
    
    ERRORES:
        400: Parámetros de filtro inválidos
        500: Error interno del servidor
    """
    try:
        estado = request.GET.get('estado')
        tipo = request.GET.get('tipo')
        rut = request.GET.get('trabajador_rut')
        
        service = IncidenciaService()
        incidencias = service.listar_incidencias(
            trabajador_rut=rut,
            estado=estado,
            tipo=tipo
        )
        return Response(IncidenciaSerializer(incidencias, many=True).data)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en listar_incidencias: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowTotem])
def resolver_incidencia(request, codigo):
    """
    POST /api/incidencias/{codigo}/resolver/
    
    Marca una incidencia como resuelta, registrando la solución aplicada.
    Cambia automáticamente el estado a 'resuelta'.
    
    ENDPOINT: POST /api/incidencias/{codigo}/resolver/
    MÉTODO: POST
    PERMISOS: Público (tótem sin autenticación)
    RATE LIMIT: 20 peticiones por minuto por IP
    
    PARÁMETROS URL:
        codigo (str): Código único de la incidencia
    
    BODY (JSON):
        {
            "resolucion": "Se reemplazó cartucho de tinta"  # OPCIONAL: Descripción de la solución
        }
    
    RESPUESTA EXITOSA (200):
        {
            "id": int,
            "codigo": "INC-20251130-001",
            "estado": "resuelta",
            "resolucion": "Se reemplazó cartucho de tinta",
            "resuelta_at": "2025-11-30T11:00:00Z",
            ...
        }
    
    ERRORES:
        404: Incidencia no encontrada
        409: Incidencia ya estaba resuelta
        500: Error interno del servidor
    """
    try:
        resolucion = request.data.get('resolucion', '')
        
        service = IncidenciaService()
        incidencia = service.resolver_incidencia(codigo, resolucion)
        return Response(IncidenciaSerializer(incidencia).data)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en resolver_incidencia: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
@permission_classes([AllowTotem])
def cambiar_estado_incidencia(request, codigo):
    """
    PATCH /api/incidencias/{codigo}/estado/
    
    Actualiza el estado de una incidencia durante su ciclo de vida.
    Permite transiciones: pendiente → en_proceso → resuelta.
    
    ENDPOINT: PATCH /api/incidencias/{codigo}/estado/
    MÉTODO: PATCH
    PERMISOS: Público (tótem sin autenticación)
    RATE LIMIT: 20 peticiones por minuto por IP
    
    PARÁMETROS URL:
        codigo (str): Código único de la incidencia
    
    BODY (JSON):
        {
            "estado": "en_proceso"  # REQUERIDO: pendiente | en_proceso | resuelta
        }
    
    RESPUESTA EXITOSA (200):
        {
            "id": int,
            "codigo": "INC-20251130-001",
            "estado": "en_proceso",
            "updated_at": "2025-11-30T10:45:00Z",
            ...
        }
    
    ERRORES:
        400: Estado inválido o falta campo estado
        404: Incidencia no encontrada
        409: Transición de estado no permitida
        500: Error interno del servidor
    """
    try:
        nuevo_estado = request.data.get('estado')
        if not nuevo_estado:
            raise ValidationException(detail='Falta campo estado')
        
        service = IncidenciaService()
        incidencia = service.cambiar_estado(codigo, nuevo_estado)
        return Response(IncidenciaSerializer(incidencia).data)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en cambiar_estado_incidencia: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def ciclo_activo(request):
    """
    GET /api/ciclo-activo/
    
    Obtiene el ciclo bimensual activo actual.
    Solo puede existir un ciclo activo a la vez.
    
    ENDPOINT: GET /api/ciclo-activo/
    MÉTODO: GET
    PERMISOS: Público (sin autenticación)
    
    RESPUESTA EXITOSA (200):
        {
            "id": int,
            "fecha_inicio": "2025-11-01",
            "fecha_fin": "2025-12-31",
            "activo": true,
            "dias_restantes": 31
        }
    
    ERRORES:
        404: Sin ciclo activo configurado
    """
    ciclo = Ciclo.objects.filter(activo=True).order_by('-id').first()
    if not ciclo:
        raise NoCicloActivoException('Sin ciclo activo')
    return Response(CicloSerializer(ciclo).data)


@api_view(['GET', 'POST'])
def parametros_operativos(request):
    """
    GET /api/parametros/ - lista todos los parámetros operativos
    POST /api/parametros/ - crea o actualiza un parámetro (upsert)
    
    Parámetros operativos permiten configurar valores dinámicamente
    sin necesidad de reiniciar el sistema (ej: TTL de tickets, cupos).
    
    ENDPOINT: GET|POST /api/parametros/
    MÉTODOS: GET, POST
    PERMISOS: Público para GET, Admin recomendado para POST
    
    --- GET ---
    RESPUESTA (200):
        [
            {
                "id": int,
                "clave": "ticket_ttl_minutos",
                "valor": "30",
                "descripcion": "Tiempo de vida de tickets en minutos"
            },
            ...
        ]
    
    --- POST ---
    BODY (JSON):
        {
            "clave": "ticket_ttl_minutos",        # REQUERIDO: Nombre del parámetro
            "valor": "45",                       # OPCIONAL: Valor (string)
            "descripcion": "TTL de tickets"     # OPCIONAL: Descripción
        }
    
    RESPUESTA (201):
        {
            "id": int,
            "clave": "ticket_ttl_minutos",
            "valor": "45",
            "descripcion": "TTL de tickets"
        }
    
    ERRORES:
        400: Falta campo 'clave' en POST
    """
    if request.method == 'GET':
        qs = ParametroOperativo.objects.all().order_by('clave')
        return Response(ParametroOperativoSerializer(qs, many=True).data)
    clave = request.data.get('clave')
    valor = request.data.get('valor')
    if not clave:
        raise ValidationException(detail='Falta clave')
    po, _created = ParametroOperativo.objects.get_or_create(clave=clave, defaults={'valor': valor or ''})
    if valor is not None:
        po.valor = valor
    descripcion = request.data.get('descripcion')
    if descripcion is not None:
        po.descripcion = descripcion
    po.save()
    return Response(ParametroOperativoSerializer(po).data, status=201)


# (metricas_guardia movido a guardia/views.py)
# (listar_tickets movido a rrhh/views.py)
