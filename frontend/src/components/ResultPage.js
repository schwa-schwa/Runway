import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Chip, Divider, CircularProgress } from '@mui/material';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

// バックエンドの英語キーと、グラフに表示する日本語名を対応させるためのオブジェクト
const subjectMapping = {
  "symmetry": "左右の対称性",
  "trunk_uprightness": "体幹の直立性",
  "gravity_stability": "重心の安定性",
  "rhythmic_accuracy": "リズムの正確性",
  "movement_smoothness": "動作の滑らかさ"
};

function ResultPage() {
  const navigate = useNavigate();
  const { scoreId } = useParams(); // URLからscoreIdを取得

  // --- State管理 ---
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [displayScore, setDisplayScore] = useState(0);
  const [personalBest, setPersonalBest] = useState(null);
  const [isBestScore, setIsBestScore] = useState(false);
  const [rank, setRank] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(null);

  // --- データ取得ロジック ---
  useEffect(() => {
    if (!scoreId) {
      setError("スコアIDが指定されていません。");
      setLoading(false);
      return;
    }

    const fetchResultData = async () => {
      try {
        setLoading(true);

        // 1. まずはメインのスコアデータをIDで取得
        const scoreResponse = await fetch(`http://localhost:8000/api/scores/${scoreId}/`);
        if (!scoreResponse.ok) {
          throw new Error(`スコア(ID: ${scoreId})の取得に失敗しました。`);
        }
        const mainScoreData = await scoreResponse.json();
        setResultData(mainScoreData);

        // 2. 関連データを並行して取得
        const [scoresResponse, rankingResponse] = await Promise.all([
          fetch(`http://localhost:8000/api/scores/?user=${mainScoreData.user}&challenge=${mainScoreData.challenge}`),
          fetch(`http://localhost:8000/api/scores/${scoreId}/ranking/`)
        ]);

        if (!scoresResponse.ok || !rankingResponse.ok) {
          throw new Error('関連データの取得に失敗しました。');
        }

        const [pastScores, rankingData] = await Promise.all([
          scoresResponse.json(),
          rankingResponse.json()
        ]);
        
        // --- 自己ベストを計算 ---
        // 今回のスコアを除いた過去のスコアリストを作成
        const scoreHistory = pastScores.filter(score => score.id !== mainScoreData.id);
        const bestPastScore = scoreHistory.reduce((max, score) => Math.max(max, score.overall_score), 0);
        setPersonalBest(bestPastScore);
        setIsBestScore(mainScoreData.overall_score > bestPastScore);

        // --- ランキング情報をセット ---
        setRank(rankingData.rank);
        setTotalParticipants(rankingData.total_participants);

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResultData();
  }, [scoreId]);

  // --- スコア表示のアニメーション ---
  useEffect(() => {
    if (!resultData) return;
    const targetScore = resultData.overall_score;
    if (targetScore === 0) {
      setDisplayScore(0);
      return;
    }
    const duration = 1500;
    const stepTime = Math.max(10, duration / targetScore);
    const timer = setInterval(() => {
      setDisplayScore(prevScore => {
        if (prevScore < targetScore) {
          return prevScore + 1;
        } else {
          clearInterval(timer);
          return targetScore;
        }
      });
    }, stepTime);
    return () => clearInterval(timer);
  }, [resultData]);

  // --- ローディング・エラー表示 ---
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>結果を読み込み中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">エラー: {error}</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
          ユーザー選択に戻る
        </Button>
      </Box>
    );
  }

  if (!resultData) {
    return null; // データがなければ何も表示しない
  }

  // --- 描画ロジック ---
  const chartDataForRecharts = Object.keys(resultData.chart_data).map(key => ({
    subject: subjectMapping[key] || key,
    score: resultData.chart_data[key],
    fullMark: 20,
  }));

  const paperStyle = {
    flex: '1 1 50%',
    minWidth: 0,
    p: 3,
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      p: 3,
      gap: 3,
      boxSizing: 'border-box',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)',
    }}>
      {/* ... JSX部分は変更なし ... */}
      <Box sx={{ display: 'flex', flex: 1, gap: 3, minHeight: 0 }}>
        <Paper elevation={6} sx={{ ...paperStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
            <Typography
              variant="h1"
              component="p"
              sx={{
                fontSize: '10vw',
                fontWeight: 'bold',
                lineHeight: 1,
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {displayScore}
            </Typography>
            <Typography variant="h2" component="span" sx={{ color: '#FE6B8B', ml: 1, fontWeight: 'bold' }}>
              点
            </Typography>
          </Box>
        </Paper>

        <Paper elevation={6} sx={{ ...paperStyle }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartDataForRecharts}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" stroke="#555" />
              <Radar name="今回のスコア" dataKey="score" stroke="#FF8E53" fill="#FE6B8B" fillOpacity={0.7} />
            </RadarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>

      <Box sx={{ display: 'flex', flex: 1, gap: 3, minHeight: 0 }}>
        <Paper elevation={6} sx={{ ...paperStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', textAlign: 'center' }}>
          <Box sx={{ flexShrink: 1 }}>
            <Typography component="h2" gutterBottom sx={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: 500 }}>
              自己ベスト比較
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: { xs: 2, sm: 4 }, mt: 2 }}>
              <Box>
                <Typography variant="caption" display="block" color="text.secondary">今回</Typography>
                <Typography component="p" sx={{ fontWeight: 'bold', color: isBestScore ? '#FF8E53' : '#FE6B8B', fontSize: 'clamp(2rem, 6vw, 3.75rem)', lineHeight: 1.2 }}>
                  {resultData.overall_score}
                </Typography>
              </Box>
              <Typography color="text.secondary" sx={{ fontSize: 'clamp(1.5rem, 4vw, 2.125rem)' }}>vs</Typography>
              <Box>
                <Typography variant="caption" display="block" color="text.secondary">自己ベスト</Typography>
                <Typography component="p" sx={{ fontWeight: 'bold', fontSize: 'clamp(2rem, 6vw, 3.75rem)', lineHeight: 1.2 }}>
                  {personalBest === null ? '...' : personalBest}
                </Typography>
              </Box>
            </Box>
            {isBestScore && (
              <Chip label="🎉 ベストスコア更新！" sx={{ mt: 2, fontWeight: 'bold', fontSize: '1rem', color: 'white', background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)' }} />
            )}
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ flexShrink: 1 }}>
            <Typography component="h2" gutterBottom sx={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: 500 }}>
              ランキング
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
              <Typography component="p" sx={{ fontWeight: 'bold', fontSize: 'clamp(2rem, 6vw, 3.75rem)', lineHeight: 1.2 }}>
                {rank === null ? '...' : rank}
              </Typography>
              <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 'bold', fontSize: 'clamp(1rem, 3vw, 1.5rem)', ml: 1 }}>
                位
              </Typography>
              <Typography component="span" sx={{ color: 'text.secondary', fontSize: 'clamp(0.8rem, 2vw, 1rem)', ml: 1.5 }}>
                / {totalParticipants === null ? '...' : totalParticipants}人中
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper elevation={6} sx={{ ...paperStyle, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h5" component="h2" gutterBottom>AIからのアドバイス</Typography>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 1, p: 2, background: 'rgba(255, 255, 255, 0.5)', borderRadius: '8px' }}>
            <Typography variant="h4" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, textAlign: 'left' }}>
              {resultData.feedback_text}
            </Typography>
          </Box>
          <Button variant="contained" size="large" sx={{ mt: 3, flexShrink: 0, background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)', color: 'white', fontWeight: 'bold' }} onClick={() => navigate('/')}>
            最初の画面に戻る
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}

export default ResultPage;
