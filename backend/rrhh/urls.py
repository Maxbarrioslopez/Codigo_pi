"""
URLs del módulo RRHH.
"""
from django.urls import path
from . import views

app_name = 'rrhh'

urlpatterns = [
    # Listados
    path('tickets/', views.listar_tickets, name='listar_tickets'),
    
    # Reportes
    path('reportes/retiros-por-dia/', views.retiros_por_dia, name='retiros_por_dia'),
    path('reportes/trabajadores-activos/', views.trabajadores_activos, name='trabajadores_activos'),
    path('reportes/incidencias/', views.reporte_incidencias, name='reporte_incidencias'),
    path('reportes/stock/', views.reporte_stock, name='reporte_stock'),
    path('reportes/tiempo-promedio-retiro/', views.tiempo_promedio_retiro, name='tiempo_promedio_retiro'),
    
    # Alertas
    path('alertas/stock/', views.alertas_stock_bajo, name='alertas_stock'),
    
    # Exportaciones
    path('exportar/tickets/', views.exportar_tickets_csv, name='exportar_tickets_csv'),
    path('exportar/tickets/excel/', views.exportar_tickets_excel, name='exportar_tickets_excel'),
]
