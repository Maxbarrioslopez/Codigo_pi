"""
Módulo de seguridad para firma y validación de códigos QR.
Usa HMAC-SHA256 para prevenir falsificación y protección contra replay attacks.
"""
import hmac
import hashlib
import logging
import time
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


class QRSecurity:
    """
    Clase para manejar firma y validación de payloads de QR.
    Incluye protección contra replay attacks mediante nonces.
    """
    
    # Prefijo para nonces en caché
    NONCE_PREFIX = 'qr_nonce'
    # Tiempo de vida del nonce (igual que TTL del ticket)
    NONCE_TTL = 60 * 60  # 1 hora
    
    @staticmethod
    def _get_secret() -> bytes:
        """Obtiene el secret configurado para firmar QRs."""
        return settings.QR_HMAC_SECRET.encode('utf-8')
    
    @staticmethod
    def generar_firma(uuid: str, timestamp: int = None) -> str:
        """
        Genera una firma HMAC para el UUID del ticket con timestamp.
        
        Args:
            uuid: UUID del ticket
            timestamp: Timestamp Unix (opcional, usa tiempo actual si no se provee)
            
        Returns:
            Firma hexadecimal (primeros 16 caracteres)
        """
        if timestamp is None:
            timestamp = int(time.time())
        
        secret = QRSecurity._get_secret()
        mensaje = f"{uuid}:{timestamp}".encode('utf-8')
        firma = hmac.new(secret, mensaje, hashlib.sha256).hexdigest()
        return firma[:16]  # Usar primeros 16 chars para compactar
    
    @staticmethod
    def crear_payload_firmado(uuid: str) -> str:
        """
        Crea un payload firmado para el QR con timestamp para anti-replay.
        
        Args:
            uuid: UUID del ticket
            
        Returns:
            Payload en formato "uuid:timestamp:firma"
        """
        timestamp = int(time.time())
        firma = QRSecurity.generar_firma(uuid, timestamp)
        payload = f"{uuid}:{timestamp}:{firma}"
        logger.debug(f"Payload QR firmado generado para ticket {uuid}")
        return payload
    
    @staticmethod
    def validar_payload(payload: str, permitir_replay: bool = False) -> tuple[bool, str | None]:
        """
        Valida un payload de QR verificando su firma y protegiendo contra replay.
        
        Args:
            payload: String en formato "uuid:timestamp:firma"
            permitir_replay: Si False, bloquea QRs ya validados (default: False)
            
        Returns:
            Tupla (es_valido, uuid_o_error)
        """
        try:
            partes = payload.split(':')
            if len(partes) < 2:
                logger.warning(f"Payload QR inválido: formato incorrecto")
                return False, "Formato de QR inválido"
            
            # Compatibilidad con formato antiguo (sin timestamp)
            if len(partes) == 2:
                uuid, firma_recibida = partes
                timestamp = None
            else:
                uuid, timestamp_str, firma_recibida = partes[0], partes[1], partes[2]
                try:
                    timestamp = int(timestamp_str)
                except ValueError:
                    logger.warning(f"Timestamp inválido en QR: {timestamp_str}")
                    return False, "Timestamp inválido en QR"
            
            # Validar timestamp (no debe ser muy antiguo)
            if timestamp:
                tiempo_actual = int(time.time())
                edad_qr = tiempo_actual - timestamp
                
                # QR no debe ser más viejo que NONCE_TTL
                if edad_qr > QRSecurity.NONCE_TTL:
                    logger.warning(f"QR expirado: {uuid}, edad {edad_qr}s")
                    return False, "QR expirado por antigüedad"
                
                # QR no debe ser del futuro (clock skew tolerance: 5 minutos)
                if edad_qr < -300:
                    logger.warning(f"QR del futuro detectado: {uuid}")
                    return False, "QR con timestamp inválido"
            
            # Generar firma esperada
            firma_esperada = QRSecurity.generar_firma(uuid, timestamp) if timestamp else QRSecurity._generar_firma_legacy(uuid)
            
            # Comparación segura contra timing attacks
            es_valido = hmac.compare_digest(firma_esperada, firma_recibida)
            
            if not es_valido:
                logger.warning(f"Intento de validación con QR falsificado: {uuid}")
                return False, "QR falsificado o alterado"
            
            # Protección contra replay attacks
            if not permitir_replay and timestamp:
                nonce_key = f"{QRSecurity.NONCE_PREFIX}:{uuid}:{timestamp}"
                if cache.get(nonce_key):
                    logger.warning(f"Replay attack detectado: {uuid}")
                    return False, "QR ya fue validado anteriormente"
                
                # Marcar nonce como usado
                cache.set(nonce_key, True, QRSecurity.NONCE_TTL)
            
            logger.info(f"QR validado correctamente: {uuid}")
            return True, uuid
            
        except Exception as e:
            logger.error(f"Error validando payload QR: {e}")
            return False, f"Error en validación: {str(e)}"
    
    @staticmethod
    def _generar_firma_legacy(uuid: str) -> str:
        """
        Genera firma en formato legacy (sin timestamp) para compatibilidad.
        
        Args:
            uuid: UUID del ticket
            
        Returns:
            Firma hexadecimal (primeros 16 caracteres)
        """
        secret = QRSecurity._get_secret()
        firma = hmac.new(secret, uuid.encode('utf-8'), hashlib.sha256).hexdigest()
        return firma[:16]
    
    @staticmethod
    def verificar_nonce_usado(uuid: str, timestamp: int) -> bool:
        """
        Verifica si un nonce ya fue usado (replay attack check).
        
        Args:
            uuid: UUID del ticket
            timestamp: Timestamp del payload
            
        Returns:
            True si el nonce ya fue usado, False si es nuevo
        """
        nonce_key = f"{QRSecurity.NONCE_PREFIX}:{uuid}:{timestamp}"
        return bool(cache.get(nonce_key))
    
    @staticmethod
    def invalidar_nonce(uuid: str, timestamp: int):
        """
        Invalida manualmente un nonce (útil para testing o rollback).
        
        Args:
            uuid: UUID del ticket
            timestamp: Timestamp del payload
        """
        nonce_key = f"{QRSecurity.NONCE_PREFIX}:{uuid}:{timestamp}"
        cache.delete(nonce_key)
        logger.info(f"Nonce invalidado: {uuid}:{timestamp}")
    
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
    
    @staticmethod
    def extraer_timestamp(payload: str) -> int | None:
        """
        Extrae el timestamp de un payload sin validar.
        
        Args:
            payload: String del QR
            
        Returns:
            Timestamp Unix o None
        """
        try:
            partes = payload.split(':')
            if len(partes) >= 3:
                return int(partes[1])
            return None
        except Exception:
            return None
