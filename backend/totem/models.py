from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

"""Modelos ampliados para cubrir casos de uso:
 - Usuario (modelo de auth extendido con roles)
 - Ciclo bimensual (Ciclo)
 - Sucursal (para segmentar stock y retiros)
 - CajaFisica (validación física en portería)
 - Agendamiento (cuando no hay stock o retiro diferido)
 - Incidencia (reportes de problemas en tótem y portería)
 - TicketEvent (trazabilidad/timeline del ticket)

NOTA: En una evolución futura se pueden separar en apps: core, totem, guardia, rrhh, admin.
"""


class Usuario(AbstractUser):
    """
    Usuario extendido del sistema con roles.
    Hereda de AbstractUser para mantener compatibilidad con Django auth.
    """
    class Roles(models.TextChoices):
        ADMIN = 'admin', 'Administrador'
        RRHH = 'rrhh', 'Recursos Humanos'
        GUARDIA = 'guardia', 'Guardia'
        SUPERVISOR = 'supervisor', 'Supervisor'
    
    rol = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.GUARDIA,
        help_text="Rol del usuario en el sistema"
    )
    sucursal = models.ForeignKey(
        'Sucursal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios',
        help_text="Sucursal asignada (para guardias principalmente)"
    )
    telefono = models.CharField(max_length=20, blank=True)
    activo = models.BooleanField(default=True)
    debe_cambiar_contraseña = models.BooleanField(
        default=False,
        help_text="Indica si el usuario debe cambiar su contraseña en el próximo ingreso"
    )
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['username']
    
    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_rol_display()})"
    
    def es_admin(self):
        return self.rol == self.Roles.ADMIN or self.is_superuser
    
    def es_rrhh(self):
        return self.rol in [self.Roles.RRHH, self.Roles.ADMIN]
    
    def es_guardia(self):
        return self.rol == self.Roles.GUARDIA
    
    def es_supervisor(self):
        return self.rol in [self.Roles.SUPERVISOR, self.Roles.ADMIN]


class Trabajador(models.Model):
    """
    Representa un trabajador/beneficiario.
    - rut: string sin formatear (ej: 12345678-9)
    - nombre: nombre completo
    - beneficio_disponible: texto o JSON con info del beneficio
    """
    rut = models.CharField(max_length=12, unique=True, db_index=True)
    nombre = models.CharField(max_length=200)
    beneficio_disponible = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['rut'], name='trabajador_rut_idx'),
        ]
        verbose_name = 'Trabajador'
        verbose_name_plural = 'Trabajadores'

    def __str__(self):
        return f"{self.nombre} ({self.rut})"


class StockSucursal(models.Model):
    """
    Stock disponible por sucursal para el beneficio/tótem.
    """
    sucursal = models.CharField(max_length=100)
    producto = models.CharField(max_length=100)
    cantidad = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.sucursal} - {self.producto}: {self.cantidad}"


class StockMovimiento(models.Model):
    """Registro de movimientos de stock por sucursal y tipo de caja.
    Usado por GuardiaModule para auditoría y reportes.
    """
    ACCIONES = (
        ('agregar', 'Agregado'),
        ('retirar', 'Retirado'),
    )
    TIPO_CAJA = (
        ('Estándar', 'Estándar'),
        ('Premium', 'Premium'),
    )

    fecha = models.DateField(auto_now_add=True)
    hora = models.TimeField(auto_now_add=True)
    tipo_caja = models.CharField(max_length=20, choices=TIPO_CAJA)
    accion = models.CharField(max_length=10, choices=ACCIONES)
    cantidad = models.PositiveIntegerField()
    motivo = models.CharField(max_length=200, blank=True)
    usuario = models.CharField(max_length=80, blank=True)
    sucursal = models.ForeignKey('Sucursal', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-fecha', '-hora']
        indexes = [
            models.Index(fields=['fecha'], name='stockmov_fecha_idx'),
            models.Index(fields=['tipo_caja'], name='stockmov_tipo_idx'),
            models.Index(fields=['accion'], name='stockmov_accion_idx'),
        ]

    def __str__(self):
        return f"{self.fecha} {self.hora} - {self.accion} {self.cantidad} {self.tipo_caja}"


class Ticket(models.Model):
    """
    Ticket generado cuando un trabajador utiliza el tótem.
    - trabajador: FK
    - uuid: id único legible
    - qr_image: path a imagen QR (MEDIA_ROOT)
    - data: info extra (sucursal, producto, valor, etc.)
    - created_at: timestamp
    """
    trabajador = models.ForeignKey(Trabajador, on_delete=models.CASCADE)
    uuid = models.CharField(max_length=64, unique=True)
    qr_image = models.ImageField(upload_to='tickets/', blank=True, null=True)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    # Estado operacional del ticket (para control en guardia)
    ESTADOS = (
        ('pendiente', 'Pendiente'),
        ('entregado', 'Entregado'),
        ('anulado', 'Anulado'),
        ('expirado', 'Expirado'),
    )
    estado = models.CharField(max_length=12, choices=ESTADOS, default='pendiente')
    ttl_expira_at = models.DateTimeField(blank=True, null=True, help_text="Fecha/hora de expiración TTL del QR")

    ciclo = models.ForeignKey('Ciclo', on_delete=models.SET_NULL, null=True, blank=True)
    sucursal = models.ForeignKey('Sucursal', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['uuid'], name='ticket_uuid_idx'),
            models.Index(fields=['estado', 'created_at'], name='ticket_est_fecha_idx'),
            models.Index(fields=['trabajador', 'ciclo', 'estado'], name='ticket_trab_ciclo_idx'),
            models.Index(fields=['ttl_expira_at'], name='ticket_ttl_idx'),
            models.Index(fields=['created_at'], name='ticket_created_idx'),
        ]
        verbose_name = 'Ticket'
        verbose_name_plural = 'Tickets'
        ordering = ['-created_at']

    def __str__(self):
        return f"Ticket {self.uuid} - {self.trabajador.rut}"


class Sucursal(models.Model):
    nombre = models.CharField(max_length=120)
    codigo = models.CharField(max_length=30, unique=True)

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class Ciclo(models.Model):
    """Representa un ciclo bimensual de beneficios."""
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"Ciclo {self.id} ({self.fecha_inicio} -> {self.fecha_fin})"

    @property
    def dias_restantes(self):
        return (self.fecha_fin - timezone.now().date()).days


class CajaFisica(models.Model):
    TIPOS = (
        ('premium', 'Premium'),
        ('estandar', 'Estándar'),
    )
    codigo = models.CharField(max_length=60, unique=True)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE)
    usado = models.BooleanField(default=False)
    asignada_ticket = models.ForeignKey(Ticket, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Caja {self.codigo} ({self.tipo})"


class Agendamiento(models.Model):
    ESTADOS = (
        ('pendiente', 'Pendiente'),
        ('efectuado', 'Efectuado'),
        ('vencido', 'Vencido'),
        ('cancelado', 'Cancelado'),
    )
    trabajador = models.ForeignKey(Trabajador, on_delete=models.CASCADE)
    ciclo = models.ForeignKey(Ciclo, on_delete=models.CASCADE)
    fecha_retiro = models.DateField(db_index=True)
    estado = models.CharField(max_length=12, choices=ESTADOS, default='pendiente', db_index=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=['trabajador', 'estado', 'ciclo'], name='agend_trab_est_idx'),
            models.Index(fields=['fecha_retiro', 'estado'], name='agend_fecha_est_idx'),
            models.Index(fields=['estado', 'fecha_retiro'], name='agend_est_fecha_idx'),
        ]
        verbose_name = 'Agendamiento'
        verbose_name_plural = 'Agendamientos'
        ordering = ['-created_at']

    def __str__(self):
        return f"Agendamiento {self.trabajador.rut} {self.fecha_retiro} ({self.estado})"


class Incidencia(models.Model):
    ESTADOS = (
        ('pendiente', 'Pendiente'),
        ('en_progreso', 'En Progreso'),
        ('resuelta', 'Resuelta'),
        ('rechazada', 'Rechazada'),
    )
    codigo = models.CharField(max_length=64, unique=True, db_index=True)
    trabajador = models.ForeignKey(Trabajador, on_delete=models.SET_NULL, null=True, blank=True)
    tipo = models.CharField(max_length=60, db_index=True)
    descripcion = models.TextField(blank=True)
    estado = models.CharField(max_length=15, choices=ESTADOS, default='pendiente', db_index=True)
    creada_por = models.CharField(max_length=40, help_text="Origen: totem, guardia, rrhh")
    created_at = models.DateTimeField(default=timezone.now)
    resolved_at = models.DateTimeField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['estado', 'created_at'], name='incid_est_fecha_idx'),
            models.Index(fields=['tipo', 'estado'], name='incid_tipo_est_idx'),
            models.Index(fields=['codigo'], name='incid_codigo_idx'),
            models.Index(fields=['trabajador', 'estado'], name='incid_trab_est_idx'),
        ]
        verbose_name = 'Incidencia'
        verbose_name_plural = 'Incidencias'
        ordering = ['-created_at']

    def __str__(self):
        return f"Incidencia {self.codigo} ({self.estado})"


class TicketEvent(models.Model):
    TIPOS = (
        ('generado', 'Generado'),
        ('validado_guardia', 'Validado Guardia'),
        ('caja_verificada', 'Caja Verificada'),
        ('entregado', 'Entregado'),
        ('reimpreso', 'Reimpreso'),
        ('anulado', 'Anulado'),
        ('expirado', 'Expirado'),
        ('intento_duplicado', 'Intento Duplicado'),
        ('incidencia_reportada', 'Incidencia Reportada'),
    )
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='eventos')
    tipo = models.CharField(max_length=30, choices=TIPOS)
    timestamp = models.DateTimeField(default=timezone.now)
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Evento {self.tipo} {self.ticket.uuid}"


class ParametroOperativo(models.Model):
    """Parámetros globales configurables (TTL QR, duración ciclo por defecto, umbral stock, etc.)."""
    clave = models.CharField(max_length=60, unique=True)
    valor = models.CharField(max_length=120)
    descripcion = models.CharField(max_length=200, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Parametro {self.clave}={self.valor}"


class NominaCarga(models.Model):
    """Auditoría de cada carga de nómina, para métricas históricas por ciclo."""
    ciclo = models.ForeignKey(
        "Ciclo",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="nomina_cargas",
    )
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="nomina_cargas",
    )
    archivo_nombre = models.CharField(max_length=255, blank=True)
    total_registros = models.PositiveIntegerField(default=0)
    creados = models.PositiveIntegerField(default=0)
    actualizados = models.PositiveIntegerField(default=0)
    sin_beneficio = models.PositiveIntegerField(default=0)
    observaciones = models.TextField(blank=True)
    fecha_carga = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha_carga", "-id"]
        indexes = [
            models.Index(fields=["fecha_carga"]),
            models.Index(fields=["ciclo"]),
        ]

    def __str__(self):
        return f"Carga nomina {self.id} ({self.archivo_nombre})"
