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
    - contrato: tipo de contrato (indefinido, plazo_fijo, part_time, honorarios, externos)
    - sucursal: sucursal asignada (Casablanca, Valparaiso Planta BIF, Valparaiso Planta BIC)
    - beneficio_disponible: texto o JSON con info del beneficio
    """
    CONTRATO_CHOICES = [
        ('indefinido', 'Indefinido'),
        ('plazo_fijo', 'Plazo Fijo'),
        ('part_time', 'Part Time'),
        ('honorarios', 'Honorarios'),
        ('externos', 'Externos'),
    ]
    
    rut = models.CharField(max_length=12, unique=True, db_index=True)
    nombre = models.CharField(max_length=200)
    contrato = models.CharField(max_length=50, choices=CONTRATO_CHOICES, blank=True, null=True, default=None)
    sucursal = models.CharField(max_length=100, blank=True, null=True, default=None)
    beneficio_disponible = models.JSONField(default=dict, blank=True)
    seccion = models.CharField(max_length=120, blank=True, null=True, default=None)

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
    # Campos adicionales usados en tests avanzados
    tipo_caja = models.CharField(max_length=50, blank=True, null=True)
    cantidad_actual = models.IntegerField(default=0)
    cantidad_minima = models.IntegerField(default=0)

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

    def save(self, *args, **kwargs):
        # Generar UUID único si está vacío
        if not self.uuid:
            import uuid as _uuid
            self.uuid = str(_uuid.uuid4())
        # Calcular TTL por defecto (30 minutos) si falta
        if not self.ttl_expira_at:
            self.ttl_expira_at = timezone.now() + timezone.timedelta(minutes=30)
        super().save(*args, **kwargs)


class Sucursal(models.Model):
    nombre = models.CharField(max_length=120)
    codigo = models.CharField(max_length=30, unique=True)

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class TipoBeneficio(models.Model):
    """Tipos de beneficios disponibles en el sistema."""
    TIPO_CONTRATO_CHOICES = [
        ('todos', 'Todos los contratos'),
        ('indefinido', 'Indefinido'),
        ('plazo_fijo', 'Plazo Fijo'),
        ('part_time', 'Part Time'),
        ('honorarios', 'Honorarios'),
        ('externos', 'Externos'),
    ]
    
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    es_caja = models.BooleanField(
        default=False,
        help_text="Si es True, este beneficio es una caja física que requiere validación con guardia"
    )
    tipos_contrato = models.JSONField(
        default=list,
        blank=True,
        help_text="Lista de tipos de contrato que reciben este beneficio (ej: ['indefinido', 'plazo_fijo'])"
    )
    requiere_validacion_guardia = models.BooleanField(
        default=False,
        help_text="Si es True, el guardia debe verificar la entrega de este beneficio con QR. Si es False, es entrega normal sin validación."
    )
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = 'Tipo de Beneficio'
        verbose_name_plural = 'Tipos de Beneficios'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class Ciclo(models.Model):
    """Representa un ciclo bimensual de beneficios."""
    nombre = models.CharField(
        max_length=200,
        help_text="Nombre descriptivo del ciclo (ej: Navidad 2025, Verano 2026)",
        blank=True
    )
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    activo = models.BooleanField(default=True)
    beneficios_activos = models.ManyToManyField(
        TipoBeneficio,
        related_name='ciclos',
        blank=True,
        help_text="Beneficios disponibles en este ciclo"
    )
    descripcion = models.TextField(blank=True, help_text="Descripción o notas del ciclo")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Ciclo'
        verbose_name_plural = 'Ciclos'
        ordering = ['-fecha_inicio']

    def __str__(self):
        if self.nombre:
            return f"{self.nombre} ({self.fecha_inicio} → {self.fecha_fin})"
        return f"Ciclo {self.id} ({self.fecha_inicio} → {self.fecha_fin})"

    @property
    def dias_restantes(self):
        return (self.fecha_fin - timezone.now().date()).days
    
    @property
    def duracion_dias(self):
        return (self.fecha_fin - self.fecha_inicio).days
    
    @property
    def progreso_porcentaje(self):
        if self.fecha_fin < timezone.now().date():
            return 100
        duracion = self.duracion_dias
        transcurrido = (timezone.now().date() - self.fecha_inicio).days
        return int((transcurrido / duracion) * 100) if duracion > 0 else 0


class CajaBeneficio(models.Model):
    """
    Define las cajas disponibles dentro de un tipo de beneficio.
    Ej: Beneficio "Caja de Navidad" puede tener cajas "Premium" y "Estándar"
    """
    beneficio = models.ForeignKey(TipoBeneficio, on_delete=models.CASCADE, related_name='cajas', null=True, blank=True)
    nombre = models.CharField(max_length=100, help_text="Nombre de la caja (ej: Premium, Estándar, Básica)")
    descripcion = models.TextField(blank=True)
    codigo_tipo = models.CharField(
        max_length=50,
        unique=True,
        help_text="Código único para identificar este tipo de caja (ej: CAJ-NAV-PREMIUM)"
    )
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = 'Caja de Beneficio'
        verbose_name_plural = 'Cajas de Beneficios'
    
    def __str__(self):
        return f"{self.beneficio.nombre} - {self.nombre}"


class BeneficioTrabajador(models.Model):
    """
    Relación entre un trabajador, ciclo y beneficio asignado.
    Permite asignar beneficios específicos a trabajadores en un ciclo.
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('validado', 'Validado'),
        ('retirado', 'Retirado'),
        ('cancelado', 'Cancelado'),
    ]
    
    trabajador = models.ForeignKey(Trabajador, on_delete=models.CASCADE, related_name='beneficios')
    ciclo = models.ForeignKey(Ciclo, on_delete=models.CASCADE, related_name='beneficios_asignados')
    tipo_beneficio = models.ForeignKey(TipoBeneficio, on_delete=models.CASCADE)
    caja_beneficio = models.ForeignKey(CajaBeneficio, on_delete=models.SET_NULL, null=True, blank=True)
    
    # QR/Código de verificación único para este beneficio
    codigo_verificacion = models.CharField(max_length=100, unique=True, db_index=True)
    qr_data = models.TextField(blank=True, help_text="Datos del QR generado")
    
    # HMAC Security: payload y firma persistidas para validación segura
    qr_payload = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Payload del QR serializado (JSON: beneficio_id, trabajador_rut, timestamp, tipo_beneficio)"
    )
    qr_signature = models.CharField(
        max_length=64,
        blank=True,
        help_text="Firma HMAC-SHA256 del payload (hex encoded, 64 caracteres)"
    )
    
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    bloqueado = models.BooleanField(default=False, help_text="Si está bloqueado, no puede retirar")
    motivo_bloqueo = models.TextField(blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Beneficio Trabajador'
        verbose_name_plural = 'Beneficios Trabajadores'
        unique_together = ('trabajador', 'ciclo', 'tipo_beneficio')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.trabajador.nombre} - {self.tipo_beneficio.nombre} ({self.ciclo})"
    
    @property
    def puede_retirarse(self):
        """
        Un beneficio puede retirarse solo si:
        - Estado es VALIDADO (no PENDIENTE)
        - No está bloqueado
        - El ciclo aún está activo (no expirado)
        """
        if self.estado != 'validado' or self.bloqueado:
            return False
        # Verificar que ciclo aún está activo
        if self.ciclo and not self.ciclo.activo:
            return False
        # Verificar que la fecha_fin del ciclo aún no ha pasado
        if self.ciclo and self.ciclo.fecha_fin < timezone.now().date():
            return False
        return True


class ValidacionCaja(models.Model):
    """
    Registro de validaciones realizadas por el guardia.
    Doble autenticación: QR/código + validación manual del guardia
    """
    RESULTADO_CHOICES = [
        ('exitoso', 'Exitoso'),
        ('rechazado', 'Rechazado'),
        ('error', 'Error'),
    ]
    
    beneficio_trabajador = models.ForeignKey(BeneficioTrabajador, on_delete=models.CASCADE, related_name='validaciones')
    guardia = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='validaciones_cajas')
    
    # Datos de validación
    codigo_escaneado = models.CharField(max_length=100, help_text="Código del QR/manual ingresado")
    resultado = models.CharField(max_length=20, choices=RESULTADO_CHOICES)
    
    # Validación de caja
    caja_validada = models.CharField(max_length=100, blank=True, help_text="Número/código de caja física entregada")
    caja_coincide = models.BooleanField(default=False, help_text="¿La caja coincide con la asignada?")
    
    # Notas
    notas = models.TextField(blank=True)
    
    # Timestamps
    fecha_validacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Validación de Caja'
        verbose_name_plural = 'Validaciones de Cajas'
        ordering = ['-fecha_validacion']
    
    def __str__(self):
        return f"Validación {self.beneficio_trabajador} - {self.resultado}"


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
