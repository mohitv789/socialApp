# from django.apps import AppConfig


# class CoreConfig(AppConfig):
#     default_auto_field = 'django.db.models.BigAutoField'
#     name = 'core'


from django.apps import AppConfig

class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        # Import and register signals after models are loaded
        from . import signals  # noqa: E402
        signals.connect_signals()