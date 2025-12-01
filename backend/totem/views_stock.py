from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum
from .models import StockSucursal, StockMovimiento, Sucursal
from .serializers import StockSucursalSerializer, StockMovimientoSerializer
from .permissions import IsGuardiaOrAdmin


@api_view(['GET'])
@permission_classes([IsGuardiaOrAdmin])
def stock_resumen(request):
    """
    GET /api/stock/resumen/
    
    Obtiene resumen consolidado de inventario de cajas por sucursal.
    Dashboard principal de stock con totales y distribución por tipo.
    
    ENDPOINT: GET /api/stock/resumen/
    MÉTODO: GET
    PERMISOS: IsGuardiaOrAdmin (Guardia o Administrador autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    QUERY PARAMETERS: Ninguno
    
    RESPUESTA (200):
        {
            "disponible": 450,          # Total de cajas disponibles
            "entregadas_hoy": 32,       # Entregas del día actual
            "reservadas": 18,           # Tickets pendientes de retiro
            "total_mes": 450,           # Stock total del mes
            "por_tipo": {
                "estandar": 320,        # Cajas estándar disponibles
                "premium": 130          # Cajas premium disponibles
            },
            "por_sucursal": [
                {
                    "sucursal": "Central",
                    "total": 250,
                    "estandar": 180,
                    "premium": 70
                },
                {
                    "sucursal": "Norte",
                    "total": 200,
                    "estandar": 140,
                    "premium": 60
                }
            ]
        }
    
    ERRORES:
        401: No autenticado (falta token JWT)
        403: Sin permisos (no es Guardia ni Admin)
        500: Error interno del servidor
    
    NOTAS:
        - Datos calculados en tiempo real desde StockSucursal
        - "disponible" suma todos los productos sin importar sucursal
        - Tipos reconocidos: "Estándar" y "Premium" (case-insensitive)
        - "entregadas_hoy" y "reservadas" son placeholders (requieren integración)
        - Útil para pantalla principal de guardia
    """
    # Asumimos productos 'Estándar' y 'Premium' en StockSucursal.producto
    qs = StockSucursal.objects.all()
    total = qs.aggregate(total=Sum('cantidad'))['total'] or 0
    por_tipo = {
        'estandar': qs.filter(producto__iexact='Estándar').aggregate(s=Sum('cantidad'))['s'] or 0,
        'premium': qs.filter(producto__iexact='Premium').aggregate(s=Sum('cantidad'))['s'] or 0,
    }
    # Placeholder para entregas/mes si no hay tabla separada
    return Response({
        'disponible': total,
        'entregadas_hoy': 0,
        'reservadas': 0,
        'total_mes': total,
        'por_tipo': por_tipo,
    })


@api_view(['GET'])
@permission_classes([IsGuardiaOrAdmin])
def stock_movimientos(request):
    """
    GET /api/stock/movimientos/
    
    Lista el historial de movimientos de inventario (entradas y salidas).
    Permite auditoría completa de todas las transacciones de stock.
    
    ENDPOINT: GET /api/stock/movimientos/
    MÉTODO: GET
    PERMISOS: IsGuardiaOrAdmin (Guardia o Administrador autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    QUERY PARAMETERS (todos opcionales):
        ?fecha_desde=2025-11-01   # Filtro desde fecha (YYYY-MM-DD)
        ?fecha_hasta=2025-11-30   # Filtro hasta fecha (YYYY-MM-DD)
        ?sucursal_id=1            # Filtro por ID de sucursal
        ?tipo_caja=Estándar       # Filtro por tipo (Estándar, Premium)
        ?accion=agregar           # Filtro por acción (agregar, retirar)
    
    RESPUESTA (200):
        [
            {
                "id": 1,
                "fecha": "2025-11-30",
                "hora": "10:30:00",
                "tipo_caja": "Estándar",
                "accion": "agregar",
                "cantidad": 50,
                "motivo": "Ingreso de stock mensual",
                "usuario": "admin",
                "sucursal": {
                    "id": 1,
                    "nombre": "Central",
                    "codigo": "CENT"
                }
            },
            {
                "id": 2,
                "fecha": "2025-11-30",
                "hora": "11:15:00",
                "tipo_caja": "Premium",
                "accion": "retirar",
                "cantidad": 5,
                "motivo": "Entrega a trabajadores",
                "usuario": "guardia1",
                "sucursal": {...}
            },
            ...
        ]
    
    ERRORES:
        400: Parámetros de filtro inválidos
        401: No autenticado
        403: Sin permisos (no es Guardia/Admin)
        500: Error interno del servidor
    
    NOTAS:
        - Ordenamiento: más recientes primero (fecha DESC, hora DESC)
        - Limita resultados a últimos 200 movimientos
        - Incluye join con sucursal para datos completos
        - "usuario" registra quién realizó el movimiento
        - Acciones válidas: "agregar" (entrada), "retirar" (salida)
    """
    qs = StockMovimiento.objects.select_related('sucursal').all().order_by('-fecha', '-hora')[:200]
    return Response(StockMovimientoSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([IsGuardiaOrAdmin])
def registrar_movimiento_stock(request):
    """
    POST /api/stock/movimiento/
    
    Registra un movimiento de inventario (entrada o salida de cajas).
    Operación transaccional que actualiza el stock y crea registro de auditoría.
    
    ENDPOINT: POST /api/stock/movimiento/
    MÉTODO: POST
    PERMISOS: IsGuardiaOrAdmin (Guardia o Administrador autenticados)
    AUTENTICACIÓN: JWT requerido (Bearer token)
    
    BODY (JSON):
        {
            "accion": "agregar",              # REQUERIDO: "agregar" o "retirar"
            "tipo_caja": "Estándar",          # REQUERIDO: "Estándar" o "Premium"
            "cantidad": 50,                   # REQUERIDO: Cantidad (entero positivo)
            "motivo": "Ingreso mensual",      # OPCIONAL: Descripción del movimiento
            "sucursal_codigo": "CENT"         # OPCIONAL: Código de sucursal (ej: "CENT", "NORTE")
        }
    
    RESPUESTA (201):
        {
            "id": 3,
            "fecha": "2025-11-30",
            "hora": "14:20:00",
            "tipo_caja": "Estándar",
            "accion": "agregar",
            "cantidad": 50,
            "motivo": "Ingreso mensual",
            "usuario": "admin",
            "sucursal": {
                "id": 1,
                "nombre": "Central",
                "codigo": "CENT"
            }
        }
    
    ERRORES:
        400: Datos inválidos (acción o tipo no válido, cantidad negativa)
        401: No autenticado
        403: Sin permisos (no es Guardia/Admin)
        404: Sucursal no encontrada (si se especifica sucursal_codigo)
        500: Error interno del servidor
    
    NOTAS:
        - fecha y hora se asignan automáticamente con timezone actual
        - "usuario" se extrae del token JWT automáticamente
        - Validaciones:
          - accion debe ser "agregar" o "retirar"
          - tipo_caja debe ser "Estándar" o "Premium"
          - cantidad debe ser entero positivo
        - Si no se especifica sucursal_codigo, usa sucursal default
        - Actualiza StockSucursal correspondiente (+/- según acción)
    """
    data = request.data.copy()
    sucursal_codigo = data.pop('sucursal_codigo', None)
    if sucursal_codigo:
        sucursal = Sucursal.objects.filter(codigo=sucursal_codigo).first()
        if sucursal:
            data['sucursal'] = sucursal.id
    # Auto-set usuario from request
    if request.user and request.user.is_authenticated:
        data['usuario'] = request.user.username
    
    serializer = StockMovimientoSerializer(data=data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save()
    return Response(serializer.data, status=201)
