from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import Ciclo, Ticket, TipoBeneficio
from .serializers import CicloSerializer, TipoBeneficioSerializer
from .permissions import IsRRHHOrSupervisor


@api_view(['GET', 'POST'])
@permission_classes([IsRRHHOrSupervisor])
def ciclos_list_create(request):
    """
    GET /api/ciclos/ - Lista todos los ciclos bimensuales
    POST /api/ciclos/ - Crea un nuevo ciclo bimensual
    
    Gestión de ciclos de retiro de beneficios (períodos bimensuales).
    Solo puede existir un ciclo activo a la vez.
    
    ENDPOINT: GET|POST /api/ciclos/
    MÉTODOS: GET, POST
    PERMISOS: IsRRHHOrSupervisor (RRHH, Supervisor o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    --- GET ---
    RESPUESTA (200):
        [
            {
                "id": 1,
                "fecha_inicio": "2025-11-01",
                "fecha_fin": "2025-12-31",
                "activo": true,
                "dias_restantes": 31
            },
            {
                "id": 2,
                "fecha_inicio": "2025-09-01",
                "fecha_fin": "2025-10-31",
                "activo": false,
                "dias_restantes": 0
            }
        ]
    
    --- POST ---
    BODY (JSON):
        {
            "fecha_inicio": "2025-12-01",  # REQUERIDO: Fecha inicio (YYYY-MM-DD)
            "fecha_fin": "2026-01-31"      # REQUERIDO: Fecha fin (YYYY-MM-DD)
        }
    
    RESPUESTA (201):
        {
            "id": 3,
            "fecha_inicio": "2025-12-01",
            "fecha_fin": "2026-01-31",
            "activo": true,
            "dias_restantes": 62
        }
    
    ERRORES:
        400: Fechas inválidas (fin antes de inicio, formato incorrecto)
        401: No autenticado
        403: Sin permisos (no es RRHH/Supervisor/Admin)
        500: Error interno del servidor
    
    NOTAS:
        - POST desactiva automáticamente el ciclo activo anterior
        - fecha_fin debe ser posterior a fecha_inicio
        - Formato de fechas: YYYY-MM-DD (ISO 8601)
        - Ordenamiento GET: más recientes primero
        - dias_restantes se calcula dinámicamente desde fecha actual
    """
    if request.method == 'GET':
        qs = Ciclo.objects.all().order_by('-id')
        return Response(CicloSerializer(qs, many=True).data)
    # POST crear
    serializer = CicloSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    # desactivar ciclo activo
    Ciclo.objects.filter(activo=True).update(activo=False)
    serializer.save(activo=True)
    return Response(serializer.data, status=201)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsRRHHOrSupervisor])
def ciclo_detail_update(request, ciclo_id):
    """
    GET /api/ciclos/{id}/ - Obtiene detalle de un ciclo
    PUT /api/ciclos/{id}/ - Actualiza un ciclo existente
    
    Operaciones sobre un ciclo específico.
    Permite modificar fechas y estado activo.
    
    ENDPOINT: GET|PUT /api/ciclos/{id}/
    MÉTODOS: GET, PUT
    PERMISOS: IsRRHHOrSupervisor (RRHH, Supervisor o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    PARÁMETROS URL:
        ciclo_id (int): ID del ciclo
    
    --- GET ---
    RESPUESTA (200):
        {
            "id": 1,
            "fecha_inicio": "2025-11-01",
            "fecha_fin": "2025-12-31",
            "activo": true,
            "dias_restantes": 31
        }
    
    --- PUT ---
    BODY (JSON) - Todos los campos son opcionales:
        {
            "fecha_inicio": "2025-11-01",  # Actualizar fecha inicio
            "fecha_fin": "2025-12-31",     # Actualizar fecha fin
            "activo": false                # Cambiar estado activo
        }
    
    RESPUESTA (200):
        {
            "id": 1,
            "fecha_inicio": "2025-11-01",
            "fecha_fin": "2025-12-31",
            "activo": false,
            "dias_restantes": 31
        }
    
    ERRORES:
        404: Ciclo no encontrado
        400: Fechas inválidas
        401: No autenticado
        403: Sin permisos
        500: Error interno del servidor
    
    NOTAS:
        - PUT permite actualización parcial (solo campos enviados)
        - Desactivar un ciclo no lo elimina
        - Cuidado al activar manualmente: puede generar múltiples ciclos activos
    """
    try:
        c = Ciclo.objects.get(id=ciclo_id)
    except Ciclo.DoesNotExist:
        return Response({'detail': 'No encontrado'}, status=404)
    
    if request.method == 'GET':
        return Response(CicloSerializer(c).data)
    
    if request.method == 'DELETE':
        # Cerrar ciclo (desactivar)
        c.activo = False
        c.save()
        return Response({
            'detail': 'Ciclo cerrado exitosamente',
            'ciclo': CicloSerializer(c).data
        })
    
    # PUT
    for f in ['fecha_inicio', 'fecha_fin', 'activo', 'nombre', 'descripcion']:
        if f in request.data:
            setattr(c, f, request.data[f])
    
    # Actualizar beneficios si se envían (soporta ambos formatos)
    if 'beneficios_activos_ids' in request.data:
        beneficio_ids = request.data['beneficios_activos_ids']
        c.beneficios_activos.set(beneficio_ids)
    elif 'beneficios_activos' in request.data:
        beneficio_ids = request.data['beneficios_activos']
        c.beneficios_activos.set(beneficio_ids)
    
    c.save()
    return Response(CicloSerializer(c).data)


@api_view(['POST'])
@permission_classes([IsRRHHOrSupervisor])
def ciclo_cerrar(request, ciclo_id):
    """
    POST /api/ciclos/{id}/cerrar/
    
    Cierra un ciclo bimensual, desactivándolo para nuevos retiros.
    Operación administrativa al finalizar un período.
    
    ENDPOINT: POST /api/ciclos/{id}/cerrar/
    MÉTODO: POST
    PERMISOS: IsRRHHOrSupervisor (RRHH, Supervisor o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    PARÁMETROS URL:
        ciclo_id (int): ID del ciclo a cerrar
    
    BODY: Vacío (no requiere datos)
    
    RESPUESTA (200):
        {
            "detail": "Ciclo cerrado",
            "id": 1,
            "fecha_inicio": "2025-11-01",
            "fecha_fin": "2025-12-31",
            "activo": false
        }
    
    ERRORES:
        404: Ciclo no encontrado
        401: No autenticado
        403: Sin permisos
        500: Error interno del servidor
    
    NOTAS:
        - Equivalente a PUT con activo=false pero semánticamente más claro
        - Tickets generados antes del cierre siguen válidos
        - Ciclo cerrado queda disponible para reportes históricos
        - Se recomienda cerrar ciclo antes de crear uno nuevo
    """
    try:
        c = Ciclo.objects.get(id=ciclo_id)
    except Ciclo.DoesNotExist:
        return Response({'detail': 'No encontrado'}, status=404)
    c.activo = False
    c.save()
    return Response({'detail': 'Ciclo cerrado'})


@api_view(['GET'])
@permission_classes([IsRRHHOrSupervisor])
def ciclo_estadisticas(request, ciclo_id):
    """
    GET /api/ciclos/{id}/estadisticas/
    
    Obtiene estadísticas completas de tickets para un ciclo específico.
    Incluye totales por estado y tasas de entrega/expiración.
    
    ENDPOINT: GET /api/ciclos/{id}/estadisticas/
    MÉTODO: GET
    PERMISOS: IsRRHHOrSupervisor (RRHH, Supervisor o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    PARÁMETROS URL:
        ciclo_id (int): ID del ciclo
    
    RESPUESTA (200):
        {
            "id": 1,
            "fecha_inicio": "2025-11-01",
            "fecha_fin": "2025-12-31",
            "activo": true,
            "total_tickets": 450,
            "entregados": 320,
            "pendientes": 85,
            "expirados": 30,
            "anulados": 15,
            "tasa_entrega": 71.1,      # Porcentaje de entregados
            "tasa_expiracion": 6.7     # Porcentaje de expirados
        }
    
    ERRORES:
        404: Ciclo no encontrado
        401: No autenticado
        403: Sin permisos
        500: Error interno del servidor
    
    NOTAS:
        - Tasas calculadas sobre total_tickets
        - tasa_entrega = (entregados / total) * 100
        - tasa_expiracion = (expirados / total) * 100
        - Útil para evaluar eficiencia del sistema por período
        - Incluye todos los estados: pendiente, entregado, expirado, anulado
    """
    try:
        c = Ciclo.objects.get(id=ciclo_id)
    except Ciclo.DoesNotExist:
        return Response({'detail': 'No encontrado'}, status=404)
    tickets = Ticket.objects.filter(ciclo=c)
    total = tickets.count()
    entregados = tickets.filter(estado='entregado').count()
    pendientes = tickets.filter(estado='pendiente').count()
    expirados = tickets.filter(estado='expirado').count()
    return Response({
        'id': c.id,
        'fecha_inicio': c.fecha_inicio,
        'fecha_fin': c.fecha_fin,
        'activo': c.activo,
        'total_tickets': total,
        'entregados': entregados,
        'pendientes': pendientes,
        'expirados': expirados,
    })


# ============================================================================
# ENDPOINTS DE TIPOS DE BENEFICIOS
# ============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsRRHHOrSupervisor])
def tipos_beneficio_list_create(request):
    """
    GET /api/tipos-beneficio/ - Lista todos los tipos de beneficios
    POST /api/tipos-beneficio/ - Crea un nuevo tipo de beneficio
    
    Gestión de tipos de beneficios disponibles (Cajas, Paseos, etc.).
    
    ENDPOINT: GET|POST /api/tipos-beneficio/
    MÉTODOS: GET, POST
    PERMISOS: IsRRHHOrSupervisor
    AUTENTICACIÓN: JWT requerido
    
    --- GET ---
    RESPUESTA (200):
        [
            {
                "id": 1,
                "nombre": "Caja de Navidad",
                "descripcion": "Caja premium o estándar",
                "activo": true,
                "created_at": "2025-01-01T10:00:00Z"
            },
            {
                "id": 2,
                "nombre": "Paseo Familiar",
                "descripcion": "Tickets para paseos con la familia",
                "activo": true,
                "created_at": "2025-01-01T10:00:00Z"
            }
        ]
    
    --- POST ---
    BODY (JSON):
        {
            "nombre": "Bono Escolar",          # REQUERIDO
            "descripcion": "Bono para útiles", # OPCIONAL
            "activo": true                     # OPCIONAL (default: true)
        }
    
    RESPUESTA (201):
        {
            "id": 3,
            "nombre": "Bono Escolar",
            "descripcion": "Bono para útiles",
            "activo": true,
            "created_at": "2025-12-04T11:30:00Z"
        }
    """
    if request.method == 'GET':
        tipos = TipoBeneficio.objects.all()
        return Response(TipoBeneficioSerializer(tipos, many=True).data)
    
    # POST
    serializer = TipoBeneficioSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save()
    return Response(serializer.data, status=201)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsRRHHOrSupervisor])
def tipo_beneficio_detail(request, tipo_id):
    """
    GET /api/tipos-beneficio/{id}/ - Detalle de tipo de beneficio
    PUT /api/tipos-beneficio/{id}/ - Actualizar tipo de beneficio
    DELETE /api/tipos-beneficio/{id}/ - Eliminar tipo de beneficio
    
    Operaciones sobre un tipo de beneficio específico.
    
    ENDPOINT: GET|PUT|DELETE /api/tipos-beneficio/{id}/
    MÉTODOS: GET, PUT, DELETE
    PERMISOS: IsRRHHOrSupervisor
    AUTENTICACIÓN: JWT requerido
    
    --- PUT ---
    BODY (JSON) - Campos opcionales:
        {
            "nombre": "Caja de Navidad Premium",
            "descripcion": "Descripción actualizada",
            "activo": false
        }
    
    --- DELETE ---
    Elimina permanentemente el tipo de beneficio.
    NOTA: Fallará si hay ciclos asociados.
    """
    try:
        tipo = TipoBeneficio.objects.get(id=tipo_id)
    except TipoBeneficio.DoesNotExist:
        return Response({'detail': 'No encontrado'}, status=404)
    
    if request.method == 'GET':
        return Response(TipoBeneficioSerializer(tipo).data)
    
    elif request.method == 'PUT':
        serializer = TipoBeneficioSerializer(tipo, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        tipo.delete()
        return Response(status=204)
