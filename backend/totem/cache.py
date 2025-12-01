# -*- coding: utf-8 -*-
"""
Sistema de caché con Redis para optimizar rendimiento.
Provee decoradores y utilidades para cacheo inteligente.
"""
from functools import wraps
from django.core.cache import cache
from django.conf import settings
import hashlib
import json
import structlog

logger = structlog.get_logger(__name__)


def generate_cache_key(prefix, *args, **kwargs):
    """
    Genera una clave de caché única basada en argumentos.
    
    Args:
        prefix (str): Prefijo de la clave
        *args: Argumentos posicionales
        **kwargs: Argumentos con nombre
    
    Returns:
        str: Clave de caché única
    """
    # Convertir argumentos a string serializable
    key_parts = [str(prefix)]
    
    for arg in args:
        if hasattr(arg, 'id'):
            key_parts.append(f'{arg.__class__.__name__}:{arg.id}')
        else:
            key_parts.append(str(arg))
    
    for k, v in sorted(kwargs.items()):
        key_parts.append(f'{k}:{v}')
    
    # Hash para mantener longitud razonable
    key_string = ':'.join(key_parts)
    key_hash = hashlib.md5(key_string.encode()).hexdigest()
    
    return f'{prefix}:{key_hash}'


def cache_response(timeout=300, key_prefix='view'):
    """
    Decorador para cachear respuestas de vistas/funciones.
    
    Args:
        timeout (int): Tiempo de vida del caché en segundos (default: 5 minutos)
        key_prefix (str): Prefijo de la clave de caché
    
    Usage:
        @cache_response(timeout=600, key_prefix='trabajadores')
        def listar_trabajadores(request):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generar clave de caché
            cache_key = generate_cache_key(key_prefix, *args, **kwargs)
            
            # Intentar obtener del caché
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug("cache_hit", key=cache_key)
                return cached_result
            
            # Ejecutar función y cachear resultado
            logger.debug("cache_miss", key=cache_key)
            result = func(*args, **kwargs)
            cache.set(cache_key, result, timeout)
            
            return result
        return wrapper
    return decorator


def invalidate_cache(key_prefix, *args, **kwargs):
    """
    Invalida una clave de caché específica.
    
    Args:
        key_prefix (str): Prefijo de la clave
        *args: Argumentos para generar la clave
        **kwargs: Argumentos con nombre para generar la clave
    """
    cache_key = generate_cache_key(key_prefix, *args, **kwargs)
    cache.delete(cache_key)
    logger.info("cache_invalidated", key=cache_key)


def invalidate_pattern(pattern):
    """
    Invalida todas las claves que coincidan con un patrón.
    
    Args:
        pattern (str): Patrón de claves a invalidar (ej: 'trabajadores:*')
    
    Note:
        Requiere Redis como backend. No funciona con cache local.
    """
    try:
        from django_redis import get_redis_connection
        redis_conn = get_redis_connection("default")
        keys = redis_conn.keys(pattern)
        if keys:
            redis_conn.delete(*keys)
            logger.info("cache_pattern_invalidated", pattern=pattern, count=len(keys))
    except ImportError:
        logger.warning("redis_no_disponible_para_invalidacion_patron")
    except Exception as e:
        logger.error("error_invalidando_patron", pattern=pattern, error=str(e))


def cache_model_instance(model_name, instance_id, timeout=3600):
    """
    Cachea una instancia de modelo por su ID.
    
    Args:
        model_name (str): Nombre del modelo
        instance_id (int): ID de la instancia
        timeout (int): Tiempo de vida (default: 1 hora)
    
    Returns:
        Instance or None: Instancia cacheada o None
    """
    cache_key = f'model:{model_name}:{instance_id}'
    return cache.get(cache_key)


def set_model_cache(model_name, instance, timeout=3600):
    """
    Guarda instancia de modelo en caché.
    
    Args:
        model_name (str): Nombre del modelo
        instance: Instancia del modelo
        timeout (int): Tiempo de vida (default: 1 hora)
    """
    cache_key = f'model:{model_name}:{instance.id}'
    cache.set(cache_key, instance, timeout)
    logger.debug("model_cached", model=model_name, id=instance.id)


def invalidate_model_cache(model_name, instance_id):
    """
    Invalida caché de una instancia específica.
    
    Args:
        model_name (str): Nombre del modelo
        instance_id (int): ID de la instancia
    """
    cache_key = f'model:{model_name}:{instance_id}'
    cache.delete(cache_key)
    logger.debug("model_cache_invalidated", model=model_name, id=instance_id)


class CacheManager:
    """
    Gestor centralizado de caché con estrategias específicas.
    """
    
    # Timeouts por tipo de dato (en segundos)
    TIMEOUTS = {
        'trabajador': 3600,  # 1 hora
        'ciclo': 1800,  # 30 minutos
        'ticket': 300,  # 5 minutos
        'stock': 60,  # 1 minuto
        'parametros': 3600,  # 1 hora
        'reportes': 600,  # 10 minutos
        'estadisticas': 300,  # 5 minutos
    }
    
    @classmethod
    def get(cls, key, default=None):
        """Obtiene valor del caché."""
        return cache.get(key, default)
    
    @classmethod
    def set(cls, key, value, timeout=None, cache_type='default'):
        """
        Guarda valor en caché con timeout apropiado.
        
        Args:
            key (str): Clave de caché
            value: Valor a cachear
            timeout (int): Timeout personalizado (opcional)
            cache_type (str): Tipo de dato para timeout automático
        """
        if timeout is None:
            timeout = cls.TIMEOUTS.get(cache_type, 300)
        
        cache.set(key, value, timeout)
        logger.debug("cache_set", key=key, timeout=timeout)
    
    @classmethod
    def delete(cls, key):
        """Elimina valor del caché."""
        cache.delete(key)
        logger.debug("cache_deleted", key=key)
    
    @classmethod
    def get_or_set(cls, key, callback, timeout=None, cache_type='default'):
        """
        Obtiene del caché o ejecuta callback y cachea resultado.
        
        Args:
            key (str): Clave de caché
            callback (callable): Función a ejecutar si no existe en caché
            timeout (int): Timeout personalizado (opcional)
            cache_type (str): Tipo de dato
        
        Returns:
            Valor cacheado o resultado del callback
        """
        value = cache.get(key)
        if value is not None:
            logger.debug("cache_hit", key=key)
            return value
        
        logger.debug("cache_miss", key=key)
        value = callback()
        
        if timeout is None:
            timeout = cls.TIMEOUTS.get(cache_type, 300)
        
        cache.set(key, value, timeout)
        return value
    
    @classmethod
    def clear_all(cls):
        """Limpia todo el caché. Usar con precaución."""
        cache.clear()
        logger.warning("cache_cleared_all")


# Atajos para operaciones comunes
def cache_trabajador(trabajador, timeout=3600):
    """Cachea trabajador por RUT."""
    key = f'trabajador:rut:{trabajador.rut}'
    cache.set(key, trabajador, timeout)


def get_cached_trabajador(rut):
    """Obtiene trabajador cacheado por RUT."""
    key = f'trabajador:rut:{rut}'
    return cache.get(key)


def cache_ciclo_activo(ciclo, timeout=1800):
    """Cachea ciclo activo."""
    key = 'ciclo:activo'
    cache.set(key, ciclo, timeout)


def get_cached_ciclo_activo():
    """Obtiene ciclo activo cacheado."""
    key = 'ciclo:activo'
    return cache.get(key)


def invalidate_ciclo_activo():
    """Invalida caché de ciclo activo."""
    cache.delete('ciclo:activo')


def cache_stock_resumen(data, timeout=60):
    """Cachea resumen de stock."""
    key = 'stock:resumen'
    cache.set(key, data, timeout)


def get_cached_stock_resumen():
    """Obtiene resumen de stock cacheado."""
    key = 'stock:resumen'
    return cache.get(key)
