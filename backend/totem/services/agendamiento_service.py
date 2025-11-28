"""
Servicio de lógica de negocio para Agendamientos.
"""
import logging
from datetime import date
from typing import List, Dict

from django.db import transaction
from django.utils import timezone

from totem.models import Agendamiento, Trabajador, Ciclo
from totem.validators import AgendamientoValidator, RUTValidator
from totem.exceptions import (
    TrabajadorNotFoundException,
    AgendamientoInvalidException,
    CupoExcedidoException
)

logger = logging.getLogger(__name__)


class AgendamientoService:
    """
    Servicio para gestión de agendamientos.
    """
    
    @transaction.atomic
    def crear_agendamiento(
        self,
        trabajador_rut: str,
        fecha_retiro: date,
        ciclo_id: int = None
    ) -> Agendamiento:
        """
        Crea un agendamiento para retiro futuro.
        
        Args:
            trabajador_rut: RUT del trabajador
            fecha_retiro: Fecha programada para retiro
            ciclo_id: ID del ciclo (opcional)
            
        Returns:
            Agendamiento creado
            
        Raises:
            TrabajadorNotFoundException: Si el trabajador no existe
            AgendamientoInvalidException: Si la fecha no es válida
            CupoExcedidoException: Si no hay cupos
        """
        logger.info(f"Creando agendamiento para {trabajador_rut} en fecha {fecha_retiro}")
        
        # Validar RUT
        rut_limpio = RUTValidator.limpiar_rut(trabajador_rut)
        es_valido, error = RUTValidator.validar_formato(rut_limpio)
        if not es_valido:
            raise TrabajadorNotFoundException(error)
        
        # Obtener trabajador
        try:
            trabajador = Trabajador.objects.get(rut=rut_limpio)
        except Trabajador.DoesNotExist:
            raise TrabajadorNotFoundException()
        
        # Validar fecha
        es_valida, error = AgendamientoValidator.validar_fecha_retiro(fecha_retiro)
        if not es_valida:
            raise AgendamientoInvalidException(error)
        
        # Validar cupo disponible
        hay_cupo, error = AgendamientoValidator.validar_cupo_disponible(fecha_retiro)
        if not hay_cupo:
            raise CupoExcedidoException(error)
        
        # Validar duplicados
        es_valido, error = AgendamientoValidator.validar_agendamiento_duplicado(rut_limpio, ciclo_id)
        if not es_valido:
            raise AgendamientoInvalidException(error)
        
        # Obtener ciclo
        if not ciclo_id:
            ciclo = Ciclo.objects.filter(activo=True).first()
            if not ciclo:
                raise AgendamientoInvalidException("No hay ciclo activo")
        else:
            ciclo = Ciclo.objects.get(id=ciclo_id)
        
        # Crear agendamiento
        agendamiento = Agendamiento.objects.create(
            trabajador=trabajador,
            ciclo=ciclo,
            fecha_retiro=fecha_retiro,
            estado='pendiente'
        )
        
        logger.info(f"Agendamiento {agendamiento.id} creado para {rut_limpio} en {fecha_retiro}")
        return agendamiento
    
    def listar_agendamientos_trabajador(self, trabajador_rut: str) -> List[Agendamiento]:
        """
        Lista agendamientos de un trabajador.
        
        Args:
            trabajador_rut: RUT del trabajador
            
        Returns:
            Lista de agendamientos
        """
        rut_limpio = RUTValidator.limpiar_rut(trabajador_rut)
        return list(
            Agendamiento.objects.filter(trabajador__rut=rut_limpio)
            .select_related('trabajador', 'ciclo')
            .order_by('-created_at')
        )
    
    def cancelar_agendamiento(self, agendamiento_id: int) -> Agendamiento:
        """
        Cancela un agendamiento pendiente.
        
        Args:
            agendamiento_id: ID del agendamiento
            
        Returns:
            Agendamiento cancelado
        """
        try:
            agendamiento = Agendamiento.objects.get(id=agendamiento_id)
        except Agendamiento.DoesNotExist:
            raise AgendamientoInvalidException("Agendamiento no encontrado")
        
        if agendamiento.estado != 'pendiente':
            raise AgendamientoInvalidException("Solo se pueden cancelar agendamientos pendientes")
        
        agendamiento.estado = 'cancelado'
        agendamiento.save()
        
        logger.info(f"Agendamiento {agendamiento_id} cancelado")
        return agendamiento
    
    def marcar_efectuado(self, agendamiento_id: int) -> Agendamiento:
        """
        Marca un agendamiento como efectuado (cuando se retira).
        
        Args:
            agendamiento_id: ID del agendamiento
            
        Returns:
            Agendamiento actualizado
        """
        try:
            agendamiento = Agendamiento.objects.get(id=agendamiento_id)
        except Agendamiento.DoesNotExist:
            raise AgendamientoInvalidException("Agendamiento no encontrado")
        
        agendamiento.estado = 'efectuado'
        agendamiento.save()
        
        logger.info(f"Agendamiento {agendamiento_id} marcado como efectuado")
        return agendamiento
    
    def marcar_vencidos(self) -> int:
        """
        Marca como vencidos los agendamientos pendientes con fecha pasada.
        
        Returns:
            Cantidad de agendamientos marcados como vencidos
        """
        hoy = timezone.now().date()
        agendamientos_vencidos = Agendamiento.objects.filter(
            estado='pendiente',
            fecha_retiro__lt=hoy
        )
        
        cantidad = agendamientos_vencidos.count()
        agendamientos_vencidos.update(estado='vencido')
        
        logger.info(f"{cantidad} agendamientos marcados como vencidos")
        return cantidad
    
    def obtener_estadisticas_fecha(self, fecha: date) -> Dict:
        """
        Obtiene estadísticas de agendamientos para una fecha.
        
        Args:
            fecha: Fecha a consultar
            
        Returns:
            Diccionario con estadísticas
        """
        from django.conf import settings
        
        total = Agendamiento.objects.filter(
            fecha_retiro=fecha,
            estado='pendiente'
        ).count()
        
        max_cupo = settings.MAX_AGENDAMIENTOS_PER_DAY
        disponibles = max(0, max_cupo - total)
        
        return {
            'fecha': fecha,
            'total_agendados': total,
            'cupos_disponibles': disponibles,
            'cupo_maximo': max_cupo,
            'porcentaje_ocupacion': round((total / max_cupo) * 100, 2) if max_cupo > 0 else 0
        }
