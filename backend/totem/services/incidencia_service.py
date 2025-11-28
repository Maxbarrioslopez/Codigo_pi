"""
Servicio de lógica de negocio para Incidencias.
"""
import logging
import uuid as uuid_lib
from typing import List, Dict, Optional

from django.db import transaction
from django.utils import timezone

from totem.models import Incidencia, Trabajador
from totem.validators import RUTValidator
from totem.exceptions import TrabajadorNotFoundException

logger = logging.getLogger(__name__)


class IncidenciaService:
    """
    Servicio para gestión de incidencias.
    """
    
    @transaction.atomic
    def crear_incidencia(
        self,
        trabajador_rut: str,
        tipo: str,
        descripcion: str = '',
        origen: str = 'totem',
        metadata: Dict = None
    ) -> Incidencia:
        """
        Crea una nueva incidencia.
        
        Args:
            trabajador_rut: RUT del trabajador (puede ser vacío para incidencias anónimas)
            tipo: Tipo de incidencia
            descripcion: Descripción detallada
            origen: Origen de la incidencia (totem, guardia, rrhh)
            metadata: Información adicional
            
        Returns:
            Incidencia creada
        """
        logger.info(f"Creando incidencia tipo '{tipo}' desde {origen}")
        
        trabajador = None
        if trabajador_rut:
            rut_limpio = RUTValidator.limpiar_rut(trabajador_rut)
            try:
                trabajador = Trabajador.objects.get(rut=rut_limpio)
            except Trabajador.DoesNotExist:
                # No bloquear creación si trabajador no existe
                logger.warning(f"Incidencia creada con RUT no registrado: {rut_limpio}")
        
        # Generar código único
        codigo = f"INC-{uuid_lib.uuid4().hex[:8].upper()}"
        
        incidencia = Incidencia.objects.create(
            codigo=codigo,
            trabajador=trabajador,
            tipo=tipo,
            descripcion=descripcion,
            estado='pendiente',
            creada_por=origen,
            metadata=metadata or {}
        )
        
        logger.info(f"Incidencia {codigo} creada exitosamente")
        return incidencia
    
    def obtener_incidencia(self, codigo: str) -> Incidencia:
        """
        Obtiene una incidencia por su código.
        
        Args:
            codigo: Código de la incidencia
            
        Returns:
            Incidencia
        """
        try:
            return Incidencia.objects.select_related('trabajador').get(codigo=codigo)
        except Incidencia.DoesNotExist:
            raise ValueError(f"Incidencia {codigo} no encontrada")
    
    def listar_incidencias(
        self,
        trabajador_rut: str = None,
        estado: str = None,
        tipo: str = None,
        limit: int = 50
    ) -> List[Incidencia]:
        """
        Lista incidencias con filtros opcionales.
        
        Args:
            trabajador_rut: Filtrar por RUT
            estado: Filtrar por estado
            tipo: Filtrar por tipo
            limit: Límite de resultados
            
        Returns:
            Lista de incidencias
        """
        queryset = Incidencia.objects.select_related('trabajador').all()
        
        if trabajador_rut:
            rut_limpio = RUTValidator.limpiar_rut(trabajador_rut)
            queryset = queryset.filter(trabajador__rut=rut_limpio)
        
        if estado:
            queryset = queryset.filter(estado=estado)
        
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        
        return list(queryset.order_by('-created_at')[:limit])
    
    @transaction.atomic
    def actualizar_estado(
        self,
        codigo: str,
        nuevo_estado: str,
        notas: str = ''
    ) -> Incidencia:
        """
        Actualiza el estado de una incidencia.
        
        Args:
            codigo: Código de la incidencia
            nuevo_estado: Nuevo estado
            notas: Notas adicionales
            
        Returns:
            Incidencia actualizada
        """
        incidencia = self.obtener_incidencia(codigo)
        
        estado_anterior = incidencia.estado
        incidencia.estado = nuevo_estado
        
        # Si se resuelve, registrar timestamp
        if nuevo_estado == 'resuelta':
            incidencia.resolved_at = timezone.now()
        
        # Agregar notas a metadata
        if notas:
            if 'historial' not in incidencia.metadata:
                incidencia.metadata['historial'] = []
            incidencia.metadata['historial'].append({
                'timestamp': timezone.now().isoformat(),
                'estado_anterior': estado_anterior,
                'estado_nuevo': nuevo_estado,
                'notas': notas
            })
        
        incidencia.save()
        
        logger.info(f"Incidencia {codigo} actualizada: {estado_anterior} → {nuevo_estado}")
        return incidencia
    
    def obtener_estadisticas(self) -> Dict:
        """
        Obtiene estadísticas generales de incidencias.
        
        Returns:
            Diccionario con estadísticas
        """
        from django.db.models import Count
        
        stats = {
            'total': Incidencia.objects.count(),
            'por_estado': dict(
                Incidencia.objects.values('estado')
                .annotate(cantidad=Count('id'))
                .values_list('estado', 'cantidad')
            ),
            'por_tipo': dict(
                Incidencia.objects.values('tipo')
                .annotate(cantidad=Count('id'))
                .order_by('-cantidad')[:10]
                .values_list('tipo', 'cantidad')
            ),
            'pendientes': Incidencia.objects.filter(estado='pendiente').count(),
            'resueltas_hoy': Incidencia.objects.filter(
                estado='resuelta',
                resolved_at__date=timezone.now().date()
            ).count()
        }
        
        return stats
