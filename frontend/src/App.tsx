import { useUnit } from 'effector-react';
import React from 'react';
import { AuthForm } from './components/Auth/AuthForm.tsx';
import { Toast } from './components/layout/Toast/Toast';
import { $currentUser, getMeFx, logout } from './models/users';
import { HomePage } from './pages/HomePage';
import { NavigationPage } from './pages/NavigationPage';
import { ProfilePage } from './pages/ProfilePage';
import { ChatPage } from './pages/services/chat/ChatPage.tsx';
import EventsPage from './pages/services/EventsPage.tsx';
import EventDetailsPage from './pages/services/EventDetailsPage.tsx';
import { MarketplacePage } from './pages/services/MarketplacePage.tsx';
import WorkPage from './pages/services/WorkPage.tsx';
import InternshipsPage from './pages/services/InternshipsPage.tsx';
import { AdminPanelPage } from './pages/AdminPanelPage';
import {
  consumeAuthRedirect,
  isAuthPath,
  markAuthRedirect,
} from './utils/authRedirect';

const PROTECTED_PATHS = new Set(['/profile', '/services/chat', '/admin', '/services/work', '/services/internships']);

const AuthPendingScreen = () => (
  <div className="flex min-h-screen items-center justify-center text-text-primary">
    <div className="text-center space-y-4">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-brand-indigo/20 border-t-brand-indigo" />
      <p className="text-sm tracking-[0.35em] uppercase text-text-muted">
        Проверяем авторизацию
      </p>
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

  const hasToken =
    typeof window !== 'undefined' && Boolean(localStorage.getItem('authToken'));

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
    if (isAuthPath(path)) {
      markAuthRedirect();
    }

    const nextUrl = new URL(path, window.location.origin);
    const relativeUrl = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    window.history.pushState({}, '', relativeUrl);
    setCurrentPath(nextUrl.pathname);
  }, []);

  // Перенаправления
  React.useEffect(() => {
    const isAuthPage = currentPath === '/login' || currentPath === '/register';
    const token = Boolean(localStorage.getItem('authToken'));
    const isProtected =
      PROTECTED_PATHS.has(currentPath) ||
      currentPath.startsWith('/services/events');

    if (isAuthPage && currentUser) {
      const target = consumeAuthRedirect();
      const safeTarget = target && !isAuthPath(target) ? target : '/';
      navigate(safeTarget);
      return;
    }

    if (isProtected && !currentUser && !token) {
      markAuthRedirect(currentPath);
      navigate('/login');
    }
  }, [currentPath, currentUser, navigate]);

  React.useEffect(() => {
    if (
      currentPath === '/admin' &&
      currentUser &&
      currentUser.role !== 'admin'
    ) {
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
      return <HomePage />;
    }

    if (currentPath === '/services/chat') {
      return renderProtectedPage(<ChatPage />);
    }

    if (currentPath === '/services/work') {
      return renderProtectedPage(<WorkPage />);
    }

    if (currentPath === '/services/internships') {
      return renderProtectedPage(<InternshipsPage />);
    }

    if (currentPath === '/services/marketplace') {
      return <MarketplacePage />;
    }

    if (currentPath === '/services/events') {
      return renderProtectedPage(<EventsPage />);
    }

    if (currentPath.startsWith('/services/events/')) {
      return renderProtectedPage(<EventDetailsPage />);
    }

    if (currentPath === '/admin') {
      if (!currentUser) {
        return hasToken ? <AuthPendingScreen /> : <AuthForm />;
      }

      if (currentUser.role !== 'admin') {
        return (
          <NavigationPage
            currentUser={currentUser}
            onNavigate={navigate}
            onLogout={() => {
              handleLogout();
              navigate('/');
            }}
          />
        );
      }

      return <AdminPanelPage />;
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
