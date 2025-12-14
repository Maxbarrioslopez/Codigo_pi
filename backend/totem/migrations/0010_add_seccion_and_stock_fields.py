from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('totem', '0009_populate_default_tipo_beneficio'),
    ]

    operations = [
        migrations.AddField(
            model_name='trabajador',
            name='seccion',
            field=models.CharField(max_length=120, blank=True, null=True, default=None),
        ),
        migrations.AddField(
            model_name='stocksucursal',
            name='tipo_caja',
            field=models.CharField(max_length=50, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='stocksucursal',
            name='cantidad_actual',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='stocksucursal',
            name='cantidad_minima',
            field=models.IntegerField(default=0),
        ),
    ]
