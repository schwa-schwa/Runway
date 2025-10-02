import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useUser } from "../contexts/UserContext";

// このコンポーネントが新しい「体験者登録画面」の本体となります
function UserSelectionPage() {
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const { setCurrentUser } = useUser()

  const apiUrl = "http://127.0.0.1:8000/api/users/";

  const fetchUsers = async () => {
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
      alert('ユーザーリストの取得に失敗しました。');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleNewUserChange = (event) => {
    setNewUserName(event.target.value);
  };

  const handleNewUserSubmit = async () => {
    if (newUserName.trim() === "") {
      alert('名前を入力してください。');
      return
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newUserName})
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorData = responseData

        alert(`エラー: ${JSON.stringify(errorData)}`)
        throw new Error('Failed to create user');
      }

      const newUser = responseData

      alert(`新しい体験者「${newUserName}」を作成しました！`);
      setNewUserName(''); 
      setCurrentUser(newUser)
      navigate('/dashboard')

    } catch (error) {
      console.error('There was a problem with the POST operation:', error);
    }
  };

  const handleExistingUserClick = (user) => {
    console.log('Selected User:', user); 
    setCurrentUser(user);
    navigate('/dashboard');
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          こんにちは！
        </Typography>
        <Typography variant="h6" component="h2" sx={{ mb: 4 }}>
          あなたの名前を教えてください
        </Typography>

        <Box sx={{ width: "100%" }}>
          <Typography variant="subtitle1" gutterBottom>
            新しく始める
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              label="新しい名前"
              variant="outlined"
              fullWidth
              value={newUserName}
              onChange={handleNewUserChange}
            />
            <Button
              variant="contained"
              color="primary"
              sx={{ whiteSpace: "nowrap" }}
              onClick={handleNewUserSubmit}
            >
              この名前で始める
            </Button>
          </Box>
        </Box>

        <Box
          sx={{ width: "100%", my: 4, borderBottom: 1, borderColor: "divider" }}
        />

        <Box sx={{ width: "100%" }}>
          <Typography variant="subtitle1" gutterBottom>
            続きから始める
          </Typography>

          <TextField
            label="名前で検索"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ mb: 2 }}
          />
          <List>
            {filteredUsers.map((user) => (
              <ListItem
                key={user.id}
                component={Button}
                onClick={() => handleExistingUserClick(user)}
                variant="outlined"
                fullWidth
                sx={{ mb: 1, justifyContent: "center" }}
              >
                <ListItemText primary={user.name} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Paper>
    </Container>
  );
}

export default UserSelectionPage;
