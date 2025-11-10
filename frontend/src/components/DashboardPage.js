import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Typography, 
    Box, 
    Button, 
    Paper, 
    Stack, 
    Divider, 
    CircularProgress 
} from '@mui/material';
import { useUser } from '../contexts/UserContext';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';


function DashboardPage() {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:8000/api/dashboard/?user=${currentUser.id}`);
        if (!response.ok) {
          throw new Error('ダッシュボードデータの取得に失敗しました。');
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error("データ取得エラー:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  const handleStartChallenge = () => {
    navigate('/challenges');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography color="error">データの読み込みに失敗しました: {error}</Typography>
      </Box>
    );
  }

  if (!currentUser || !dashboardData) {
    return (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h5">ユーザー情報が見つかりません。</Typography>
            <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
                ユーザー選択画面に戻る
            </Button>
        </Box>
    );
  }

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        ようこそぉ！, {dashboardData.userName}!
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>ステータス</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" sx={{ mr: 1 }}>Lv.</Typography>
              <Typography variant="h2">{dashboardData.level}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EmojiEventsIcon sx={{ color: '#ffeb3b', mr: 1 }} />
              <Typography>ハイスコア: {dashboardData.highScore}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocalFireDepartmentIcon sx={{ color: '#f44336', mr: 1 }} />
              <Typography>連続プレイ: {dashboardData.streak} 日</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>最近のアクティビティ</Typography>
            <Stack spacing={2}>
              {dashboardData.recentActivities.length > 0 ? (
                dashboardData.recentActivities.map(activity => (
                  <Paper 
                    key={activity.id} 
                    variant="outlined" 
                    sx={{ 
                      p: 1.5, 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                    onClick={() => navigate(`/result/${activity.id}`)}
                  >
                    <Typography variant="body1">「{activity.challengeName}」で</Typography>
                    <Typography variant="h5" component="p" sx={{ fontWeight: 'bold' }}>{activity.overall_score}点</Typography>
                    <Typography variant="caption" color="text.secondary">{activity.date}</Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">まだアクティビティがありません。</Typography>
              )}
            </Stack>
          </Paper>
        </Box>

        <Box sx={{ width: { xs: '100%', md: '66.67%' }, display: 'flex', alignItems: 'stretch' }}>
          <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <Typography variant="h5" gutterBottom>準備はいいですか？</Typography>
            <Button 
              variant="contained" 
              size="large"
              sx={{
                mt: 2,
                fontSize: '1.5rem',
                fontWeight: 'bold',
                px: 8, py: 2,
                borderRadius: '50px',
                color: 'white',
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 6px 10px 4px rgba(33, 203, 243, .5)',
                }
              }}
              onClick={handleStartChallenge}
            >
              新しいチャレンジを始める
            </Button>
          </Paper>
        </Box>
      </Box>
    </>
  );
}

export default DashboardPage;