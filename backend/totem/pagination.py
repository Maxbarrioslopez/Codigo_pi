# -*- coding: utf-8 -*-
"""
Paginadores personalizados para el sistema.
Provee paginación flexible con límites configurables.
"""
from rest_framework.pagination import PageNumberPagination, LimitOffsetPagination
from rest_framework.response import Response
from collections import OrderedDict


class StandardResultsSetPagination(PageNumberPagination):
    """
    Paginación estándar por número de página.
    Default: 50 items por página, máximo 100.
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """
        Respuesta con metadata enriquecida.
        """
        return Response(OrderedDict([
            ('count', self.page.paginator.count),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('page', self.page.number),
            ('page_size', self.get_page_size(self.request)),
            ('total_pages', self.page.paginator.num_pages),
            ('results', data)
        ]))


class LargeResultsSetPagination(PageNumberPagination):
    """
    Paginación para conjuntos grandes de datos.
    Default: 100 items por página, máximo 500.
    """
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 500


class SmallResultsSetPagination(PageNumberPagination):
    """
    Paginación para conjuntos pequeños.
    Default: 10 items por página, máximo 50.
    Ideal para dashboards y vistas resumidas.
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class CustomLimitOffsetPagination(LimitOffsetPagination):
    """
    Paginación por offset/limit para cargas incrementales.
    Ideal para scroll infinito.
    """
    default_limit = 50
    max_limit = 200
    
    def get_paginated_response(self, data):
        """
        Respuesta con metadata enriquecida.
        """
        return Response(OrderedDict([
            ('count', self.count),
            ('next', self.get_next_link()),
            ('previous', self.get_previous_link()),
            ('limit', self.get_limit(self.request)),
            ('offset', self.get_offset(self.request)),
            ('results', data)
        ]))


class NoPagination(PageNumberPagination):
    """
    Desactiva paginación para endpoints específicos.
    Usar con precaución: solo para datasets pequeños garantizados.
    """
    page_size = None
    max_page_size = None
