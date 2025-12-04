# -*- coding: utf-8 -*-
"""
Servicio de lógica de negocio para Trabajadores.
Consolida operaciones CRUD, validaciones y queries complejas.
"""
import structlog
from django.db import transaction
from django.db.models import Q, Count, Prefetch
from ..models import Trabajador, Ticket, Incidencia, Agendamiento, TicketEvent
from ..utils_rut import clean_rut, valid_rut

logger = structlog.get_logger(__name__)


class TrabajadorService:
    """
    Servicio para gestión de trabajadores.
    Encapsula validaciones, búsquedas y operaciones de negocio.
    """

    @staticmethod
    def buscar_trabajadores(query=None, rut=None, seccion=None, limit=500):
        """
        Búsqueda flexible de trabajadores con múltiples filtros.
        
        Args:
            query (str): Búsqueda por nombre o RUT
            rut (str): Filtro exacto por RUT
            seccion (str): Filtro por sección
            limit (int): Máximo de resultados (default 500)
        
        Returns:
            QuerySet: Trabajadores que coinciden con los filtros
        """
        logger.info("buscar_trabajadores", query=query, rut=rut, seccion=seccion)
        
        qs = Trabajador.objects.all().order_by('nombre')
        
        if rut:
            rut_clean = clean_rut(rut)
            qs = qs.filter(rut__iexact=rut_clean)
        
        if query:
            qs = qs.filter(Q(nombre__icontains=query) | Q(rut__icontains=query))
        
        if seccion:
            qs = qs.filter(seccion__icontains=seccion)
        
        return qs[:limit]

    @staticmethod
    def validar_datos_trabajador(rut, nombre, beneficio=None):
        """
        Valida datos de trabajador antes de crear/actualizar.
        
        Args:
            rut (str): RUT del trabajador
            nombre (str): Nombre completo
            beneficio (dict): Beneficio disponible (opcional)
        
        Returns:
            tuple: (valid: bool, error_message: str or None)
        """
        rut_clean = clean_rut(rut)
        
        if not rut_clean:
            return False, "RUT requerido"
        
        if not valid_rut(rut_clean):
            return False, "RUT inválido (dígito verificador incorrecto)"
        
        if not nombre or len(nombre.strip()) < 3:
            return False, "Nombre debe tener al menos 3 caracteres"
        
        if beneficio and not isinstance(beneficio, dict):
            return False, "Beneficio debe ser un objeto JSON válido"
        
        return True, None

    @staticmethod
    @transaction.atomic
    def crear_trabajador(rut, nombre, seccion=None, contrato=None, sucursal=None, beneficio_disponible=None):
        """
        Crea un nuevo trabajador con validaciones completas.
        
        Args:
            rut (str): RUT único del trabajador
            nombre (str): Nombre completo
            seccion (str): Sección de trabajo (opcional)
            contrato (str): Tipo de contrato (opcional)
            sucursal (str): Sucursal asignada (opcional)
            beneficio_disponible (dict): Beneficio inicial (opcional)
        
        Returns:
            tuple: (trabajador: Trabajador or None, error: str or None)
        """
        logger.info("crear_trabajador", rut=rut, nombre=nombre)
        
        rut_clean = clean_rut(rut)
        
        # Validar datos
        valid, error = TrabajadorService.validar_datos_trabajador(rut_clean, nombre, beneficio_disponible)
        if not valid:
            logger.warning("validacion_fallida", error=error)
            return None, error
        
        # Verificar unicidad
        if Trabajador.objects.filter(rut__iexact=rut_clean).exists():
            logger.warning("trabajador_duplicado", rut=rut_clean)
            return None, "Ya existe un trabajador con este RUT"
        
        # Crear trabajador
        trabajador = Trabajador.objects.create(
            rut=rut_clean,
            nombre=nombre.strip(),
            seccion=seccion,
            contrato=contrato,
            sucursal=sucursal,
            beneficio_disponible=beneficio_disponible or {}
        )
        
        logger.info("trabajador_creado", trabajador_id=trabajador.id, rut=rut_clean)
        return trabajador, None

    @staticmethod
    def obtener_trabajador_por_rut(rut):
        """
        Obtiene trabajador por RUT (case-insensitive).
        
        Args:
            rut (str): RUT del trabajador
        
        Returns:
            Trabajador or None: Trabajador encontrado o None
        """
        rut_clean = clean_rut(rut)
        try:
            return Trabajador.objects.get(rut__iexact=rut_clean)
        except Trabajador.DoesNotExist:
            logger.warning("trabajador_no_encontrado", rut=rut_clean)
            return None

    @staticmethod
    @transaction.atomic
    def actualizar_trabajador(trabajador, nombre=None, seccion=None, contrato=None, sucursal=None, beneficio_disponible=None):
        """
        Actualiza datos de un trabajador existente.
        
        Args:
            trabajador (Trabajador): Instancia a actualizar
            nombre (str): Nuevo nombre (opcional)
            seccion (str): Nueva sección (opcional)
            contrato (str): Nuevo contrato (opcional)
            sucursal (str): Nueva sucursal (opcional)
            beneficio_disponible (dict): Nuevo beneficio (opcional)
        
        Returns:
            Trabajador: Trabajador actualizado
        """
        logger.info("actualizar_trabajador", trabajador_id=trabajador.id)
        
        if nombre:
            trabajador.nombre = nombre.strip()
        if seccion is not None:
            trabajador.seccion = seccion
        if contrato is not None:
            trabajador.contrato = contrato
        if sucursal is not None:
            trabajador.sucursal = sucursal
        if beneficio_disponible is not None:
            trabajador.beneficio_disponible = beneficio_disponible
        
        trabajador.save()
        logger.info("trabajador_actualizado", trabajador_id=trabajador.id)
        return trabajador

    @staticmethod
    @transaction.atomic
    def bloquear_trabajador(trabajador, motivo="Bloqueado por RRHH"):
        """
        Bloquea el acceso de un trabajador a beneficios.
        
        Args:
            trabajador (Trabajador): Instancia a bloquear
            motivo (str): Razón del bloqueo
        
        Returns:
            Trabajador: Trabajador bloqueado
        """
        logger.info("bloquear_trabajador", trabajador_id=trabajador.id, motivo=motivo)
        
        bd = trabajador.beneficio_disponible or {}
        # Guardar el tipo original antes de bloquear
        if bd.get('tipo') != 'BLOQUEADO':
            bd['tipo_original'] = bd.get('tipo', 'SIN_BENEFICIO')
        bd['tipo'] = 'BLOQUEADO'
        bd['activo'] = False
        bd['motivo'] = motivo
        bd['bloqueado_at'] = timezone.now().isoformat()
        
        trabajador.beneficio_disponible = bd
        trabajador.save()
        
        logger.info("trabajador_bloqueado", trabajador_id=trabajador.id)
        return trabajador

    @staticmethod
    @transaction.atomic
    def desbloquear_trabajador(trabajador):
        """
        Desbloquea un trabajador previamente bloqueado.
        
        Args:
            trabajador (Trabajador): Instancia a desbloquear
        
        Returns:
            Trabajador: Trabajador desbloqueado
        """
        logger.info("desbloquear_trabajador", trabajador_id=trabajador.id)
        
        bd = trabajador.beneficio_disponible or {}
        if bd.get('tipo') == 'BLOQUEADO':
            # Restaurar el tipo original si existe, sino dejar SIN_BENEFICIO
            tipo_original = bd.pop('tipo_original', 'SIN_BENEFICIO')
            bd['tipo'] = tipo_original
            # Si tiene ciclo_id, significa que tiene beneficio asignado, activarlo
            if bd.get('ciclo_id'):
                bd['activo'] = True
            bd.pop('motivo', None)
            bd.pop('bloqueado_at', None)
        
        trabajador.beneficio_disponible = bd
        trabajador.save()
        
        logger.info("trabajador_desbloqueado", trabajador_id=trabajador.id)
        return trabajador

    @staticmethod
    def obtener_timeline(trabajador, limit=100):
        """
        Genera línea de tiempo de actividad del trabajador.
        Consolida tickets, incidencias y agendamientos.
        
        Args:
            trabajador (Trabajador): Instancia del trabajador
            limit (int): Máximo de eventos por tipo
        
        Returns:
            dict: Timeline con eventos ordenados cronológicamente
        """
        logger.info("obtener_timeline", trabajador_id=trabajador.id)
        
        eventos = []
        
        # Tickets y sus eventos
        tickets = Ticket.objects.filter(trabajador=trabajador).prefetch_related('eventos').order_by('-created_at')[:limit]
        for ticket in tickets:
            for evento in ticket.eventos.all().order_by('timestamp'):
                eventos.append({
                    'tipo': f'ticket:{evento.tipo}',
                    'fecha': evento.timestamp.isoformat(),
                    'metadata': evento.metadata,
                    'ticket': ticket.uuid
                })
        
        # Incidencias
        incidencias = Incidencia.objects.filter(trabajador=trabajador).order_by('-created_at')[:limit]
        for inc in incidencias:
            eventos.append({
                'tipo': 'incidencia',
                'fecha': inc.created_at.isoformat(),
                'metadata': {
                    'codigo': inc.codigo,
                    'estado': inc.estado,
                    'tipo': inc.tipo
                }
            })
        
        # Agendamientos
        agendamientos = Agendamiento.objects.filter(trabajador=trabajador).order_by('-created_at')[:limit]
        for ag in agendamientos:
            eventos.append({
                'tipo': 'agendamiento',
                'fecha': ag.created_at.isoformat(),
                'metadata': {
                    'fecha_retiro': ag.fecha_retiro.isoformat() if ag.fecha_retiro else None,
                    'estado': ag.estado
                }
            })
        
        # Ordenar por fecha (más recientes primero)
        eventos.sort(key=lambda x: x['fecha'], reverse=True)
        
        return {
            'rut': trabajador.rut,
            'nombre': trabajador.nombre,
            'eventos': eventos
        }

    @staticmethod
    def estadisticas_trabajador(trabajador):
        """
        Obtiene estadísticas de actividad del trabajador.
        
        Args:
            trabajador (Trabajador): Instancia del trabajador
        
        Returns:
            dict: Estadísticas consolidadas
        """
        tickets = Ticket.objects.filter(trabajador=trabajador)
        
        return {
            'total_tickets': tickets.count(),
            'tickets_entregados': tickets.filter(estado='entregado').count(),
            'tickets_pendientes': tickets.filter(estado='pendiente').count(),
            'tickets_expirados': tickets.filter(estado='expirado').count(),
            'total_incidencias': Incidencia.objects.filter(trabajador=trabajador).count(),
            'incidencias_abiertas': Incidencia.objects.filter(trabajador=trabajador, estado='abierta').count(),
            'total_agendamientos': Agendamiento.objects.filter(trabajador=trabajador).count(),
        }
