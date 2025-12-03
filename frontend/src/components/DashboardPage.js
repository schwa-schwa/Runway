import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Typography, 
    Box, 
    Button, 
    Paper, 
    Stack, 
    Divider, 
    CircularProgress,
    Grid
} from '@mui/material';
import { useUser } from '../contexts/UserContext';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';


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
        const response = await fetch(`/api/dashboard/?user=${currentUser.id}`);
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

  // Create a 5-element array for display, padding with nulls
  const activities = dashboardData.recentActivities || [];
  const displayActivities = Array(5).fill(null).map((_, i) => activities[i] || null);

  // Prepare data for the mini chart, showing oldest to newest
  const chartData = (activities || [])
    .map(activity => ({ name: activity.date, score: activity.overall_score }))
    .reverse();

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        ようこそぉ！, {dashboardData.userName}!
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: '16px' }}>
            <Typography variant="h6" gutterBottom>ステータス</Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <Paper elevation={0} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '24px' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>現在のレベル</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{dashboardData.level}</Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: '50%', bgcolor: 'primary.light', color: 'white', display: 'flex' }}>
                  <Typography variant="h6" sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Lv</Typography>
                </Box>
              </Paper>

              <Paper elevation={0} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '24px' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>ハイスコア</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{dashboardData.highScore}</Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: '50%', bgcolor: '#FFF9C4', color: '#FBC02D', display: 'flex' }}>
                  <EmojiEventsIcon />
                </Box>
              </Paper>

              <Paper elevation={0} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '24px' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>連続プレイ</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{dashboardData.streak}<Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>日</Typography></Typography>
                </Box>
                <Box sx={{ p: 1, borderRadius: '50%', bgcolor: '#FFEBEE', color: '#F44336', display: 'flex' }}>
                  <LocalFireDepartmentIcon />
                </Box>
              </Paper>
            </Stack>

            <Divider sx={{ my: 2 }} />
            {chartData.length > 1 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>スコア推移</Typography>
                <Box sx={{ height: 200, mb: 4 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        labelStyle={{ color: '#666', fontWeight: 'bold' }}
                        itemStyle={{ color: '#4CAF50', fontWeight: 'bold' }}
                        formatter={(value) => [`${value}点`, 'スコア']}
                      />
                      <Area type="monotone" dataKey="score" stroke="#4CAF50" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </>
            )}

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>最近のアクティビティ</Typography>
            <Stack spacing={2}>
              {displayActivities.map((activity, index) =>
                activity ? (
                  <Paper 
                    key={activity.id} 
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.05)'
                      }
                    }}
                    onClick={() => navigate(`/result/${activity.id}`)}
                  >
                    <Box sx={{ 
                      mr: 2, 
                      p: 1.5, 
                      borderRadius: '12px', 
                      bgcolor: 'primary.light', 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <DirectionsRunIcon />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{activity.challengeName}</Typography>
                      <Typography variant="caption" color="text.secondary">{activity.date}</Typography>
                    </Box>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>{activity.overall_score}</Typography>
                  </Paper>
                ) : (
                  // If this is the first placeholder AND there are no activities, show a message.
                  (index === 0 && activities.length === 0) ? (
                    <Paper 
                      key="no-activity-message"
                      variant="outlined"
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        borderRadius: '12px',
                        borderStyle: 'dashed'
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        まだチャレンジ履歴がありません。<br/>
                        最初のチャレンジを始めましょう！
                      </Typography>
                    </Paper>
                  ) : null
                )
              )}
            </Stack>
          </Paper>
        </Box>

        <Box sx={{ width: { xs: '100%', md: '66.67%' }, display: 'flex', alignItems: 'stretch' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
              color: 'white',
              borderRadius: '16px',
              backgroundImage: 'url(https://images.pexels.com/photos/1149923/pexels-photo-1149923.jpeg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 1,
            }} />
            <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                準備はいいですか？
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                今日も新しいスコアを目指して走り出しましょう！
              </Typography>
              <Button 
                variant="contained" 
                size="large"
                sx={{
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  px: 6, py: 1.5,
                  borderRadius: '50px',
                  color: 'white',
                  background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
                  boxShadow: '0 4px 15px rgba(76, 175, 80, .4)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 6px 20px rgba(76, 175, 80, .6)',
                  }
                }}
                onClick={handleStartChallenge}
              >
                新しいチャレンジを始める
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </>
  );
}

export default DashboardPage;
