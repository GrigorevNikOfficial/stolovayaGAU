import { useUnit } from 'effector-react';
import React from 'react';
import { AuthForm } from './components/Auth/AuthForm.tsx';
import { Toast } from './components/layout/Toast/Toast';
import { $currentUser, getMeFx, logout } from './models/users';
import { HomePage } from './pages/HomePage';
import { NavigationPage } from './pages/NavigationPage';
import { ProfilePage } from './pages/ProfilePage';
import { ChatPage } from './pages/services/chat/ChatPage.tsx';
import EventsPage from './pages/services/EventsPage';
import { MarketplacePage } from './pages/services/MarketplacePage.tsx';

const PROTECTED_PATHS = new Set(['/profile', '/services/cafeteria', '/services/chat']);

const AuthPendingScreen = () => (
  <div className="flex min-h-screen items-center justify-center text-text-primary">
    <div className="text-center space-y-4">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-brand-indigo/20 border-t-brand-indigo" />
      <p className="text-sm tracking-[0.35em] uppercase text-text-muted">Проверяем авторизацию</p>
    </div>
  </div>
);

function App() {
  const { currentUser, handleGetMe, handleLogout } = useUnit({
    currentUser: $currentUser,
    handleGetMe: getMeFx,
    handleLogout: logout,
  });

  const [currentPath, setCurrentPath] = React.useState(
    window.location.pathname
  );

  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('authToken'));

  // Проверяем авторизацию при загрузке приложения
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && !currentUser) {
      console.log('App: проверка авторизации по токену');
      handleGetMe();
    }
  }, [currentUser, handleGetMe]);

  // Слушаем изменения URL
  React.useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Функция для навигации
  const navigate = React.useCallback((path: string) => {
    const nextUrl = new URL(path, window.location.origin);
    const relativeUrl = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    window.history.pushState({}, '', relativeUrl);
    setCurrentPath(nextUrl.pathname);
  }, []);

  // Перенаправления
  React.useEffect(() => {
    const isAuthPage = currentPath === '/login' || currentPath === '/register';
    const token = Boolean(localStorage.getItem('authToken'));
    const isProtected = PROTECTED_PATHS.has(currentPath);

    if (isAuthPage && currentUser) {
      navigate('/');
      return;
    }

    if (isProtected && !currentUser && !token) {
      navigate('/');
    }
  }, [currentPath, currentUser, navigate]);

  const renderProtectedPage = (component: React.ReactNode) => {
    if (currentUser) {
      return component;
    }

    if (hasToken) {
      return <AuthPendingScreen />;
    }

    return <AuthForm />;
  };

  const getCurrentPage = () => {
    console.log('App: текущий путь', currentPath, 'пользователь', currentUser);

    const isAuthPage = currentPath === '/login' || currentPath === '/register';

    if (currentPath === '/') {
      return (
        <NavigationPage
          currentUser={currentUser ?? null}
          onNavigate={navigate}
          onLogout={() => {
            handleLogout();
            navigate('/');
          }}
        />
      );
    }

    if (isAuthPage) {
      return currentUser ? (
        <NavigationPage
          currentUser={currentUser}
          onNavigate={navigate}
          onLogout={() => {
            handleLogout();
            navigate('/');
          }}
        />
      ) : (
        <AuthForm />
      );
    }

    if (currentPath === '/services/notifications') {
      return renderProtectedPage(<ProfilePage initialTab="notifications" />);
    }

    if (currentPath === '/profile') {
      return renderProtectedPage(<ProfilePage />);
    }

    if (currentPath === '/services/cafeteria') {
      return renderProtectedPage(<HomePage />);
    }

    if (currentPath === '/services/chat') {
      return renderProtectedPage(<ChatPage />);
    }

    if (currentPath === '/services/marketplace') {
      return <MarketplacePage />;
    }

    if (currentPath === '/services/events') {
      return renderProtectedPage(<EventsPage />);
    }

    return (
      <NavigationPage
        currentUser={currentUser ?? null}
        onNavigate={navigate}
        onLogout={() => {
          handleLogout();
          navigate('/');
        }}
      />
    );
  };

  return (
    <div className="min-h-screen text-text-primary">
      {getCurrentPage()}
      <Toast />
    </div>
  );
}

export default App;
