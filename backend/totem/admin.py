from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Usuario, Trabajador, StockSucursal, Ticket, Sucursal,
    Ciclo, TipoBeneficio, CajaFisica, Agendamiento, Incidencia, TicketEvent,
    ParametroOperativo, CajaBeneficio, BeneficioTrabajador, ValidacionCaja
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


@admin.register(TipoBeneficio)
class TipoBeneficioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'activo', 'created_at')
    list_filter = ('activo',)
    search_fields = ('nombre', 'descripcion')
    ordering = ('nombre',)


@admin.register(Ciclo)
class CicloAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'fecha_inicio', 'fecha_fin', 'activo', 'dias_restantes', 'cantidad_beneficios')
    list_filter = ('activo', 'beneficios_activos')
    date_hierarchy = 'fecha_inicio'
    search_fields = ('nombre', 'descripcion')
    filter_horizontal = ('beneficios_activos',)
    
    def cantidad_beneficios(self, obj):
        return obj.beneficios_activos.count()
    cantidad_beneficios.short_description = 'Beneficios'


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


@admin.register(CajaBeneficio)
class CajaBeneficioAdmin(admin.ModelAdmin):
    list_display = ('beneficio', 'nombre', 'codigo_tipo', 'activo', 'created_at')
    list_filter = ('beneficio', 'activo', 'created_at')
    search_fields = ('nombre', 'codigo_tipo', 'beneficio__nombre')
    readonly_fields = ('created_at',)


@admin.register(BeneficioTrabajador)
class BeneficioTrabajadorAdmin(admin.ModelAdmin):
    list_display = ('trabajador', 'tipo_beneficio', 'caja_beneficio', 'ciclo', 'estado', 'bloqueado')
    list_filter = ('estado', 'ciclo', 'tipo_beneficio', 'bloqueado', 'created_at')
    search_fields = ('trabajador__rut', 'trabajador__nombre', 'codigo_verificacion')
    readonly_fields = ('codigo_verificacion', 'qr_data', 'created_at', 'updated_at')
    fieldsets = (
        ('Información Básica', {
            'fields': ('trabajador', 'ciclo', 'tipo_beneficio', 'caja_beneficio')
        }),
        ('Códigos de Verificación', {
            'fields': ('codigo_verificacion', 'qr_data'),
            'classes': ('collapse',)
        }),
        ('Estado y Bloqueos', {
            'fields': ('estado', 'bloqueado', 'motivo_bloqueo')
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ValidacionCaja)
class ValidacionCajaAdmin(admin.ModelAdmin):
    list_display = ('beneficio_trabajador', 'guardia', 'resultado', 'caja_coincide', 'fecha_validacion')
    list_filter = ('resultado', 'caja_coincide', 'fecha_validacion')
    search_fields = ('beneficio_trabajador__codigo_verificacion', 'guardia__username', 'codigo_escaneado')
    readonly_fields = ('fecha_validacion', 'get_beneficio_info')
    
    def get_beneficio_info(self, obj):
        return f"{obj.beneficio_trabajador.trabajador.nombre} - {obj.beneficio_trabajador.tipo_beneficio.nombre}"
    get_beneficio_info.short_description = 'Información del Beneficio'

