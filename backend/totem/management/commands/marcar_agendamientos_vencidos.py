"""
Comando Django para marcar agendamientos vencidos.
Ejecutar: python manage.py marcar_agendamientos_vencidos
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from totem.services.agendamiento_service import AgendamientoService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Marca como vencidos los agendamientos pendientes con fecha pasada'
    
    def handle(self, *args, **options):
        service = AgendamientoService()
        cantidad = service.marcar_vencidos()
        
        if cantidad == 0:
            self.stdout.write(self.style.SUCCESS('No hay agendamientos vencidos.'))
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ {cantidad} agendamientos marcados como vencidos.'
                )
            )
