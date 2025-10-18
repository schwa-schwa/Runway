import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import { 
    Box, 
    Typography, 
    Paper, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    CircularProgress, 
    Alert,
    Divider 
} from '@mui/material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';

function GrowthReportPage() {
  const { currentUser } = useUser();
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState('');
  const [scoreHistory, setScoreHistory] = useState([]);
  const [averageScores, setAverageScores] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/challenges/');
        if (!response.ok) throw new Error('チャレンジ一覧の取得に失敗しました。');
        const data = await response.json();
        console.log(`チャレンジデーター: ${data[0]}`)
        setChallenges(data);
        if (data.length > 0) {
          setSelectedChallenge(data[0].id);
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchChallenges();
  }, []);

  useEffect(() => {
    if (!selectedChallenge || !currentUser) return;

    const fetchReportData = async () => {
      setLoading(true);
      setError('');
      try {
        const [historyRes, avgRes] = await Promise.all([
          fetch(`http://localhost:8000/api/scores/history/?user=${currentUser.id}&challenge=${selectedChallenge}`),
          fetch(`http://localhost:8000/api/scores/average_comparison/?user=${currentUser.id}&challenge=${selectedChallenge}`)
        ]);

        if (!historyRes.ok) throw new Error('スコア履歴の取得に失敗しました。');
        if (!avgRes.ok) throw new Error('平均スコアの取得に失敗しました。');

        const historyData = await historyRes.json();
        const avgData = await avgRes.json();

        setScoreHistory(historyData);
        setAverageScores(avgData);
      } catch (err) {
        setError(err.message);
        setScoreHistory([]);
        setAverageScores(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [selectedChallenge, currentUser]);

  const radarChartData = useMemo(() => {
    if (!averageScores || !averageScores.user_chart_data_averages || !averageScores.overall_chart_data_averages) return [];

    const itemLabels = {
        symmetry: '左右対称性',
        trunk_uprightness: '体幹の直立性',
        gravity_stability: '重心の安定性',
        rhythmic_accuracy: 'リズムの正確性',
        movement_smoothness: '動作の滑らかさ'
    };

    const userAvgs = averageScores.user_chart_data_averages;
    const overallAvgs = averageScores.overall_chart_data_averages;

    return Object.keys(itemLabels).map(key => ({
        subject: itemLabels[key],
        'あなた': userAvgs[key] || 0,
        '全体': overallAvgs[key] || 0,
        fullMark: 20,
    }));
  }, [averageScores]);

  const summaryData = useMemo(() => {
    if (!averageScores || scoreHistory.length === 0) return null;

    const yourAverage = averageScores.user_average || 0;
    const overallAverage = averageScores.overall_average || 0;
    const bestScore = Math.max(...scoreHistory.map(s => s.score));
    const attempts = scoreHistory.length;

    const scoreChangeFromPrevious = attempts > 1 ? scoreHistory[attempts - 1].score - scoreHistory[attempts - 2].score : 0;
    const scoreChangeFromFirst = attempts > 0 ? scoreHistory[attempts - 1].score - scoreHistory[0].score : 0;

    const itemLabels = {
        symmetry: '左右対称性',
        trunk_uprightness: '体幹の直立性',
        gravity_stability: '重心の安定性',
        rhythmic_accuracy: 'リズムの正確性',
        movement_smoothness: '動作の滑らかさ'
    };

    const userAvgs = averageScores.user_chart_data_averages || {};
    let bestItem = 'N/A';
    let worstItem = 'N/A';

    if (Object.keys(userAvgs).length > 0) {
        bestItem = Object.keys(userAvgs).reduce((a, b) => userAvgs[a] > userAvgs[b] ? a : b);
        worstItem = Object.keys(userAvgs).reduce((a, b) => userAvgs[a] < userAvgs[b] ? a : b);
    }

    return {
        yourAverage: yourAverage.toFixed(1),
        bestScore: bestScore.toFixed(1),
        attempts,
        overallAverage: overallAverage.toFixed(1),
        bestItem: itemLabels[bestItem] || 'N/A',
        worstItem: itemLabels[worstItem] || 'N/A',
        scoreChangeFromPrevious: scoreChangeFromPrevious.toFixed(1),
        scoreChangeFromFirst: scoreChangeFromFirst.toFixed(1),
    };
  }, [averageScores, scoreHistory]);

  return (
    <Box sx={{ flexGrow: 1, p: 3, background: '#f4f6f8', minHeight: '100vh' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        成長レポート
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="challenge-select-label">チャレンジ</InputLabel>
        <Select
          labelId="challenge-select-label"
          value={selectedChallenge}
          label="チャレンジ"
          onChange={(e) => setSelectedChallenge(e.target.value)}
          disabled={challenges.length === 0}
        >
          {challenges.map((challenge) => (
            <MenuItem key={challenge.id} value={challenge.id}>
              {challenge.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ width: { xs: '100%', md: '66.66%' } }}>
              <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" gutterBottom>スコア推移</Typography>
                <Box sx={{ flexGrow: 1, minHeight: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreHistory} margin={{ top: 5, right: 20, left: -10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" />
                      <YAxis domain={[0, 100]}/>
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="score" name="スコア" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Box>
            <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
              <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h6" gutterBottom>項目別スコア比較</Typography>
                <Box sx={{ flexGrow: 1, minHeight: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 20]} />
                      <Tooltip />
                      <Legend />
                      <Radar name="あなた" dataKey="あなた" stroke="#81d4fa" fill="#81d4fa" fillOpacity={0.6} />
                      <Radar name="全体" dataKey="全体" stroke="#808080" fill="#808080" fillOpacity={0} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Box>
          </Box>

          {summaryData && (
            <Paper elevation={3}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                <Box sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1" color="text.secondary">あなたの総合平均</Typography>
                  <Typography variant="h4" component="p">{summaryData.yourAverage}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1" color="text.secondary">最高スコア</Typography>
                  <Typography variant="h4" component="p">{summaryData.bestScore}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1" color="text.secondary">全体の総合平均</Typography>
                  <Typography variant="h4" component="p">{summaryData.overallAverage}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1" color="text.secondary">挑戦回数</Typography>
                  <Typography variant="h4" component="p">{summaryData.attempts}</Typography>
                </Box>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
                <Box sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1" color="text.secondary">初回からの伸び</Typography>
                  <Typography variant="h4" component="p">{summaryData.scoreChangeFromFirst}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1" color="text.secondary">前回からの変化</Typography>
                  <Typography variant="h4" component="p">{summaryData.scoreChangeFromPrevious}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1" color="text.secondary">最も得意な項目</Typography>
                  <Typography variant="h5" component="p" sx={{ pt: 1 }}>{summaryData.bestItem}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle1" color="text.secondary">今後の課題項目</Typography>
                  <Typography variant="h5" component="p" sx={{ pt: 1 }}>{summaryData.worstItem}</Typography>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
}

export default GrowthReportPage;