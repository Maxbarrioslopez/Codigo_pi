"""
Comando Django para marcar tickets expirados.
Ejecutar: python manage.py expirar_tickets
Se puede configurar como cron job para ejecutar cada 5-10 minutos.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from totem.models import Ticket, TicketEvent
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Marca como expirados los tickets pendientes que han superado su TTL'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra los tickets a expirar sin modificar la base de datos',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        ahora = timezone.now()
        
        # Buscar tickets pendientes con TTL expirado
        tickets_expirados = Ticket.objects.filter(
            estado='pendiente',
            ttl_expira_at__lt=ahora
        ).select_related('trabajador')
        
        cantidad = tickets_expirados.count()
        
        if cantidad == 0:
            self.stdout.write(self.style.SUCCESS('No hay tickets expirados.'))
            return
        
        self.stdout.write(f'Encontrados {cantidad} tickets expirados:')
        
        for ticket in tickets_expirados:
            tiempo_expirado = (ahora - ticket.ttl_expira_at).total_seconds() / 60
            self.stdout.write(
                f'  - {ticket.uuid} ({ticket.trabajador.rut}) - '
                f'Expirado hace {tiempo_expirado:.1f} minutos'
            )
            
            if not dry_run:
                # Marcar como expirado
                ticket.estado = 'expirado'
                ticket.save()
                
                # Crear evento
                TicketEvent.objects.create(
                    ticket=ticket,
                    tipo='expirado',
                    metadata={
                        'expiro_hace_minutos': round(tiempo_expirado, 1),
                        'ttl_original': ticket.ttl_expira_at.isoformat()
                    }
                )
                
                logger.info(f'Ticket {ticket.uuid} marcado como expirado')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'\nModo DRY-RUN: No se modificó la base de datos. '
                    f'{cantidad} tickets serían marcados como expirados.'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✓ {cantidad} tickets marcados como expirados exitosamente.'
                )
            )
