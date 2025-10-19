import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Box, CircularProgress, Button, LinearProgress, Paper } from '@mui/material';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { useUser } from '../contexts/UserContext';

const SCORING_DURATION = 10000; // 採点時間（ミリ秒）

function ScoringPage() {
  const navigate = useNavigate();
  const {currentUser} = useUser();
  const { challengeId } = useParams();
  const [challenge, setChallenge] = useState(null);
  const [error, setError] = useState(null);
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [scoringStatus, setScoringStatus] = useState('idle'); // 'idle', 'countdown', 'scoring', 'finished'
  const [recordedLandmarks, setRecordedLandmarks] = useState([]);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0); // プログレスバー用のstate

  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const scoringStatusRef = useRef(scoringStatus);

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
            modelAssetPath: `/pose_landmarker_lite.task`,
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
      setTimeout(() => setMessage('2'), 1000);
      setTimeout(() => setMessage('1'), 2000);
      setTimeout(() => {
        setMessage('START!');
        setTimeout(() => setScoringStatus('scoring'), 500);
      }, 3000);
    } else if (scoringStatus === 'scoring') {
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
  }, [scoringStatus]);

  // スコア送信の管理（データ送信担当）
  useEffect(() => {
    if (scoringStatus === 'finished') {
      const submitData = async () => {
        if (recordedLandmarks.length === 0) {
          alert('データが記録されませんでした。もう一度お試しください。');
          setScoringStatus('idle');
          return;
        }
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); // FINISH表示を見せる
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
          navigate('/result', { state: { resultData: resultData } });
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
          if (scoringStatusRef.current === 'scoring') {
            setRecordedLandmarks(prev => [...prev, results.landmarks]);
          }
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
          if (results.landmarks) {
            for (const landmark of results.landmarks) {
              drawingUtils.drawLandmarks(landmark, { radius: 5, color: '#FF0000' });
              drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, { color: '#FFFFFF' });
            }
          }
          canvasCtx.restore();
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

  // カウントダウン中と終了後にメッセージをオーバーレイ表示
  const showOverlay = scoringStatus === 'countdown' || (scoringStatus === 'finished' && message === 'FINISH');

  return (
    <Box sx={{
      flexGrow: 1,
      p: 3,
      background: '#f4f6f8',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
    }}>
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
          <Typography variant="h1" component="p" sx={{ fontSize: '80vmin', fontWeight: 'bold', color: 'white', animation: 'zoomAnimation 0.5s ease-out' }}>
            {message}
          </Typography>
        </Box>
      )}

      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
        {challenge.name}
      </Typography>

      <Paper elevation={3} sx={{ width: '100%', maxWidth: '960px', overflow: 'hidden' }}>
        {scoringStatus === 'scoring' && <LinearProgress variant="determinate" value={progress} />}
        <Box sx={{ position: 'relative' }}>
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

      <Box sx={{ my: 2, height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {scoringStatus === 'idle' && (
          <Button variant='contained' size='large' onClick={handleStartScoring}>
            採点開始
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default ScoringPage;
