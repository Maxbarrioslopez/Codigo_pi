"""
Vista para gestionar cajas, asignación de beneficios a trabajadores y validaciones.

Flujo:
1. RRHH: Crear/editar cajas de beneficio (CajaBeneficio)
2. RRHH: Asignar beneficios a trabajadores en un ciclo (BeneficioTrabajador)
3. Guardia: Validar entregas con QR (ValidacionCaja)
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import (
    CajaBeneficio, BeneficioTrabajador, ValidacionCaja,
    TipoBeneficio, Ciclo, Trabajador, Usuario
)
from .serializers import (
    CajaBeneficioSerializer, BeneficioTrabajadorSerializer, ValidacionCajaSerializer
)
from .permissions import IsRRHH, IsGuardia
from .utils_rut import clean_rut
import uuid


# ==================== CAJA BENEFICIO (RRHH) ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsRRHH])
def cajas_beneficio_list_create(request):
    """
    GET: Listar todas las cajas de beneficio
    POST: Crear nueva caja de beneficio
    """
    if request.method == 'GET':
        cajas = CajaBeneficio.objects.select_related('beneficio').all()
        serializer = CajaBeneficioSerializer(cajas, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CajaBeneficioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsRRHH])
def caja_beneficio_detail(request, caja_id):
    """
    GET: Obtener detalles de una caja
    PUT: Actualizar caja
    DELETE: Desactivar caja
    """
    caja = get_object_or_404(CajaBeneficio, id=caja_id)
    
    if request.method == 'GET':
        serializer = CajaBeneficioSerializer(caja)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = CajaBeneficioSerializer(caja, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Soft delete: desactivar la caja
        caja.activo = False
        caja.save()
        return Response({'mensaje': 'Caja desactivada'}, status=status.HTTP_200_OK)


# ==================== BENEFICIO TRABAJADOR (RRHH) ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsRRHH])
def beneficio_trabajador_list_create(request):
    """
    GET: Listar asignaciones de beneficios a trabajadores
    POST: Asignar beneficio a trabajador (unitario) o bulk
    """
    if request.method == 'GET':
        # Filtros opcionales
        ciclo_id = request.query_params.get('ciclo_id')
        trabajador_rut = request.query_params.get('trabajador_rut')
        tipo_beneficio_id = request.query_params.get('tipo_beneficio_id')
        estado = request.query_params.get('estado')  # pendiente, validado, retirado, cancelado
        
        queryset = BeneficioTrabajador.objects.select_related(
            'trabajador', 'ciclo', 'tipo_beneficio', 'caja_beneficio'
        ).all()
        
        if ciclo_id:
            queryset = queryset.filter(ciclo_id=ciclo_id)
        if trabajador_rut:
            try:
                rut_normalizado = clean_rut(trabajador_rut)
                queryset = queryset.filter(trabajador__rut=rut_normalizado)
            except:
                return Response({'error': 'RUT inválido'}, status=status.HTTP_400_BAD_REQUEST)
        if tipo_beneficio_id:
            queryset = queryset.filter(tipo_beneficio_id=tipo_beneficio_id)
        if estado:
            queryset = queryset.filter(estado=estado)
        
        serializer = BeneficioTrabajadorSerializer(queryset, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Soporta asignación individual o bulk
        if isinstance(request.data, list):
            # Bulk assignment
            return _asignar_beneficios_bulk(request.data, request.user)
        else:
            # Individual assignment
            serializer = BeneficioTrabajadorSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def _asignar_beneficios_bulk(beneficios_data, user):
    """Helper para asignar beneficios en lote"""
    try:
        with transaction.atomic():
            resultados = []
            for datos in beneficios_data:
                serializer = BeneficioTrabajadorSerializer(data=datos)
                if serializer.is_valid():
                    serializer.save()
                    data = dict(serializer.data)
                    resultados.append({'id': data['id'], 'status': 'creado'})
                else:
                    resultados.append({'error': serializer.errors})
        return Response(resultados, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def beneficio_trabajador_por_codigo(request, codigo_verificacion):
    """
    GET: Obtener beneficio de trabajador por código de verificación
    Usado por el guardia para escanear QR y obtener datos
    """
    beneficio = get_object_or_404(
        BeneficioTrabajador.objects.select_related('trabajador', 'tipo_beneficio', 'caja_beneficio', 'ciclo'),
        codigo_verificacion=codigo_verificacion
    )
    
    # Validar que no esté bloqueado
    if beneficio.bloqueado:
        return Response(
            {'error': f'Beneficio bloqueado: {beneficio.motivo_bloqueo}'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Validar que esté en estado pendiente
    if beneficio.estado != 'pendiente':
        return Response(
            {'error': f'Beneficio en estado {beneficio.estado}, no puede ser validado'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = BeneficioTrabajadorSerializer(beneficio)
    return Response(serializer.data)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsRRHH])
def beneficio_trabajador_detail(request, beneficio_id):
    """
    PUT: Actualizar beneficio de trabajador (ej: cambiar caja)
    DELETE: Cancelar beneficio
    """
    beneficio = get_object_or_404(BeneficioTrabajador, id=beneficio_id)
    
    if request.method == 'PUT':
        serializer = BeneficioTrabajadorSerializer(beneficio, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Cambiar estado a cancelado
        beneficio.estado = 'cancelado'
        beneficio.save()
        return Response({'mensaje': 'Beneficio cancelado'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsRRHH])
def beneficio_trabajador_bloquear(request, beneficio_id):
    """
    POST: Bloquear beneficio de trabajador (por sospecha de fraude)
    Body: { "motivo": "..." }
    """
    beneficio = get_object_or_404(BeneficioTrabajador, id=beneficio_id)
    
    motivo = request.data.get('motivo', 'Bloqueado por RRHH')
    beneficio.bloqueado = True
    beneficio.motivo_bloqueo = motivo
    beneficio.save()
    
    serializer = BeneficioTrabajadorSerializer(beneficio)
    return Response(serializer.data)


# ==================== VALIDACIÓN CAJA (GUARDIA) ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsGuardia])
def validacion_caja_crear(request):
    """
    POST: Registrar validación de caja por guardia
    
    Body:
    {
        "beneficio_trabajador_id": 1,
        "codigo_escaneado": "BEN-0013-000001-abc1",
        "resultado": "exitoso|rechazado|error",
        "caja_validada": "CAJA-12345",
        "notas": "..."
    }
    """
    try:
        beneficio_id = request.data.get('beneficio_trabajador_id')
        if not beneficio_id:
            return Response(
                {'error': 'beneficio_trabajador_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        beneficio = get_object_or_404(BeneficioTrabajador, id=beneficio_id)
        
        # Validar que el beneficio requiera validación
        if not beneficio.tipo_beneficio.requiere_validacion_guardia:
            return Response(
                {'error': 'Este beneficio no requiere validación del guardia'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que esté pendiente
        if beneficio.estado != 'pendiente':
            return Response(
                {'error': f'Beneficio en estado {beneficio.estado}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        codigo_escaneado = request.data.get('codigo_escaneado', '')
        resultado = request.data.get('resultado', 'exitoso')
        caja_validada = request.data.get('caja_validada', '')
        notas = request.data.get('notas', '')
        
        # Validar que el código coincida
        caja_coincide = codigo_escaneado == beneficio.codigo_verificacion
        
        # Crear validación
        validacion = ValidacionCaja.objects.create(
            beneficio_trabajador=beneficio,
            guardia=request.user,
            codigo_escaneado=codigo_escaneado,
            resultado=resultado,
            caja_validada=caja_validada,
            caja_coincide=caja_coincide,
            notas=notas
        )
        
        # Actualizar estado del beneficio según resultado
        if resultado == 'exitoso' and caja_coincide:
            beneficio.estado = 'validado'
            beneficio.save()
        elif resultado == 'rechazado':
            beneficio.estado = 'cancelado'
            beneficio.save()
        
        serializer = ValidacionCajaSerializer(validacion)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsGuardia])
def validacion_caja_listar(request):
    """
    GET: Listar validaciones de cajas (para guardia)
    
    Filtros:
    - ciclo_id: filtrar por ciclo
    - resultado: exitoso, rechazado, error
    - fecha_desde, fecha_hasta: rango de fechas
    """
    queryset = ValidacionCaja.objects.select_related(
        'beneficio_trabajador', 'guardia'
    ).all()
    
    ciclo_id = request.query_params.get('ciclo_id')
    resultado = request.query_params.get('resultado')
    fecha_desde = request.query_params.get('fecha_desde')
    fecha_hasta = request.query_params.get('fecha_hasta')
    
    if ciclo_id:
        queryset = queryset.filter(beneficio_trabajador__ciclo_id=ciclo_id)
    if resultado:
        queryset = queryset.filter(resultado=resultado)
    if fecha_desde:
        queryset = queryset.filter(fecha_validacion__gte=fecha_desde)
    if fecha_hasta:
        queryset = queryset.filter(fecha_validacion__lte=fecha_hasta)
    
    serializer = ValidacionCajaSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsGuardia])
def validacion_caja_estadisticas(request):
    """
    GET: Estadísticas de validaciones (para guardia)
    """
    ciclo_id = request.query_params.get('ciclo_id')
    
    queryset = ValidacionCaja.objects.all()
    if ciclo_id:
        queryset = queryset.filter(beneficio_trabajador__ciclo_id=ciclo_id)
    
    stats = {
        'total': queryset.count(),
        'exitosos': queryset.filter(resultado='exitoso').count(),
        'rechazados': queryset.filter(resultado='rechazado').count(),
        'errores': queryset.filter(resultado='error').count(),
        'cajas_coinciden': queryset.filter(caja_coincide=True).count(),
    }
    
    return Response(stats)
