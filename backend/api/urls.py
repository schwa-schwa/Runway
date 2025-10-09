from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, ChallengeViewSet, ScoreCreateAPIView, ScoreViewSet, RankingAPIView

router = DefaultRouter()

router.register(r'users', UserViewSet, basename='user')
router.register(r'challenges', ChallengeViewSet, basename='challenge')
router.register(r'scores', ScoreViewSet, basename='score')

urlpatterns = [
    path('', include(router.urls)),
    path('score/', ScoreCreateAPIView.as_view(), name='score-create'),
    path('ranking/', RankingAPIView.as_view(), name='ranking-list'),
]
