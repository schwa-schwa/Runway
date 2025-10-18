from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, 
    ChallengeViewSet, 
    ScoreCreateAPIView, 
    ScoreViewSet, 
    RankingAPIView,
    ScoreHistoryView,
    ScoreAverageComparisonView
)

router = DefaultRouter()

router.register(r'users', UserViewSet, basename='user')
router.register(r'challenges', ChallengeViewSet, basename='challenge')
router.register(r'scores', ScoreViewSet, basename='score')

# 手動で定義するURLを先に記述
urlpatterns = [
    path('score/', ScoreCreateAPIView.as_view(), name='score-create'),
    path('ranking/', RankingAPIView.as_view(), name='ranking-list'),
    path('scores/history/', ScoreHistoryView.as_view(), name='score-history'),
    path('scores/average_comparison/', ScoreAverageComparisonView.as_view(), name='score-average-comparison'),
    
    # routerが生成するURLを後に記述
    path('', include(router.urls)),
]
