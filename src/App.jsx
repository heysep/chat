import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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

  const handleRegisterSuccess = () => {
    setPage('login');
  };

  return (
    page === 'login' ? (
      <LoginPage
        onLoginSuccess={handleLogin}
        onNavigateToRegister={() => setPage('register')}
      />
    ) : page === 'register' ? (
      <RegisterPage
        onRegisterSuccess={handleRegisterSuccess}
        onNavigateToLogin={() => setPage('login')}
      />
    ) : (
      <ChatPage user={user} onLogout={handleLogout} />
    )
  );
}

export default App;
