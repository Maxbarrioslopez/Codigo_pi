"""
Tests básicos para el modelo Ticket.
"""

import pytest
from django.utils import timezone
from datetime import timedelta
from totem.models import Ticket


@pytest.mark.django_db
class TestTicketModel:
    """Tests para el modelo Ticket."""
    
    def test_crear_ticket(self, trabajador, ciclo_activo, sucursal):
        """Test crear ticket básico."""
        ticket = Ticket.objects.create(
            trabajador=trabajador,
            uuid='TEST-UUID-123',
            estado='pendiente',
            ciclo=ciclo_activo,
            sucursal=sucursal,
            ttl_expira_at=timezone.now() + timedelta(minutes=30)
        )
        
        assert ticket.id is not None
        assert ticket.estado == 'pendiente'
        assert ticket.trabajador == trabajador
        
    def test_ticket_string_representation(self, ticket_pendiente):
        """Test __str__ del ticket."""
        expected = f"Ticket {ticket_pendiente.uuid} - {ticket_pendiente.trabajador.rut}"
        assert str(ticket_pendiente) == expected
        
    def test_cambiar_estado_ticket(self, ticket_pendiente):
        """Test cambiar estado del ticket."""
        ticket_pendiente.estado = 'entregado'
        ticket_pendiente.save()
        
        ticket_pendiente.refresh_from_db()
        assert ticket_pendiente.estado == 'entregado'
        
    def test_ticket_expirado(self, trabajador, ciclo_activo, sucursal):
        """Test ticket con TTL expirado."""
        ticket = Ticket.objects.create(
            trabajador=trabajador,
            uuid='TEST-EXPIRED',
            estado='pendiente',
            ciclo=ciclo_activo,
            sucursal=sucursal,
            ttl_expira_at=timezone.now() - timedelta(minutes=5)  # Ya expiró
        )
        
        # Verificar que el TTL está en el pasado
        assert ticket.ttl_expira_at < timezone.now()
