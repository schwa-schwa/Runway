import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Chip, CircularProgress, } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { useTheme } from '@mui/material/styles';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// バックエンドの英語キーと、グラフに表示する日本語名を対応させるためのオブジェクト
const subjectMapping = {
  "symmetry": "左右の対称性",
  "trunk_uprightness": "体幹の直立性",
  "gravity_stability": "重心の安定性",
  "rhythmic_accuracy": "リズムの正確性",
};

// --- サブコンポーネント定義 ---

// 総合スコア表示コンポーネント
const ScoreDisplay = ({ displayScore, isBestScore, rank, totalParticipants }) => {
  const theme = useTheme();
  return (
    <Paper elevation={6} sx={{ p: 4, textAlign: 'center', borderRadius: '16px', bgcolor: 'white' }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
        <Typography
          variant="h1"
          component="p"
          sx={{
            fontSize: { xs: '4rem', sm: '6rem', md: '8rem' },
            fontWeight: 'bold',
            lineHeight: 1,
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.info.light} 90%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {displayScore}
        </Typography>
        <Typography variant="h2" component="span" sx={{ color: theme.palette.primary.main, ml: 1, fontWeight: 'bold' }}>
          点
        </Typography>
      </Box>
      {isBestScore && (
        <Chip
          label="🎉 ベストスコア更新！"
          sx={{
            mt: 2,
            fontWeight: 'bold',
            fontSize: '1rem',
            color: 'white',
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.info.light} 90%)`,
          }}
        />
      )}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" component="span" sx={{ color: theme.palette.grey[700] }}>
          ランキング:
        </Typography>
        <Typography variant="h5" component="span" sx={{ fontWeight: 'bold', color: theme.palette.primary.dark }}>
          {rank === null ? '...' : rank}
        </Typography>
        <Typography variant="h6" component="span" sx={{ color: theme.palette.grey[700] }}>
          位 / {totalParticipants === null ? '...' : totalParticipants}人中
        </Typography>
      </Box>
    </Paper>
  );
};

// パフォーマンス分析コンポーネント
const PerformanceAnalysis = ({ chartData }) => {
  const theme = useTheme();
  return (
    <Box sx={{ width: { xs: '100%', md: '41.66%' } }}> {/* 5/12 */}
      <Paper elevation={6} sx={{ p: 4, borderRadius: '16px', bgcolor: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', color: theme.palette.grey[800] }}>
          パフォーマンス分析
        </Typography>
        <Box sx={{ flexGrow: 1, minHeight: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke={theme.palette.grey[300]} />
              <PolarAngleAxis dataKey="subject" stroke={theme.palette.grey[700]} />
              <PolarRadiusAxis domain={[0, 25]} angle={30} stroke={theme.palette.grey[500]} />
              <Radar name="今回のスコア" dataKey="score" stroke={theme.palette.primary.main} fill={theme.palette.info.light} fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
};

// AIコーチの視点コンポーネント
const AiCoachView = ({ feedbackText }) => {
  const theme = useTheme();
  return (
    <Box sx={{ width: { xs: '100%', md: '58.33%' } }}> {/* 7/12 */}
      <Paper elevation={6} sx={{ p: 4, borderRadius: '16px', bgcolor: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <LightbulbIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: theme.palette.grey[800] }}>
            AIコーチの視点
          </Typography>
        </Box>
        <Box sx={{
          flexGrow: 1,
          overflowY: 'auto',
          mt: 2,
          p: 2,
          pl: 3,
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          bgcolor: theme.palette.grey[50],
          borderRadius: '0 8px 8px 0',
        }}>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: theme.palette.grey[800] }}>
            {feedbackText}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

// スコア履歴チャートコンポーネント
const ScoreHistoryChart = ({ historyData }) => {
  const theme = useTheme();
  return (
    <Paper elevation={6} sx={{ p: 3, borderRadius: '16px', bgcolor: 'white' }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', color: theme.palette.grey[800] }}>
        このチャレンジのスコア推移
      </Typography>
      <Box sx={{ height: 300, mt: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={historyData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.grey[300]} />
            <XAxis dataKey="date" stroke={theme.palette.grey[700]} />
            <YAxis domain={[0, 100]} stroke={theme.palette.grey[700]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="overall_score" stroke={theme.palette.primary.main} activeDot={{ r: 8 }} name="スコア" />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

// アクションボタンコンポーネント
const ActionButtons = ({ onNavigate }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
      <Button
        variant="contained"
        size="large"
        sx={{
          bgcolor: theme.palette.primary.main,
          '&:hover': { bgcolor: theme.palette.primary.dark },
          color: 'white',
          fontWeight: 'bold',
          px: 4,
          py: 1.5,
          borderRadius: '25px',
        }}
        onClick={() => onNavigate(`/challenges`)}
      >
        もう一度挑戦する
      </Button>
      <Button
        variant="outlined"
        size="large"
        sx={{
          color: theme.palette.primary.main,
          borderColor: theme.palette.primary.main,
          '&:hover': { borderColor: theme.palette.primary.dark, color: theme.palette.primary.dark },
          fontWeight: 'bold',
          px: 4,
          py: 1.5,
          borderRadius: '25px',
        }}
        onClick={() => onNavigate('/dashboard')}
      >
        ダッシュボードに戻る
      </Button>
      <Button
        variant="text"
        size="large"
        sx={{
          color: theme.palette.info.main,
          '&:hover': { color: theme.palette.info.dark },
          fontWeight: 'bold',
          px: 4,
          py: 1.5,
          borderRadius: '25px',
        }}
        onClick={() => onNavigate('/report')}
      >
        詳細な成長レポートを見る
      </Button>
    </Box>
  );
};


// --- メインコンポーネント ---
function ResultPage() {
  const navigate = useNavigate();
  const { scoreId } = useParams(); // URLからscoreIdを取得
  const theme = useTheme(); // テーマフックを呼び出す

  // --- State管理 ---
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [displayScore, setDisplayScore] = useState(0);
  const [isBestScore, setIsBestScore] = useState(false);
  const [rank, setRank] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(null);
  const [scoreHistoryForChart, setScoreHistoryForChart] = useState([]); // スコア履歴チャート用

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

        // 新しい単一のエンドポイントにリクエスト
        const response = await fetch(`http://localhost:8000/api/result/${scoreId}/`);
        if (!response.ok) {
          throw new Error(`結果データの取得に失敗しました。(ID: ${scoreId})`);
        }
        const data = await response.json();

        // APIからのレスポンスを元に各stateを更新
        setResultData(data.main_score);
        setIsBestScore(data.main_score.overall_score > data.personal_best);
        setRank(data.ranking.rank);
        setTotalParticipants(data.ranking.total_participants);
        setScoreHistoryForChart(data.score_history);

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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>結果を読み込み中...</Typography>
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
    fullMark: 25,
  }));

  return (
    <Box sx={{
      minHeight: '100vh',
      background: theme.palette.grey[100],
      py: 4,
      px: { xs: 2, md: 4 },
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      boxSizing: 'border-box',
    }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold', color: theme.palette.grey[800] }}>
        採点結果
      </Typography>

      <ScoreDisplay
        displayScore={displayScore}
        isBestScore={isBestScore}
        rank={rank}
        totalParticipants={totalParticipants}
      />
      
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          mb: 3,
        }}
      >
        <PerformanceAnalysis chartData={chartDataForRecharts} />
        <AiCoachView feedbackText={resultData.feedback_text} />
      </Box>

      <ScoreHistoryChart historyData={scoreHistoryForChart} />

      <ActionButtons onNavigate={navigate} />
    </Box>
  );
}

export default ResultPage;
