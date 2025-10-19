import React, { useState, useEffect, useMemo } from 'react';
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
import BarChartIcon from '@mui/icons-material/BarChart';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

function DashboardPage() {
	const {currentUser} = useUser();
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser){
      setLoading(false);
      return
    }

    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [scoresResponse, challengesResponse] = await Promise.all([
          fetch(`http://localhost:8000/api/scores/?user=${currentUser.id}`),
          fetch(`http://localhost:8000/api/challenges/`)
        ]);

        if (!scoresResponse.ok) throw new Error('スコアデータの取得に失敗しました。');
        if (!challengesResponse.ok) throw new Error('チャレンジデータの取得に失敗しました。');

        const scoresData = await scoresResponse.json();
        const challengesData = await challengesResponse.json();

        setScores(scoresData);
        setChallenges(challengesData);

      } catch (err) {
        console.error("データ取得エラー:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
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

    // 連続プレイ日数を計算 (シンプル版)
    let streak = 0;
    if (scores.length > 0) {
      // 1. 重複を除いたプレイ日（YYYY-MM-DDの文字列）のリストを作成
      const uniqueDateStrings = [...new Set(scores.map(s => s.created_at.split('T')[0]))];
      // 2. 新しい順に並べ替え
      uniqueDateStrings.sort((a, b) => new Date(b) - new Date(a));

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const mostRecentPlayDate = new Date(uniqueDateStrings[0]);
      mostRecentPlayDate.setHours(0, 0, 0, 0);

      // 3. 最新のプレイが今日か昨日かチェック
      const diffDays = (today - mostRecentPlayDate) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) {
        streak = 1;
        // 4. 2日目以降の連続をチェック
        for (let i = 0; i < uniqueDateStrings.length - 1; i++) {
          const currentDay = new Date(uniqueDateStrings[i]);
          const previousDay = new Date(uniqueDateStrings[i + 1]);
          const dayDifference = (currentDay - previousDay) / (1000 * 60 * 60 * 24);
          
          if (dayDifference === 1) {
            streak++;
          } else {
            break; // 連続が途切れたら終了
          }
        }
      }
    }

    const level = Math.floor(scores.length / 5) + 1;

    return {
      level: level,
      highScore: highScore,
      streak: streak,
    }
  }, [scores])

  const recentActivities = useMemo(() => {
    if (scores.length === 0 || challenges.length === 0) return [];

    // challengeIdをキー、challenge名を値とするマップを作成
    const challengeMap = challenges.reduce((map, challenge) => {
      map[challenge.id] = challenge.name;
      return map;
    }, {});

    // 最新3件のスコアを整形
    return scores.slice(0, 3).map(score => ({
      ...score,
      challengeName: challengeMap[score.challenge] || '不明なチャレンジ',
      date: new Date(score.created_at).toLocaleDateString(),
    }));
  }, [scores, challenges]);

    if (!currentUser) {
        // ... (変更なし) ...
    }

    // 4. ローディング中の表示
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }
    
    // エラー発生時の表示
    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography color="error">データの読み込みに失敗しました: {error}</Typography>
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocalFireDepartmentIcon sx={{ color: '#f44336', mr: 1 }} />
              <Typography>連続プレイ: {userStats.streak} 日</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>ナビゲーション</Typography>
            <Stack spacing={1}>
              <Button startIcon={<BarChartIcon />} variant="text" sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/report')}>レポート</Button>
              <Button startIcon={<LeaderboardIcon />} variant="text" sx={{ justifyContent: 'flex-start' }} onClick={() => navigate('/ranking')}>ランキング</Button>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>最近のアクティビティ</Typography>
            <Stack spacing={2}>
              {recentActivities.length > 0 ? (
                recentActivities.map(activity => (
                  <Paper key={activity.id} variant="outlined" sx={{ p: 1.5 }}>
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