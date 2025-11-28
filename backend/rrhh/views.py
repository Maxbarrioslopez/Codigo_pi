"""Vistas del módulo RRHH: listados y consultas administrativas.
Separadas de totem/views.py para modularización por dominio.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from datetime import timedelta, date
from django.utils import timezone
from django.http import HttpResponse
from totem.models import Ticket
from totem.serializers import TicketSerializer
from totem.utils_rut import clean_rut, valid_rut
from totem.permissions import IsRRHH, IsRRHHOrSupervisor
from totem.exceptions import TotemBaseException
from .services.rrhh_service import RRHHService
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsRRHHOrSupervisor])
def listar_tickets(request):
    """
    GET /api/rrhh/tickets?rut=...&estado=...&fecha_desde=...&fecha_hasta=...&sucursal_id=...
    
    Lista tickets con múltiples filtros.
    """
    try:
        rut = request.GET.get('rut')
        estado = request.GET.get('estado')
        fecha_desde = request.GET.get('fecha_desde')
        fecha_hasta = request.GET.get('fecha_hasta')
        sucursal_id = request.GET.get('sucursal_id')
        
        service = RRHHService()
        tickets = service.listar_tickets(
            trabajador_rut=rut,
            estado=estado,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            sucursal_id=int(sucursal_id) if sucursal_id else None
        )
        return Response(TicketSerializer(tickets, many=True).data, status=status.HTTP_200_OK)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en listar_tickets: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsRRHH])
def retiros_por_dia(request):
    """
    GET /api/rrhh/reportes/retiros-por-dia?dias=7
    
    Devuelve resumen por día de tickets por estado.
    """
    try:
        dias = int(request.GET.get('dias', '7'))
        
        service = RRHHService()
        reporte = service.reporte_retiros_por_dia(dias=dias)
        return Response(reporte, status=status.HTTP_200_OK)
    except TotemBaseException:
        raise
    except ValueError as e:
        return Response({'detail': 'Parámetro "dias" inválido'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error inesperado en retiros_por_dia: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsRRHH])
def trabajadores_activos(request):
    """
    GET /api/rrhh/reportes/trabajadores-activos?ciclo_id=1
    
    Reporte de trabajadores con tickets en un ciclo, con tasa de retiro.
    """
    try:
        ciclo_id = request.GET.get('ciclo_id')
        
        service = RRHHService()
        reporte = service.reporte_trabajadores_activos(
            ciclo_id=int(ciclo_id) if ciclo_id else None
        )
        return Response(reporte, status=status.HTTP_200_OK)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en trabajadores_activos: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsRRHH])
def reporte_incidencias(request):
    """
    GET /api/rrhh/reportes/incidencias
    
    Estadísticas de incidencias con tiempo promedio de resolución.
    """
    try:
        service = RRHHService()
        reporte = service.reporte_incidencias()
        return Response(reporte, status=status.HTTP_200_OK)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en reporte_incidencias: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsRRHH])
def reporte_stock(request):
    """
    GET /api/rrhh/reportes/stock
    
    Niveles de stock por sucursal con alertas.
    """
    try:
        service = RRHHService()
        reporte = service.reporte_stock()
        return Response(reporte, status=status.HTTP_200_OK)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en reporte_stock: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsRRHH])
def alertas_stock_bajo(request):
    """
    GET /api/rrhh/alertas/stock
    
    Alertas de stock bajo por sucursal con niveles de severidad.
    """
    try:
        service = RRHHService()
        alertas = service.alertas_stock_bajo()
        return Response(alertas, status=status.HTTP_200_OK)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en alertas_stock_bajo: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsRRHH])
def tiempo_promedio_retiro(request):
    """
    GET /api/rrhh/reportes/tiempo-promedio-retiro?fecha_desde=...&fecha_hasta=...
    
    Calcula tiempo promedio desde creación hasta entrega.
    """
    try:
        fecha_desde = request.GET.get('fecha_desde')
        fecha_hasta = request.GET.get('fecha_hasta')
        
        service = RRHHService()
        reporte = service.reporte_tiempo_promedio_retiro(
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta
        )
        return Response(reporte, status=status.HTTP_200_OK)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en tiempo_promedio_retiro: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsRRHH])
def exportar_tickets_csv(request):
    """
    GET /api/rrhh/exportar/tickets?fecha_desde=YYYY-MM-DD&fecha_hasta=YYYY-MM-DD
    
    Exporta tickets a CSV.
    """
    try:
        fecha_desde_str = request.GET.get('fecha_desde')
        fecha_hasta_str = request.GET.get('fecha_hasta')
        
        # Convertir strings a date objects
        fecha_desde = date.fromisoformat(fecha_desde_str) if fecha_desde_str else None
        fecha_hasta = date.fromisoformat(fecha_hasta_str) if fecha_hasta_str else None
        
        service = RRHHService()
        csv_content = service.exportar_tickets_csv(
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta
        )
        
        response = HttpResponse(csv_content, content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="tickets_{date.today().isoformat()}.csv"'
        return response
    except ValueError as e:
        return Response({'detail': 'Formato de fecha inválido. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
    except TotemBaseException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en exportar_tickets_csv: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
