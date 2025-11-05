import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { 
  Box, Typography, Paper, List, ListItemText, 
  CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';

// --- Styled Components ---
const PodiumItem = styled(Paper)(({ theme, rank, isCurrentUser }) => ({
  background: isCurrentUser ? '#e3dffc' : theme.palette.background.paper,
  padding: theme.spacing(2),
  textAlign: 'center',
  width: '30%',
  position: 'relative',
  border: '2px solid',
  borderColor: rank === 1 ? '#ffd700' : (rank === 2 ? '#c0c0c0' : '#cd7f32'),
  boxShadow: `0 0 15px ${rank === 1 ? '#ffd700' : (rank === 2 ? '#c0c0c0' : '#cd7f32')}`,
  order: rank === 1 ? 2 : (rank === 2 ? 1 : 3), // 2位を中央に
  transform: rank === 1 ? 'translateY(-20px)' : (rank === 2 ? 'translateY(-10px)' : 'none'), // 1位を少し上に
}));

const RankListItem = styled(Paper)(({ theme, isCurrentUser }) => ({
  background: isCurrentUser ? '#e3dffc' : theme.palette.background.paper,
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1, 2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: '10px',
  border: isCurrentUser ? `2px solid ${theme.palette.primary.main}` : 'none',
}));


const RankingPage = () => {
  const { currentUser } = useUser();
  
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState('');
  const [rankingData, setRankingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/challenges/');
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

  useEffect(() => {
    if (!selectedChallenge || !currentUser) return;

    const fetchRanking = async () => {
      setLoading(true);
      setError('');
      setRankingData(null);
      try {
        const response = await fetch(`http://localhost:8000/api/ranking/?challenge=${selectedChallenge}&user=${currentUser.id}`);
        if (!response.ok) throw new Error('ランキングデータの取得に失敗しました。');
        const data = await response.json();
        setRankingData(data);
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
    <>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', mb: 2 }}>
        LEADERBOARD
      </Typography>

      <FormControl fullWidth sx={{ mb: 4 }}>
        <InputLabel id="challenge-select-label">チャレンジ</InputLabel>
        <Select
          labelId="challenge-select-label"
          value={selectedChallenge}
          label="チャレンジ"
          onChange={handleChallengeChange}
          disabled={challenges.length === 0}
        >
          {challenges.map((challenge) => (
            <MenuItem key={challenge.id} value={challenge.id}>{challenge.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* --- Your Rank --- */}
      {rankingData && (
        rankingData.my_rank ? (
          <Paper sx={(theme) => ({ 
            p: 2, 
            mb: 4, 
            background: '#e3dffc', 
            border: `2px solid ${theme.palette.primary.main}`,
            textAlign: 'center'
          })}>
            <Typography variant="h6">YOUR RANK</Typography>
            <Typography variant="h4" component="p" sx={{fontWeight: 'bold'}}>
              {rankingData.my_rank.rank}
              <Typography component="span" sx={{fontSize: '1rem', ml: 0.5}}>th</Typography>
            </Typography>
            <Typography variant="body1">{rankingData.my_rank.score} pts</Typography>
          </Paper>
        ) : (
          !loading && <Alert severity="info" sx={{ mb: 4 }}>
            このチャレンジにはまだ参加していません。
          </Alert>
        )
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress color="inherit" /></Box>}

      {rankingData && (
        <>
          {/* --- Podium (Top 3) --- */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 1, mb: 4, minHeight: 180 }}>
            {top3.map((entry) => (
              <PodiumItem key={entry.user_id} rank={entry.rank} isCurrentUser={entry.user_id === currentUser.id}>
                <Avatar sx={{ width: 56, height: 56, margin: 'auto', mb: 1, background: '#a78dff' }}>{entry.user_name.charAt(0)}</Avatar>
                <Typography variant="h6" sx={{fontWeight: 'bold'}}>{entry.user_name}</Typography>
                <Typography variant="body1" color="text.secondary">{entry.score} pts</Typography>
                <Typography variant="h4" sx={{fontWeight: 'bold'}}>{entry.rank}</Typography>
              </PodiumItem>
            ))}
          </Box>

          {/* --- Ranking List (4th onwards) --- */}
          <List>
            {others.map((entry) => (
              <RankListItem key={entry.user_id} isCurrentUser={entry.user_id === currentUser.id}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                  <Typography variant="h6" sx={{width: '30px'}}>{entry.rank}</Typography>
                  <Avatar sx={{ width: 40, height: 40, background: '#a78dff' }}>{entry.user_name.charAt(0)}</Avatar>
                  <ListItemText primary={entry.user_name} primaryTypographyProps={{fontWeight: 'bold'}} />
                </Box>
                <Typography variant="h6" color="text.secondary">{entry.score} pts</Typography>
              </RankListItem>
            ))}
          </List>
        </>
      )}
    </>
  );
};

export default RankingPage;
