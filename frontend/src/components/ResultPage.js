import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Chip, CircularProgress, Divider, Tooltip as MuiTooltip } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTheme } from '@mui/material/styles';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import ReactMarkdown from 'react-markdown';

// バックエンドの英語キーと、グラフに表示する日本語名を対応させるためのオブジェクト
const subjectMapping = {
  "symmetry": "左右の対称性",
  "trunk_uprightness": "体幹の直立性",
  "gravity_stability": "重心の安定性",
  "rhythmic_accuracy": "リズムの正確性",
};

const partMapping = {
  "shoulders": "肩",
  "hips": "腰",
};

// --- サブコンポーネント定義 ---

// 総合スコア表示コンポーネント
const ScoreDisplay = ({ displayScore, isBestScore, rank, totalParticipants }) => {
  const theme = useTheme();
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
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
    </Box>
  );
};

// パフォーマンス分析コンポーネント
const PerformanceAnalysis = ({ chartData }) => {
  const theme = useTheme();
  return (
    <Box sx={{ width: '100%', height: '500px', p: 4, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', color: theme.palette.grey[800] }}>
        パフォーマンス分析
      </Typography>
      <Box sx={{ flexGrow: 1, minHeight: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <defs>
              <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#2979ff" stopOpacity={0.4}/>
              </linearGradient>
            </defs>
            <PolarGrid stroke={theme.palette.grey[300]} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: theme.palette.grey[700], fontSize: 14, fontWeight: 'bold' }} />
            <PolarRadiusAxis domain={[0, 25]} angle={30} stroke={theme.palette.grey[400]} tick={false} axisLine={false} />
            <Radar
              name="今回のスコア"
              dataKey="score"
              stroke="#00e5ff"
              strokeWidth={4}
              fill="url(#radarFill)"
              fillOpacity={1}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: theme.palette.primary.dark, fontWeight: 'bold' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

// AIコーチの視点コンポーネント
const AiCoachView = ({ feedbackText }) => {
  const theme = useTheme();
  return (
    <Box sx={{ width: '100%', height: '100%', p: 4, display: 'flex', flexDirection: 'column' }}>
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
        '& p': {
          margin: '0.5em 0',
          lineHeight: 1.8,
          color: theme.palette.grey[800],
        },
        '& h1, & h2, & h3': {
            color: theme.palette.primary.dark,
            marginTop: '1em',
            marginBottom: '0.5em',
            fontWeight: 'bold'
        },
        '& ul, & ol': {
            paddingLeft: '1.5em',
        },
        '& li': {
            marginBottom: '0.3em',
        },
        '& strong': {
            color: theme.palette.secondary.dark,
        }
      }}>
        <ReactMarkdown>{feedbackText}</ReactMarkdown>
      </Box>
    </Box>
  );
};

// --- 詳細分析セクションコンポーネント ---

const SymmetrySection = ({ symmetryData }) => {
  const theme = useTheme();
  if (!symmetryData) return null;

  const renderTiltDirection = (tilt) => {
    if (Math.abs(tilt) < 0.005) return "ほぼ均等";
    const direction = tilt < 0 ? "左" : "右";
    const percentage = Math.abs(tilt * 100).toFixed(1);
    return `${direction}側が約${percentage}%高い傾向`;
  };

  return (
    <>
      {Object.entries(symmetryData).map(([part, data], index, array) => (
        <Box key={part} sx={{ p: 2 }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', color: theme.palette.primary.dark }}>
            {partMapping[part] || part}の対称性
          </Typography>
          <Box sx={{ textAlign: 'center', my: 2 }}>
            <Typography variant="h4" component="p" sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}>
              {data.score} <span style={{ fontSize: '1rem' }}>/ 25点</span>
            </Typography>
          </Box>
          <Box>
            <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <MuiTooltip title="歩行中の左右のブレの大きさ。体幹の長さに対する相対的な割合で、0に近いほど安定しています。">
                <InfoOutlinedIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }} />
              </MuiTooltip>
              安定性 (ブレの大きさ): <Typography component="span" sx={{ fontWeight: 'bold', ml: 1 }}>{data.avg_deviation}</Typography>
            </Typography>
            <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
              <MuiTooltip title="左右どちらに体が傾いているかの癖。-は左、+は右が高い傾向を示します。">
                <InfoOutlinedIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }} />
              </MuiTooltip>
              傾きの癖: <Typography component="span" sx={{ fontWeight: 'bold', ml: 1 }}>{renderTiltDirection(data.avg_tilt_direction)}</Typography>
            </Typography>
          </Box>
          {/* Add divider if it's not the last item in symmetry loop */}
          {index < array.length - 1 && <Divider sx={{ my: 2 }} />}
        </Box>
      ))}
    </>
  );
};

const TrunkSection = ({ trunkData }) => {
  const theme = useTheme();
  if (!trunkData) return null;

  const renderTiltDirection = (tilt) => {
    if (Math.abs(tilt) < 0.5) return "ほぼ垂直";
    const direction = tilt > 0 ? "右" : "左";
    return `${direction}側に約${Math.abs(tilt).toFixed(1)}度傾き`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', color: theme.palette.primary.dark }}>
        体幹の直立性
      </Typography>
      <Box sx={{ textAlign: 'center', my: 2 }}>
        <Typography variant="h4" component="p" sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}>
          {trunkData.score} <span style={{ fontSize: '1rem' }}>/ 25点</span>
        </Typography>
      </Box>
      <Box>
        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <MuiTooltip title="体幹が垂直からどれくらい傾いているかの平均角度（絶対値）。0に近いほど直立しています。">
            <InfoOutlinedIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }} />
          </MuiTooltip>
          平均傾斜角: <Typography component="span" sx={{ fontWeight: 'bold', ml: 1 }}>{trunkData.avg_tilt_angle} 度</Typography>
        </Typography>
        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
          <MuiTooltip title="左右どちらに傾きがちか。">
            <InfoOutlinedIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }} />
          </MuiTooltip>
          傾きの傾向: <Typography component="span" sx={{ fontWeight: 'bold', ml: 1 }}>{renderTiltDirection(trunkData.avg_tilt_direction)}</Typography>
        </Typography>
      </Box>
    </Box>
  );
};

const GravitySection = ({ gravityData }) => {
  const theme = useTheme();
  if (!gravityData) return null;

  const renderSwayDirection = (bias) => {
    if (Math.abs(bias) < 0.05) return "中心";
    const direction = bias > 0 ? "右" : "左";
    return `${direction}寄りに${Math.abs(bias).toFixed(2)}`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', color: theme.palette.primary.dark }}>
        重心の安定性
      </Typography>
      <Box sx={{ textAlign: 'center', my: 2 }}>
        <Typography variant="h4" component="p" sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}>
          {gravityData.score} <span style={{ fontSize: '1rem' }}>/ 25点</span>
        </Typography>
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2, mb: 1, color: theme.palette.grey[700] }}>
          腰の安定性 <span style={{ color: theme.palette.secondary.main }}>({gravityData.hip_score}点)</span>
        </Typography>
        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <MuiTooltip title="腰の左右のふらつきの大きさ（標準偏差）。小さいほど安定しています。">
            <InfoOutlinedIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }} />
          </MuiTooltip>
          ふらつき: <Typography component="span" sx={{ fontWeight: 'bold', ml: 1 }}>{gravityData.hip_sway_magnitude}</Typography>
        </Typography>
        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
          <MuiTooltip title="腰の位置が左右どちらに偏っているか。">
            <InfoOutlinedIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }} />
          </MuiTooltip>
          偏り: <Typography component="span" sx={{ fontWeight: 'bold', ml: 1 }}>{renderSwayDirection(gravityData.avg_hip_sway_direction)}</Typography>
        </Typography>

        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2, mb: 1, color: theme.palette.grey[700] }}>
          頭の安定性 <span style={{ color: theme.palette.secondary.main }}>({gravityData.head_score}点)</span>
        </Typography>
        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <MuiTooltip title="頭の左右のブレの大きさ（標準偏差）。小さいほど視線が安定しています。">
            <InfoOutlinedIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }} />
          </MuiTooltip>
          ブレ: <Typography component="span" sx={{ fontWeight: 'bold', ml: 1 }}>{gravityData.head_sway_magnitude}</Typography>
        </Typography>
        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
          <MuiTooltip title="頭の位置が左右どちらに偏っているか。">
            <InfoOutlinedIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }} />
          </MuiTooltip>
          偏り: <Typography component="span" sx={{ fontWeight: 'bold', ml: 1 }}>{renderSwayDirection(gravityData.avg_head_sway_direction)}</Typography>
        </Typography>
      </Box>
    </Box>
  );
};

const RhythmSection = ({ rhythmData }) => {
  const theme = useTheme();
  if (!rhythmData) return null;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', color: theme.palette.primary.dark }}>
        リズムの正確性
      </Typography>
      <Box sx={{ textAlign: 'center', my: 2 }}>
        <Typography variant="h4" component="p" sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}>
          {rhythmData.score} <span style={{ fontSize: '1rem' }}>/ 25点</span>
        </Typography>
      </Box>
      <Box>
        <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
          <MuiTooltip title="歩行リズム（ステップ間隔）のばらつき。0に近いほど一定のリズムで歩けています。">
            <InfoOutlinedIcon sx={{ mr: 1, color: 'text.secondary', fontSize: '1.1rem' }} />
          </MuiTooltip>
          リズムのばらつき (標準偏差): <Typography component="span" sx={{ fontWeight: 'bold', ml: 1 }}>{rhythmData.rhythm_consistency}</Typography>
        </Typography>
      </Box>
    </Box>
  );
};

// 統合された詳細分析レポートコンポーネント
const DetailedAnalysisReport = ({ detailedResults }) => {
  const theme = useTheme();
  if (!detailedResults) return null;

  const { symmetry, trunk_uprightness, gravity_stability, rhythmic_accuracy } = detailedResults;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold', color: theme.palette.grey[800], mb: 3 }}>
        詳細分析レポート
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <SymmetrySection symmetryData={symmetry} />
        <Divider />
        <TrunkSection trunkData={trunk_uprightness} />
        <Divider />
        <GravitySection gravityData={gravity_stability} />
        <Divider />
        <RhythmSection rhythmData={rhythmic_accuracy} />
      </Box>
    </Box>
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
        const response = await fetch(`/api/result/${scoreId}/`);
        if (!response.ok) {
          throw new Error(`結果データの取得に失敗しました。(ID: ${scoreId})`);
        }
        const data = await response.json();

        // APIからのレスポンスを元に各stateを更新
        setResultData(data.main_score);
        setIsBestScore(data.main_score.overall_score > data.personal_best);
        setRank(data.ranking.rank);
        setTotalParticipants(data.ranking.total_participants);

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
      <Typography variant="h4" component="h1" sx={{ mb: 1, textAlign: 'center', fontWeight: 'bold', color: theme.palette.grey[800] }}>
        採点結果
      </Typography>

      {/* Main Unified Card */}
      <Paper elevation={6} sx={{ borderRadius: '16px', bgcolor: 'white', overflow: 'hidden' }}>
        
        {/* Score Display */}
        <ScoreDisplay
          displayScore={displayScore}
          isBestScore={isBestScore}
          rank={rank}
          totalParticipants={totalParticipants}
        />
        
        <Divider />

        {/* Performance Analysis */}
        <PerformanceAnalysis chartData={chartDataForRecharts} />
        
        <Divider />

        {/* Split Section: Detailed Analysis and AI Coach */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ flex: { md: 4 }, width: '100%' }}>
            <DetailedAnalysisReport detailedResults={resultData.detailed_results} />
          </Box>
          
          {/* Responsive Divider */}
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
          <Divider sx={{ display: { xs: 'block', md: 'none' } }} />
          
          <Box sx={{ flex: { md: 6 }, width: '100%' }}>
            <AiCoachView feedbackText={resultData.feedback_text} />
          </Box>
        </Box>
      </Paper>

      <ActionButtons onNavigate={navigate} />
    </Box>
  );
}

export default ResultPage;
