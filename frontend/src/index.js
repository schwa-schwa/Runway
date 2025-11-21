import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { BrowserRouter } from 'react-router-dom'
import App from './App';
import reportWebVitals from './reportWebVitals';

// アプリケーション全体のテーマを定義
const theme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50', // Fresh Green
      light: '#81C784',
      dark: '#388E3C',
      contrastText: '#fff',
    },
    secondary: {
      main: '#8BC34A', // Light Green
      light: '#AED581',
      dark: '#689F38',
      contrastText: '#fff',
    },
    background: {
      default: '#F1F8E9', // Very light green background
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '"Noto Sans JP"', // メインのフォント
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <CssBaseline />
        <App />
      </BrowserRouter>
    </ThemeProvider>
  //</React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
