# Generated manually on 2025-12-04
# Migración de datos: crear tipos de beneficios por defecto

from django.db import migrations


def crear_tipos_beneficio_default(apps, schema_editor):
    """Crear tipos de beneficios iniciales"""
    TipoBeneficio = apps.get_model('totem', 'TipoBeneficio')
    
    tipos_default = [
        {
            'nombre': 'Caja de Navidad',
            'descripcion': 'Caja premium o estándar para temporada navideña',
            'activo': True
        },
        {
            'nombre': 'Paseo Familiar',
            'descripcion': 'Tickets para paseos recreativos con la familia',
            'activo': True
        },
    ]
    
    for tipo_data in tipos_default:
        TipoBeneficio.objects.get_or_create(
            nombre=tipo_data['nombre'],
            defaults={
                'descripcion': tipo_data['descripcion'],
                'activo': tipo_data['activo']
            }
        )


def eliminar_tipos_beneficio(apps, schema_editor):
    """Rollback: eliminar tipos creados"""
    TipoBeneficio = apps.get_model('totem', 'TipoBeneficio')
    TipoBeneficio.objects.filter(
        nombre__in=['Caja de Navidad', 'Paseo Familiar']
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('totem', '0008_add_tipo_beneficio_and_ciclo_improvements'),
    ]

    operations = [
        migrations.RunPython(crear_tipos_beneficio_default, eliminar_tipos_beneficio),
    ]
