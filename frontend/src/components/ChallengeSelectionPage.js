import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Typography, Box, Paper, CardActionArea, Chip, Button } from "@mui/material";
import { useUser } from "../contexts/UserContext";

function ChallengeSelectionPage() {
  const {currentUser} = useUser()
  const [challenges, setChallenges] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const apiUrl = "http://127.0.0.1:8000/api/challenges/";
    const fetchChallenges = async () => {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setChallenges(data);
      } catch (error) {
        console.error("Failed to fetch challenges:", error);
        alert("チャレンジの取得に失敗しました。");
      }
    };

    fetchChallenges();
  }, []);

  const handleChallengeSelect = (challenge) => {
    console.log("Selected Challenge:", challenge);
    navigate(`/scoring/${challenge.id}`);
    // TODO: 次のステップで、採点画面に遷移する処理を実装
  };


  if (!currentUser) {
    return (
      <Box sx={{ mt: 8, textAlign: "center" }}>
        <Typography variant="h6" component="p" sx={{ color: "red" }}>
          ユーザー情報がありません。
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate("/")}
        >
          ユーザー選択画面に戻る
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ textAlign: "center" }}
      >
        チャレンジ選択
      </Typography>
      <Typography
        variant="h6"
        color="text.secondary"
        sx={{ textAlign: "center", mb: 4 }}
      >
        挑戦したいウォーキングスタイルを選んでください
      </Typography>

      {/* flexboxによるグリッドレイアウト */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap", // アイテムを折り返す
          gap: 3, // アイテム間のすき間
          justifyContent: "center", // 中央揃え
        }}
      >
        {challenges.map((challenge) => (
          // 各カード（flexアイテム）
          <Paper
            key={challenge.id}
            elevation={3}
            sx={{
              // 画面サイズに応じた幅を指定
              flexBasis: { xs: "100%", sm: "45%", md: "30%" },
              display: "flex",
              flexDirection: "column",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 6,
              },
            }}
          >
            <CardActionArea
              onClick={() => handleChallengeSelect(challenge)}
              sx={{
                p: 2,
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  alignItems: "center",
                  mb: 1,
                }}
              >
                <Typography gutterBottom variant="h5" component="h2">
                  {challenge.name}
                </Typography>
                {challenge.has_posing && (
                  <Chip label="ポーズあり" color="secondary" size="small" />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {challenge.description}
              </Typography>
            </CardActionArea>
          </Paper>
        ))}
      </Box>
    </>
  );
}

export default ChallengeSelectionPage;
