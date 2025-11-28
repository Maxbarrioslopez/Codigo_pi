"""
Validadores de reglas de negocio.
"""
import logging
from datetime import date, datetime
from django.conf import settings
from django.utils import timezone
from typing import Tuple

logger = logging.getLogger(__name__)


class AgendamientoValidator:
    """
    Validador de reglas para agendamientos.
    """
    
    @staticmethod
    def validar_fecha_retiro(fecha_retiro: date) -> Tuple[bool, str]:
        """
        Valida que la fecha de retiro cumpla todas las reglas.
        
        Returns:
            Tupla (es_valida, mensaje_error)
        """
        hoy = timezone.now().date()
        
        # No puede ser fecha pasada
        if fecha_retiro < hoy:
            return False, "No puedes agendar en una fecha pasada"
        
        # No puede ser mismo día (para eso está el retiro inmediato)
        if fecha_retiro == hoy:
            return False, "Para retiro hoy usa la opción de retiro inmediato"
        
        # No puede ser fin de semana (sábado=5, domingo=6)
        if fecha_retiro.weekday() >= 5:
            return False, "No se puede agendar en fin de semana"
        
        # No puede ser más de 30 días en el futuro
        dias_diferencia = (fecha_retiro - hoy).days
        if dias_diferencia > 30:
            return False, "No puedes agendar con más de 30 días de anticipación"
        
        return True, ""
    
    @staticmethod
    def validar_cupo_disponible(fecha_retiro: date, sucursal_id: int = None) -> Tuple[bool, str]:
        """
        Valida que haya cupos disponibles para la fecha.
        
        Args:
            fecha_retiro: Fecha a validar
            sucursal_id: ID de sucursal (opcional)
            
        Returns:
            Tupla (hay_cupo, mensaje_error)
        """
        from totem.models import Agendamiento
        
        filtros = {
            'fecha_retiro': fecha_retiro,
            'estado': 'pendiente'
        }
        if sucursal_id:
            filtros['ciclo__sucursal_id'] = sucursal_id
        
        cantidad_agendamientos = Agendamiento.objects.filter(**filtros).count()
        max_cupo = settings.MAX_AGENDAMIENTOS_PER_DAY
        
        if cantidad_agendamientos >= max_cupo:
            logger.warning(f"Sin cupos para fecha {fecha_retiro}: {cantidad_agendamientos}/{max_cupo}")
            return False, f"No hay cupos disponibles para ese día (máximo {max_cupo})"
        
        return True, ""
    
    @staticmethod
    def validar_agendamiento_duplicado(trabajador_rut: str, ciclo_id: int = None) -> Tuple[bool, str]:
        """
        Valida que el trabajador no tenga agendamientos activos duplicados.
        
        Returns:
            Tupla (es_valido, mensaje_error)
        """
        from totem.models import Agendamiento
        
        filtros = {
            'trabajador__rut': trabajador_rut,
            'estado': 'pendiente'
        }
        if ciclo_id:
            filtros['ciclo_id'] = ciclo_id
        
        cantidad = Agendamiento.objects.filter(**filtros).count()
        max_permitido = settings.MAX_AGENDAMIENTOS_PER_WORKER
        
        if cantidad >= max_permitido:
            logger.warning(f"Trabajador {trabajador_rut} ya tiene agendamiento activo")
            return False, "Ya tienes un agendamiento activo. Cancélalo antes de crear otro."
        
        return True, ""


class TicketValidator:
    """
    Validador de reglas para tickets.
    """
    
    @staticmethod
    def validar_ttl(ttl_expira_at: datetime) -> Tuple[bool, str]:
        """
        Valida que el ticket no haya expirado.
        
        Returns:
            Tupla (es_valido, mensaje_error)
        """
        if not ttl_expira_at:
            return False, "Ticket sin fecha de expiración"
        
        ahora = timezone.now()
        if ahora > ttl_expira_at:
            segundos_expirado = (ahora - ttl_expira_at).total_seconds()
            logger.info(f"Ticket expirado hace {segundos_expirado:.0f} segundos")
            return False, "El ticket ha expirado"
        
        return True, ""
    
    @staticmethod
    def validar_estado(ticket_estado: str, estados_permitidos: list) -> Tuple[bool, str]:
        """
        Valida que el ticket esté en un estado permitido.
        
        Args:
            ticket_estado: Estado actual del ticket
            estados_permitidos: Lista de estados válidos
            
        Returns:
            Tupla (es_valido, mensaje_error)
        """
        if ticket_estado not in estados_permitidos:
            return False, f"Ticket en estado '{ticket_estado}', se requiere: {', '.join(estados_permitidos)}"
        
        return True, ""
    
    @staticmethod
    def validar_unicidad_retiro(trabajador_rut: str, ciclo_id: int) -> Tuple[bool, str]:
        """
        Valida que el trabajador no haya retirado ya en este ciclo.
        
        Returns:
            Tupla (es_valido, mensaje_error)
        """
        from totem.models import Ticket
        
        tickets_entregados = Ticket.objects.filter(
            trabajador__rut=trabajador_rut,
            ciclo_id=ciclo_id,
            estado='entregado'
        ).count()
        
        if tickets_entregados > 0:
            logger.warning(f"Trabajador {trabajador_rut} ya tiene ticket entregado en ciclo {ciclo_id}")
            return False, "Ya has retirado tu beneficio en este ciclo"
        
        return True, ""


class RUTValidator:
    """
    Validador de RUT chileno.
    """
    
    @staticmethod
    def validar_formato(rut: str) -> Tuple[bool, str]:
        """
        Valida formato y dígito verificador de RUT.
        
        Args:
            rut: String con RUT (puede incluir puntos y guión)
            
        Returns:
            Tupla (es_valido, mensaje_error)
        """
        # Importar la utilidad existente
        from totem.utils_rut import validar_rut
        
        try:
            es_valido = validar_rut(rut)
            if not es_valido:
                return False, "RUT inválido"
            return True, ""
        except Exception as e:
            logger.error(f"Error validando RUT {rut}: {e}")
            return False, f"Error en validación de RUT: {str(e)}"
    
    @staticmethod
    def limpiar_rut(rut: str) -> str:
        """
        Limpia el RUT eliminando puntos y convirtiendo a formato estándar.
        
        Args:
            rut: RUT con o sin formato
            
        Returns:
            RUT limpio en formato XXXXXXXX-X
        """
        # Eliminar puntos y espacios
        rut = rut.replace('.', '').replace(' ', '').upper()
        
        # Si no tiene guión, agregarlo antes del último dígito
        if '-' not in rut:
            rut = f"{rut[:-1]}-{rut[-1]}"
        
        return rut
