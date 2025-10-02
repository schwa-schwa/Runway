from rest_framework import serializers
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
        
class ScoreSerializer(serializers.ModelSerializer):
    
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
            'created_at',
        ]
        read_only_fields = [
            'overall_score',
            'feedback_text',
            'chart_data',
            'created_at',
        ]
