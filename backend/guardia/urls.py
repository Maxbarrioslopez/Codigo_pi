"""
URLs del módulo Guardia.
"""
from django.urls import path
from . import views

app_name = 'guardia'

urlpatterns = [
    # Validación de tickets
    path('tickets/<str:uuid>/validar/', views.validar_ticket_guardia, name='validar_ticket'),
    path('tickets/<str:uuid>/tiempo-restante/', views.verificar_tiempo_restante, name='tiempo_restante'),
    path('tickets/pendientes/', views.tickets_pendientes, name='tickets_pendientes'),
    
    # Métricas
    path('metricas/', views.metricas_guardia, name='metricas'),
]
