import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import ChatRoomPage from './pages/ChatRoomPage';

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            user ? (
              <Navigate to="/chat" replace />
            ) : (
              <LoginPage onLoginSuccess={handleLogin} />
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            user ? (
              <Navigate to="/chat" replace />
            ) : (
              <RegisterPage />
            )
          } 
        />
        <Route 
          path="/chat" 
          element={
            user ? (
              <ChatPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/chatroom/:chatRoomId" 
          element={
            user ? (
              <ChatRoomPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/" 
          element={
            <Navigate to={user ? "/chat" : "/login"} replace />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
