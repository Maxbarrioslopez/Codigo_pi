# -*- coding: utf-8 -*-
"""
Rate limiting personalizado para protección contra abuso.
Implementa límites específicos por tipo de operación.
"""
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
import structlog

logger = structlog.get_logger(__name__)


class TicketCreationThrottle(UserRateThrottle):
    """
    Límite estricto para creación de tickets.
    Previene abuso del sistema de beneficios.
    """
    scope = 'ticket_create'
    rate = '20/hour'  # Máximo 20 tickets por trabajador por hora


class QRValidationThrottle(UserRateThrottle):
    """
    Límite para validación de códigos QR por guardia.
    Previene escaneo masivo no autorizado.
    """
    scope = 'qr_validation'
    rate = '100/hour'  # Máximo 100 validaciones por guardia por hora


class AuthenticationThrottle(AnonRateThrottle):
    """
    Límite para intentos de autenticación.
    Protege contra ataques de fuerza bruta.
    """
    scope = 'auth'
    rate = '10/minute'  # Máximo 10 intentos por minuto por IP


class ReportGenerationThrottle(UserRateThrottle):
    """
    Límite para generación de reportes pesados.
    Evita sobrecarga del servidor.
    """
    scope = 'reports'
    rate = '30/hour'  # Máximo 30 reportes por usuario por hora


class NominaUploadThrottle(UserRateThrottle):
    """
    Límite para carga de archivos de nómina.
    Operación sensible que requiere restricción.
    """
    scope = 'nomina_upload'
    rate = '5/hour'  # Máximo 5 cargas por hora


class StockMovementThrottle(UserRateThrottle):
    """
    Límite para movimientos de stock.
    Previene modificaciones masivas no intencionadas.
    """
    scope = 'stock_movement'
    rate = '50/hour'  # Máximo 50 movimientos por usuario por hora


class BurstRateThrottle(UserRateThrottle):
    """
    Límite de ráfaga para operaciones generales.
    Previene picos de tráfico anómalos.
    """
    scope = 'burst'
    rate = '60/minute'  # Máximo 60 requests por minuto


class SustainedRateThrottle(UserRateThrottle):
    """
    Límite sostenido para uso continuo.
    Asegura distribución justa de recursos.
    """
    scope = 'sustained'
    rate = '1000/hour'  # Máximo 1000 requests por hora
