from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.core.management import call_command
import tempfile
from .permissions import IsRRHHOrSupervisor
from .models import NominaCarga
from .serializers import NominaCargaSerializer


@api_view(['POST'])
@permission_classes([IsRRHHOrSupervisor])
@parser_classes([MultiPartParser, FormParser])
def nomina_preview(request):
    """
    POST /api/nomina/preview/
    
    Valida un archivo de nómina sin realizar cambios en la base de datos (dry-run).
    Retorna resumen de errores y estadísticas de la carga potencial.
    
    ENDPOINT: POST /api/nomina/preview/
    MÉTODO: POST
    PERMISOS: IsRRHHOrSupervisor (RRHH, Supervisor o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    CONTENT-TYPE: multipart/form-data
    
    FORM DATA:
        archivo: [archivo CSV o Excel]       # REQUERIDO: Archivo de nómina
        actualizar: "1"                      # OPCIONAL: "1" para actualizar existentes
    
    FORMATO CSV ESPERADO:
        rut,nombre,seccion,contrato,sucursal,beneficio,observaciones
        12345678-9,Juan Pérez,Producción,Indefinido,Central,Caja Estándar,
        87654321-K,María González,Logística,Plazo Fijo,Norte,Caja Premium,VIP
        11111111-1,Pedro Soto,Administración,Indefinido,Central,SIN_BENEFICIO,Suspendido
    
    RESPUESTA (200):
        {
            "detail": "Validación OK (dry-run). Revise logs de salida en consola.",
            "resumen": {
                "total_registros": 150,
                "validos": 145,
                "invalidos": 5,
                "a_crear": 120,           # Trabajadores nuevos
                "a_actualizar": 25,       # Trabajadores existentes
                "sin_beneficio": 15,      # Con SIN_BENEFICIO o BLOQUEADO
                "errores": [
                    {
                        "fila": 23,
                        "rut": "12345678-X",
                        "error": "RUT inválido"
                    },
                    ...
                ]
            }
        }
    
    ERRORES:
        400: Archivo faltante o formato inválido
        401: No autenticado
        403: Sin permisos (no es RRHH/Supervisor/Admin)
        500: Error procesando archivo
    
    NOTAS:
        - Modo DRY-RUN: NO realiza cambios en la base de datos
        - Valida formato de RUT con dígito verificador
        - Detecta duplicados en el archivo
        - Identifica trabajadores existentes vs nuevos
        - Formatos soportados: CSV (.csv) y Excel (.xlsx, .xls)
        - Codificación CSV recomendada: UTF-8
        - actualizar="1": permite sobrescribir trabajadores existentes
        - Revise logs del servidor para detalle completo de validación
    """
    f = request.FILES.get('archivo')
    if not f:
        return Response({'detail': 'Falta archivo'}, status=400)
    actualizar = request.data.get('actualizar') in ['1', 'true', 'True']
    # Guardar temporalmente
    with tempfile.NamedTemporaryFile(suffix='.' + f.name.split('.')[-1], delete=False) as tmp:
        for chunk in f.chunks():
            tmp.write(chunk)
        tmp.flush()
        path = tmp.name
    # Ejecutar comando con --dry-run
    try:
        out = call_command('cargar_nomina', path, '--dry-run', '--actualizar' if actualizar else '')
    except Exception as e:
        return Response({'detail': f'Error validando archivo: {e}'}, status=400)
    return Response({'detail': 'Validación OK (dry-run). Revise logs de salida en consola.'})


@api_view(['POST'])
@permission_classes([IsRRHHOrSupervisor])
@parser_classes([MultiPartParser, FormParser])
def nomina_confirmar(request):
    """
    POST /api/nomina/confirmar/
    
    Ejecuta la carga definitiva de un archivo de nómina.
    Crea/actualiza trabajadores y registra la operación en auditoría.
    
    ENDPOINT: POST /api/nomina/confirmar/
    MÉTODO: POST
    PERMISOS: IsRRHHOrSupervisor (RRHH, Supervisor o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    CONTENT-TYPE: multipart/form-data
    
    FORM DATA:
        archivo: [archivo CSV o Excel]       # REQUERIDO: Archivo de nómina
        actualizar: "1"                      # OPCIONAL: "1" para actualizar existentes
    
    FORMATO CSV ESPERADO:
        rut,nombre,seccion,contrato,sucursal,beneficio,observaciones
        12345678-9,Juan Pérez,Producción,Indefinido,Central,Caja Estándar,
        87654321-K,María González,Logística,Plazo Fijo,Norte,Caja Premium,VIP
    
    RESPUESTA (200):
        {
            "detail": "Carga ejecutada exitosamente",
            "resumen": {
                "total_procesados": 145,
                "creados": 120,           # Trabajadores nuevos insertados
                "actualizados": 25,       # Trabajadores existentes modificados
                "sin_beneficio": 15,      # Marcados sin beneficio
                "errores": 0,             # Registros con errores críticos
                "tiempo_ejecucion_segundos": 4.5
            }
        }
    
    ERRORES:
        400: Archivo faltante, formato inválido o errores de validación
        401: No autenticado
        403: Sin permisos (no es RRHH/Supervisor/Admin)
        500: Error procesando archivo o fallo de base de datos
    
    NOTAS:
        - OPERACIÓN IRREVERSIBLE: modifica la base de datos
        - Se recomienda ejecutar nomina_preview primero
        - Operación transaccional: si falla un registro, se revierte todo
        - Crea registro en NominaCarga para auditoría
        - actualizar="1":
          - true: sobrescribe trabajadores existentes
          - false: solo crea nuevos, ignora existentes
        - Si trabajador existe y actualizar=false, se omite sin error
        - Procesa todas las columnas del formato esperado:
          - rut: único, validado con dígito verificador
          - nombre: obligatorio
          - seccion, contrato, sucursal: opcionales
          - beneficio: se parsea a estructura JSON
          - observaciones: texto libre
        - Revise logs del servidor para resumen detallado
    """
    f = request.FILES.get('archivo')
    if not f:
        return Response({'detail': 'Falta archivo'}, status=400)
    actualizar = request.data.get('actualizar') in ['1', 'true', 'True']
    with tempfile.NamedTemporaryFile(suffix='.' + f.name.split('.')[-1], delete=False) as tmp:
        for chunk in f.chunks():
            tmp.write(chunk)
        tmp.flush()
        path = tmp.name
    try:
        out = call_command('cargar_nomina', path, '--actualizar' if actualizar else '')
    except Exception as e:
        return Response({'detail': f'Error cargando archivo: {e}'}, status=400)
    return Response({'detail': 'Carga ejecutada. Revise resumen en consola.'})


@api_view(['GET'])
@permission_classes([IsRRHHOrSupervisor])
def nomina_historial(request):
    """
    GET /api/nomina/historial/
    
    Lista el historial de todas las cargas de nómina realizadas.
    Incluye métricas de cada carga para auditoría y trazabilidad.
    
    ENDPOINT: GET /api/nomina/historial/
    MÉTODO: GET
    PERMISOS: IsRRHHOrSupervisor (RRHH, Supervisor o Admin autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    QUERY PARAMETERS:
        ?ciclo=1  # OPCIONAL: Filtrar por ID de ciclo específico
    
    RESPUESTA (200):
        [
            {
                "id": 1,
                "ciclo": {
                    "id": 1,
                    "fecha_inicio": "2025-11-01",
                    "fecha_fin": "2025-12-31",
                    "activo": true
                },
                "usuario": {
                    "id": 1,
                    "username": "admin",
                    "email": "admin@example.com"
                },
                "archivo_nombre": "nomina_noviembre_2025.csv",
                "total_registros": 150,
                "creados": 120,
                "actualizados": 25,
                "sin_beneficio": 5,
                "observaciones": "Carga mensual regular",
                "fecha_carga": "2025-11-01T09:00:00Z"
            },
            {
                "id": 2,
                "ciclo": {...},
                "usuario": {...},
                "archivo_nombre": "nomina_octubre_2025.xlsx",
                "total_registros": 148,
                "creados": 5,
                "actualizados": 143,
                "sin_beneficio": 8,
                "observaciones": "Actualización de beneficios",
                "fecha_carga": "2025-10-01T09:15:00Z"
            },
            ...
        ]
    
    ERRORES:
        401: No autenticado
        403: Sin permisos (no es RRHH/Supervisor/Admin)
        404: Ciclo no encontrado (si se especifica ciclo inexistente)
        500: Error interno del servidor
    
    NOTAS:
        - Ordenamiento: más recientes primero
        - Incluye información del usuario que realizó la carga
        - Asociado al ciclo activo al momento de la carga
        - Métricas:
          - total_registros: filas procesadas en el archivo
          - creados: nuevos trabajadores insertados
          - actualizados: trabajadores existentes modificados
          - sin_beneficio: trabajadores marcados sin beneficio o bloqueados
        - archivo_nombre: nombre original del archivo subido
        - Útil para:
          - Auditoría de cambios masivos
          - Tracking de actualizaciones de nómina
          - Identificar cuándo se agregó/modificó un trabajador
    """
    qs = NominaCarga.objects.all()
    ciclo_id = request.query_params.get('ciclo')
    if ciclo_id:
        qs = qs.filter(ciclo_id=ciclo_id)
    serializer = NominaCargaSerializer(qs, many=True)
    return Response(serializer.data)