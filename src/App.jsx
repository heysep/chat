import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [page, setPage] = useState(() => (user ? 'chat' : 'login'));

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setPage('chat');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setPage('login');
  };

  return (
    page === 'login' ? (
      <LoginPage onLoginSuccess={handleLogin} />
    ) : (
      <ChatPage user={user} onLogout={handleLogout} />
    )
  );
}

export default App;
