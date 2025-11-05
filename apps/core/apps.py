"""
Core App Configuration
تكوين التطبيق الأساسي لمنصة Stock It Up
"""

from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'
    verbose_name = 'Core System'
    
    def ready(self):
        """Initialize core functionality when Django starts"""
        # Import signal handlers
        try:
            import apps.core.signals
        except ImportError:
            pass