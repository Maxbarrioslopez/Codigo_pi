from django.urls import path
from . import views  # vistas núcleo tótem
from guardia import views as guardia_views
from rrhh import views as rrhh_views

urlpatterns = [
    # Beneficios / trabajador
    path('beneficios/<str:rut>/', views.obtener_beneficio, name='obtener_beneficio'),

    # Tickets
    path('tickets/', views.crear_ticket, name='crear_ticket'),
    path('tickets/listar/', rrhh_views.listar_tickets, name='listar_tickets'),
    path('reportes/retiros_por_dia/', rrhh_views.retiros_por_dia, name='retiros_por_dia'),
    path('tickets/<str:uuid>/estado/', views.estado_ticket, name='estado_ticket'),
    path('tickets/<str:uuid>/validar_guardia/', guardia_views.validar_ticket_guardia, name='validar_ticket_guardia'),
    path('tickets/<str:uuid>/anular/', views.anular_ticket, name='anular_ticket'),
    path('tickets/<str:uuid>/reimprimir/', views.reimprimir_ticket, name='reimprimir_ticket'),

    # Agendamientos
    path('agendamientos/', views.crear_agendamiento, name='crear_agendamiento'),
    path('agendamientos/<str:rut>/', views.listar_agendamientos_trabajador, name='listar_agendamientos_trabajador'),

    # Incidencias
    path('incidencias/', views.crear_incidencia, name='crear_incidencia'),
    path('incidencias/<str:codigo>/', views.obtener_incidencia, name='obtener_incidencia'),
    path('incidencias/listar/', views.listar_incidencias, name='listar_incidencias'),

    # Ciclo y métricas
    path('ciclo/activo/', views.ciclo_activo, name='ciclo_activo'),
    path('metricas/guardia/', guardia_views.metricas_guardia, name='metricas_guardia'),
    path('parametros/', views.parametros_operativos, name='parametros_operativos'),
]
