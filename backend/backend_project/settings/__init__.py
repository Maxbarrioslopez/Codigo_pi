"""
Settings package for Tótem Digital.

Usage:
- Development: DJANGO_SETTINGS_MODULE=backend_project.settings.development
- Production: DJANGO_SETTINGS_MODULE=backend_project.settings.production
- Testing: DJANGO_SETTINGS_MODULE=backend_project.settings.testing
"""

import os

# Auto-detect environment if not specified
environment = os.environ.get('DJANGO_ENVIRONMENT', 'development')

if environment == 'production':
    from .production import *
elif environment == 'testing':
    from .testing import *
else:
    from .development import *
