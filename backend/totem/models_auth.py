"""
Modelos extendidos para autenticación y perfiles de usuario.
Define roles (admin, rrhh, guardia, supervisor) y permisos asociados.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    """
    Usuario extendido del sistema.
    Hereda de AbstractUser para mantener compatibilidad con Django auth.
    """
    class Roles(models.TextChoices):
        ADMIN = 'admin', 'Administrador'
        RRHH = 'rrhh', 'Recursos Humanos'
        GUARDIA = 'guardia', 'Guardia'
        SUPERVISOR = 'supervisor', 'Supervisor'
    
    rol = models.CharField(
        max_length=20,
        choices=Roles.choices,
        default=Roles.GUARDIA,
        help_text="Rol del usuario en el sistema"
    )
    sucursal = models.ForeignKey(
        'totem.Sucursal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='usuarios',
        help_text="Sucursal asignada (para guardias principalmente)"
    )
    telefono = models.CharField(max_length=20, blank=True)
    activo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['username']
    
    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_rol_display()})"
    
    def es_admin(self):
        return self.rol == self.Roles.ADMIN or self.is_superuser
    
    def es_rrhh(self):
        return self.rol in [self.Roles.RRHH, self.Roles.ADMIN]
    
    def es_guardia(self):
        return self.rol == self.Roles.GUARDIA
    
    def es_supervisor(self):
        return self.rol in [self.Roles.SUPERVISOR, self.Roles.ADMIN]
