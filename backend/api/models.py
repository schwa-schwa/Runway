from django.db import models

# Create your models here.
class User(models.Model):
    
    name = models.CharField(
        verbose_name='ユーザー名',
        max_length=50,
        unique=True,
        blank=False,
        null=False
    )
    created_at = models.DateTimeField(
        verbose_name='作成日時',
        auto_now_add=True
    )
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = 'ユーザー'
        verbose_name_plural = 'ユーザー'
        
class Challenge(models.Model):
    
    name = models.CharField(
        verbose_name='チャレンジ名',
        max_length=100,
        unique=True
    )
    
    description = models.TextField(
        verbose_name='説明文'
    )
    
    has_posing = models.BooleanField(
        verbose_name='ポージングあり',
        default=False,
    )
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "チャレンジ"
        verbose_name_plural = "チャレンジ"
        
class Score(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scores')
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='scores')
    overall_score = models.FloatField()
    feedback_text = models.TextField(blank=True, null=True) 
    chart_data = models.JSONField() 
    raw_landmarks = models.JSONField()
    detailed_results = models.JSONField(blank=True, null=True)
    video_duration = models.FloatField(default=5.0, verbose_name='動画時間(秒)')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f'{self.user.name} - {self.challenge.name}: {self.overall_score}点'
    
    class Meta:
        ordering = ['created_at']
    
    