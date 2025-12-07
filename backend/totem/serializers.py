from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    Trabajador, Ticket, StockSucursal, StockMovimiento, Usuario,
    Ciclo, TipoBeneficio, Sucursal, CajaFisica, Agendamiento, Incidencia, TicketEvent, ParametroOperativo, NominaCarga,
    CajaBeneficio, BeneficioTrabajador, ValidacionCaja
)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer JWT personalizado que incluye el rol del usuario en el token"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Agregar campos personalizados al token
        token['username'] = user.username
        token['rol'] = user.rol
        token['email'] = user.email
        
        return token


class TrabajadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trabajador
        fields = ['id', 'rut', 'nombre', 'beneficio_disponible']


class StockSucursalSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockSucursal
        fields = ['id', 'sucursal', 'producto', 'cantidad']


class StockMovimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovimiento
        fields = ['id', 'fecha', 'hora', 'tipo_caja', 'accion', 'cantidad', 'motivo', 'usuario', 'sucursal']


class TicketSerializer(serializers.ModelSerializer):
    trabajador = TrabajadorSerializer(read_only=True)
    trabajador_id = serializers.PrimaryKeyRelatedField(
        queryset=Trabajador.objects.all(), source='trabajador', write_only=True
    )
    eventos = serializers.SerializerMethodField()

    class Meta:
        model = Ticket
        fields = [
            'id', 'uuid', 'trabajador', 'trabajador_id', 'qr_image', 'data', 'created_at',
            'estado', 'ttl_expira_at', 'ciclo', 'sucursal', 'eventos'
        ]
        read_only_fields = ['id', 'uuid', 'qr_image', 'created_at', 'eventos']

    def get_eventos(self, obj):
        return [
            {
                'tipo': e.tipo,
                'timestamp': e.timestamp.isoformat(),
                'metadata': e.metadata
            } for e in obj.eventos.all().order_by('timestamp')
        ]


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email']


class TipoBeneficioSerializer(serializers.ModelSerializer):
    cajas = serializers.SerializerMethodField()
    
    class Meta:
        model = TipoBeneficio
        fields = ['id', 'nombre', 'descripcion', 'activo', 'tipos_contrato', 'requiere_validacion_guardia', 'cajas', 'created_at']
        read_only_fields = ['created_at']
    
    def get_cajas(self, obj):
        cajas = obj.cajas.filter(activo=True)
        return CajaBeneficioSerializer(cajas, many=True).data


class CicloSerializer(serializers.ModelSerializer):
    dias_restantes = serializers.ReadOnlyField()
    duracion_dias = serializers.ReadOnlyField()
    progreso_porcentaje = serializers.ReadOnlyField()
    beneficios_activos = TipoBeneficioSerializer(many=True, read_only=True)
    beneficios_activos_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=TipoBeneficio.objects.all(),
        source='beneficios_activos',
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Ciclo
        fields = [
            'id', 'nombre', 'fecha_inicio', 'fecha_fin', 'activo',
            'beneficios_activos', 'beneficios_activos_ids',
            'descripcion', 'dias_restantes', 'duracion_dias',
            'progreso_porcentaje', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class SucursalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sucursal
        fields = ['id', 'nombre', 'codigo']


class CajaFisicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CajaFisica
        fields = ['id', 'codigo', 'tipo', 'sucursal', 'usado', 'asignada_ticket']


class AgendamientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agendamiento
        fields = ['id', 'trabajador', 'ciclo', 'fecha_retiro', 'estado', 'created_at']
        read_only_fields = ['estado', 'created_at']


class IncidenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incidencia
        fields = [
            'id', 'codigo', 'trabajador', 'tipo', 'descripcion', 'estado',
            'creada_por', 'created_at', 'resolved_at', 'metadata'
        ]
        read_only_fields = ['created_at', 'resolved_at']


class TicketEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketEvent
        fields = ['id', 'ticket', 'tipo', 'timestamp', 'metadata']
        read_only_fields = ['timestamp']


class ParametroOperativoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParametroOperativo
        fields = ['id', 'clave', 'valor', 'descripcion', 'updated_at']
        read_only_fields = ['updated_at']


class NominaCargaSerializer(serializers.ModelSerializer):
    class Meta:
        model = NominaCarga
        fields = [
            'id', 'ciclo', 'usuario', 'archivo_nombre', 'total_registros',
            'creados', 'actualizados', 'sin_beneficio', 'observaciones', 'fecha_carga'
        ]
        read_only_fields = ['fecha_carga']


class CajaBeneficioSerializer(serializers.ModelSerializer):
    beneficio_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = CajaBeneficio
        fields = ['id', 'beneficio', 'beneficio_nombre', 'nombre', 'descripcion', 'codigo_tipo', 'activo', 'created_at']
        read_only_fields = ['created_at']
    
    def get_beneficio_nombre(self, obj):
        return obj.beneficio.nombre if obj.beneficio else None


class BeneficioTrabajadorSerializer(serializers.ModelSerializer):
    tipo_beneficio_nombre = serializers.CharField(source='tipo_beneficio.nombre', read_only=True)
    caja_beneficio_nombre = serializers.CharField(source='caja_beneficio.nombre', read_only=True)
    trabajador_nombre = serializers.CharField(source='trabajador.nombre', read_only=True)
    
    class Meta:
        model = BeneficioTrabajador
        fields = [
            'id', 'trabajador', 'trabajador_nombre', 'ciclo', 'tipo_beneficio', 'tipo_beneficio_nombre',
            'caja_beneficio', 'caja_beneficio_nombre', 'codigo_verificacion', 'qr_data',
            'estado', 'bloqueado', 'motivo_bloqueo', 'created_at', 'updated_at'
        ]
        read_only_fields = ['codigo_verificacion', 'qr_data', 'created_at', 'updated_at']


class ValidacionCajaSerializer(serializers.ModelSerializer):
    guardia_nombre = serializers.CharField(source='guardia.get_full_name', read_only=True)
    beneficio_info = serializers.SerializerMethodField()
    
    class Meta:
        model = ValidacionCaja
        fields = [
            'id', 'beneficio_trabajador', 'guardia', 'guardia_nombre',
            'codigo_escaneado', 'resultado', 'caja_validada', 'caja_coincide',
            'notas', 'fecha_validacion', 'beneficio_info'
        ]
        read_only_fields = ['fecha_validacion']
    
    def get_beneficio_info(self, obj):
        return {
            'trabajador': obj.beneficio_trabajador.trabajador.nombre,
            'beneficio': obj.beneficio_trabajador.tipo_beneficio.nombre,
            'ciclo': obj.beneficio_trabajador.ciclo.nombre
        }
