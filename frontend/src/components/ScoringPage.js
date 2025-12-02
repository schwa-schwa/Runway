import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Box, CircularProgress, Button, LinearProgress, Paper, IconButton, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { useUser } from '../contexts/UserContext';

const SCORING_DURATION = 5000; // 採点時間（ミリ秒）

// --- Metric Definitions ---
const METRIC_DEFINITIONS = {
  trunkAngle: {
    name: "体幹の傾き",
    unit: "°",
    calculation: (landmarks) => {
      const [LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP] = [11, 12, 23, 24];
      const VISIBILITY_THRESHOLD = 0.85;
      const requiredLandmarks = [landmarks[LEFT_SHOULDER], landmarks[RIGHT_SHOULDER], landmarks[LEFT_HIP], landmarks[RIGHT_HIP]];
      if (requiredLandmarks.some(lm => !lm || lm.visibility < VISIBILITY_THRESHOLD)) return null;

      const shoulderMidX = (landmarks[LEFT_SHOULDER].x + landmarks[RIGHT_SHOULDER].x) / 2;
      const shoulderMidY = (landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2;
      const hipMidX = (landmarks[LEFT_HIP].x + landmarks[RIGHT_HIP].x) / 2;
      const hipMidY = (landmarks[LEFT_HIP].y + landmarks[RIGHT_HIP].y) / 2;

      const bodyVecY = shoulderMidY - hipMidY;
      const bodyVecX = shoulderMidX - hipMidX;
      
      const bodyAngleRad = Math.atan2(bodyVecY, bodyVecX);
      const bodyAngleDeg = bodyAngleRad * (180 / Math.PI);
      
      let signedTiltAngle = bodyAngleDeg - (-90);

      // 角度を-180から180度の範囲に正規化
      while (signedTiltAngle > 180) signedTiltAngle -= 360;
      // while (signedTiltAngle < -180) signedTiltAngle += 360; // この行は不要
      
      return signedTiltAngle;
    }
  },
  stepCount: {
    name: "歩数",
    unit: "歩",
    calculation: () => null // Stateful calculation handled separately
  }
};

const calculateAllRealtimeMetrics = (landmarks) => {
  const metrics = {};
  for (const key in METRIC_DEFINITIONS) {
    const value = METRIC_DEFINITIONS[key].calculation(landmarks);
    if (value !== null) {
      metrics[key] = value;
    }
  }
  return metrics;
};

// --- UI Components ---

const RealtimeMetricsDisplay = ({ metrics, visibility }) => {
  return (
    <Box sx={{
      position: 'absolute',
      top: 16,
      left: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      color: 'white',
      p: 1,
      borderRadius: 2,
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 0.5
    }}>
      {Object.keys(METRIC_DEFINITIONS).map(key => (
        visibility[key] && metrics[key] !== undefined && (
          <Typography key={key} variant="h6" component="p" sx={{ fontWeight: 'bold' }}>
            {METRIC_DEFINITIONS[key].name}: {key === 'stepCount' ? metrics[key] : metrics[key].toFixed(1)}
            {METRIC_DEFINITIONS[key].unit}
          </Typography>
        )
      ))}
    </Box>
  );
};

const MetricsVisibilityControl = ({ visibility, setVisibility }) => {
  const handleVisibilityChange = (key) => {
    setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ToggleButtonGroup size="small" aria-label="metric visibility controls">
      {Object.keys(METRIC_DEFINITIONS).map(key => (
        <Tooltip key={key} title={`${METRIC_DEFINITIONS[key].name} 表示ON/OFF`}>
          <ToggleButton
            value={key}
            selected={visibility[key]}
            onChange={() => handleVisibilityChange(key)}
          >
            {visibility[key] ? <VisibilityIcon /> : <VisibilityOffIcon />}
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
};


function ScoringPage() {
  const navigate = useNavigate();
  const {currentUser} = useUser();
  const { challengeId } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState(null);
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [scoringStatus, setScoringStatus] = useState('idle'); // 'idle', 'countdown', 'scoring', 'finished'
  const [scoringMode, setScoringMode] = useState('time'); // 'time' or 'manual'
  const [recordedLandmarks, setRecordedLandmarks] = useState([]);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  
  const [realtimeMetrics, setRealtimeMetrics] = useState({});
  const [metricsVisibility, setMetricsVisibility] = useState(
    Object.keys(METRIC_DEFINITIONS).reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );

  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const scoringStatusRef = useRef(scoringStatus);
  const hasSubmittedRef = useRef(false);

  // Step Counting Refs
  const leftAnkleHistory = useRef([]);
  const rightAnkleHistory = useRef([]);
  const stepCountRef = useRef(0);

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setScoringMode(newMode);
    }
  };

  // チャレンジ情報を取得
  useEffect(() => {
    if (!challengeId) return;
    const fetchChallenge = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/challenges/${challengeId}/`);
        if (!response.ok) throw new Error('Challenge not found');
        const data = await response.json();
        setChallenge(data);
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch challenge:", err);
      }
    };
    fetchChallenge();
  }, [challengeId]);

  // PoseLandmarkerの初期化
  useEffect(() => {
    const createPoseLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const newPoseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `/pose_landmarker_heavy.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });
        setPoseLandmarker(newPoseLandmarker);
        setIsModelLoading(false);
      } catch (err) {
        console.error("Pose Landmarkerの初期化に失敗しました:", err);
        alert("姿勢検出モデルの読み込みに失敗しました。");
      }
    };
    createPoseLandmarker();
  }, []);

  // カメラを起動
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        await videoRef.current.play();
        streamRef.current = stream;
      } catch (err) {
        console.error("カメラの起動に失敗しました:", err);
        alert("カメラの起動に失敗しました。ブラウザのカメラアクセス許可を確認してください。");
      }
    };
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 採点シーケンスの管理（タイマー担当）
  useEffect(() => {
    let timer;
    if (scoringStatus === 'countdown') {
      setMessage('3');
      // Reset step count on start
      stepCountRef.current = 0;
      leftAnkleHistory.current = [];
      rightAnkleHistory.current = [];
      
      setTimeout(() => setMessage('2'), 1000);
      setTimeout(() => setMessage('1'), 2000);
      setTimeout(() => {
        setMessage('START!');
        setTimeout(() => setScoringStatus('scoring'), 500);
      }, 3000);
    } else if (scoringStatus === 'scoring' && scoringMode === 'time') {
      setMessage('');
      setProgress(0);
      const startTime = Date.now();
      timer = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const currentProgress = Math.min(100, (elapsedTime / SCORING_DURATION) * 100);
        setProgress(currentProgress);
        if (currentProgress >= 100) {
          clearInterval(timer);
          setMessage('FINISH');
          setScoringStatus('finished');
        }
      }, 50);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [scoringStatus, scoringMode]);

  // Reset submitted ref when status changes to idle
  useEffect(() => {
    if (scoringStatus === 'idle') {
      hasSubmittedRef.current = false;
      stepCountRef.current = 0; // Reset display as well if needed
    }
  }, [scoringStatus]);

  // スコア送信の管理（データ送信担当）
  useEffect(() => {
    if (scoringStatus === 'finished') {
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;

      const submitData = async () => {
        if (recordedLandmarks.length === 0) {
          alert('データが記録されませんでした。もう一度お試しください。');
          setScoringStatus('idle');
          return;
        }
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); // FINISH表示を見せる
          setMessage('AIがフォームを解析しています...');
          const response = await fetch('http://127.0.0.1:8000/api/score/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user: currentUser.id,
              challenge: challengeId,
              raw_landmarks: recordedLandmarks,
            })
          });
          const resultData = await response.json();
          if (!response.ok) throw new Error(resultData.detail || 'APIリクエストに失敗しました。');
          navigate(`/result/${resultData.id}`);
        } catch (err) {
          console.error('スコアの送信に失敗しました:', err);
          alert(`スコアの送信に失敗しました: ${err.message}`);
          setScoringStatus('idle');
        }
      };
      submitData();
    }
  }, [scoringStatus, challengeId, recordedLandmarks, navigate, currentUser]);

  // scoringStatusの最新値をrefに同期
  useEffect(() => {
    scoringStatusRef.current = scoringStatus;
  }, [scoringStatus]);

  const handleVideoLoad = () => {
    if (poseLandmarker) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      const canvasCtx = canvas.getContext('2d');
      const drawingUtils = new DrawingUtils(canvasCtx);
      let lastVideoTime = -1;
      const predictWebcam = () => {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const results = poseLandmarker.detectForVideo(video, performance.now());
          
          if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            
            const metrics = calculateAllRealtimeMetrics(landmarks);

            // --- Step Counting Logic ---
            if (scoringStatusRef.current === 'scoring') {
              const LEFT_ANKLE = 27;
              const RIGHT_ANKLE = 28;
              const leftY = landmarks[LEFT_ANKLE].y;
              const rightY = landmarks[RIGHT_ANKLE].y;

              const updateHistoryAndCheckStep = (historyRef, currentY) => {
                historyRef.current.push(currentY);
                if (historyRef.current.length > 3) {
                  historyRef.current.shift();
                }
                if (historyRef.current.length === 3) {
                  const [y_prev2, y_prev1, y_curr] = historyRef.current;
                  // Local minimum detection (highest point in screen coordinates)
                  // y increases downwards, so min y is max height
                  if (y_prev2 > y_prev1 && y_prev1 < y_curr) {
                    return true;
                  }
                }
                return false;
              };

              if (updateHistoryAndCheckStep(leftAnkleHistory, leftY)) {
                stepCountRef.current += 1;
              }
              if (updateHistoryAndCheckStep(rightAnkleHistory, rightY)) {
                stepCountRef.current += 1;
              }
            }
            
            metrics.stepCount = stepCountRef.current;
            setRealtimeMetrics(metrics);
            
            if (scoringStatusRef.current === 'scoring') {
              setRecordedLandmarks(prev => [...prev, results.landmarks]);
            }

            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            drawingUtils.drawLandmarks(landmarks, { radius: 5, color: '#03A9F4' });
            drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: '#FFFFFF' });
            canvasCtx.restore();
          }
        }
        requestRef.current = requestAnimationFrame(predictWebcam);
      };
      predictWebcam();
    }
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handleStartScoring = () => {
    setScoringStatus('countdown');
  };

  const handleStopScoring = () => {
    setMessage('FINISH');
    setScoringStatus('finished');
  };

  if (error) {
    return <Typography sx={{ mt: 4, textAlign: 'center' }} color="error">エラー: {error}</Typography>;
  }

  if (!currentUser) {
    return (
      <Box sx={{ mt: 8, textAlign: "center" }}>
        <Typography variant="h6" component="p" sx={{ color: "red" }}>ユーザー情報がありません。</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate("/")}>ユーザー選択画面に戻る</Button>
      </Box>
    );
  }

  if (!challenge || isModelLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>{isModelLoading ? "AIモデルを準備中..." : "チャレンジ情報を読み込み中..."}</Typography>
      </Box>
    );
  }

  const showOverlay = scoringStatus === 'countdown' || scoringStatus === 'finished';

  return (
    <Box sx={{
      position: 'relative',
      flexGrow: 1,
      p: 3,
      background: '#f4f6f8',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
    }}>
      <IconButton 
        aria-label="cancel"
        onClick={() => navigate('/challenges')}
        sx={{
          position: 'absolute',
          top: 24,
          right: 24,
          zIndex: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        <CloseIcon sx={{ color: 'white' }} />
      </IconButton>

      {showOverlay && (
        <Box sx={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
          '@keyframes zoomAnimation': {
            '0%': { transform: 'scale(0.5)', opacity: 0 },
            '50%': { transform: 'scale(1.2)', opacity: 1 },
            '100%': { transform: 'scale(1)', opacity: 1 },
          },
        }}>
          {scoringStatus === 'finished' && message !== 'FINISH' ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'white' }}>
              <CircularProgress color="inherit" size={80} thickness={4} />
              <Typography variant="h4" sx={{ mt: 3, fontWeight: 'bold', textShadow: '0px 2px 4px rgba(0,0,0,0.5)' }}>
                {message}
              </Typography>
            </Box>
          ) : (
            <Typography variant="h1" component="p" sx={{ fontSize: '80vmin', fontWeight: 'bold', color: 'white', animation: 'zoomAnimation 0.5s ease-out' }}>
              {message}
            </Typography>
          )}
        </Box>
      )}


      <Paper elevation={3} sx={{ width: '100%', maxWidth: '1280px', overflow: 'hidden' }}>
        {scoringStatus === 'scoring' && scoringMode === 'time' && <LinearProgress variant="determinate" value={progress} />}
        <Box sx={{ position: 'relative' }}>
          <RealtimeMetricsDisplay metrics={realtimeMetrics} visibility={metricsVisibility} />
          <video 
            ref={videoRef}
            playsInline 
            muted
            onLoadedMetadata={() => handleVideoLoad()}
            style={{ display: 'block', width: '100%', height: 'auto', transform: 'scaleX(-1)' }}
          />
          <canvas
            ref={canvasRef}
            style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }}
          />
        </Box>
      </Paper>

      <Box sx={{ my: 2, height: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2}}>
        {scoringStatus === 'idle' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <ToggleButtonGroup
              color="primary"
              value={scoringMode}
              exclusive
              onChange={handleModeChange}
              aria-label="Scoring Mode"
            >
              <ToggleButton value="time">時間制</ToggleButton>
              <ToggleButton value="manual">手動</ToggleButton>
            </ToggleButtonGroup>
            <MetricsVisibilityControl visibility={metricsVisibility} setVisibility={setMetricsVisibility} />
            <Button variant='contained' size='large' onClick={handleStartScoring}>
              採点開始
            </Button>
          </Box>
        )}
        {scoringStatus === 'scoring' && scoringMode === 'manual' && (
          <Button variant='contained' size='large' color='error' onClick={handleStopScoring}>
            採点終了
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default ScoringPage;
