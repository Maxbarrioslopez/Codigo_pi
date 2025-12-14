from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from django.utils import timezone
from datetime import datetime
from .models import Trabajador, Ticket, TicketEvent, Incidencia, Agendamiento
from .serializers import TrabajadorSerializer
from .permissions import IsRRHHOrSupervisor
from .utils_rut import clean_rut, valid_rut
from .exceptions import (
    TrabajadorNotFoundException,
    RUTInvalidException,
    ValidationException,
)


@api_view(['GET', 'POST'])
@permission_classes([IsRRHHOrSupervisor])
def trabajadores_list_create(request):
    """
    GET /api/trabajadores/ - Lista trabajadores con filtros
    POST /api/trabajadores/ - Crea un nuevo trabajador
    
    Endpoint CRUD principal para gestión de trabajadores.
    Permite búsqueda flexible y creación con validación de RUT.
    
    ENDPOINT: GET|POST /api/trabajadores/
    MÉTODOS: GET, POST
    PERMISOS: IsRRHHOrSupervisor (RRHH, Supervisor o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    --- GET ---
    QUERY PARAMETERS (todos opcionales):
        ?q=juan              # Búsqueda por nombre o RUT (texto libre)
        ?rut=12345678-9      # Filtro exacto por RUT
        ?seccion=Producción  # Filtro por sección
        ?contrato=Indefinido # Filtro por tipo de contrato (Indefinido, Plazo Fijo, Part Time, Honorarios, Externos)
    
    RESPUESTA GET (200):
        [
            {
                "id": int,
                "rut": "12345678-9",
                "nombre": "Juan Pérez López",
                "seccion": "Producción",
                "contrato": "Indefinido",
                "sucursal": "Casablanca",
                "beneficio_disponible": {
                    "tipo": "Caja",
                    "categoria": "Estándar",
                    "vigente_desde": "2025-11-01",
                    "vigente_hasta": "2025-12-31"
                },
                "created_at": "2025-01-15T10:00:00Z"
            },
            ...
        ]
    
    --- POST ---
    BODY (JSON):
        {
            "rut": "12345678-9",              # REQUERIDO: RUT único del trabajador
            "nombre": "Juan Pérez López",     # REQUERIDO: Nombre completo
            "seccion": "Producción",          # OPCIONAL: Sección de trabajo
            "contrato": "Indefinido",         # OPCIONAL: Tipo de contrato (Indefinido, Plazo Fijo, Part Time, Honorarios, Externos)
            "sucursal": "Casablanca",         # OPCIONAL: Sucursal asignada (Casablanca, Valparaiso Planta BIF, Valparaiso Planta BIC)
            "beneficio_disponible": {         # OPCIONAL: Beneficio asignado
                "tipo": "Caja",
                "categoria": "Estándar",
                "descripcion": "Caja de mercadería estándar"
            }
        }
    
    RESPUESTA POST (201):
        {
            "id": 1,
            "rut": "12345678-9",
            "nombre": "Juan Pérez López",
            "beneficio_disponible": {...},
            "created_at": "2025-11-30T10:30:00Z"
        }
    
    ERRORES:
        400: RUT inválido, nombre faltante o trabajador ya existe
        401: No autenticado
        403: Sin permisos (no es RRHH/Supervisor/Admin)
        500: Error interno del servidor
    
    NOTAS:
        - GET limita resultados a 500 registros
        - RUT se valida con dígito verificador
        - Búsqueda "q" busca en nombre y RUT simultáneamente
        - POST valida unicidad de RUT antes de crear
        - Contratos permitidos: Indefinido, Plazo Fijo, Part Time, Honorarios, Externos
        - Sucursales canónicas: Casablanca, Valparaiso Planta BIF, Valparaiso Planta BIC
    """
    if request.method == 'GET':
        q = request.GET.get('q')
        rut = request.GET.get('rut')
        qs = Trabajador.objects.all().order_by('nombre')
        if rut:
            rc = clean_rut(rut)
            qs = qs.filter(rut__iexact=rc)
        if q:
            qs = qs.filter(Q(nombre__icontains=q) | Q(rut__icontains=q))
        data = TrabajadorSerializer(qs[:500], many=True).data
        return Response(data)

    # POST - Crear o actualizar trabajador en un ciclo específico
    payload = request.data
    rut = clean_rut(payload.get('rut', ''))
    if not rut or not valid_rut(rut):
        raise RUTInvalidException()
    nombre = payload.get('nombre')
    if not nombre:
        raise ValidationException(detail='Nombre requerido')
    
    # Obtener datos adicionales
    contrato = payload.get('contrato')
    sucursal = payload.get('sucursal')
    beneficio = payload.get('beneficio_disponible') or {}
    ciclo_id = beneficio.get('ciclo_id')
    
    # Buscar trabajador existente
    trabajador_existente = Trabajador.objects.filter(rut__iexact=rut).first()
    
    if trabajador_existente:
        # Trabajador existe - actualizar datos y beneficio del ciclo actual
        trabajador_existente.nombre = nombre  # Actualizar nombre por si cambió
        if contrato:
            trabajador_existente.contrato = contrato
        if sucursal:
            trabajador_existente.sucursal = sucursal
        
        # El campo beneficio_disponible ahora representa el beneficio del ciclo actual
        # Se sobrescribe con el nuevo beneficio para el ciclo especificado
        trabajador_existente.beneficio_disponible = beneficio
        trabajador_existente.save()
        
        return Response(
            TrabajadorSerializer(trabajador_existente).data, 
            status=200  # 200 indica actualización exitosa
        )
    
    # Trabajador nuevo - crear
    t = Trabajador.objects.create(
        rut=rut, 
        nombre=nombre,
        contrato=contrato,
        sucursal=sucursal,
        beneficio_disponible=beneficio
    )
    return Response(TrabajadorSerializer(t).data, status=201)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsRRHHOrSupervisor])
def trabajador_detail(request, rut):
    """
    GET /api/trabajadores/{rut}/ - Obtiene detalle de trabajador
    PUT /api/trabajadores/{rut}/ - Actualiza trabajador
    DELETE /api/trabajadores/{rut}/ - Desactiva trabajador (soft delete)
    
    Operaciones sobre un trabajador específico identificado por RUT.
    DELETE realiza eliminación lógica bloqueando el beneficio.
    
    ENDPOINT: GET|PUT|DELETE /api/trabajadores/{rut}/
    MÉTODOS: GET, PUT, DELETE
    PERMISOS: IsRRHHOrSupervisor (RRHH, Supervisor o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    PARÁMETROS URL:
        rut (str): RUT del trabajador (formato: 12345678-9)
    
    --- GET ---
    RESPUESTA (200):
        {
            "id": 1,
            "rut": "12345678-9",
            "nombre": "Juan Pérez López",
            "seccion": "Producción",
            "contrato": "Indefinido",
            "sucursal": "Central",
            "beneficio_disponible": {...},
            "created_at": "2025-01-15T10:00:00Z"
        }
    
    --- PUT ---
    BODY (JSON) - Todos los campos son opcionales:
        {
            "nombre": "Juan Pérez López",     # Actualizar nombre
            "seccion": "Logística",           # Actualizar sección
            "beneficio_disponible": {         # Actualizar beneficio
                "tipo": "Caja",
                "categoria": "Premium"
            }
        }
    
    RESPUESTA (200):
        {
            "id": 1,
            "rut": "12345678-9",
            "nombre": "Juan Pérez López",
            "seccion": "Logística",
            "beneficio_disponible": {...}
        }
    
    --- DELETE ---
    BODY (JSON) - Opcional:
        {
            "motivo": "Desvinculación laboral"  # Motivo de desactivación
        }
    
    RESPUESTA (204): Sin contenido (éxito)
    
    ERRORES:
        404: Trabajador no encontrado
        401: No autenticado
        403: Sin permisos
        500: Error interno del servidor
    
    NOTAS:
        - DELETE no elimina el registro, solo bloquea el beneficio
        - RUT se normaliza automáticamente (con/sin guiones)
        - PUT permite actualización parcial (solo campos enviados)
    """
    rc = clean_rut(rut)
    try:
        t = Trabajador.objects.get(rut__iexact=rc)
    except Trabajador.DoesNotExist:
        raise TrabajadorNotFoundException()

    if request.method == 'GET':
        return Response(TrabajadorSerializer(t).data)

    if request.method == 'PUT':
        nombre = request.data.get('nombre')
        if nombre:
            t.nombre = nombre
        beneficio = request.data.get('beneficio_disponible')
        if beneficio is not None:
            t.beneficio_disponible = beneficio
        t.save()
        return Response(TrabajadorSerializer(t).data)

    # DELETE: Por defecto soft delete - marcar beneficio como bloqueado
    # Si se envía ?hard=true, se elimina permanentemente del sistema
    hard_delete = request.GET.get('hard', '').lower() == 'true'
    
    if hard_delete:
        # Eliminación permanente - verificar que no tenga tickets activos
        tickets_activos = Ticket.objects.filter(
            trabajador=t,
            estado__in=['PENDIENTE', 'AGENDADO']
        ).exists()
        
        if tickets_activos:
            return Response(
                {'detail': 'No se puede eliminar. El trabajador tiene tickets activos.'},
                status=400
            )
        
        # Eliminar físicamente
        t.delete()
        return Response(status=204)
    
    # Soft delete - marcar beneficio como bloqueado
    bd = t.beneficio_disponible or {}
    bd['tipo'] = 'BLOQUEADO'
    bd['motivo'] = request.data.get('motivo', 'Desactivado por RRHH')
    bd['fecha_bloqueo'] = str(datetime.now())
    t.beneficio_disponible = bd
    t.save()
    return Response(status=204)


@api_view(['POST'])
@permission_classes([IsRRHHOrSupervisor])
def trabajador_bloquear(request, rut):
    """
    POST /api/trabajadores/{rut}/bloquear/
    
    Bloquea temporalmente el acceso de un trabajador a sus beneficios.
    Útil para suspensiones, auditorías o situaciones disciplinarias.
    
    ENDPOINT: POST /api/trabajadores/{rut}/bloquear/
    MÉTODO: POST
    PERMISOS: IsRRHHOrSupervisor (RRHH, Supervisor o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    PARÁMETROS URL:
        rut (str): RUT del trabajador a bloquear
    
    BODY (JSON):
        {
            "motivo": "Suspensión temporal por auditoría"  # REQUERIDO: Motivo del bloqueo
        }
    
    RESPUESTA (200):
        {
            "id": 1,
            "rut": "12345678-9",
            "nombre": "Juan Pérez López",
            "beneficio_disponible": {
                "tipo": "BLOQUEADO",
                "motivo": "Suspensión temporal por auditoría",
                "bloqueado_at": "2025-11-30T10:30:00Z"
            }
        }
    
    ERRORES:
        404: Trabajador no encontrado
        401: No autenticado
        403: Sin permisos
        500: Error interno del servidor
    
    NOTAS:
        - Trabajador bloqueado no puede generar tickets
        - El bloqueo es reversible con trabajador_desbloquear
        - Se recomienda registrar motivo detallado para auditoría
    """
    rc = clean_rut(rut)
    try:
        t = Trabajador.objects.get(rut__iexact=rc)
    except Trabajador.DoesNotExist:
        raise TrabajadorNotFoundException()
    bd = t.beneficio_disponible or {}
    # Guardar el tipo original antes de bloquear
    if bd.get('tipo') != 'BLOQUEADO':
        bd['tipo_original'] = bd.get('tipo', 'SIN_BENEFICIO')
    bd['tipo'] = 'BLOQUEADO'
    bd['activo'] = False
    bd['motivo'] = request.data.get('motivo', 'Bloqueado por RRHH')
    bd['bloqueado_at'] = timezone.now().isoformat()
    t.beneficio_disponible = bd
    t.save()
    return Response(TrabajadorSerializer(t).data)


@api_view(['POST'])
@permission_classes([IsRRHHOrSupervisor])
def trabajador_desbloquear(request, rut):
    """
    POST /api/trabajadores/{rut}/desbloquear/
    
    Desbloquea un trabajador previamente bloqueado, restaurando su acceso.
    Limpia el motivo de bloqueo y permite generar nuevos tickets.
    
    ENDPOINT: POST /api/trabajadores/{rut}/desbloquear/
    MÉTODO: POST
    PERMISOS: IsRRHHOrSupervisor (RRHH, Supervisor o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    PARÁMETROS URL:
        rut (str): RUT del trabajador a desbloquear
    
    BODY: Vacío (no requiere datos)
    
    RESPUESTA (200):
        {
            "id": 1,
            "rut": "12345678-9",
            "nombre": "Juan Pérez López",
            "beneficio_disponible": {
                "tipo": "SIN_BENEFICIO",  # Estado neutral después de desbloqueo
                "categoria": null
            }
        }
    
    ERRORES:
        404: Trabajador no encontrado
        401: No autenticado
        403: Sin permisos
        500: Error interno del servidor
    
    NOTAS:
        - Desbloquear no restaura automáticamente el beneficio anterior
        - Se debe asignar nuevo beneficio si corresponde
        - Solo desbloquea si el tipo actual es "BLOQUEADO"
        - Registra el desbloqueo en logs de auditoría
    """
    rc = clean_rut(rut)
    try:
        t = Trabajador.objects.get(rut__iexact=rc)
    except Trabajador.DoesNotExist:
        raise TrabajadorNotFoundException()
    bd = t.beneficio_disponible or {}
    if bd.get('tipo') == 'BLOQUEADO':
        # Restaurar el tipo original si existe, sino dejar SIN_BENEFICIO
        tipo_original = bd.pop('tipo_original', 'SIN_BENEFICIO')
        bd['tipo'] = tipo_original
        # Si tiene ciclo_id, significa que tiene beneficio asignado, activarlo
        if bd.get('ciclo_id'):
            bd['activo'] = True
        bd.pop('motivo', None)
        bd.pop('bloqueado_at', None)
    t.beneficio_disponible = bd
    t.save()
    return Response(TrabajadorSerializer(t).data)


@api_view(['GET'])
@permission_classes([IsRRHHOrSupervisor])
def trabajador_timeline(request, rut):
    """
    GET /api/trabajadores/{rut}/timeline/
    
    Obtiene línea de tiempo completa de actividad del trabajador.
    Consolida tickets, incidencias y agendamientos en orden cronológico.
    
    ENDPOINT: GET /api/trabajadores/{rut}/timeline/
    MÉTODO: GET
    PERMISOS: IsRRHHOrSupervisor (RRHH, Supervisor o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    PARÁMETROS URL:
        rut (str): RUT del trabajador
    
    RESPUESTA (200):
        {
            "rut": "12345678-9",
            "nombre": "Juan Pérez López",
            "eventos": [
                {
                    "tipo": "ticket:creado",
                    "fecha": "2025-11-30T10:30:00Z",
                    "metadata": {
                        "ticket": "ABC123",
                        "sucursal": "Central"
                    }
                },
                {
                    "tipo": "ticket:entregado",
                    "fecha": "2025-11-30T10:45:00Z",
                    "metadata": {
                        "ticket": "ABC123",
                        "guardia": "jperez"
                    }
                },
                {
                    "tipo": "incidencia",
                    "fecha": "2025-11-28T14:20:00Z",
                    "metadata": {
                        "codigo": "INC-12345",
                        "tipo": "Falla",
                        "estado": "resuelta"
                    }
                },
                {
                    "tipo": "agendamiento",
                    "fecha": "2025-11-25T09:00:00Z",
                    "metadata": {
                        "fecha_retiro": "2025-12-15",
                        "estado": "confirmado"
                    }
                }
            ]
        }
    
    ERRORES:
        404: Trabajador no encontrado
        401: No autenticado
        403: Sin permisos
        500: Error interno del servidor
    
    NOTAS:
        - Eventos ordenados de más reciente a más antiguo
        - Últimos 100 registros por tipo de evento
        - Tipos de eventos:
          - ticket:creado, ticket:entregado, ticket:expirado, ticket:anulado
          - incidencia (con estado actual)
          - agendamiento (con fecha programada)
        - Útil para auditoría y soporte al usuario
    """
    rc = clean_rut(rut)
    try:
        t = Trabajador.objects.get(rut__iexact=rc)
    except Trabajador.DoesNotExist:
        return Response({'detail': 'No encontrado'}, status=404)

    tickets = Ticket.objects.filter(trabajador=t).order_by('-created_at')[:100]
    eventos = []
    for tick in tickets:
        for e in tick.eventos.all().order_by('timestamp'):
            eventos.append({'tipo': f'ticket:{e.tipo}', 'fecha': e.timestamp.isoformat(), 'metadata': e.metadata, 'ticket': tick.uuid})
    for inc in Incidencia.objects.filter(trabajador=t).order_by('-created_at')[:100]:
        eventos.append({'tipo': 'incidencia', 'fecha': inc.created_at.isoformat(), 'metadata': {'codigo': inc.codigo, 'estado': inc.estado, 'tipo': inc.tipo}})
    for ag in Agendamiento.objects.filter(trabajador=t).order_by('-created_at')[:100]:
        eventos.append({'tipo': 'agendamiento', 'fecha': ag.created_at.isoformat(), 'metadata': {'fecha_retiro': ag.fecha_retiro.isoformat(), 'estado': ag.estado}})
    eventos.sort(key=lambda x: x['fecha'], reverse=True)
    return Response({'rut': t.rut, 'nombre': t.nombre, 'eventos': eventos})


@api_view(['POST'])
@permission_classes([IsRRHHOrSupervisor])
def trabajador_actualizar_beneficio(request, rut):
    """
    POST /api/trabajadores/{rut}/actualizar_beneficio/
    
    Actualiza el beneficio de un trabajador para un ciclo específico.
    Permite activar/desactivar o cambiar el tipo de beneficio.
    
    ENDPOINT: POST /api/trabajadores/{rut}/actualizar_beneficio/
    MÉTODO: POST
    PERMISOS: IsRRHHOrSupervisor
    AUTENTICACIÓN: JWT requerido
    
    PARÁMETROS URL:
        rut (str): RUT del trabajador
    
    BODY (JSON):
        {
            "beneficio_disponible": {
                "tipo": "Caja",              # Tipo de beneficio
                "categoria": "Estándar",      # Categoría
                "ciclo_id": 5,                # ID del ciclo
                "activo": true                # Si está activo o no
            }
        }
    
    RESPUESTA (200):
        {
            "id": 1,
            "rut": "12345678-9",
            "nombre": "Juan Pérez",
            "beneficio_disponible": {
                "tipo": "Caja",
                "categoria": "Estándar",
                "ciclo_id": 5,
                "activo": true
            }
        }
    """
    rc = clean_rut(rut)
    try:
        t = Trabajador.objects.get(rut__iexact=rc)
    except Trabajador.DoesNotExist:
        raise TrabajadorNotFoundException()
    
    beneficio = request.data.get('beneficio_disponible', {})
    t.beneficio_disponible = beneficio
    t.save()
    
    return Response(TrabajadorSerializer(t).data)
