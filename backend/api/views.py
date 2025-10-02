from django.shortcuts import render
from rest_framework import viewsets, status, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import User, Challenge, Score
from .serializers import UserSerializer, ChallengeSerializer, ScoreSerializer
from .services import ScoringService
from django.db.models import Max
from rest_framework.decorators import action
# Create your views here.

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class ChallengeViewSet(viewsets.ModelViewSet):
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer
    

class ScoreViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Score.objects.all().order_by('-created_at')
    serializer_class = ScoreSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'challenge']
    
    @action(detail=True, methods=['get'])
    def ranking(self, request, pk=None):
        try:
            target_score = self.get_object()
        except Score.DoesNotExist:
            return Response({"error": "Score not found"}, status=status.HTTP_404_NOT_FOUND)
        
        leaderboard = Score.objects.filter(challenge=target_score.challenge).values('user').annotate(max_score=Max('overall_score')).order_by('-max_score')
    
        my_rank = 0
        for i, entry in enumerate(leaderboard):
            if entry['user'] == target_score.user_id:
                my_rank = i + 1
                break
            
        total_participants = leaderboard.count()
        
        return Response({
            'rank': my_rank,
            'total_participants': total_participants
        })
    
class ScoreCreateAPIView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = ScoreSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        raw_landmarks = serializer.validated_data['raw_landmarks']
        
        service = ScoringService(raw_landmarks)    
        result = service.calculate_all()
        
        instance = serializer.save(**result)
        
        response_serializer = ScoreSerializer(instance, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
