from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    Trabajador, Ticket, StockSucursal, StockMovimiento, Usuario,
    Ciclo, Sucursal, CajaFisica, Agendamiento, Incidencia, TicketEvent, ParametroOperativo, NominaCarga
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


class CicloSerializer(serializers.ModelSerializer):
    dias_restantes = serializers.ReadOnlyField()
    class Meta:
        model = Ciclo
        fields = ['id', 'fecha_inicio', 'fecha_fin', 'activo', 'dias_restantes']


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
