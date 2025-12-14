"""
URLs del módulo Guardia.
"""
from django.urls import path
from . import views

app_name = 'guardia'

urlpatterns = [
    # Validación de tickets (legacy)
    path('tickets/<str:uuid>/validar/', views.validar_ticket_guardia, name='validar_ticket'),
    path('tickets/<str:uuid>/tiempo-restante/', views.verificar_tiempo_restante, name='tiempo_restante'),
    path('tickets/pendientes/', views.tickets_pendientes, name='tickets_pendientes'),
    
    # Validación de beneficios (NEW)
    path('beneficios/<int:beneficio_id>/validar/', views.validar_beneficio, name='validar_beneficio'),
    path('beneficios/<int:beneficio_id>/confirmar-entrega/', views.confirmar_entrega, name='confirmar_entrega'),
    
    # Métricas
    path('metricas/', views.metricas_guardia, name='metricas'),
]
