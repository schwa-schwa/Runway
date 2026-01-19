import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { 
  Box, Typography, CircularProgress, Alert, Select, MenuItem, 
  FormControl, InputLabel, Paper, keyframes
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import PersonIcon from '@mui/icons-material/Person';

// =============================================
// デザイントークン（GrowthReportPageと統一）
// =============================================
const theme = {
  colors: {
    bg: '#0f0f1a',
    surface: '#1a1a2e',
    surfaceLight: '#252542',
    primary: '#00d4ff',
    secondary: '#ff6b9d',
    accent: '#7c4dff',
    gold: '#ffd700',
    silver: '#c0c0c0',
    bronze: '#cd7f32',
    success: '#00e676',
    text: '#ffffff',
    textMuted: '#a0a0b8',
  },
};

// =============================================
// アニメーション定義
// =============================================
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeInScale = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
  }
  50% {
    box-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
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

// =============================================
// カウントアップフック
// =============================================
const useCountUp = (end, duration = 1000, startAnimation = false) => {
  const [count, setCount] = useState(0);
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
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * endValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);
    return () => { startTimeRef.current = null; };
  }, [end, duration, startAnimation]);

  return count;
};

// =============================================
// サブコンポーネント
// =============================================

const GlowCard = ({ children, sx = {}, glowColor = theme.colors.primary }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 3,
      background: `linear-gradient(145deg, ${theme.colors.surface} 0%, ${theme.colors.bg} 100%)`,
      border: `1px solid ${theme.colors.surfaceLight}`,
      transition: 'all 0.3s ease',
      '&:hover': {
        borderColor: glowColor,
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 32px ${glowColor}33`,
      },
      ...sx,
    }}
  >
    {children}
  </Paper>
);

// 表彰台アイテム
const PodiumCard = ({ entry, rank, isCurrentUser, animationDelay, animationStarted }) => {
  const rankColors = {
    1: { color: theme.colors.gold, icon: <EmojiEventsIcon sx={{ fontSize: 40 }} />, height: 180 },
    2: { color: theme.colors.silver, icon: <WorkspacePremiumIcon sx={{ fontSize: 36 }} />, height: 150 },
    3: { color: theme.colors.bronze, icon: <MilitaryTechIcon sx={{ fontSize: 32 }} />, height: 120 },
  };
  
  const config = rankColors[rank];
  const animatedScore = useCountUp(entry?.score || 0, 1200, animationStarted);

  if (!entry) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: `${fadeInScale} 0.6s ease-out`,
        animationDelay: `${animationDelay}s`,
        animationFillMode: 'both',
        order: rank === 1 ? 2 : rank === 2 ? 1 : 3,
      }}
    >
      {/* アバター + 名前 */}
      <Box
        sx={{
          width: rank === 1 ? 90 : 70,
          height: rank === 1 ? 90 : 70,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${config.color}44 0%, ${config.color}22 100%)`,
          border: `3px solid ${config.color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1,
          position: 'relative',
          boxShadow: isCurrentUser ? `0 0 30px ${theme.colors.primary}` : `0 0 20px ${config.color}66`,
          animation: rank === 1 ? `${glowPulse} 2s ease-in-out infinite` : 'none',
        }}
      >
        <Typography
          variant={rank === 1 ? 'h4' : 'h5'}
          sx={{ 
            fontWeight: 700, 
            color: config.color,
            textShadow: `0 0 10px ${config.color}`,
          }}
        >
          {entry.user_name?.charAt(0)?.toUpperCase() || '?'}
        </Typography>
        {/* ランクバッジ */}
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${config.color}66`,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#000' }}>
            {rank}
          </Typography>
        </Box>
      </Box>

      <Typography
        variant="body1"
        sx={{
          fontWeight: 700,
          color: isCurrentUser ? theme.colors.primary : theme.colors.text,
          mb: 0.5,
          maxWidth: 100,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'center',
        }}
      >
        {entry.user_name}
      </Typography>

      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: config.color,
          textShadow: `0 0 8px ${config.color}66`,
        }}
      >
        {animatedScore} pts
      </Typography>

      {/* 表彰台の台座 */}
      <Box
        sx={{
          width: rank === 1 ? 120 : 100,
          height: config.height,
          mt: 2,
          borderRadius: '8px 8px 0 0',
          background: `linear-gradient(180deg, ${config.color}33 0%, ${config.color}11 100%)`,
          border: `2px solid ${config.color}44`,
          borderBottom: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: `linear-gradient(180deg, ${config.color}22 0%, transparent 100%)`,
            borderRadius: '8px 8px 0 0',
          },
        }}
      >
        <Box sx={{ color: config.color, opacity: 0.6 }}>
          {config.icon}
        </Box>
      </Box>
    </Box>
  );
};

// 自分のランクカード
const MyRankCard = ({ myRank, animationStarted }) => {
  const animatedRank = useCountUp(myRank?.rank || 0, 800, animationStarted);
  const animatedScore = useCountUp(myRank?.score || 0, 1000, animationStarted);

  if (!myRank) return null;

  return (
    <GlowCard
      glowColor={theme.colors.primary}
      sx={{
        mb: 4,
        background: `linear-gradient(135deg, ${theme.colors.surface} 0%, ${theme.colors.primary}11 100%)`,
        border: `2px solid ${theme.colors.primary}44`,
        animation: `${fadeInUp} 0.6s ease-out`,
        animationDelay: '0.3s',
        animationFillMode: 'both',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.colors.primary}33 0%, ${theme.colors.accent}33 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PersonIcon sx={{ fontSize: 32, color: theme.colors.primary }} />
          </Box>
          <Box>
            <Typography variant="overline" sx={{ color: theme.colors.textMuted, letterSpacing: 2 }}>
              YOUR RANK
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {animatedRank}
              </Typography>
              <Typography variant="h6" sx={{ color: theme.colors.textMuted }}>
                位
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" sx={{ color: theme.colors.textMuted, letterSpacing: 2 }}>
            SCORE
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: theme.colors.success,
              textShadow: `0 0 20px ${theme.colors.success}44`,
            }}
          >
            {animatedScore} pts
          </Typography>
        </Box>
      </Box>
    </GlowCard>
  );
};

// ランキングリストアイテム
const RankingListItem = ({ entry, index, isCurrentUser }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      mb: 1.5,
      borderRadius: 2,
      background: isCurrentUser 
        ? `linear-gradient(90deg, ${theme.colors.primary}11 0%, ${theme.colors.surface} 100%)`
        : theme.colors.surface,
      border: `1px solid ${isCurrentUser ? theme.colors.primary + '66' : theme.colors.surfaceLight}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'all 0.2s ease',
      animation: `${fadeInUp} 0.4s ease-out`,
      animationDelay: `${0.5 + index * 0.05}s`,
      animationFillMode: 'both',
      '&:hover': {
        transform: 'translateX(8px)',
        borderColor: theme.colors.primary,
        boxShadow: `0 4px 20px ${theme.colors.primary}22`,
      },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {/* ランク番号 */}
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1,
          bgcolor: theme.colors.surfaceLight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 700, color: theme.colors.textMuted }}>
          {entry.rank}
        </Typography>
      </Box>

      {/* アバター */}
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${theme.colors.accent}44 0%, ${theme.colors.secondary}44 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: isCurrentUser ? `2px solid ${theme.colors.primary}` : 'none',
        }}
      >
        <Typography variant="body1" sx={{ fontWeight: 700, color: theme.colors.text }}>
          {entry.user_name?.charAt(0)?.toUpperCase() || '?'}
        </Typography>
      </Box>

      {/* 名前 */}
      <Typography
        variant="body1"
        sx={{
          fontWeight: isCurrentUser ? 700 : 500,
          color: isCurrentUser ? theme.colors.primary : theme.colors.text,
        }}
      >
        {entry.user_name}
        {isCurrentUser && (
          <Typography component="span" sx={{ ml: 1, fontSize: '0.75rem', color: theme.colors.primary }}>
            (You)
          </Typography>
        )}
      </Typography>
    </Box>

    {/* スコア */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          width: 100,
          height: 6,
          borderRadius: 3,
          bgcolor: theme.colors.surfaceLight,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${Math.min((entry.score / 100) * 100, 100)}%`,
            height: '100%',
            borderRadius: 3,
            background: `linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
          }}
        />
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: isCurrentUser ? theme.colors.primary : theme.colors.text,
          minWidth: 80,
          textAlign: 'right',
        }}
      >
        {entry.score} pts
      </Typography>
    </Box>
  </Paper>
);

// =============================================
// メインコンポーネント
// =============================================
const RankingPage = () => {
  const { currentUser } = useUser();
  
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState('');
  const [rankingData, setRankingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animationStarted, setAnimationStarted] = useState(false);

  // チャレンジ一覧の取得
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await fetch(`/api/challenges/`);
        if (!response.ok) throw new Error('チャレンジ一覧の取得に失敗しました。');
        const data = await response.json();
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

  // ランキングデータの取得
  useEffect(() => {
    if (!selectedChallenge || !currentUser) return;

    const fetchRanking = async () => {
      setLoading(true);
      setError('');
      setRankingData(null);
      setAnimationStarted(false);
      try {
        const response = await fetch(`/api/ranking/?challenge=${selectedChallenge}&user=${currentUser.id}`);
        if (!response.ok) throw new Error('ランキングデータの取得に失敗しました。');
        const data = await response.json();
        setRankingData(data);
        // データ取得後にアニメーション開始
        setTimeout(() => setAnimationStarted(true), 100);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [selectedChallenge, currentUser]);

  const handleChallengeChange = (event) => {
    setSelectedChallenge(event.target.value);
  };

  const leaderboard = rankingData?.leaderboard || [];
  const top3 = leaderboard.slice(0, 3);
  const others = leaderboard.slice(3);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.colors.bg, py: 4, px: { xs: 2, md: 4 } }}>
      {/* ヘッダー */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
          animation: `${fadeInUp} 0.5s ease-out`,
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: theme.colors.primary,
              letterSpacing: 3,
              fontWeight: 600,
              background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent})`,
              backgroundSize: '200% auto',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: `${shimmer} 3s linear infinite`,
            }}
          >
            LEADERBOARD
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: theme.colors.text }}>
            ランキング
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: theme.colors.textMuted }}>チャレンジ</InputLabel>
          <Select
            value={selectedChallenge}
            label="チャレンジ"
            onChange={handleChallengeChange}
            disabled={challenges.length === 0}
            sx={{
              color: theme.colors.text,
              '.MuiOutlinedInput-notchedOutline': { borderColor: theme.colors.surfaceLight },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.colors.primary },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.colors.primary },
              '.MuiSvgIcon-root': { color: theme.colors.textMuted },
            }}
            MenuProps={{
              PaperProps: {
                sx: { bgcolor: theme.colors.surface, color: theme.colors.text },
              },
            }}
          >
            {challenges.map((challenge) => (
              <MenuItem
                key={challenge.id}
                value={challenge.id}
                sx={{ '&:hover': { bgcolor: theme.colors.surfaceLight } }}
              >
                {challenge.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* エラー表示 */}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* ローディング */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: theme.colors.primary }} size={60} />
        </Box>
      )}

      {/* メインコンテンツ */}
      {!loading && rankingData && (
        <>
          {/* 自分のランク */}
          {rankingData.my_rank ? (
            <MyRankCard myRank={rankingData.my_rank} animationStarted={animationStarted} />
          ) : (
            <GlowCard
              sx={{
                mb: 4,
                textAlign: 'center',
                animation: `${fadeInUp} 0.5s ease-out`,
              }}
            >
              <Typography variant="body1" sx={{ color: theme.colors.textMuted }}>
                このチャレンジにはまだ参加していません
              </Typography>
            </GlowCard>
          )}

          {/* 表彰台（Top 3） */}
          {top3.length > 0 && (
            <Box sx={{ mb: 5 }}>
              <Typography
                variant="h6"
                sx={{
                  color: theme.colors.text,
                  fontWeight: 700,
                  mb: 3,
                  textAlign: 'center',
                }}
              >
                🏆 TOP 3
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  gap: { xs: 1, md: 3 },
                  minHeight: 350,
                }}
              >
                {[1, 2, 3].map((rank) => {
                  const entry = top3.find((e) => e.rank === rank);
                  return (
                    <PodiumCard
                      key={rank}
                      entry={entry}
                      rank={rank}
                      isCurrentUser={entry?.user_id === currentUser?.id}
                      animationDelay={rank === 1 ? 0.2 : rank === 2 ? 0.1 : 0.3}
                      animationStarted={animationStarted}
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          {/* ランキングリスト（4位以降） */}
          {others.length > 0 && (
            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: theme.colors.text,
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                📊 ランキング
              </Typography>
              {others.map((entry, index) => (
                <RankingListItem
                  key={entry.user_id}
                  entry={entry}
                  index={index}
                  isCurrentUser={entry.user_id === currentUser?.id}
                />
              ))}
            </Box>
          )}

          {/* データがない場合 */}
          {leaderboard.length === 0 && (
            <GlowCard sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" sx={{ color: theme.colors.textMuted, mb: 1 }}>
                まだランキングデータがありません
              </Typography>
              <Typography variant="body2" sx={{ color: theme.colors.textMuted }}>
                チャレンジに参加してランキングに登録しましょう！
              </Typography>
            </GlowCard>
          )}
        </>
      )}
    </Box>
  );
};

export default RankingPage;
