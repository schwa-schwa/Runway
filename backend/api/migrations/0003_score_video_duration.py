# Generated migration for video_duration field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_score_detailed_results'),
    ]

    operations = [
        migrations.AddField(
            model_name='score',
            name='video_duration',
            field=models.FloatField(default=5.0, verbose_name='動画時間(秒)'),
        ),
    ]
