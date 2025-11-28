"""
Módulo de seguridad para firma y validación de códigos QR.
Usa HMAC-SHA256 para prevenir falsificación.
"""
import hmac
import hashlib
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


class QRSecurity:
    """
    Clase para manejar firma y validación de payloads de QR.
    """
    
    @staticmethod
    def _get_secret() -> bytes:
        """Obtiene el secret configurado para firmar QRs."""
        return settings.QR_HMAC_SECRET.encode('utf-8')
    
    @staticmethod
    def generar_firma(uuid: str) -> str:
        """
        Genera una firma HMAC para el UUID del ticket.
        
        Args:
            uuid: UUID del ticket
            
        Returns:
            Firma hexadecimal (primeros 16 caracteres)
        """
        secret = QRSecurity._get_secret()
        firma = hmac.new(secret, uuid.encode('utf-8'), hashlib.sha256).hexdigest()
        return firma[:16]  # Usar primeros 16 chars para compactar
    
    @staticmethod
    def crear_payload_firmado(uuid: str) -> str:
        """
        Crea un payload firmado para el QR.
        
        Args:
            uuid: UUID del ticket
            
        Returns:
            Payload en formato "uuid:firma"
        """
        firma = QRSecurity.generar_firma(uuid)
        payload = f"{uuid}:{firma}"
        logger.debug(f"Payload QR firmado generado para ticket {uuid}")
        return payload
    
    @staticmethod
    def validar_payload(payload: str) -> tuple[bool, str | None]:
        """
        Valida un payload de QR verificando su firma.
        
        Args:
            payload: String en formato "uuid:firma"
            
        Returns:
            Tupla (es_valido, uuid_o_error)
        """
        try:
            if ':' not in payload:
                logger.warning(f"Payload QR inválido: formato incorrecto")
                return False, "Formato de QR inválido"
            
            uuid, firma_recibida = payload.split(':', 1)
            firma_esperada = QRSecurity.generar_firma(uuid)
            
            # Comparación segura contra timing attacks
            es_valido = hmac.compare_digest(firma_esperada, firma_recibida)
            
            if not es_valido:
                logger.warning(f"Intento de validación con QR falsificado: {uuid}")
                return False, "QR falsificado o alterado"
            
            logger.debug(f"QR validado correctamente: {uuid}")
            return True, uuid
            
        except Exception as e:
            logger.error(f"Error validando payload QR: {e}")
            return False, f"Error en validación: {str(e)}"
    
    @staticmethod
    def extraer_uuid(payload: str) -> str | None:
        """
        Extrae el UUID de un payload sin validar firma.
        Útil solo para logging/debugging, NO para lógica crítica.
        
        Args:
            payload: String del QR
            
        Returns:
            UUID o None si no se puede extraer
        """
        try:
            return payload.split(':', 1)[0] if ':' in payload else None
        except Exception:
            return None
