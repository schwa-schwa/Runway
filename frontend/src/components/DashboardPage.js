import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Typography, 
    Box, 
    Button, 
    Paper, 
    Stack, 
    Divider, 
    CircularProgress,
    Grid,
    keyframes,
    Chip,
    Skeleton
} from '@mui/material';
import { useUser } from '../contexts/UserContext';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

// 時間帯別挨拶を取得する関数
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'おはようございます';
  } else if (hour >= 12 && hour < 17) {
    return 'こんにちは';
  } else {
    return 'こんばんは';
  }
};

// 前回比較を計算する関数
const getScoreComparison = (activities, currentIndex) => {
  if (currentIndex >= activities.length - 1) {
    return null; // 最古の記録には比較対象なし
  }
  const currentScore = activities[currentIndex].overall_score;
  const previousScore = activities[currentIndex + 1].overall_score;
  const diff = currentScore - previousScore;
  // 小数点3桁までにフォーマット
  const formattedDiff = diff.toFixed(3);
  return { diff, formattedDiff, previousScore };
};

// アニメーション定義
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const fadeInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 20px 5px rgba(244, 67, 54, 0.6);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

// カウントアップアニメーション用カスタムフック
const useCountUp = (end, duration = 1000, startAnimation = false) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!startAnimation || end === undefined || end === null) return;
    
    const endValue = typeof end === 'number' ? end : parseInt(end, 10);
    if (isNaN(endValue)) {
      setCount(end);
      return;
    }

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // イージング関数（ease-out）
      const easeOut = 1 - Math.pow(1 - progress, 3);
      countRef.current = Math.floor(easeOut * endValue);
      setCount(countRef.current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      startTimeRef.current = null;
    };
  }, [end, duration, startAnimation]);

  return count;
};

function DashboardPage() {
  const { currentUser } = useUser();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animationStarted, setAnimationStarted] = useState(false);

  // カウントアップアニメーション
  const animatedLevel = useCountUp(dashboardData?.level, 800, animationStarted);
  const animatedHighScore = useCountUp(dashboardData?.highScore, 1200, animationStarted);
  const animatedStreak = useCountUp(dashboardData?.streak, 1000, animationStarted);

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

  // データ読み込み後にアニメーション開始
  useEffect(() => {
    if (dashboardData && !loading) {
      // 少し遅延させてからアニメーション開始
      const timer = setTimeout(() => {
        setAnimationStarted(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dashboardData, loading]);

  const handleStartChallenge = () => {
    navigate('/challenges');
  };

  // スケルトンローディングUI
  if (loading) {
    return (
      <>
        {/* ウェルカムメッセージのスケルトン */}
        <Skeleton variant="text" width={300} height={50} sx={{ mb: 3 }} />
        
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* 左側パネルのスケルトン */}
          <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
            <Paper elevation={3} sx={{ p: 2, borderRadius: '16px' }}>
              <Skeleton variant="text" width={100} height={32} sx={{ mb: 2 }} />
              <Stack spacing={2} sx={{ mb: 3 }}>
                {[1, 2, 3].map((i) => (
                  <Paper key={i} elevation={0} variant="outlined" sx={{ p: 2, borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Skeleton variant="text" width={80} height={20} />
                      <Skeleton variant="text" width={60} height={40} />
                    </Box>
                    <Skeleton variant="circular" width={40} height={40} />
                  </Paper>
                ))}
              </Stack>
              
              <Divider sx={{ my: 2 }} />
              <Skeleton variant="text" width={100} height={32} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '12px', mb: 4 }} />
              
              <Skeleton variant="text" width={150} height={32} sx={{ mb: 2 }} />
              <Stack spacing={2}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Paper key={i} elevation={0} variant="outlined" sx={{ p: 2, borderRadius: '12px', display: 'flex', alignItems: 'center', height: 64 }}>
                    <Skeleton variant="rounded" width={48} height={48} sx={{ mr: 2, borderRadius: '12px' }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton variant="text" width="60%" height={24} />
                      <Skeleton variant="text" width="40%" height={16} />
                    </Box>
                    <Skeleton variant="text" width={40} height={32} />
                  </Paper>
                ))}
              </Stack>
            </Paper>
          </Box>

          {/* 右側パネルのスケルトン */}
          <Box sx={{ width: { xs: '100%', md: '66.67%' }, display: 'flex', alignItems: 'stretch' }}>
            <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              <Skeleton variant="text" width={250} height={50} sx={{ mb: 2 }} />
              <Skeleton variant="text" width={350} height={30} sx={{ mb: 4 }} />
              <Skeleton variant="rounded" width={250} height={50} sx={{ borderRadius: '50px' }} />
            </Paper>
          </Box>
        </Box>
      </>
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
      <Typography 
        variant="h4" 
        component="h1" 
        sx={{ 
          mb: 3,
          animation: `${fadeInUp} 0.6s ease-out`,
        }}
      >
        {getGreeting()}、{dashboardData.userName}さん！
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ 
          width: { xs: '100%', md: '33.33%' },
          animation: `${fadeInLeft} 0.6s ease-out`,
          animationDelay: '0.2s',
          animationFillMode: 'both',
        }}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: '16px' }}>
            <Typography variant="h6" gutterBottom>ステータス</Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  borderRadius: '24px',
                  animation: `${fadeInUp} 0.5s ease-out`,
                  animationDelay: '0.3s',
                  animationFillMode: 'both',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>現在のレベル</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{animatedLevel}</Typography>
                </Box>
                <Box sx={{ 
                  p: 1, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.light', 
                  color: 'white', 
                  display: 'flex',
                  transition: 'transform 0.3s',
                  '&:hover': { transform: 'rotate(10deg)' }
                }}>
                  <Typography variant="h6" sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Lv</Typography>
                </Box>
              </Paper>

              <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  borderRadius: '24px',
                  animation: `${fadeInUp} 0.5s ease-out`,
                  animationDelay: '0.4s',
                  animationFillMode: 'both',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>ハイスコア</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{animatedHighScore}</Typography>
                </Box>
                <Box sx={{ 
                  p: 1, 
                  borderRadius: '50%', 
                  bgcolor: '#FFF9C4', 
                  color: '#FBC02D', 
                  display: 'flex',
                  transition: 'transform 0.3s',
                  '&:hover': { transform: 'scale(1.2) rotate(-10deg)' }
                }}>
                  <EmojiEventsIcon />
                </Box>
              </Paper>

              <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  borderRadius: '24px',
                  animation: `${fadeInUp} 0.5s ease-out`,
                  animationDelay: '0.5s',
                  animationFillMode: 'both',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>連続プレイ</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{animatedStreak}<Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>日</Typography></Typography>
                </Box>
                <Box sx={{ 
                  p: 1, 
                  borderRadius: '50%', 
                  bgcolor: '#FFEBEE', 
                  color: '#F44336', 
                  display: 'flex',
                  animation: dashboardData?.streak > 0 ? `${pulseGlow} 2s ease-in-out infinite` : 'none',
                }}>
                  <LocalFireDepartmentIcon />
                </Box>
              </Paper>
            </Stack>

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>スコア推移</Typography>
            {chartData.length > 1 ? (
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
            ) : (
              <Box 
                sx={{ 
                  height: 200, 
                  mb: 4, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: '12px',
                  backgroundColor: 'action.hover',
                }}
              >
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  チャレンジを2回以上完了すると<br/>スコア推移が表示されます
                </Typography>
              </Box>
            )}

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>最近のアクティビティ</Typography>
            <Stack spacing={2}>
              {displayActivities.map((activity, index) => {
                const comparison = activity ? getScoreComparison(activities, index) : null;
                return activity ? (
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
                      height: 64,
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>{activity.overall_score}</Typography>
                      {comparison && (
                        <Chip
                          size="small"
                          icon={
                            comparison.diff > 0 ? <TrendingUpIcon sx={{ fontSize: 18, color: 'white' }} /> :
                            comparison.diff < 0 ? <TrendingDownIcon sx={{ fontSize: 18, color: 'white' }} /> :
                            <TrendingFlatIcon sx={{ fontSize: 18, color: 'white' }} />
                          }
                          label={comparison.diff > 0 ? `+${comparison.formattedDiff}` : comparison.diff === 0 ? '±0.000' : comparison.formattedDiff}
                          sx={{
                            height: 28,
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            bgcolor: comparison.diff > 0 ? 'success.main' : comparison.diff < 0 ? 'error.main' : 'grey.500',
                            color: 'white',
                            '& .MuiChip-icon': {
                              color: 'white',
                              marginLeft: '4px',
                            },
                            '& .MuiChip-label': {
                              paddingRight: '10px',
                            }
                          }}
                        />
                      )}
                    </Box>
                  </Paper>
                ) : (
                  <Paper 
                    key={`placeholder-${index}`}
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      height: 64,
                      opacity: 0.5,
                    }}
                  >
                    <Box sx={{ 
                      mr: 2, 
                      p: 1.5, 
                      borderRadius: '12px', 
                      bgcolor: 'action.disabledBackground',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <DirectionsRunIcon sx={{ color: 'text.disabled' }} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'text.disabled' }}>---</Typography>
                      <Typography variant="caption" color="text.disabled">---</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.disabled' }}>--</Typography>
                  </Paper>
                );
              })}
            </Stack>
          </Paper>
        </Box>

        <Box sx={{ 
          width: { xs: '100%', md: '66.67%' }, 
          display: 'flex', 
          alignItems: 'stretch',
          animation: `${fadeInRight} 0.6s ease-out`,
          animationDelay: '0.3s',
          animationFillMode: 'both',
        }}>
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
              backgroundImage: 'url(walker.png)',
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
