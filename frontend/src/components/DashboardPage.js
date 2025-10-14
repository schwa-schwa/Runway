import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Box, Button, Paper, Stack } from '@mui/material';
import { useUser } from '../contexts/UserContext';

// アイコンをインポート
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import BarChartIcon from '@mui/icons-material/BarChart';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

function DashboardPage() {
	const {currentUser} = useUser();
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);

  useEffect(() => {
    if (!currentUser){
      return
    }

    const fetchScores = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/scores/?user=${currentUser.id}`);
        if (!response.ok) {
          throw new Error('スコアデータの取得に失敗しました。');
        }
        const data = await response.json();
        setScores(data);
        console.log("ダッシュボード用スコアデータ:", data)
      } catch (error) {
        console.error("スコアの取得エラー:", error)
      }
    }
    fetchScores();
  }, [currentUser]);

	const handleStartChallenge = () => {
		navigate('/challenges')
	}

  // ダミーデータから recentActivity を削除
  const userStats = useMemo(() => {
    if (scores.length === 0) {
      return {
        level: 1,
        highScore: 0,
        streak: 0,
      };
    }

    const highScore = scores.reduce((max, currentScore) => {
      return Math.max(max, currentScore.overall_score);
    }, 0)

    return {
      level: 5,
      highScore: highScore,
      streak: 3,
    }
  }, [scores])

  if (!currentUser) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h6" component="p" sx={{ color: 'red' }}>
          ユーザー情報がありません。
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
          ユーザー選択画面に戻る
        </Button>
      </Box>
    );
  }

  return (
    // 全体を囲むBox
    <Box sx={{ flexGrow: 1, p: 3, background: '#f4f6f8', height: '100vh' }}>
      {/* ヘッダー */}
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Welcome back, {currentUser.name}!
      </Typography>
      
      {/* 2カラムを囲むflexコンテナ */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 3,
          flexDirection: { xs: 'column', md: 'row' } // スマホでは縦、PCでは横並び
        }}
      >
        {/* 左カラム：ユーザー統計 (幅を33%に) */}
        <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>ステータス</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" sx={{ mr: 1 }}>Lv.</Typography>
              <Typography variant="h2">{userStats.level}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EmojiEventsIcon sx={{ color: '#ffeb3b', mr: 1 }} />
              <Typography>ハイスコア: {userStats.highScore}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocalFireDepartmentIcon sx={{ color: '#f44336', mr: 1 }} />
              <Typography>連続プレイ: {userStats.streak} 日</Typography>
            </Box>
          </Paper>
          <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>ナビゲーション</Typography>
            <Stack spacing={1}>
              <Button startIcon={<BarChartIcon />} variant="text" sx={{ justifyContent: 'flex-start' }}>レポート</Button>
              <Button startIcon={<LeaderboardIcon />} variant="text" sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/ranking')}>ランキング</Button>
            </Stack>
          </Paper>
        </Box>

        {/* 右カラム(旧中央カラム)：メインアクション (幅を66%に) */}
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
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 6px 10px 4px rgba(255, 105, 135, .3)',
                }
              }}
							onClick={handleStartChallenge}
            >
              新しいチャレンジを始める
            </Button>
          </Paper>
        </Box>

      </Box>
    </Box>
  );
}

export default DashboardPage;