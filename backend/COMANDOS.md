# -*- coding: utf-8 -*-
"""
Comandos de gestión personalizados para administración del sistema.
Para ejecutar: python manage.py <comando>
"""

# totem/management/commands/limpiar_tickets_expirados.py
"""
Comando: python manage.py limpiar_tickets_expirados
Limpia tickets expirados antiguos para liberar espacio en DB.
"""

# totem/management/commands/generar_reporte_mensual.py
"""
Comando: python manage.py generar_reporte_mensual --mes=11 --año=2025
Genera reporte consolidado de un mes específico.
"""

# totem/management/commands/sincronizar_nomina.py
"""
Comando: python manage.py sincronizar_nomina --archivo=nomina.xlsx
Sincroniza trabajadores desde archivo de nómina.
"""

# totem/management/commands/verificar_integridad.py
"""
Comando: python manage.py verificar_integridad
Verifica integridad de datos y relaciones en la DB.
"""

# totem/management/commands/backup_database.py
"""
Comando: python manage.py backup_database --output=/backups/
Genera backup de la base de datos.
"""

# TODO: Implementar comandos completos en totem/management/commands/
