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


class RankingAPIView(APIView):
    """
    チャレンジごとの総合ランキングと、指定されたユーザーの順位を返すAPIビュー。
    GET /api/ranking/?challenge=<challenge_id>&user=<user_id>
    """
    def get(self, request, *args, **kwargs):
        # 1. クエリパラメータから challenge_id を取得
        challenge_id = request.query_params.get('challenge')
        user_id = request.query_params.get('user') # user_idも取得（後で使います）

        if not challenge_id:
            return Response(
                {"error": "challenge ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. リーダーボードの元データをデータベースから取得
        leaderboard_query = Score.objects.filter(challenge=challenge_id).values('user', 'user__name').annotate(max_score=Max('overall_score')).order_by('-max_score')

        # 3. 取得したデータを、ランキング形式のリストに変換（上位10名）
        leaderboard_data = []
        for i, entry in enumerate(leaderboard_query[:10]):
            leaderboard_data.append({
                "rank": i + 1,
                "user_id": entry['user'],
                "user_name": entry['user__name'],
                "score": entry['max_score']
            })
        
        my_rank_data = None
        if user_id:
            # user_idがURLで指定されている場合のみ、自分の順位を探す
            for i, entry in enumerate(leaderboard_query):
                # user_idは文字列なので、比較のために整数(int)に変換する
                if entry['user'] == int(user_id):
                    my_rank_data = {
                        "rank": i + 1,
                        "user_id": entry['user'],
                        "user_name": entry['user__name'],
                        "score": entry['max_score']
                    }
                    break # 自分の順位が見つかったら、ループを終了する
        
        # 4. 生成したリーダーボードをレスポンスとして返す
        return Response({
            "leaderboard": leaderboard_data,
            "my_rank": my_rank_data,
        })
