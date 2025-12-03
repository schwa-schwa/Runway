from django.core.management.base import BaseCommand
from api.models import Challenge

class Command(BaseCommand):
    help = 'Seeds the database with default challenges'

    def handle(self, *args, **options):
        challenge_name = "ストレートウォーク"
        description = "左右対称にまっすぐ歩きましょう！"
        
        if not Challenge.objects.filter(name=challenge_name).exists():
            Challenge.objects.create(
                name=challenge_name,
                description=description,
                has_posing=False
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created challenge "{challenge_name}"'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Challenge "{challenge_name}" already exists'))
