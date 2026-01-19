import React, { useState, useEffect, useMemo } from "react";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
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
  Button,
  LinearProgress,
  Chip,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  EmojiEvents,
  DirectionsRun,
  Repeat,
  CompareArrows,
  Star,
  FitnessCenter,
} from "@mui/icons-material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";

// =============================================
// デザイントークン
// =============================================
const theme = {
  colors: {
    bg: "#0f0f1a",
    surface: "#1a1a2e",
    surfaceLight: "#252542",
    primary: "#00d4ff",
    secondary: "#ff6b9d",
    accent: "#7c4dff",
    success: "#00e676",
    warning: "#ffab00",
    text: "#ffffff",
    textMuted: "#a0a0b8",
  },
};

const itemLabels = {
  symmetry: "左右対称性",
  trunk_uprightness: "体幹の直立性",
  gravity_stability: "重心の安定性",
  walking_speed: "歩行速度",
};

// =============================================
// サブコンポーネント
// =============================================

const GlowCard = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 3,
      background: `linear-gradient(145deg, ${theme.colors.surface} 0%, ${theme.colors.bg} 100%)`,
      border: `1px solid ${theme.colors.surfaceLight}`,
      transition: "all 0.3s ease",
      "&:hover": {
        borderColor: theme.colors.primary,
        transform: "translateY(-2px)",
      },
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const StatDisplay = ({ label, value, icon, color, trend }) => (
  <GlowCard sx={{ flex: "1 1 200px", minWidth: 180 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: `${color}22`,
          color: color,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: theme.colors.textMuted, fontWeight: 500, display: "block" }}>
          {label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography variant="h5" sx={{ color: theme.colors.text, fontWeight: 700 }}>
            {value}
          </Typography>
          {trend !== undefined && trend !== 0 && (
            <Chip
              icon={trend > 0 ? <TrendingUp sx={{ fontSize: 14 }} /> : <TrendingDown sx={{ fontSize: 14 }} />}
              label={`${trend > 0 ? "+" : ""}${trend}`}
              size="small"
              sx={{
                bgcolor: trend > 0 ? `${theme.colors.success}22` : `${theme.colors.secondary}22`,
                color: trend > 0 ? theme.colors.success : theme.colors.secondary,
                fontWeight: 600,
                height: 22,
                "& .MuiChip-icon": { color: "inherit" },
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  </GlowCard>
);

const SkillBar = ({ label, value, maxValue = 25, color }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="body2" sx={{ color: theme.colors.textMuted }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ color: theme.colors.text, fontWeight: 600 }}>
          {value.toFixed(1)}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: theme.colors.surfaceLight,
          "& .MuiLinearProgress-bar": {
            borderRadius: 4,
            background: `linear-gradient(90deg, ${color} 0%, ${color}99 100%)`,
          },
        }}
      />
    </Box>
  );
};

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.primary}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <Typography variant="caption" sx={{ color: theme.colors.textMuted, display: "block" }}>
          {label}
        </Typography>
        <Typography variant="h6" sx={{ color: theme.colors.primary, fontWeight: 700 }}>
          {payload[0].value} 点
        </Typography>
      </Box>
    );
  }
  return null;
};

const InsightCard = ({ icon, label, value, color }) => (
  <GlowCard sx={{ flex: "1 1 250px" }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Box sx={{ color: color, fontSize: 32 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" sx={{ color: theme.colors.textMuted, display: "block" }}>
          {label}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, color: theme.colors.text }}>
          {value}
        </Typography>
      </Box>
    </Box>
  </GlowCard>
);

// =============================================
// メインコンポーネント
// =============================================

function GrowthReportPage() {
  const { currentUser } = useUser();
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState("");
  const [scoreHistory, setScoreHistory] = useState([]);
  const [averageScores, setAverageScores] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // --- データ取得 ---
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await fetch("/api/challenges/");
        if (!response.ok) throw new Error("チャレンジの取得に失敗");
        const data = await response.json();
        setChallenges(data);
        if (data.length > 0) setSelectedChallenge(data[0].id);
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
      setError("");
      try {
        const [historyRes, avgRes] = await Promise.all([
          fetch(`/api/scores/history/?user=${currentUser.id}&challenge=${selectedChallenge}`),
          fetch(`/api/scores/average_comparison/?user=${currentUser.id}&challenge=${selectedChallenge}`),
        ]);
        if (!historyRes.ok || !avgRes.ok) throw new Error("データ取得エラー");
        setScoreHistory(await historyRes.json());
        setAverageScores(await avgRes.json());
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

  // --- データ変換 ---
  const radarData = useMemo(() => {
    if (!averageScores?.user_chart_data_averages) return [];
    const userAvgs = averageScores.user_chart_data_averages;
    const overallAvgs = averageScores.overall_chart_data_averages || {};
    return Object.keys(itemLabels).map((key) => ({
      subject: itemLabels[key],
      あなた: userAvgs[key] || 0,
      全体平均: overallAvgs[key] || 0,
    }));
  }, [averageScores]);

  const summary = useMemo(() => {
    if (!averageScores || !scoreHistory.length) return null;
    const yourAvg = averageScores.user_average || 0;
    const overallAvg = averageScores.overall_average || 0;
    const best = Math.max(...scoreHistory.map((s) => s.score));
    const attempts = scoreHistory.length;
    const latestDiff = attempts > 1 ? scoreHistory[attempts - 1].score - scoreHistory[attempts - 2].score : 0;
    const totalGrowth = attempts > 0 ? scoreHistory[attempts - 1].score - scoreHistory[0].score : 0;

    const userAvgs = averageScores.user_chart_data_averages || {};
    const keys = Object.keys(userAvgs);
    const bestKey = keys.length ? keys.reduce((a, b) => (userAvgs[a] > userAvgs[b] ? a : b)) : null;
    const worstKey = keys.length ? keys.reduce((a, b) => (userAvgs[a] < userAvgs[b] ? a : b)) : null;

    return {
      yourAvg: yourAvg.toFixed(1),
      overallAvg: overallAvg.toFixed(1),
      best: best.toFixed(1),
      attempts,
      latestDiff: parseFloat(latestDiff.toFixed(1)),
      totalGrowth: parseFloat(totalGrowth.toFixed(1)),
      bestItem: bestKey ? itemLabels[bestKey] : "-",
      worstItem: worstKey ? itemLabels[worstKey] : "-",
      userAvgs,
    };
  }, [averageScores, scoreHistory]);

  // --- ユーザー未選択 ---
  if (!currentUser) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: theme.colors.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <Typography variant="h5" sx={{ color: theme.colors.secondary }} gutterBottom>ユーザー未選択</Typography>
        <Button variant="outlined" sx={{ color: theme.colors.text, borderColor: theme.colors.text }} onClick={() => navigate("/")}>ホームへ</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: theme.colors.bg, py: 4, px: { xs: 2, md: 5 } }}>
      {/* ヘッダー */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="overline" sx={{ color: theme.colors.primary, letterSpacing: 3, fontWeight: 600 }}>
            PERFORMANCE ANALYTICS
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: theme.colors.text }}>
            成長レポート
          </Typography>
          <Typography variant="body2" sx={{ color: theme.colors.textMuted, mt: 0.5 }}>
            {currentUser.name} さんのパフォーマンス分析
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: theme.colors.textMuted }}>チャレンジ</InputLabel>
          <Select
            value={selectedChallenge}
            label="チャレンジ"
            onChange={(e) => setSelectedChallenge(e.target.value)}
            sx={{
              color: theme.colors.text,
              ".MuiOutlinedInput-notchedOutline": { borderColor: theme.colors.surfaceLight },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: theme.colors.primary },
              ".MuiSvgIcon-root": { color: theme.colors.textMuted },
            }}
            MenuProps={{ PaperProps: { sx: { bgcolor: theme.colors.surface, color: theme.colors.text } } }}
          >
            {challenges.map((c) => (
              <MenuItem key={c.id} value={c.id} sx={{ "&:hover": { bgcolor: theme.colors.surfaceLight } }}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* ローディング / エラー */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
          <CircularProgress sx={{ color: theme.colors.primary }} size={60} />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

      {/* メインコンテンツ */}
      {!loading && !error && summary && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* 統計カード行 */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <StatDisplay label="平均スコア" value={summary.yourAvg} icon={<DirectionsRun />} color={theme.colors.primary} />
            <StatDisplay label="最高スコア" value={summary.best} icon={<EmojiEvents />} color={theme.colors.warning} />
            <StatDisplay label="挑戦回数" value={summary.attempts} icon={<Repeat />} color={theme.colors.accent} />
            <StatDisplay label="初回からの成長" value={`${summary.totalGrowth > 0 ? "+" : ""}${summary.totalGrowth}`} icon={<TrendingUp />} color={theme.colors.success} trend={summary.latestDiff} />
          </Box>

          {/* グラフ行 */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {/* スコア推移グラフ */}
            <GlowCard sx={{ flex: "2 1 500px", minWidth: 300 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: theme.colors.text }}>
                📈 スコア推移
              </Typography>
              <Box sx={{ height: 320 }}>
                <ResponsiveContainer>
                  <AreaChart data={scoreHistory} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={theme.colors.primary} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={theme.colors.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.surfaceLight} vertical={false} />
                    <XAxis dataKey="date" stroke={theme.colors.textMuted} tick={{ fontSize: 11, fill: theme.colors.textMuted }} />
                    <YAxis domain={[0, 100]} stroke={theme.colors.textMuted} tick={{ fontSize: 11, fill: theme.colors.textMuted }} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area type="monotone" dataKey="score" stroke={theme.colors.primary} strokeWidth={3} fill="url(#scoreGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </GlowCard>

            {/* スキルバー */}
            <GlowCard sx={{ flex: "1 1 280px", minWidth: 250 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: theme.colors.text }}>
                🎯 項目別スコア
              </Typography>
              {Object.entries(summary.userAvgs).map(([key, val], i) => (
                <SkillBar
                  key={key}
                  label={itemLabels[key]}
                  value={val}
                  color={[theme.colors.primary, theme.colors.secondary, theme.colors.accent, theme.colors.success][i % 4]}
                />
              ))}
            </GlowCard>
          </Box>

          {/* レーダー + インサイト行 */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {/* レーダーチャート */}
            <GlowCard sx={{ flex: "1 1 350px", minWidth: 300 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: theme.colors.text }}>
                🕸️ 全体平均との比較
              </Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={theme.colors.surfaceLight} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: theme.colors.textMuted, fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 25]} tick={false} axisLine={false} />
                    <Radar name="あなた" dataKey="あなた" stroke={theme.colors.primary} fill={theme.colors.primary} fillOpacity={0.4} />
                    <Radar name="全体平均" dataKey="全体平均" stroke={theme.colors.textMuted} fill={theme.colors.textMuted} fillOpacity={0.1} />
                    <Legend wrapperStyle={{ color: theme.colors.text }} />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </GlowCard>

            {/* インサイト */}
            <Box sx={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 2 }}>
              <InsightCard icon={<Star />} label="あなたの強み" value={summary.bestItem} color={theme.colors.warning} />
              <InsightCard icon={<FitnessCenter />} label="今後の伸び代" value={summary.worstItem} color={theme.colors.secondary} />
              <InsightCard
                icon={<CompareArrows />}
                label="全体平均との差"
                value={`${(parseFloat(summary.yourAvg) - parseFloat(summary.overallAvg)).toFixed(1)} pt`}
                color={parseFloat(summary.yourAvg) >= parseFloat(summary.overallAvg) ? theme.colors.success : theme.colors.secondary}
              />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default GrowthReportPage;
