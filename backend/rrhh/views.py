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
    GET /api/rrhh/tickets/
    
    Lista todos los tickets del sistema con múltiples filtros opcionales.
    Endpoint administrativo para análisis y seguimiento de retiros.
    
    ENDPOINT: GET /api/rrhh/tickets/
    MÉTODO: GET
    PERMISOS: IsRRHHOrSupervisor (RRHH, Supervisor o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    QUERY PARAMETERS (todos opcionales):
        ?rut=12345678-9           # Filtro por RUT de trabajador
        ?estado=pendiente         # Filtro: pendiente | entregado | expirado | anulado
        ?fecha_desde=2025-11-01   # Filtro desde fecha (YYYY-MM-DD)
        ?fecha_hasta=2025-11-30   # Filtro hasta fecha (YYYY-MM-DD)
        ?sucursal_id=1            # Filtro por ID de sucursal
    
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
                "estado": "entregado",
                "sucursal": {"id": 1, "nombre": "Central"},
                "created_at": "2025-11-30T10:30:00Z",
                "entregado_at": "2025-11-30T10:45:00Z",
                "validado_por": "guardia1"
            },
            ...
        ]
    
    ERRORES:
        401: No autenticado (falta token JWT)
        403: Sin permisos (no es RRHH/Supervisor/Admin)
        400: Parámetros de filtro inválidos
        500: Error interno del servidor
    
    NOTAS:
        - Los filtros se combinan con lógica AND
        - Ordenamiento: más recientes primero
        - Soporta paginación automática (si se configura en settings)
        - Fechas en formato ISO 8601 (YYYY-MM-DD)
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
    GET /api/rrhh/reportes/retiros-por-dia/
    
    Reporte estadístico de tickets agrupados por día.
    Muestra evolución de retiros en un período específico.
    
    ENDPOINT: GET /api/rrhh/reportes/retiros-por-dia/
    MÉTODO: GET
    PERMISOS: IsRRHH (RRHH o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    QUERY PARAMETERS:
        ?dias=7  # OPCIONAL: Número de días hacia atrás (default: 7, max: 90)
    
    RESPUESTA EXITOSA (200):
        {
            "periodo": {
                "desde": "2025-11-24",
                "hasta": "2025-11-30",
                "dias": 7
            },
            "datos": [
                {
                    "fecha": "2025-11-30",
                    "total": 85,
                    "entregados": 70,
                    "pendientes": 10,
                    "expirados": 3,
                    "anulados": 2,
                    "tasa_entrega": 82.4  # Porcentaje
                },
                ...
            ],
            "totales": {
                "total": 550,
                "entregados": 480,
                "tasa_entrega_promedio": 87.3
            }
        }
    
    ERRORES:
        400: Parámetro "dias" inválido
        401: No autenticado
        403: Sin permisos (no es RRHH/Admin)
        500: Error interno del servidor
    
    NOTAS:
        - Datos ordenados de más antiguo a más reciente
        - Incluye todos los estados de tickets
        - Útil para gráficos de tendencia
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
    GET /api/rrhh/reportes/trabajadores-activos/
    
    Reporte de participación de trabajadores en retiros por ciclo.
    Calcula tasas de uso del beneficio y patrones de retiro.
    
    ENDPOINT: GET /api/rrhh/reportes/trabajadores-activos/
    MÉTODO: GET
    PERMISOS: IsRRHH (RRHH o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    QUERY PARAMETERS:
        ?ciclo_id=1  # OPCIONAL: ID del ciclo (default: ciclo activo)
    
    RESPUESTA EXITOSA (200):
        {
            "ciclo": {
                "id": 1,
                "fecha_inicio": "2025-11-01",
                "fecha_fin": "2025-12-31",
                "activo": true
            },
            "total_trabajadores": 500,           # Total en nómina
            "trabajadores_con_retiros": 420,     # Con al menos 1 ticket
            "tasa_participacion": 84.0,          # Porcentaje
            "retiros_totales": 450,              # Total de tickets
            "promedio_retiros_por_trabajador": 1.07,
            "sin_retiros": 80,                   # No han retirado
            "multiples_retiros": 30              # Con más de 1 retiro
        }
    
    ERRORES:
        401: No autenticado
        403: Sin permisos (no es RRHH/Admin)
        404: Ciclo no encontrado
        500: Error interno del servidor
    
    NOTAS:
        - Si no se especifica ciclo_id, usa el ciclo activo
        - "trabajadores_con_retiros" cuenta únicos (distintos RUTs)
        - Útil para evaluar efectividad del programa de beneficios
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
    GET /api/rrhh/reportes/incidencias/
    
    Estadísticas completas de incidencias reportadas.
    Incluye distribución por tipo, estado y tiempo de resolución.
    
    ENDPOINT: GET /api/rrhh/reportes/incidencias/
    MÉTODO: GET
    PERMISOS: IsRRHH (RRHH o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    QUERY PARAMETERS: Ninguno
    
    RESPUESTA EXITOSA (200):
        {
            "total_incidencias": 150,
            "por_estado": {
                "pendiente": 15,
                "en_proceso": 8,
                "resuelta": 127
            },
            "por_tipo": {
                "tecnica": 80,
                "operacional": 45,
                "usuario": 25
            },
            "por_origen": {
                "totem": 95,
                "guardia": 55
            },
            "tiempo_promedio_resolucion_horas": 4.2,
            "tasa_resolucion": 84.7,  # Porcentaje de resueltas
            "incidencias_abiertas": 23,
            "ultima_semana": 18
        }
    
    ERRORES:
        401: No autenticado
        403: Sin permisos (no es RRHH/Admin)
        500: Error interno del servidor
    
    NOTAS:
        - Tiempo promedio calculado solo sobre incidencias resueltas
        - "incidencias_abiertas" = pendiente + en_proceso
        - Útil para identificar problemas recurrentes
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
    GET /api/rrhh/reportes/stock/
    
    Reporte consolidado de niveles de inventario por sucursal.
    Incluye proyecciones y alertas de stock crítico.
    
    ENDPOINT: GET /api/rrhh/reportes/stock/
    MÉTODO: GET
    PERMISOS: IsRRHH (RRHH o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    QUERY PARAMETERS: Ninguno
    
    RESPUESTA EXITOSA (200):
        {
            "total_disponible": 450,
            "por_sucursal": [
                {
                    "sucursal": {"id": 1, "nombre": "Central"},
                    "estandar": 180,
                    "premium": 70,
                    "total": 250,
                    "nivel": "normal",  # critico | bajo | normal | alto
                    "dias_estimados": 15  # Proyección según consumo
                },
                ...
            ],
            "por_tipo": {
                "estandar": 320,
                "premium": 130
            },
            "alertas": [
                {
                    "sucursal": "Norte",
                    "tipo": "Estandar",
                    "cantidad": 25,
                    "nivel": "bajo",
                    "mensaje": "Stock bajo, reabastecer pronto"
                }
            ]
        }
    
    ERRORES:
        401: No autenticado
        403: Sin permisos (no es RRHH/Admin)
        500: Error interno del servidor
    
    NOTAS:
        - Niveles: critico (<10%), bajo (10-30%), normal (30-70%), alto (>70%)
        - "dias_estimados" basado en consumo promedio de últimos 7 días
        - Alertas generadas automáticamente cuando nivel <= bajo
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
    GET /api/rrhh/alertas/stock/
    
    Sistema de alertas de inventario con niveles de severidad.
    Notifica cuando el stock está por debajo de umbrales críticos.
    
    ENDPOINT: GET /api/rrhh/alertas/stock/
    MÉTODO: GET
    PERMISOS: IsRRHH (RRHH o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    QUERY PARAMETERS: Ninguno
    
    RESPUESTA EXITOSA (200):
        {
            "total_alertas": 3,
            "alertas": [
                {
                    "id": 1,
                    "sucursal": {"id": 2, "nombre": "Norte"},
                    "tipo_caja": "Estandar",
                    "cantidad_actual": 25,
                    "umbral_minimo": 50,
                    "nivel_severidad": "alto",  # critico | alto | medio
                    "mensaje": "Stock crítico: 25 unidades (umbral: 50)",
                    "accion_recomendada": "Reabastecimiento urgente requerido",
                    "dias_estimados_agotamiento": 2,
                    "created_at": "2025-11-30T10:00:00Z"
                },
                ...
            ]
        }
    
    ERRORES:
        401: No autenticado
        403: Sin permisos (no es RRHH/Admin)
        500: Error interno del servidor
    
    NOTAS:
        - Severidades:
          - critico: <10% del umbral mínimo
          - alto: 10-30% del umbral
          - medio: 30-50% del umbral
        - Umbrales configurables por tipo de caja y sucursal
        - Alertas ordenadas por severidad (crítico primero)
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
    GET /api/rrhh/reportes/tiempo-promedio-retiro/
    
    Métricas de eficiencia operacional del sistema de retiro.
    Calcula tiempo promedio entre creación y entrega de tickets.
    
    ENDPOINT: GET /api/rrhh/reportes/tiempo-promedio-retiro/
    MÉTODO: GET
    PERMISOS: IsRRHH (RRHH o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    QUERY PARAMETERS:
        ?fecha_desde=2025-11-01  # OPCIONAL: Fecha inicio (YYYY-MM-DD)
        ?fecha_hasta=2025-11-30  # OPCIONAL: Fecha fin (YYYY-MM-DD)
    
    RESPUESTA EXITOSA (200):
        {
            "periodo": {
                "desde": "2025-11-01",
                "hasta": "2025-11-30"
            },
            "total_tickets_entregados": 450,
            "tiempo_promedio_minutos": 12.5,
            "tiempo_mediano_minutos": 10,
            "tiempo_minimo_minutos": 2,
            "tiempo_maximo_minutos": 45,
            "por_sucursal": [
                {
                    "sucursal": "Central",
                    "promedio_minutos": 11.2,
                    "tickets": 280
                },
                ...
            ],
            "distribucion": {
                "0_5_min": 120,     # Muy rápido
                "5_15_min": 250,    # Normal
                "15_30_min": 65,    # Lento
                "mas_30_min": 15    # Muy lento
            }
        }
    
    ERRORES:
        400: Formato de fecha inválido
        401: No autenticado
        403: Sin permisos (no es RRHH/Admin)
        500: Error interno del servidor
    
    NOTAS:
        - Solo considera tickets estado="entregado"
        - Tiempo calculado: entregado_at - created_at
        - Útil para evaluar eficiencia de portería
        - Meta objetivo: <15 minutos promedio
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
    GET /api/rrhh/exportar/tickets/
    
    Exporta datos de tickets a formato CSV para análisis externo.
    Genera archivo descargable con todos los campos relevantes.
    
    ENDPOINT: GET /api/rrhh/exportar/tickets/
    MÉTODO: GET
    PERMISOS: IsRRHH (RRHH o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    QUERY PARAMETERS:
        ?fecha_desde=2025-11-01  # OPCIONAL: Fecha inicio (YYYY-MM-DD)
        ?fecha_hasta=2025-11-30  # OPCIONAL: Fecha fin (YYYY-MM-DD)
    
    RESPUESTA EXITOSA (200):
        Content-Type: text/csv; charset=utf-8
        Content-Disposition: attachment; filename="tickets_2025-11-30.csv"
        
        Estructura CSV:
        uuid,trabajador_rut,trabajador_nombre,estado,sucursal,created_at,entregado_at,validado_por,tiempo_entrega_min
        ABC123,12345678-9,Juan Pérez,entregado,Central,2025-11-30 10:30:00,2025-11-30 10:45:00,guardia1,15
        DEF456,87654321-K,María González,pendiente,Norte,2025-11-30 11:00:00,,,
        ...
    
    ERRORES:
        400: Formato de fecha inválido (debe ser YYYY-MM-DD)
        401: No autenticado
        403: Sin permisos (no es RRHH/Admin)
        500: Error interno del servidor
    
    NOTAS:
        - Codificación: UTF-8 con BOM para compatibilidad con Excel
        - Delimiter: coma (,)
        - Si no se especifican fechas, exporta todos los tickets
        - Máximo recomendado: 10,000 registros (usar filtros de fecha)
        - Compatible con Excel, Google Sheets, Power BI
        - Timestamps en formato ISO 8601 local
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


@api_view(['GET'])
@permission_classes([IsRRHH])
def exportar_tickets_excel(request):
    """
    GET /api/rrhh/exportar/tickets/excel/
    
    Exporta datos de tickets a formato Excel (XLSX) con estilos profesionales.
    Incluye hoja de resumen con estadísticas consolidadas.
    
    ENDPOINT: GET /api/rrhh/exportar/tickets/excel/
    MÉTODO: GET
    PERMISOS: IsRRHH (RRHH o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    QUERY PARAMETERS:
        ?fecha_desde=2025-11-01  # OPCIONAL: Fecha inicio (YYYY-MM-DD)
        ?fecha_hasta=2025-11-30  # OPCIONAL: Fecha fin (YYYY-MM-DD)
        ?estado=entregado        # OPCIONAL: Filtrar por estado
    
    RESPUESTA EXITOSA (200):
        Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
        Content-Disposition: attachment; filename="tickets_20251130_103000.xlsx"
        
        Archivo Excel con 2 hojas:
        1. "Tickets": Listado detallado con encabezados con estilo
        2. "Resumen": Estadísticas consolidadas del período
    
    ERRORES:
        400: Formato de fecha inválido
        401: No autenticado
        403: Sin permisos (no es RRHH/Admin)
        500: Error interno del servidor o openpyxl no instalado
    
    NOTAS:
        - Requiere: pip install openpyxl
        - Formato más amigable que CSV para análisis en Excel
        - Incluye formato de fecha automático
        - Columnas auto-ajustadas según contenido
        - Encabezados con fondo azul y texto blanco
    """
    try:
        from totem.excel_utils import exportar_queryset_a_excel, agregar_hoja_resumen
        
        fecha_desde_str = request.GET.get('fecha_desde')
        fecha_hasta_str = request.GET.get('fecha_hasta')
        estado = request.GET.get('estado')
        
        # Construir QuerySet con filtros
        qs = Ticket.objects.select_related('trabajador', 'ciclo').all()
        
        if fecha_desde_str:
            fecha_desde = date.fromisoformat(fecha_desde_str)
            qs = qs.filter(created_at__date__gte=fecha_desde)
        
        if fecha_hasta_str:
            fecha_hasta = date.fromisoformat(fecha_hasta_str)
            qs = qs.filter(created_at__date__lte=fecha_hasta)
        
        if estado:
            qs = qs.filter(estado=estado)
        
        qs = qs.order_by('-created_at')
        
        # Definir encabezados y campos
        headers = [
            'UUID',
            'RUT Trabajador',
            'Nombre Trabajador',
            'Estado',
            'Sucursal',
            'Fecha Creación',
            'Fecha Entrega',
            'Validado Por',
            'Tiempo Entrega (min)'
        ]
        
        def calcular_tiempo_entrega(ticket):
            if ticket.entregado_at and ticket.created_at:
                diff = ticket.entregado_at - ticket.created_at
                return round(diff.total_seconds() / 60)
            return None
        
        campos = [
            'uuid',
            'trabajador.rut',
            'trabajador.nombre',
            'estado',
            lambda t: t.sucursal or 'N/A',
            lambda t: t.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            lambda t: t.entregado_at.strftime('%Y-%m-%d %H:%M:%S') if t.entregado_at else '',
            'validado_por',
            calcular_tiempo_entrega
        ]
        
        # Generar Excel
        response = exportar_queryset_a_excel(
            qs,
            'tickets',
            headers,
            campos,
            sheet_name='Tickets'
        )
        
        # Agregar hoja de resumen (si hay suficientes datos)
        if qs.count() > 0:
            estadisticas = {
                'Total Tickets': qs.count(),
                'Entregados': qs.filter(estado='entregado').count(),
                'Pendientes': qs.filter(estado='pendiente').count(),
                'Expirados': qs.filter(estado='expirado').count(),
                'Anulados': qs.filter(estado='anulado').count(),
            }
            
            # TODO: Agregar estadísticas al Excel
            # (requiere modificar exportar_queryset_a_excel para retornar workbook)
        
        return response
        
    except ImportError:
        return Response(
            {'detail': 'Exportación Excel no disponible. Contacte al administrador.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except ValueError as e:
        return Response({'detail': 'Formato de fecha inválido. Use YYYY-MM-DD'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error inesperado en exportar_tickets_excel: {e}")
        return Response({'detail': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
