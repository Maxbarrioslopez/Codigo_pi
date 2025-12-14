"""
Servicio para gestión de Beneficios de Trabajadores.
Encapsula lógica de validación, HMAC, cambios de estado.
"""
import hmac
import hashlib
import json
import logging
from django.utils import timezone
from django.db import transaction
from totem.models import BeneficioTrabajador, ValidacionCaja, Trabajador, Ciclo, TipoBeneficio

logger = logging.getLogger(__name__)

# Clave HMAC compartida (en producción debe venir de settings.HMAC_KEY)
# Será reemplazada por settings.HMAC_SECRET_KEY
HMAC_SECRET = 'beneficio-secret-key-change-in-production'


class BeneficioService:
    """
    Servicio centralizado para operaciones con beneficios.
    Maneja asignación, validación HMAC, cambios de estado.
    """
    
    @staticmethod
    def generar_payload(beneficio: BeneficioTrabajador) -> dict:
        """
        Genera el payload JSON para el QR.
        Usado al crear el beneficio y para validación posterior.
        
        Payload incluye:
        - beneficio_id
        - trabajador_rut
        - ciclo_id
        - tipo_beneficio_nombre
        - timestamp (creación)
        """
        return {
            'beneficio_id': beneficio.id,
            'trabajador_rut': beneficio.trabajador.rut,
            'ciclo_id': beneficio.ciclo.id,
            'tipo_beneficio': beneficio.tipo_beneficio.nombre,
            'created_at': beneficio.created_at.isoformat() if beneficio.created_at else '',
        }
    
    @staticmethod
    def calcular_hmac(payload: dict) -> str:
        """
        Calcula HMAC-SHA256 del payload JSON.
        
        Args:
            payload: dict con datos del beneficio
            
        Returns:
            hex string de 64 caracteres (HMAC-SHA256)
        """
        payload_json = json.dumps(payload, separators=(',', ':'), sort_keys=True)
        signature = hmac.new(
            HMAC_SECRET.encode('utf-8'),
            payload_json.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    @staticmethod
    def validar_hmac(payload: dict, esperada_signature: str) -> bool:
        """
        Valida que la firma HMAC corresponda al payload.
        Usa compare_digest para evitar timing attacks.
        
        Args:
            payload: dict con datos del beneficio
            esperada_signature: str de 64 caracteres (firma a validar)
            
        Returns:
            True si la firma es válida, False si no
        """
        calculada_signature = BeneficioService.calcular_hmac(payload)
        # Usar compare_digest para prevenir timing attacks
        return hmac.compare_digest(calculada_signature, esperada_signature)
    
    @staticmethod
    @transaction.atomic
    def asignar_beneficio(
        trabajador: Trabajador,
        ciclo: Ciclo,
        tipo_beneficio: TipoBeneficio,
        codigo_verificacion: str,
        caja_beneficio=None
    ) -> BeneficioTrabajador:
        """
        Asigna un beneficio a un trabajador para un ciclo.
        Genera payload y firma HMAC.
        
        Args:
            trabajador: instancia de Trabajador
            ciclo: instancia de Ciclo
            tipo_beneficio: instancia de TipoBeneficio
            codigo_verificacion: código único para este beneficio
            caja_beneficio: instancia opcional de CajaBeneficio
            
        Returns:
            BeneficioTrabajador creado
            
        Raises:
            IntegrityError si ya existe un beneficio igual en el ciclo
        """
        beneficio = BeneficioTrabajador(
            trabajador=trabajador,
            ciclo=ciclo,
            tipo_beneficio=tipo_beneficio,
            caja_beneficio=caja_beneficio,
            codigo_verificacion=codigo_verificacion,
            estado='pendiente'
        )
        
        # Generar payload y firma
        payload = BeneficioService.generar_payload(beneficio)
        signature = BeneficioService.calcular_hmac(payload)
        
        beneficio.qr_payload = payload
        beneficio.qr_signature = signature
        
        beneficio.save()
        logger.info(f"Beneficio asignado: {beneficio.id} - {trabajador.rut} - {tipo_beneficio.nombre}")
        
        return beneficio
    
    @staticmethod
    @transaction.atomic
    def validar_beneficio(
        beneficio: BeneficioTrabajador,
        codigo_escaneado: str,
        guardia_usuario=None
    ) -> tuple[bool, dict]:
        """
        Valida un beneficio escaneado por el guardia.
        Verifica firma HMAC contra payload persistido.
        Cambia estado de PENDIENTE a VALIDADO.
        
        Args:
            beneficio: instancia de BeneficioTrabajador
            codigo_escaneado: código QR escaneado
            guardia_usuario: usuario guardia que realiza validación
            
        Returns:
            (éxito: bool, datos_validacion: dict)
            
        Raises:
            Valida pero registra rechazo en ValidacionCaja si hay error
        """
        resultado = {'exitoso': False, 'beneficio_id': beneficio.id, 'razones': []}
        
        # Validaciones previas
        if beneficio.estado != 'pendiente':
            resultado['razones'].append(f'Estado no es pendiente (actual: {beneficio.estado})')
            resultado['exitoso'] = False
        
        if beneficio.bloqueado:
            resultado['razones'].append('Beneficio bloqueado')
            resultado['exitoso'] = False
        
        if not beneficio.ciclo or not beneficio.ciclo.activo:
            resultado['razones'].append('Ciclo no activo')
            resultado['exitoso'] = False
        
        if beneficio.ciclo and beneficio.ciclo.fecha_fin < timezone.now().date():
            resultado['razones'].append('Ciclo expirado')
            resultado['exitoso'] = False
        
        if resultado['razones']:
            # Registrar validación fallida
            ValidacionCaja.objects.create(
                beneficio_trabajador=beneficio,
                guardia=guardia_usuario,
                codigo_escaneado=codigo_escaneado,
                resultado='rechazado'
            )
            return False, resultado
        
        # Validar firma HMAC usando payload persistido
        if not beneficio.qr_signature or not beneficio.qr_payload:
            resultado['razones'].append('Beneficio sin firma HMAC')
            resultado['exitoso'] = False
            ValidacionCaja.objects.create(
                beneficio_trabajador=beneficio,
                guardia=guardia_usuario,
                codigo_escaneado=codigo_escaneado,
                resultado='error'
            )
            return False, resultado
        
        # Validar HMAC contra payload persistido (NUNCA reconstruit)
        hmac_valido = BeneficioService.validar_hmac(beneficio.qr_payload, beneficio.qr_signature)
        
        if not hmac_valido:
            resultado['razones'].append('Firma HMAC inválida')
            resultado['exitoso'] = False
            ValidacionCaja.objects.create(
                beneficio_trabajador=beneficio,
                guardia=guardia_usuario,
                codigo_escaneado=codigo_escaneado,
                resultado='rechazado'
            )
            return False, resultado
        
        # TODO: Validar que el código_escaneado corresponde al beneficio
        # (si están embebidos en el QR, comparar)
        
        # Cambiar estado a VALIDADO
        beneficio.estado = 'validado'
        beneficio.save(update_fields=['estado', 'updated_at'])
        
        # Registrar validación exitosa
        ValidacionCaja.objects.create(
            beneficio_trabajador=beneficio,
            guardia=guardia_usuario,
            codigo_escaneado=codigo_escaneado,
            resultado='exitoso'
        )
        
        resultado['exitoso'] = True
        resultado['razones'] = []
        logger.info(f"Beneficio validado: {beneficio.id} - {beneficio.trabajador.rut}")
        
        return True, resultado
    
    @staticmethod
    @transaction.atomic
    def confirmar_entrega(
        beneficio: BeneficioTrabajador,
        guardia_usuario=None,
        caja_fisica_codigo: str = None
    ) -> tuple[bool, dict]:
        """
        Confirma la entrega física del beneficio.
        Solo posible si estado es VALIDADO.
        Cambia estado de VALIDADO a RETIRADO.
        
        Args:
            beneficio: instancia de BeneficioTrabajador
            guardia_usuario: usuario guardia que confirma entrega
            caja_fisica_codigo: código de caja física entregada (opcional)
            
        Returns:
            (éxito: bool, datos_entrega: dict)
        """
        resultado = {'exitoso': False, 'beneficio_id': beneficio.id, 'razones': []}
        
        # Validar que está en estado VALIDADO
        if beneficio.estado != 'validado':
            resultado['razones'].append(f'Estado debe ser VALIDADO (actual: {beneficio.estado})')
            return False, resultado
        
        if beneficio.bloqueado:
            resultado['razones'].append('Beneficio bloqueado')
            return False, resultado
        
        # Cambiar estado a RETIRADO
        beneficio.estado = 'retirado'
        beneficio.save(update_fields=['estado', 'updated_at'])
        
        # Registrar entrega en ValidacionCaja si hay guardia
        if guardia_usuario:
            ValidacionCaja.objects.create(
                beneficio_trabajador=beneficio,
                guardia=guardia_usuario,
                codigo_escaneado=caja_fisica_codigo or beneficio.codigo_verificacion,
                resultado='exitoso',
                caja_validada=caja_fisica_codigo or ''
            )
        
        resultado['exitoso'] = True
        resultado['estado_final'] = 'retirado'
        logger.info(f"Entrega confirmada: {beneficio.id} - {beneficio.trabajador.rut}")
        
        return True, resultado
    
    @staticmethod
    def obtener_beneficios_pendientes(trabajador: Trabajador):
        """Lista todos los beneficios pendientes de un trabajador."""
        return BeneficioTrabajador.objects.filter(
            trabajador=trabajador,
            estado='pendiente',
            bloqueado=False
        ).select_related('ciclo', 'tipo_beneficio')
    
    @staticmethod
    def obtener_beneficios_validados(trabajador: Trabajador):
        """Lista todos los beneficios validados (listos para retirar)."""
        return BeneficioTrabajador.objects.filter(
            trabajador=trabajador,
            estado='validado',
            bloqueado=False
        ).select_related('ciclo', 'tipo_beneficio')
    
    @staticmethod
    @transaction.atomic
    def bloquear_beneficio(beneficio: BeneficioTrabajador, motivo: str) -> BeneficioTrabajador:
        """Bloquea un beneficio impidiendo su retiro."""
        beneficio.bloqueado = True
        beneficio.motivo_bloqueo = motivo
        beneficio.save(update_fields=['bloqueado', 'motivo_bloqueo', 'updated_at'])
        logger.warning(f"Beneficio bloqueado: {beneficio.id} - Motivo: {motivo}")
        return beneficio
    
    @staticmethod
    @transaction.atomic
    def desbloquear_beneficio(beneficio: BeneficioTrabajador) -> BeneficioTrabajador:
        """Desbloquea un beneficio."""
        beneficio.bloqueado = False
        beneficio.motivo_bloqueo = ''
        beneficio.save(update_fields=['bloqueado', 'motivo_bloqueo', 'updated_at'])
        logger.info(f"Beneficio desbloqueado: {beneficio.id}")
        return beneficio
