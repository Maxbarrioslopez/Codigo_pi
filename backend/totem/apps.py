from django.apps import AppConfig


class TotemConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'totem'
    
    def ready(self):
        """
        Importa signals cuando la aplicación esté lista.
        """
        import totem.signals  # noqa: F401
