from rest_framework import serializers
from adrf.serializers import ModelSerializer
from .models import User, Challenge, Score

class UserSerializer(serializers.HyperlinkedModelSerializer):
    
    def validate_name(self, value):
        if User.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError('この名前を持つUserはすでに存在しています')
        
        return value
    
    class Meta:
        model = User
        fields = ['url', 'id', 'name', 'created_at']
        
class ChallengeSerializer(serializers.HyperlinkedModelSerializer):
    
    class Meta:
        model = Challenge
        fields = ['url', 'id', 'name', 'description', 'has_posing']
        
class ScoreSerializer(ModelSerializer):
    # video_duration is now stored in DB
    video_duration = serializers.FloatField(required=False, default=5.0)
    
    class Meta:
        model = Score
        fields = [
            'id',
            'user',
            'challenge',
            'overall_score',
            'feedback_text',
            'chart_data',
            'raw_landmarks',
            'detailed_results',
            'video_duration',
            'created_at',
        ]
        read_only_fields = [
            'overall_score',
            'feedback_text',
            'chart_data',
            'detailed_results',
            'created_at',
        ]

