"""
Permisos personalizados para DRF basados en roles.
"""
from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Permiso para usuarios con rol Admin.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.es_admin()


class IsRRHH(permissions.BasePermission):
    """
    Permiso para usuarios con rol RRHH o Admin.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.es_rrhh()


class IsGuardia(permissions.BasePermission):
    """
    Permiso para usuarios con rol Guardia.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.es_guardia()


class IsSupervisor(permissions.BasePermission):
    """
    Permiso para usuarios con rol Supervisor o Admin.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.es_supervisor()


class IsGuardiaOrAdmin(permissions.BasePermission):
    """
    Permiso para Guardia o Admin.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.es_guardia() or request.user.es_admin()
        )


class IsRRHHOrSupervisor(permissions.BasePermission):
    """
    Permiso para RRHH, Supervisor o Admin.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.es_rrhh() or request.user.es_supervisor()
        )


class AllowTotem(permissions.BasePermission):
    """
    Permiso público para endpoints del tótem (sin autenticación).
    """
    def has_permission(self, request, view):
        return True
