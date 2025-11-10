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

class ScoreHistoryView(APIView):
    """
    特定ユーザーの、特定チャレンジにおけるスコアの時系列データを返す。
    GET /api/scores/history/?user=<user_id>&challenge=<challenge_id>
    """
    def get(self, request, *args, **kwargs):
        user_id = request.query_params.get('user')
        challenge_id = request.query_params.get('challenge')

        if not user_id or not challenge_id:
            return Response(
                {"error": "user and challenge ID are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        history_query = Score.objects.filter(
            user_id=user_id,
            challenge_id=challenge_id
        ).order_by('created_at')

        # 4. 必要なデータだけを抽出・整形 (idを追加)
        data = list(history_query.values('id', 'created_at', 'overall_score'))

        # 5. フロントエンドが使いやすいように最終調整
        for item in data:
            item['date'] = item.pop('created_at').strftime('%Y-%m-%d')
            item['score'] = item.pop('overall_score')
            # 'id' は pop せずにそのまま残す

        return Response(data)

from django.db.models import Avg, FloatField, Case, When
from django.db.models.functions import Cast
from django.db.models.fields.json import KeyTextTransform
from datetime import date, timedelta

class ScoreAverageComparisonView(APIView):
    """
    特定チャレンジにおける「自分の平均スコア」と「全ユーザーの平均スコア」を返す。
    GET /api/scores/average_comparison/?user=<user_id>&challenge=<challenge_id>
    """
    def get(self, request, *args, **kwargs):
        user_id = request.query_params.get('user')
        challenge_id = request.query_params.get('challenge')

        if not user_id or not challenge_id:
            return Response(
                {"error": "user and challenge ID are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        
        chart_data_keys = [
            'symmetry',
            'trunk_uprightness',
            'gravity_stability',
            'rhythmic_accuracy',
        ]
        
        aggregations = {
            'overall_average': Avg('overall_score'),
            'user_average': Avg(Case(When(user_id=user_id, then='overall_score'), output_field=FloatField()))
        }
        
        for key in chart_data_keys:
            aggregations[f'overall_{key}_avg'] = Avg(Cast(KeyTextTransform(key, 'chart_data'), FloatField()))
            
            aggregations[f'user_{key}_avg'] = Avg(Case(When(user_id=user_id, then=Cast(KeyTextTransform(key, 'chart_data'), FloatField())), output_field=FloatField()))

        
        all_averages = Score.objects.filter(challenge_id=challenge_id).aggregate(**aggregations)
        user_chart_data_averages = {
            key: round(all_averages.get(f'user_{key}_avg') or 0, 3) for key in chart_data_keys
        }
        overall_chart_data_averages = {
            key: round(all_averages.get(f'overall_{key}_avg') or 0, 3) for key in chart_data_keys
        }

        # 全体の平均スコアを計算
        overall_scores = Score.objects.filter(challenge_id=challenge_id)
        overall_average = overall_scores.aggregate(Avg('overall_score'))['overall_score__avg'] or 0

        return Response({
            "user_average": round(all_averages.get('user_average') or 0, 3),
            "overall_average": round(all_averages.get('overall_average') or 0, 3),
            "user_chart_data_averages": user_chart_data_averages,
            "overall_chart_data_averages": overall_chart_data_averages,
        })

class DashboardAPIView(APIView):
    """
    ダッシュボードに必要なデータをまとめて返すAPIビュー。
    GET /api/dashboard/?user=<user_id>
    """
    def get(self, request, *args, **kwargs):
        user_id = request.query_params.get('user')
        if not user_id:
            return Response(
                {"error": "user ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # ユーザーの全スコアを取得
        scores = Score.objects.filter(user=user).order_by('-created_at')

        # --- 統計データの計算 ---

        # 1. レベル
        total_plays = scores.count()
        level = (total_plays // 5) + 1

        # 2. ハイスコア (より効率的な方法)
        high_score_data = scores.aggregate(max_score=Max('overall_score'))
        high_score = high_score_data['max_score'] or 0

        # 3. 連続プレイ日数
        streak = 0
        if total_plays > 0:
            # ユニークなプレイ日を取得
            unique_dates = sorted(list(set(scores.values_list('created_at__date', flat=True))), reverse=True)
            
            today = date.today()
            
            # 最新のプレイが今日か昨日かチェック
            if (today - unique_dates[0]).days <= 1:
                streak = 1
                for i in range(len(unique_dates) - 1):
                    # 日付の差が1日なら連続とみなす
                    if (unique_dates[i] - unique_dates[i+1]).days == 1:
                        streak += 1
                    else:
                        break # 連続が途切れたら終了

        # 4. 最近のアクティビティ (N+1問題を回避)
        recent_activities_query = scores.select_related('challenge')[:3]
        recent_activities = [
            {
                "id": score.id,
                "challengeName": score.challenge.name,
                "overall_score": score.overall_score,
                "date": score.created_at.strftime('%Y-%m-%d')
            }
            for score in recent_activities_query
        ]

        # --- レスポンスを構築 ---
        response_data = {
            "userName": user.name,
            "level": level,
            "highScore": high_score,
            "streak": streak,
            "recentActivities": recent_activities
        }

        return Response(response_data)
