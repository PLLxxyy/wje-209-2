import React, { useState, useEffect, useCallback } from 'react';
import { User, Page } from './types';
import { apiGetMe, apiGetUnreadCount } from './api';
import Login from './pages/Login';
import Register from './pages/Register';
import Square from './pages/Square';
import CreateMeetup from './pages/CreateMeetup';
import MeetupDetail from './pages/MeetupDetail';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>('square');
  const [selectedMeetupId, setSelectedMeetupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(() => {
    if (user) {
      apiGetUnreadCount()
        .then((data) => setUnreadCount(data.count))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    apiGetMe()
      .then((data) => {
        setUser(data.user as unknown as User);
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  const navigate = useCallback((p: Page, meetupId?: number) => {
    setPage(p);
    if (meetupId !== undefined) {
      setSelectedMeetupId(meetupId);
    }
  }, []);

  const handleAuth = useCallback((token: string, u: User) => {
    localStorage.setItem('token', token);
    setUser(u);
    setPage('square');
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setPage('square');
    setUnreadCount(0);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'login':
        return <Login onAuth={handleAuth} onSwitch={() => setPage('register')} />;
      case 'register':
        return <Register onAuth={handleAuth} onSwitch={() => setPage('login')} />;
      case 'create':
        if (!user) return <Login onAuth={handleAuth} onSwitch={() => setPage('register')} />;
        return <CreateMeetup user={user} onNavigate={navigate} />;
      case 'detail':
        if (!selectedMeetupId) return <Square user={user} onNavigate={navigate} />;
        return <MeetupDetail meetupId={selectedMeetupId} user={user} onNavigate={navigate} />;
      case 'profile':
        if (!user) return <Login onAuth={handleAuth} onSwitch={() => setPage('register')} />;
        return <Profile user={user} onNavigate={navigate} />;
      case 'notifications':
        if (!user) return <Login onAuth={handleAuth} onSwitch={() => setPage('register')} />;
        return <Notifications onNavigate={navigate} onReadChange={refreshUnreadCount} />;
      case 'square':
      default:
        return <Square user={user} onNavigate={navigate} />;
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="logo" onClick={() => navigate('square')}>
          <span role="img" aria-label="food">🍲</span>
          <span>饭搭子组局</span>
        </div>
        <nav className="nav-links">
          {user ? (
            <>
              <button
                className={`nav-link ${page === 'square' ? 'active' : ''}`}
                onClick={() => navigate('square')}
              >
                组局广场
              </button>
              <button
                className={`nav-link ${page === 'create' ? 'active' : ''}`}
                onClick={() => navigate('create')}
              >
                发起饭局
              </button>
              <button
                className={`nav-link nav-msg-btn ${page === 'notifications' ? 'active' : ''}`}
                onClick={() => navigate('notifications')}
              >
                <span className="nav-msg-icon">🔔</span>
                消息
                {unreadCount > 0 && <span className="nav-msg-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </button>
              <button
                className={`nav-link ${page === 'profile' ? 'active' : ''}`}
                onClick={() => navigate('profile')}
              >
                {user.nickname}
              </button>
              <button className="nav-link" onClick={handleLogout}>
                退出
              </button>
            </>
          ) : (
            <>
              <button
                className={`nav-link ${page === 'square' ? 'active' : ''}`}
                onClick={() => navigate('square')}
              >
                组局广场
              </button>
              <button
                className={`nav-link ${page === 'login' ? 'active' : ''}`}
                onClick={() => navigate('login')}
              >
                登录
              </button>
              <button
                className={`nav-link ${page === 'register' ? 'active' : ''}`}
                onClick={() => navigate('register')}
              >
                注册
              </button>
            </>
          )}
        </nav>
      </header>
      <main className="app-content">
        {renderPage()}
      </main>
    </>
  );
}
