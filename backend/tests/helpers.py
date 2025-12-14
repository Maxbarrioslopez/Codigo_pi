"""
Helpers y utilities para tests.
Funciones reutilizables y builders para objetos de test.
"""
from datetime import timedelta
from django.utils import timezone
from totem.models import (
    Trabajador, Ciclo, TipoBeneficio, CajaBeneficio,
    BeneficioTrabajador, Sucursal, Usuario
)
from totem.security import QRSecurity


class TrabajadorBuilder:
    """Builder para crear Trabajadores de test con configuraciones comunes."""

    @staticmethod
    def crear_trabajador_basico(rut='11111111-1', nombre='Test Worker', contrato='planta'):
        """Crea trabajador básico con defaults razonables."""
        return Trabajador.objects.create(
            rut=rut,
            nombre=nombre,
            seccion='Test',
            contrato=contrato,
            beneficio_disponible={'tipo': 'test', 'activo': True}
        )

    @staticmethod
    def crear_trabajador_sin_beneficio(rut='22222222-2', nombre='No Benefit Worker'):
        """Crea trabajador sin beneficio asignado."""
        return Trabajador.objects.create(
            rut=rut,
            nombre=nombre,
            beneficio_disponible={}
        )

    @staticmethod
    def crear_trabajador_bloqueado(rut='33333333-3', nombre='Blocked Worker'):
        """Crea trabajador bloqueado."""
        return Trabajador.objects.create(
            rut=rut,
            nombre=nombre,
            beneficio_disponible={'bloqueado': True, 'motivo': 'Prueba'}
        )


class CicloBuilder:
    """Builder para crear Ciclos con distintas fechas."""

    @staticmethod
    def crear_ciclo_activo(nombre='Ciclo Activo', dias_antes=10, dias_despues=20):
        """Crea ciclo activo que incluye hoy."""
        hoy = timezone.now().date()
        return Ciclo.objects.create(
            nombre=nombre,
            fecha_inicio=hoy - timedelta(days=dias_antes),
            fecha_fin=hoy + timedelta(days=dias_despues),
            activo=True
        )

    @staticmethod
    def crear_ciclo_futuro(nombre='Ciclo Futuro', dias_inicio=30, dias_duracion=20):
        """Crea ciclo que comienza en el futuro."""
        hoy = timezone.now().date()
        return Ciclo.objects.create(
            nombre=nombre,
            fecha_inicio=hoy + timedelta(days=dias_inicio),
            fecha_fin=hoy + timedelta(days=dias_inicio + dias_duracion),
            activo=False
        )

    @staticmethod
    def crear_ciclo_pasado(nombre='Ciclo Pasado', dias_atras=100, dias_duracion=20):
        """Crea ciclo que ya terminó."""
        hoy = timezone.now().date()
        return Ciclo.objects.create(
            nombre=nombre,
            fecha_inicio=hoy - timedelta(days=dias_atras),
            fecha_fin=hoy - timedelta(days=dias_atras - dias_duracion),
            activo=False
        )


class BeneficioBuilder:
    """Builder para crear Beneficios con configuraciones."""

    @staticmethod
    def crear_tipo_con_guardia(nombre='Caja Con Guardia', tipos_contrato=None):
        """Crea tipo de beneficio que requiere validación guardia."""
        if tipos_contrato is None:
            tipos_contrato = ['planta', 'contrata']
        
        return TipoBeneficio.objects.create(
            nombre=nombre,
            descripcion='Con validación guardia',
            activo=True,
            tipos_contrato=tipos_contrato,
            requiere_validacion_guardia=True
        )

    @staticmethod
    def crear_tipo_sin_guardia(nombre='Vale Directo', tipos_contrato=None):
        """Crea tipo de beneficio sin validación guardia."""
        if tipos_contrato is None:
            tipos_contrato = ['todos']
        
        return TipoBeneficio.objects.create(
            nombre=nombre,
            descripcion='Sin validación guardia',
            activo=True,
            tipos_contrato=tipos_contrato,
            requiere_validacion_guardia=False
        )

    @staticmethod
    def crear_caja(beneficio, nombre='Standard', codigo='CAJ-TEST-STD'):
        """Crea caja de beneficio."""
        return CajaBeneficio.objects.create(
            beneficio=beneficio,
            nombre=nombre,
            codigo_tipo=codigo,
            activo=True
        )


class BeneficioTrabajadorBuilder:
    """Builder para crear BeneficioTrabajador con distintos estados."""

    @staticmethod
    def crear_beneficio_pendiente(trabajador, ciclo, tipo_beneficio, caja=None):
        """Crea beneficio en estado pendiente, listo para guardia."""
        codigo = QRSecurity.crear_payload_firmado(f'uuid-{trabajador.id}-{ciclo.id}')
        
        return BeneficioTrabajador.objects.create(
            trabajador=trabajador,
            ciclo=ciclo,
            tipo_beneficio=tipo_beneficio,
            caja_beneficio=caja,
            codigo_verificacion=codigo,
            qr_data=f'{{"codigo": "{codigo}", "rut": "{trabajador.rut}"}}',
            estado='pendiente',
            bloqueado=False
        )

    @staticmethod
    def crear_beneficio_validado(trabajador, ciclo, tipo_beneficio, caja=None):
        """Crea beneficio ya validado por guardia."""
        codigo = QRSecurity.crear_payload_firmado(f'uuid-validado-{trabajador.id}')
        
        return BeneficioTrabajador.objects.create(
            trabajador=trabajador,
            ciclo=ciclo,
            tipo_beneficio=tipo_beneficio,
            caja_beneficio=caja,
            codigo_verificacion=codigo,
            qr_data=f'{{"codigo": "{codigo}", "rut": "{trabajador.rut}"}}',
            estado='validado',
            bloqueado=False
        )

    @staticmethod
    def crear_beneficio_retirado(trabajador, ciclo, tipo_beneficio, caja=None):
        """Crea beneficio ya retirado."""
        codigo = QRSecurity.crear_payload_firmado(f'uuid-retirado-{trabajador.id}')
        
        return BeneficioTrabajador.objects.create(
            trabajador=trabajador,
            ciclo=ciclo,
            tipo_beneficio=tipo_beneficio,
            caja_beneficio=caja,
            codigo_verificacion=codigo,
            qr_data=f'{{"codigo": "{codigo}", "rut": "{trabajador.rut}"}}',
            estado='retirado',
            bloqueado=False
        )

    @staticmethod
    def crear_beneficio_bloqueado(trabajador, ciclo, tipo_beneficio, motivo='Deuda'):
        """Crea beneficio bloqueado."""
        codigo = QRSecurity.crear_payload_firmado(f'uuid-bloqueado-{trabajador.id}')
        
        return BeneficioTrabajador.objects.create(
            trabajador=trabajador,
            ciclo=ciclo,
            tipo_beneficio=tipo_beneficio,
            codigo_verificacion=codigo,
            qr_data=f'{{"codigo": "{codigo}", "rut": "{trabajador.rut}"}}',
            estado='pendiente',
            bloqueado=True,
            motivo_bloqueo=motivo
        )


class UsuarioBuilder:
    """Builder para crear usuarios con distintos roles."""

    @staticmethod
    def crear_guardia(username='guardia_test', sucursal=None):
        """Crea usuario Guardia."""
        return Usuario.objects.create_user(
            username=username,
            email=f'{username}@test.cl',
            password='test123456',
            rol='guardia',
            sucursal=sucursal,
            is_staff=False
        )

    @staticmethod
    def crear_rrhh(username='rrhh_test'):
        """Crea usuario RRHH."""
        return Usuario.objects.create_user(
            username=username,
            email=f'{username}@test.cl',
            password='test123456',
            rol='rrhh',
            is_staff=True
        )

    @staticmethod
    def crear_admin(username='admin_test'):
        """Crea usuario Admin."""
        return Usuario.objects.create_user(
            username=username,
            email=f'{username}@test.cl',
            password='test123456',
            rol='admin',
            is_staff=True,
            is_superuser=True
        )

    @staticmethod
    def crear_supervisor(username='supervisor_test'):
        """Crea usuario Supervisor."""
        return Usuario.objects.create_user(
            username=username,
            email=f'{username}@test.cl',
            password='test123456',
            rol='supervisor',
            is_staff=True
        )


# Helpers de seguridad

def crear_payload_qr_valido(codigo):
    """Crea payload QR con firma válida."""
    return QRSecurity.crear_payload_firmado(codigo)


def crear_payload_qr_con_firma_falsa(codigo, timestamp='1234567890'):
    """Crea payload con firma manipulada (inválida)."""
    return f"{codigo}:{timestamp}:aaaaaabbbbbbcccccdddddd"


def crear_payload_qr_antiguo(codigo, horas_atras=2):
    """Crea payload con timestamp antiguo (para anti-replay)."""
    timestamp_antiguo = int((timezone.now() - timedelta(hours=horas_atras)).timestamp())
    firma = QRSecurity.generar_firma(codigo, timestamp=timestamp_antiguo)
    return f"{codigo}:{timestamp_antiguo}:{firma}"


def crear_payload_qr_formato_incorrecto():
    """Crea payload con formato incorrecto."""
    return "formato:incorrecto:extra"


def crear_payload_qr_vacio():
    """Crea payload vacío."""
    return ""


# Helpers de validación en tests

def assert_beneficio_es_igual(beneficio1, beneficio2):
    """Verifica que dos dicts de beneficio sean idénticos."""
    assert beneficio1['rut'] == beneficio2['rut']
    assert beneficio1['nombre'] == beneficio2['nombre']
    assert beneficio1.get('beneficio_disponible') == beneficio2.get('beneficio_disponible')


def assert_estado_beneficio(beneficio_trabajador, estado_esperado):
    """Refresh y verifica estado de BeneficioTrabajador."""
    beneficio_trabajador.refresh_from_db()
    assert beneficio_trabajador.estado == estado_esperado, \
        f"Estado esperado {estado_esperado}, obtenido {beneficio_trabajador.estado}"


def assert_validacion_caja_creada(beneficio_trabajador, guardia):
    """Verifica que ValidacionCaja existe para el beneficio."""
    from totem.models import ValidacionCaja
    
    validacion = ValidacionCaja.objects.filter(
        beneficio_trabajador=beneficio_trabajador,
        guardia=guardia
    ).first()
    
    assert validacion is not None, "ValidacionCaja no encontrada en BD"
    return validacion


def assert_no_hay_duplicados(trabajador, ciclo, tipo_beneficio):
    """Verifica que hay máximo 1 BeneficioTrabajador para esta combinación."""
    beneficios = BeneficioTrabajador.objects.filter(
        trabajador=trabajador,
        ciclo=ciclo,
        tipo_beneficio=tipo_beneficio
    ).count()
    
    assert beneficios <= 1, f"Se encontraron {beneficios} beneficios, esperaba <=1"
