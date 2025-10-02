import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Chip, Divider } from '@mui/material';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, } from 'recharts';

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
  const location = useLocation();
  const [displayScore, setDisplayScore] = useState(0);
  const [personalBest, setPersonalBest] = useState(null);
  const [isBestScore, setIsBestScore] = useState(false);
  const [rank, setRank] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(null);

  const resultData = location.state?.resultData;

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

  useEffect(() => {
    const fetchPastScores = async () =>{
      if (!resultData?.challenge) {
        return;
      }
      
      try {
        const [scoresResponse, rankingResponse] = await Promise.all([fetch(`http://localhost:8000/api/scores/?user=${resultData.user}&challenge=${resultData.challenge}`), fetch(`http://localhost:8000/api/scores/${resultData.id}/ranking/`)])
        
        if (!scoresResponse.ok || !rankingResponse.ok) {
          throw new Error('過去のスコアの取得に失敗しました。');
        }

        const [pastScores, rankingData] = await Promise.all([
          scoresResponse.json(),
          rankingResponse.json()
        ]);

        console.log('取得した過去スコア:', pastScores);
        const scoreHistory = pastScores.slice(1);
        const bestPastScore = scoreHistory.reduce((max, score) => {
          return Math.max(max, score.overall_score);
        },0);
        setPersonalBest(bestPastScore);
        setIsBestScore(resultData.overall_score > bestPastScore);

        setRank(rankingData.rank);
        setTotalParticipants(rankingData.total_participants);

      } catch (error) {
        console.error(error)
        setPersonalBest(0);
        setIsBestScore(true);
        setRank(1);
        setTotalParticipants(1);
      }
    }
    fetchPastScores();
  },[resultData])

  if (!resultData) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">結果データがありません。</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
          ユーザー選択に戻る
        </Button>
      </Box>
    );
  }

  const chartDataForRecharts = Object.keys(resultData.chart_data).map(key => ({
    subject: subjectMapping[key] || key,
    score: resultData.chart_data[key],
    fullMark: 20,
  }));
  

  // ★★★ 半透明のスタイルを共通化 ★★★
  const paperStyle = {
    flex: '1 1 50%',
    minWidth: 0,
    p: 3,
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.4)',       // 枠線を少し濃く
    backgroundColor: 'rgba(255, 255, 255, 0.75)',    // 透明度を少し下げる
    backdropFilter: 'blur(10px)',                       // ぼかし効果
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)', // 影を調整
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
      {/* --- 上段の行 --- */}
      <Box sx={{ display: 'flex', flex: 1, gap: 3, minHeight: 0 }}>
        {/* --- 左上：総合スコア --- */}
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

        {/* --- 右上：レーダーチャート --- */}
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

      {/* --- 下段の行 --- */}
      <Box sx={{ display: 'flex', flex: 1, gap: 3, minHeight: 0 }}>
        {/* --- 左下：過去との比較とランキング --- */}
        <Paper elevation={6} sx={{ ...paperStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', textAlign: 'center' }}>
          <Box sx={{ flexShrink: 1 }}>
            <Typography variant="h5" component="h2" gutterBottom >
              自己ベスト比較
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, mt: 2 }}>
              <Box>
                <Typography variant="caption" display="block" color="text.secondary">今回</Typography>
                <Typography variant="h2" component="p" sx={{ fontWeight: 'bold', color: isBestScore ? '#FF8E53' : '#FE6B8B' }}>
                  {resultData.overall_score}
                </Typography>
              </Box>
              <Typography variant="h4" color="text.secondary">vs</Typography>
              <Box>
                <Typography variant="caption" display="block" color="text.secondary">自己ベスト</Typography>
                <Typography variant="h2" component="p" sx={{ fontWeight: 'bold' }}>
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
            <Typography variant="h5" component="h2" gutterBottom>
              ランキング
            </Typography>
            <Typography variant="h2" component="p" sx={{ fontWeight: 'bold' }}>
              {rank === null ? '...' : rank}
              <Typography variant="h5" component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                位
              </Typography>
              <Typography variant="body1" component="span" sx={{ ml: 1.5, color: 'text.secondary' }}>
                / {totalParticipants === null ? '...' : totalParticipants}人中
              </Typography>
            </Typography>
          </Box>
        </Paper>

        {/* --- 右下：AIフィードバック --- */}
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