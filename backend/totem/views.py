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
    AgendamientoInvalidException
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
    GET /api/beneficios/{rut}
    - Valida formato RUT
    - Busca trabajador por rut
    - Retorna información de beneficio y stock aproximado
    """
    try:
        rut_c = clean_rut(rut)
        if not valid_rut(rut_c):
            raise RUTInvalidException('RUT inválido. Use formato 12345678-5.')
        
        try:
            trabajador = Trabajador.objects.get(rut__iexact=rut_c)
        except Trabajador.DoesNotExist:
            raise TrabajadorNotFoundException('No se encontró trabajador con ese RUT.')

        serializer = TrabajadorSerializer(trabajador)
        return Response({'beneficio': serializer.data}, status=status.HTTP_200_OK)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en obtener_beneficio: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowTotem])
@ratelimit(key='ip', rate='10/m', method='POST')
def crear_ticket(request):
    """
    POST /api/tickets
    Body esperado JSON:
    {
        "trabajador_rut": "12345678-5",
        "sucursal": "Central"
    }
    Usa TicketService para crear ticket con QR firmado y validaciones.
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
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en crear_ticket: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowTotem])
def estado_ticket(request, uuid):
    """
    GET /api/tickets/{uuid}/estado - retorna estado y eventos del ticket.
    """
    try:
        service = TicketService()
        ticket = service.obtener_estado_ticket(uuid)
        return Response(TicketSerializer(ticket).data)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en estado_ticket: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowTotem])
def anular_ticket(request, uuid):
    """
    POST /api/tickets/{uuid}/anular - anula un ticket pendiente.
    """
    try:
        razon = request.data.get('motivo', 'No especificado')
        service = TicketService()
        ticket = service.anular_ticket(uuid, razon=razon)
        return Response(TicketSerializer(ticket).data)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en anular_ticket: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowTotem])
def reimprimir_ticket(request, uuid):
    """
    POST /api/tickets/{uuid}/reimprimir - reimprime un ticket pendiente (renueva TTL).
    """
    try:
        service = TicketService()
        ticket = service.reimprimir_ticket(uuid)
        return Response(TicketSerializer(ticket).data)
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
    POST /api/agendamientos
    Body: {"trabajador_rut": "...", "fecha_retiro": "YYYY-MM-DD"}
    Crea agendamiento asociado al ciclo activo.
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
    GET /api/agendamientos/{rut} - lista agendamientos de un trabajador.
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
    POST /api/incidencias - reportar incidencia desde tótem o guardia.
    Body: {
        "trabajador_rut": "...", (opcional)
        "tipo": "tecnica|operacional|usuario",
        "descripcion": "...",
        "origen": "totem|guardia"
    }
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
    GET /api/incidencias/{codigo} - obtiene una incidencia por código.
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
    GET /api/incidencias?estado=pendiente&tipo=tecnica - lista incidencias con filtros.
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
    POST /api/incidencias/{codigo}/resolver/ - resuelve una incidencia.
    Body: {"resolucion": "..."}
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
    PATCH /api/incidencias/{codigo}/estado/ - cambia el estado de una incidencia.
    Body: {"estado": "pendiente|en_proceso|resuelta"}
    """
    try:
        nuevo_estado = request.data.get('estado')
        if not nuevo_estado:
            return Response({'detail': 'Falta campo estado'}, status=status.HTTP_400_BAD_REQUEST)
        
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
    ciclo = Ciclo.objects.filter(activo=True).order_by('-id').first()
    if not ciclo:
        return Response({'detail': 'Sin ciclo activo'}, status=404)
    return Response(CicloSerializer(ciclo).data)


@api_view(['GET', 'POST'])
def parametros_operativos(request):
    """GET: lista parámetros; POST: upsert clave/valor."""
    if request.method == 'GET':
        qs = ParametroOperativo.objects.all().order_by('clave')
        return Response(ParametroOperativoSerializer(qs, many=True).data)
    clave = request.data.get('clave')
    valor = request.data.get('valor')
    if not clave:
        return Response({'detail': 'Falta clave'}, status=400)
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
