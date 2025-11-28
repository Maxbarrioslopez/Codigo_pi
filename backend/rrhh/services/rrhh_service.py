"""
Servicio de RRHH para reportes y gestión.
"""
import logging
from datetime import date, timedelta
from typing import List, Dict, Optional
from django.db.models import Count, Q, Avg, F, ExpressionWrapper, DurationField
from django.utils import timezone

from totem.models import Ticket, Trabajador, Incidencia, StockSucursal, Agendamiento

logger = logging.getLogger(__name__)


class RRHHService:
    """
    Servicio para operaciones de Recursos Humanos.
    """
    
    def listar_tickets(
        self,
        trabajador_rut: Optional[str] = None,
        estado: Optional[str] = None,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
        sucursal_id: Optional[int] = None,
        limit: int = 100
    ) -> List[Ticket]:
        """
        Lista tickets con filtros para RRHH.
        
        Args:
            trabajador_rut: Filtrar por RUT
            estado: Filtrar por estado
            fecha_desde: Fecha inicio
            fecha_hasta: Fecha fin
            sucursal_id: Filtrar por sucursal
            limit: Límite de resultados
            
        Returns:
            Lista de tickets
        """
        queryset = Ticket.objects.select_related(
            'trabajador', 'ciclo', 'sucursal'
        ).prefetch_related('eventos')
        
        if trabajador_rut:
            queryset = queryset.filter(trabajador__rut=trabajador_rut)
        
        if estado:
            queryset = queryset.filter(estado=estado)
        
        if fecha_desde:
            queryset = queryset.filter(created_at__date__gte=fecha_desde)
        
        if fecha_hasta:
            queryset = queryset.filter(created_at__date__lte=fecha_hasta)
        
        if sucursal_id:
            queryset = queryset.filter(sucursal_id=sucursal_id)
        
        return list(queryset.order_by('-created_at')[:limit])
    
    def reporte_retiros_por_dia(self, dias: int = 7) -> List[Dict]:
        """
        Genera reporte de retiros diarios.
        
        Args:
            dias: Número de días hacia atrás
            
        Returns:
            Lista de diccionarios con estadísticas por día
        """
        fecha_inicio = timezone.now().date() - timedelta(days=dias)
        
        tickets_por_dia = Ticket.objects.filter(
            created_at__date__gte=fecha_inicio
        ).values('created_at__date').annotate(
            total=Count('id'),
            entregados=Count('id', filter=Q(estado='entregado')),
            pendientes=Count('id', filter=Q(estado='pendiente')),
            expirados=Count('id', filter=Q(estado='expirado')),
            anulados=Count('id', filter=Q(estado='anulado'))
        ).order_by('-created_at__date')
        
        return list(tickets_por_dia)
    
    def reporte_trabajadores_activos(self, ciclo_id: Optional[int] = None) -> Dict:
        """
        Reporte de trabajadores activos y sus retiros.
        
        Args:
            ciclo_id: Filtrar por ciclo
            
        Returns:
            Diccionario con estadísticas
        """
        filtros = {}
        if ciclo_id:
            filtros['ticket__ciclo_id'] = ciclo_id
        
        stats = {
            'total_trabajadores': Trabajador.objects.count(),
            'trabajadores_con_beneficio': Trabajador.objects.filter(
                beneficio_disponible__isnull=False
            ).exclude(beneficio_disponible={}).count(),
            'trabajadores_que_retiraron': Ticket.objects.filter(
                estado='entregado',
                **filtros
            ).values('trabajador').distinct().count(),
            'tickets_generados': Ticket.objects.filter(**filtros).count(),
            'tickets_entregados': Ticket.objects.filter(
                estado='entregado',
                **filtros
            ).count()
        }
        
        if stats['trabajadores_con_beneficio'] > 0:
            stats['tasa_retiro'] = round(
                (stats['trabajadores_que_retiraron'] / stats['trabajadores_con_beneficio']) * 100,
                2
            )
        else:
            stats['tasa_retiro'] = 0
        
        return stats
    
    def reporte_incidencias(
        self,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None
    ) -> Dict:
        """
        Reporte de incidencias.
        
        Args:
            fecha_desde: Fecha inicio
            fecha_hasta: Fecha fin
            
        Returns:
            Diccionario con estadísticas de incidencias
        """
        filtros = {}
        if fecha_desde:
            filtros['created_at__date__gte'] = fecha_desde
        if fecha_hasta:
            filtros['created_at__date__lte'] = fecha_hasta
        
        incidencias = Incidencia.objects.filter(**filtros)
        
        stats = {
            'total': incidencias.count(),
            'por_estado': dict(
                incidencias.values('estado')
                .annotate(cantidad=Count('id'))
                .values_list('estado', 'cantidad')
            ),
            'por_tipo': dict(
                incidencias.values('tipo')
                .annotate(cantidad=Count('id'))
                .order_by('-cantidad')[:10]
                .values_list('tipo', 'cantidad')
            ),
            'por_origen': dict(
                incidencias.values('creada_por')
                .annotate(cantidad=Count('id'))
                .values_list('creada_por', 'cantidad')
            )
        }
        
        # Tiempo promedio de resolución
        incidencias_resueltas = incidencias.filter(
            estado='resuelta',
            resolved_at__isnull=False
        )
        
        if incidencias_resueltas.exists():
            promedio = incidencias_resueltas.annotate(
                tiempo_resolucion=ExpressionWrapper(
                    F('resolved_at') - F('created_at'),
                    output_field=DurationField()
                )
            ).aggregate(promedio=Avg('tiempo_resolucion'))
            
            if promedio['promedio']:
                stats['tiempo_promedio_resolucion_horas'] = round(
                    promedio['promedio'].total_seconds() / 3600,
                    2
                )
        
        return stats
    
    def reporte_stock(self) -> List[Dict]:
        """
        Reporte de stock por sucursal.
        
        Returns:
            Lista de stocks
        """
        stocks = StockSucursal.objects.all().values(
            'sucursal', 'producto', 'cantidad'
        ).order_by('sucursal', '-cantidad')
        
        resultado = []
        for stock in stocks:
            # Determinar si está bajo
            umbral_bajo = 10  # Podría venir de ParametroOperativo
            stock['estado'] = 'bajo' if stock['cantidad'] < umbral_bajo else 'normal'
            stock['critico'] = stock['cantidad'] == 0
            resultado.append(stock)
        
        return resultado
    
    def reporte_agendamientos(
        self,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None
    ) -> Dict:
        """
        Reporte de agendamientos.
        
        Args:
            fecha_desde: Fecha inicio
            fecha_hasta: Fecha fin
            
        Returns:
            Estadísticas de agendamientos
        """
        filtros = {}
        if fecha_desde:
            filtros['fecha_retiro__gte'] = fecha_desde
        if fecha_hasta:
            filtros['fecha_retiro__lte'] = fecha_hasta
        
        agendamientos = Agendamiento.objects.filter(**filtros)
        
        return {
            'total': agendamientos.count(),
            'por_estado': dict(
                agendamientos.values('estado')
                .annotate(cantidad=Count('id'))
                .values_list('estado', 'cantidad')
            ),
            'pendientes': agendamientos.filter(estado='pendiente').count(),
            'efectuados': agendamientos.filter(estado='efectuado').count(),
            'vencidos': agendamientos.filter(estado='vencido').count(),
            'cancelados': agendamientos.filter(estado='cancelado').count()
        }
    
    def reporte_tiempo_promedio_retiro(self, dias: int = 30) -> Dict:
        """
        Calcula tiempo promedio entre generación y entrega de tickets.
        
        Args:
            dias: Días hacia atrás a considerar
            
        Returns:
            Estadísticas de tiempo
        """
        fecha_inicio = timezone.now().date() - timedelta(days=dias)
        
        tickets_entregados = Ticket.objects.filter(
            estado='entregado',
            created_at__date__gte=fecha_inicio
        ).prefetch_related('eventos')
        
        tiempos = []
        for ticket in tickets_entregados:
            evento_entrega = ticket.eventos.filter(tipo='entregado').first()
            if evento_entrega:
                diferencia = (evento_entrega.timestamp - ticket.created_at).total_seconds()
                tiempos.append(diferencia / 60)  # Convertir a minutos
        
        if not tiempos:
            return {
                'cantidad_tickets': 0,
                'tiempo_promedio_minutos': 0,
                'tiempo_minimo_minutos': 0,
                'tiempo_maximo_minutos': 0
            }
        
        return {
            'cantidad_tickets': len(tiempos),
            'tiempo_promedio_minutos': round(sum(tiempos) / len(tiempos), 2),
            'tiempo_minimo_minutos': round(min(tiempos), 2),
            'tiempo_maximo_minutos': round(max(tiempos), 2)
        }
    
    def alertas_stock_bajo(self, umbral: int = 10) -> List[Dict]:
        """
        Obtiene alertas de stock bajo.
        
        Args:
            umbral: Cantidad mínima para considerar bajo
            
        Returns:
            Lista de stocks bajos
        """
        stocks_bajos = StockSucursal.objects.filter(
            cantidad__lte=umbral
        ).values('sucursal', 'producto', 'cantidad').order_by('cantidad')
        
        alertas = []
        for stock in stocks_bajos:
            alerta = {
                **stock,
                'nivel': 'critico' if stock['cantidad'] == 0 else 'bajo',
                'mensaje': f"Stock {'AGOTADO' if stock['cantidad'] == 0 else 'BAJO'} en {stock['sucursal']}"
            }
            alertas.append(alerta)
        
        return alertas
    
    def exportar_tickets_csv(
        self,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None
    ) -> str:
        """
        Genera CSV de tickets para exportación.
        
        Args:
            fecha_desde: Fecha inicio
            fecha_hasta: Fecha fin
            
        Returns:
            String CSV
        """
        import csv
        from io import StringIO
        
        tickets = self.listar_tickets(
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            limit=10000
        )
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow([
            'UUID', 'Trabajador RUT', 'Trabajador Nombre', 'Estado',
            'Fecha Creación', 'TTL Expira', 'Ciclo', 'Sucursal'
        ])
        
        # Rows
        for ticket in tickets:
            writer.writerow([
                ticket.uuid,
                ticket.trabajador.rut,
                ticket.trabajador.nombre,
                ticket.estado,
                ticket.created_at.isoformat(),
                ticket.ttl_expira_at.isoformat() if ticket.ttl_expira_at else '',
                str(ticket.ciclo) if ticket.ciclo else '',
                ticket.sucursal.nombre if ticket.sucursal else ''
            ])
        
        return output.getvalue()
