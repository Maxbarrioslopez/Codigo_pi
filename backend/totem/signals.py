# -*- coding: utf-8 -*-
"""
Signals para eventos automáticos del sistema.
Maneja notificaciones, auditoría y side-effects de operaciones.
"""
from django.db.models.signals import post_save, pre_save, post_delete, pre_delete
from django.dispatch import receiver, Signal
from django.utils import timezone
import structlog
from .models import Ticket, Trabajador, Ciclo, Incidencia, Agendamiento, StockMovimiento, NominaCarga

logger = structlog.get_logger(__name__)

# Signals personalizados
ticket_creado = Signal()
ticket_validado = Signal()
ticket_expirado = Signal()
ticket_anulado = Signal()

incidencia_creada = Signal()
incidencia_resuelta = Signal()

agendamiento_creado = Signal()
agendamiento_vencido = Signal()

stock_bajo = Signal()
ciclo_cerrado = Signal()


# === TICKET SIGNALS ===

@receiver(post_save, sender=Ticket)
def ticket_post_save_handler(sender, instance, created, **kwargs):
    """
    Post-save signal para Ticket.
    Registra eventos y ejecuta lógica post-creación.
    """
    if created:
        logger.info(
            "ticket_creado_signal",
            ticket_uuid=instance.uuid,
            trabajador_rut=instance.trabajador.rut,
            ciclo_id=instance.ciclo_id
        )
        
        # Emitir signal personalizado para otras apps
        ticket_creado.send(sender=Ticket, instance=instance)
        
        # TODO: Enviar notificación al trabajador (email, SMS, push)
        # from .notifications import enviar_notificacion_ticket_creado
        # enviar_notificacion_ticket_creado(instance)


@receiver(pre_delete, sender=Ticket)
def ticket_pre_delete_handler(sender, instance, **kwargs):
    """
    Pre-delete signal para Ticket.
    Registra auditoría antes de eliminar.
    """
    logger.warning(
        "ticket_eliminado",
        ticket_uuid=instance.uuid,
        trabajador_rut=instance.trabajador.rut,
        estado=instance.estado
    )


# === TRABAJADOR SIGNALS ===

@receiver(post_save, sender=Trabajador)
def trabajador_post_save_handler(sender, instance, created, **kwargs):
    """
    Post-save signal para Trabajador.
    Detecta cambios en beneficio y estado.
    """
    if created:
        logger.info(
            "trabajador_creado",
            rut=instance.rut,
            nombre=instance.nombre
        )
    else:
        # Detectar si fue bloqueado
        if instance.beneficio_disponible.get('tipo') == 'BLOQUEADO':
            logger.warning(
                "trabajador_bloqueado",
                rut=instance.rut,
                motivo=instance.beneficio_disponible.get('motivo', 'No especificado')
            )
            # TODO: Notificar al trabajador y a RRHH


@receiver(pre_save, sender=Trabajador)
def trabajador_pre_save_handler(sender, instance, **kwargs):
    """
    Pre-save signal para Trabajador.
    Valida cambios antes de guardar.
    """
    if instance.pk:
        try:
            old_instance = Trabajador.objects.get(pk=instance.pk)
            
            # Detectar cambio en beneficio
            old_beneficio = old_instance.beneficio_disponible or {}
            new_beneficio = instance.beneficio_disponible or {}
            
            if old_beneficio.get('tipo') != new_beneficio.get('tipo'):
                logger.info(
                    "cambio_beneficio_trabajador",
                    rut=instance.rut,
                    beneficio_anterior=old_beneficio.get('tipo'),
                    beneficio_nuevo=new_beneficio.get('tipo')
                )
        except Trabajador.DoesNotExist:
            pass


# === CICLO SIGNALS ===

@receiver(post_save, sender=Ciclo)
def ciclo_post_save_handler(sender, instance, created, **kwargs):
    """
    Post-save signal para Ciclo.
    Desactiva otros ciclos al crear uno nuevo activo.
    """
    if created and instance.activo:
        # Desactivar otros ciclos activos
        otros_activos = Ciclo.objects.filter(activo=True).exclude(id=instance.id)
        if otros_activos.exists():
            count = otros_activos.update(activo=False)
            logger.info(
                "ciclos_desactivados_automaticamente",
                ciclo_nuevo_id=instance.id,
                ciclos_desactivados=count
            )
        
        logger.info(
            "ciclo_creado",
            ciclo_id=instance.id,
            fecha_inicio=instance.fecha_inicio.isoformat(),
            fecha_fin=instance.fecha_fin.isoformat()
        )


@receiver(pre_save, sender=Ciclo)
def ciclo_pre_save_handler(sender, instance, **kwargs):
    """
    Pre-save signal para Ciclo.
    Detecta cierre de ciclo.
    """
    if instance.pk:
        try:
            old_instance = Ciclo.objects.get(pk=instance.pk)
            
            # Detectar cierre de ciclo
            if old_instance.activo and not instance.activo:
                logger.info(
                    "ciclo_cerrado_signal",
                    ciclo_id=instance.id,
                    fecha_cierre=timezone.now().isoformat()
                )
                
                # Emitir signal personalizado
                ciclo_cerrado.send(sender=Ciclo, instance=instance)
                
                # TODO: Generar reporte automático del ciclo cerrado
                # from .tasks import generar_reporte_ciclo
                # generar_reporte_ciclo.delay(instance.id)
        except Ciclo.DoesNotExist:
            pass


# === INCIDENCIA SIGNALS ===

@receiver(post_save, sender=Incidencia)
def incidencia_post_save_handler(sender, instance, created, **kwargs):
    """
    Post-save signal para Incidencia.
    Notifica a RRHH sobre nuevas incidencias.
    """
    if created:
        logger.info(
            "incidencia_creada",
            codigo=instance.codigo,
            tipo=instance.tipo,
            trabajador_rut=instance.trabajador.rut if instance.trabajador else None
        )
        
        # Emitir signal personalizado
        incidencia_creada.send(sender=Incidencia, instance=instance)
        
        # TODO: Notificar a RRHH según severidad
        if instance.tipo in ['Falla', 'Queja']:
            logger.warning(
                "incidencia_critica_detectada",
                codigo=instance.codigo,
                tipo=instance.tipo
            )
            # from .notifications import notificar_rrhh_incidencia
            # notificar_rrhh_incidencia(instance)


@receiver(pre_save, sender=Incidencia)
def incidencia_pre_save_handler(sender, instance, **kwargs):
    """
    Pre-save signal para Incidencia.
    Detecta resolución de incidencia.
    """
    if instance.pk:
        try:
            old_instance = Incidencia.objects.get(pk=instance.pk)
            
            # Detectar resolución
            if old_instance.estado != 'resuelta' and instance.estado == 'resuelta':
                instance.fecha_resolucion = timezone.now()
                
                logger.info(
                    "incidencia_resuelta",
                    codigo=instance.codigo,
                    tiempo_resolucion=(instance.fecha_resolucion - instance.created_at).total_seconds()
                )
                
                # Emitir signal personalizado
                incidencia_resuelta.send(sender=Incidencia, instance=instance)
        except Incidencia.DoesNotExist:
            pass


# === AGENDAMIENTO SIGNALS ===

@receiver(post_save, sender=Agendamiento)
def agendamiento_post_save_handler(sender, instance, created, **kwargs):
    """
    Post-save signal para Agendamiento.
    Notifica al trabajador sobre su agendamiento.
    """
    if created:
        logger.info(
            "agendamiento_creado",
            agendamiento_id=instance.id,
            trabajador_rut=instance.trabajador.rut,
            fecha_retiro=instance.fecha_retiro.isoformat() if instance.fecha_retiro else None
        )
        
        # Emitir signal personalizado
        agendamiento_creado.send(sender=Agendamiento, instance=instance)
        
        # TODO: Enviar confirmación al trabajador
        # from .notifications import enviar_confirmacion_agendamiento
        # enviar_confirmacion_agendamiento(instance)


# === STOCK SIGNALS ===

@receiver(post_save, sender=StockMovimiento)
def stock_movimiento_post_save_handler(sender, instance, created, **kwargs):
    """
    Post-save signal para StockMovimiento.
    Detecta stock bajo y genera alertas.
    """
    if created:
        logger.info(
            "movimiento_stock_registrado",
            movimiento_id=instance.id,
            accion=instance.accion,
            cantidad=instance.cantidad,
            tipo_caja=instance.tipo_caja
        )
        
        # Verificar stock bajo después del movimiento
        if instance.accion == 'retirar' and instance.sucursal:
            from .models import StockSucursal
            
            try:
                stock = StockSucursal.objects.get(
                    sucursal=instance.sucursal,
                    producto__iexact=instance.tipo_caja
                )
                
                # Alert si stock bajo (menos de 10)
                if stock.cantidad <= 10:
                    logger.warning(
                        "stock_bajo_detectado",
                        sucursal=instance.sucursal.nombre,
                        producto=instance.tipo_caja,
                        cantidad=stock.cantidad
                    )
                    
                    # Emitir signal de stock bajo
                    stock_bajo.send(
                        sender=StockMovimiento,
                        sucursal=instance.sucursal,
                        producto=instance.tipo_caja,
                        cantidad=stock.cantidad
                    )
                    
                    # TODO: Notificar a administradores
                    # from .notifications import notificar_stock_bajo
                    # notificar_stock_bajo(instance.sucursal, instance.tipo_caja, stock.cantidad)
            except StockSucursal.DoesNotExist:
                pass


# === NOMINA SIGNALS ===

@receiver(post_save, sender=NominaCarga)
def nomina_carga_post_save_handler(sender, instance, created, **kwargs):
    """
    Post-save signal para NominaCarga.
    Registra carga de nómina para auditoría.
    """
    if created:
        logger.info(
            "nomina_cargada",
            carga_id=instance.id,
            archivo=instance.archivo_nombre,
            trabajadores_creados=instance.trabajadores_creados,
            trabajadores_actualizados=instance.trabajadores_actualizados,
            errores=instance.errores_count,
            usuario=instance.usuario.username if instance.usuario else None
        )
        
        # Alertar si hubo muchos errores
        if instance.errores_count > instance.total_registros * 0.1:  # Más del 10% con errores
            logger.warning(
                "nomina_con_muchos_errores",
                carga_id=instance.id,
                porcentaje_errores=(instance.errores_count / instance.total_registros * 100) if instance.total_registros > 0 else 0
            )
            # TODO: Notificar a RRHH
