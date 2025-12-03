from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = "Set is_active=True for all users where it's False (safety tool for dev)."

    def handle(self, *args, **options):
        User = get_user_model()
        qs = User.objects.filter(is_active=False)
        count = qs.count()
        qs.update(is_active=True)
        self.stdout.write(self.style.SUCCESS(f"Activated {count} users (is_active=True)."))