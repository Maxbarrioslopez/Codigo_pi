from django.urls import path
from . import views  # vistas núcleo tótem
from . import views_auth  # vistas de autenticación
from guardia import views as guardia_views
from rrhh import views as rrhh_views
from . import views_trabajadores as trab_views
from . import views_ciclos as ciclos_views
from . import views_stock as stock_views
from . import views_nomina as nomina_views
from . import views_debug as debug_views
from . import views_health as health_views

urlpatterns = [
    # Health checks (públicos, sin autenticación)
    path('health/', health_views.health_check, name='health_check'),
    path('health/liveness/', health_views.liveness_check, name='liveness_check'),
    path('health/readiness/', health_views.readiness_check, name='readiness_check'),
    
    # Autenticación
    path('auth/me/', views_auth.auth_me, name='auth_me'),
    path('auth/logout/', views_auth.auth_logout, name='auth_logout'),
    path('auth/change-password/', views_auth.auth_change_password, name='auth_change_password'),
    
    # Gestión de Usuarios (admin)
    path('usuarios/', views_auth.usuarios_list, name='usuarios_list'),
    path('usuarios/', views_auth.usuarios_create, name='usuarios_create'),
    path('usuarios/reset-password/', views_auth.usuarios_reset_password, name='usuarios_reset_password'),
    
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
    path('incidencias/listar/', views.listar_incidencias, name='listar_incidencias'),
    path('incidencias/<str:codigo>/', views.obtener_incidencia, name='obtener_incidencia'),
    path('incidencias/<str:codigo>/resolver/', views.resolver_incidencia, name='resolver_incidencia'),
    path('incidencias/<str:codigo>/estado/', views.cambiar_estado_incidencia, name='cambiar_estado_incidencia'),

    # Ciclo y métricas
    path('ciclo/activo/', views.ciclo_activo, name='ciclo_activo'),
    path('metricas/guardia/', guardia_views.metricas_guardia, name='metricas_guardia'),
    path('parametros/', views.parametros_operativos, name='parametros_operativos'),

    # Trabajadores (RRHH)
    path('trabajadores/', trab_views.trabajadores_list_create, name='trabajadores_list_create'),
    path('trabajadores/<str:rut>/', trab_views.trabajador_detail, name='trabajador_detail'),
    path('trabajadores/<str:rut>/bloquear/', trab_views.trabajador_bloquear, name='trabajador_bloquear'),
    path('trabajadores/<str:rut>/desbloquear/', trab_views.trabajador_desbloquear, name='trabajador_desbloquear'),
    path('trabajadores/<str:rut>/timeline/', trab_views.trabajador_timeline, name='trabajador_timeline'),

    # Ciclos
    path('ciclos/', ciclos_views.ciclos_list_create, name='ciclos_list_create'),
    path('ciclos/<int:ciclo_id>/', ciclos_views.ciclo_detail_update, name='ciclo_detail_update'),
    path('ciclos/<int:ciclo_id>/cerrar/', ciclos_views.ciclo_cerrar, name='ciclo_cerrar'),
    path('ciclos/<int:ciclo_id>/estadisticas/', ciclos_views.ciclo_estadisticas, name='ciclo_estadisticas'),

    # Stock
    path('stock/resumen/', stock_views.stock_resumen, name='stock_resumen'),
    path('stock/movimientos/', stock_views.stock_movimientos, name='stock_movimientos'),
    path('stock/movimiento/', stock_views.registrar_movimiento_stock, name='registrar_movimiento_stock'),

    # Nómina
    path('nomina/preview/', nomina_views.nomina_preview, name='nomina_preview'),
    path('nomina/confirmar/', nomina_views.nomina_confirmar, name='nomina_confirmar'),
    path('nomina/historial/', nomina_views.nomina_historial, name='nomina_historial'),

    # Debug
    path('debug/user/', debug_views.debug_user, name='debug_user'),
]
