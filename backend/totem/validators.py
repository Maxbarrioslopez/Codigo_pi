"""
Validadores de reglas de negocio y sanitización de inputs.
Cumple con OWASP A03:2021 (Injection).
"""
import logging
import re
from datetime import date, datetime
from django.conf import settings
from django.utils import timezone
from typing import Tuple, Any

logger = logging.getLogger(__name__)


class InputSanitizer:
    """
    Sanitizador de inputs para prevenir inyecciones.
    """
    
    @staticmethod
    def sanitize_string(value: str, max_length: int = 255) -> str:
        """
        Sanitiza string eliminando HTML/scripts y limitando longitud.
        
        Args:
            value: String a sanitizar
            max_length: Longitud máxima permitida
            
        Returns:
            String sanitizado y seguro
        """
        if not value:
            return ""
        
        # Try to use bleach if available, otherwise use basic sanitization
        try:
            import bleach
            clean_value = bleach.clean(value, tags=[], strip=True)
        except ImportError:
            # Fallback: remove HTML tags manually
            clean_value = re.sub(r'<[^>]+>', '', value)
        
        # Eliminar caracteres de control excepto newline/tab
        clean_value = ''.join(char for char in clean_value if ord(char) >= 32 or char in '\n\t')
        
        # Limitar longitud
        clean_value = clean_value[:max_length]
        
        # Strip whitespace
        return clean_value.strip()
    
    @staticmethod
    def sanitize_rut(rut: str) -> str:
        """
        Sanitiza RUT permitiendo solo dígitos, K y guión.
        
        Args:
            rut: RUT a sanitizar
            
        Returns:
            RUT sanitizado
        """
        if not rut:
            return ""
        
        # Solo permitir: dígitos, K, k, guión, punto
        sanitized = re.sub(r'[^0-9Kk\-\.]', '', str(rut))
        
        # Normalizar: eliminar puntos, uppercase
        sanitized = sanitized.replace('.', '').upper()
        
        return sanitized
    
    @staticmethod
    def sanitize_email(email: str) -> str:
        """
        Sanitiza email básicamente.
        
        Args:
            email: Email a sanitizar
            
        Returns:
            Email sanitizado
        """
        if not email:
            return ""
        
        # Solo caracteres válidos en emails
        sanitized = re.sub(r'[^a-zA-Z0-9@._\-\+]', '', email.strip().lower())
        
        # Limitar longitud
        return sanitized[:254]  # RFC 5321
    
    @staticmethod
    def sanitize_phone(phone: str) -> str:
        """
        Sanitiza teléfono dejando solo dígitos y +.
        
        Args:
            phone: Teléfono a sanitizar
            
        Returns:
            Teléfono sanitizado
        """
        if not phone:
            return ""
        
        # Solo dígitos, +, espacios, guiones, paréntesis
        sanitized = re.sub(r'[^0-9\+\s\-\(\)]', '', phone)
        
        return sanitized.strip()[:20]
    
    @staticmethod
    def validate_mime_type(file, allowed_types: list) -> bool:
        """
        Valida MIME type de archivo subido.
        
        Args:
            file: Archivo Django UploadedFile
            allowed_types: Lista de MIME types permitidos
            
        Returns:
            True si es válido, False si no
        """
        if not file:
            return False
        
        # Verificar MIME type del archivo
        content_type = getattr(file, 'content_type', None)
        
        if content_type not in allowed_types:
            logger.warning(f"MIME type no permitido: {content_type}")
            return False
        
        return True


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
        from totem.utils_rut import valid_rut
        
        try:
            es_valido = valid_rut(rut)
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
            rut: String con RUT (ej: "12.345.678-9" o "123456789")
            
        Returns:
            RUT limpio en formato sin puntos con guión (ej: "12345678-9")
        """
        from totem.utils_rut import clean_rut
        return clean_rut(rut)


class CicloValidator:
    """
    Validador de reglas para ciclos bimensuales.
    """
    
    @staticmethod
    def validar_fechas(fecha_inicio: date, fecha_fin: date) -> Tuple[bool, str]:
        """
        Valida que las fechas del ciclo sean coherentes.
        
        Args:
            fecha_inicio: Fecha de inicio del ciclo
            fecha_fin: Fecha de fin del ciclo
            
        Returns:
            Tupla (es_valido, mensaje_error)
        """
        if not fecha_inicio or not fecha_fin:
            return False, "Fechas inicio y fin son requeridas"
        
        if fecha_fin <= fecha_inicio:
            return False, "Fecha fin debe ser posterior a fecha inicio"
        
        # Advertir si el ciclo es muy corto
        duracion = (fecha_fin - fecha_inicio).days
        if duracion < 7:
            logger.warning(f"Ciclo muy corto: {duracion} días")
        
        # Advertir si el ciclo es muy largo (más de 90 días)
        if duracion > 90:
            logger.warning(f"Ciclo muy largo: {duracion} días")
        
        return True, ""
    
    @staticmethod
    def validar_solapamiento(fecha_inicio: date, fecha_fin: date, excluir_id: int = None) -> Tuple[bool, str]:
        """
        Valida que no haya solapamiento con otros ciclos activos.
        
        Args:
            fecha_inicio: Fecha inicio del nuevo ciclo
            fecha_fin: Fecha fin del nuevo ciclo
            excluir_id: ID de ciclo a excluir (para updates)
            
        Returns:
            Tupla (es_valido, mensaje_error)
        """
        from totem.models import Ciclo
        from django.db.models import Q
        
        # Buscar ciclos que se solapen
        query = Q(
            Q(fecha_inicio__lte=fecha_fin, fecha_fin__gte=fecha_inicio) |
            Q(fecha_inicio__gte=fecha_inicio, fecha_fin__lte=fecha_fin)
        )
        
        if excluir_id:
            query &= ~Q(id=excluir_id)
        
        ciclos_solapados = Ciclo.objects.filter(query, activo=True)
        
        if ciclos_solapados.exists():
            return False, "Ya existe un ciclo activo que se solapa con estas fechas"
        
        return True, ""


class StockValidator:
    """
    Validador de reglas para movimientos de stock.
    """
    
    @staticmethod
    def validar_cantidad(cantidad: Any) -> Tuple[bool, str]:
        """
        Valida que la cantidad sea un entero positivo.
        
        Args:
            cantidad: Valor a validar
            
        Returns:
            Tupla (es_valido, mensaje_error)
        """
        try:
            cantidad_int = int(cantidad)
            if cantidad_int <= 0:
                return False, "Cantidad debe ser un número positivo"
            if cantidad_int > 10000:
                return False, "Cantidad excede el límite permitido (10000)"
            return True, ""
        except (ValueError, TypeError):
            return False, "Cantidad debe ser un número entero"
    
    @staticmethod
    def validar_accion(accion: str) -> Tuple[bool, str]:
        """
        Valida que la acción sea válida.
        
        Args:
            accion: Acción a validar
            
        Returns:
            Tupla (es_valido, mensaje_error)
        """
        acciones_validas = ['agregar', 'retirar']
        if accion not in acciones_validas:
            return False, f"Acción inválida. Debe ser: {', '.join(acciones_validas)}"
        return True, ""
    
    @staticmethod
    def validar_tipo_caja(tipo: str) -> Tuple[bool, str]:
        """
        Valida que el tipo de caja sea válido.
        
        Args:
            tipo: Tipo de caja a validar
            
        Returns:
            Tupla (es_valido, mensaje_error)
        """
        tipos_validos = ['Estándar', 'Premium', 'estandar', 'premium']
        if not tipo or tipo.strip() == '':
            return False, "Tipo de caja es requerido"
        # Normalizar y validar
        if tipo.lower() not in [t.lower() for t in tipos_validos]:
            return False, f"Tipo de caja inválido. Debe ser: Estándar o Premium"
        return True, ""
    
    @staticmethod
    def validar_stock_disponible(sucursal_id: int, tipo_caja: str, cantidad_requerida: int) -> Tuple[bool, str]:
        """
        Valida que haya stock suficiente para un retiro.
        
        Args:
            sucursal_id: ID de sucursal
            tipo_caja: Tipo de caja
            cantidad_requerida: Cantidad a retirar
            
        Returns:
            Tupla (es_valido, mensaje_error)
        """
        from totem.models import StockSucursal
        
        try:
            stock = StockSucursal.objects.get(sucursal_id=sucursal_id, producto__iexact=tipo_caja)
            stock_disponible = stock.cantidad
        except StockSucursal.DoesNotExist:
            stock_disponible = 0
        
        if stock_disponible < cantidad_requerida:
            return False, f"Stock insuficiente. Disponible: {stock_disponible}, solicitado: {cantidad_requerida}"
        
        return True, ""


class IncidenciaValidator:
    """
    Validador de reglas para incidencias.
    """
    
    @staticmethod
    def validar_tipo(tipo: str) -> Tuple[bool, str]:
        """
        Valida que el tipo de incidencia sea válido.
        
        Args:
            tipo: Tipo de incidencia
            
        Returns:
            Tupla (es_valido, mensaje_error)
        """
        tipos_validos = ['Falla', 'Queja', 'Sugerencia', 'Consulta', 'Otro']
        if tipo not in tipos_validos:
            return False, f"Tipo inválido. Debe ser: {', '.join(tipos_validos)}"
        return True, ""
    
    @staticmethod
    def validar_descripcion(descripcion: str) -> Tuple[bool, str]:
        """
        Valida que la descripción tenga contenido adecuado.
        
        Args:
            descripcion: Texto de la descripción
            
        Returns:
            Tupla (es_valido, mensaje_error)
        """
        if not descripcion or len(descripcion.strip()) < 10:
            return False, "Descripción debe tener al menos 10 caracteres"
        if len(descripcion) > 2000:
            return False, "Descripción excede el límite de 2000 caracteres"
        return True, ""
