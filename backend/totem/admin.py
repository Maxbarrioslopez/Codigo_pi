from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Usuario, Trabajador, StockSucursal, Ticket, Sucursal,
    Ciclo, CajaFisica, Agendamiento, Incidencia, TicketEvent,
    ParametroOperativo
)


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'rol', 'sucursal', 'is_staff')
    list_filter = ('rol', 'is_staff', 'is_superuser', 'is_active', 'sucursal')
    fieldsets = UserAdmin.fieldsets + (
        ('Información Adicional', {'fields': ('rol', 'sucursal', 'telefono', 'activo')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Información Adicional', {'fields': ('rol', 'sucursal', 'telefono', 'activo')}),
    )


@admin.register(Trabajador)
class TrabajadorAdmin(admin.ModelAdmin):
    list_display = ('rut', 'nombre', 'tiene_beneficio')
    search_fields = ('rut', 'nombre')
    list_filter = ('beneficio_disponible',)
    
    def tiene_beneficio(self, obj):
        return bool(obj.beneficio_disponible)
    tiene_beneficio.boolean = True
    tiene_beneficio.short_description = 'Beneficio'


@admin.register(StockSucursal)
class StockAdmin(admin.ModelAdmin):
    list_display = ('sucursal', 'producto', 'cantidad', 'tiene_stock')
    list_filter = ('sucursal',)
    search_fields = ('sucursal', 'producto')
    
    def tiene_stock(self, obj):
        return obj.cantidad > 0
    tiene_stock.boolean = True


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'trabajador', 'estado', 'created_at', 'ttl_expira_at', 'ciclo')
    list_filter = ('estado', 'ciclo', 'created_at')
    search_fields = ('uuid', 'trabajador__rut', 'trabajador__nombre')
    readonly_fields = ('uuid', 'created_at', 'qr_image')
    date_hierarchy = 'created_at'


@admin.register(Sucursal)
class SucursalAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nombre')
    search_fields = ('codigo', 'nombre')


@admin.register(Ciclo)
class CicloAdmin(admin.ModelAdmin):
    list_display = ('id', 'fecha_inicio', 'fecha_fin', 'activo', 'dias_restantes')
    list_filter = ('activo',)
    date_hierarchy = 'fecha_inicio'


@admin.register(CajaFisica)
class CajaFisicaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'tipo', 'sucursal', 'usado', 'asignada_ticket')
    list_filter = ('tipo', 'sucursal', 'usado')
    search_fields = ('codigo',)


@admin.register(Agendamiento)
class AgendamientoAdmin(admin.ModelAdmin):
    list_display = ('id', 'trabajador', 'fecha_retiro', 'estado', 'ciclo', 'created_at')
    list_filter = ('estado', 'fecha_retiro', 'ciclo')
    search_fields = ('trabajador__rut', 'trabajador__nombre')
    date_hierarchy = 'fecha_retiro'


@admin.register(Incidencia)
class IncidenciaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'trabajador', 'tipo', 'estado', 'creada_por', 'created_at', 'resolved_at')
    list_filter = ('estado', 'tipo', 'creada_por', 'created_at')
    search_fields = ('codigo', 'trabajador__rut', 'descripcion')
    readonly_fields = ('codigo', 'created_at')
    date_hierarchy = 'created_at'


@admin.register(TicketEvent)
class TicketEventAdmin(admin.ModelAdmin):
    list_display = ('ticket', 'tipo', 'timestamp')
    list_filter = ('tipo', 'timestamp')
    search_fields = ('ticket__uuid',)
    readonly_fields = ('timestamp',)
    date_hierarchy = 'timestamp'


@admin.register(ParametroOperativo)
class ParametroOperativoAdmin(admin.ModelAdmin):
    list_display = ('clave', 'valor', 'descripcion', 'updated_at')
    search_fields = ('clave', 'descripcion')
    readonly_fields = ('updated_at',)
