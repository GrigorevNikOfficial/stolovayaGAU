import React from 'react';
import { useUnit } from 'effector-react';
import { $currentUser, getMeFx } from './models/users';
import { HomePage } from './pages/HomePage';
import { AuthForm } from './components/Auth/AuthForm.tsx';
import { ProfilePage } from './pages/ProfilePage';
import { Toast } from './components/layout/Toast/Toast'; // Добавь этот импорт

function App() {
  const [currentUser, handleGetMe] = useUnit([$currentUser, getMeFx]);

  const [currentPath, setCurrentPath] = React.useState(
    window.location.pathname
  );

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
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  }, []);

  // Перенаправления
  React.useEffect(() => {
    const isAuthPage = currentPath === '/login' || currentPath === '/register';
    const hasToken = Boolean(localStorage.getItem('authToken'));

    if (isAuthPage) {
      // Если пользователь уже авторизован, перенаправляем на главную
      if (currentUser) {
        navigate('/');
      }
      return;
    }

    // Любой защищенный маршрут перенаправляем на логин, если нет токена/пользователя
    if (!currentUser && !hasToken) {
      navigate('/login');
      return;
    }

    if (currentPath === '/profile' && !currentUser) {
      navigate('/login');
    }
  }, [currentPath, currentUser, navigate]);

  // Рендер текущей страницы
  const getCurrentPage = () => {
    console.log('App: текущий путь', currentPath, 'пользователь', currentUser);

    const isAuthPage = currentPath === '/login' || currentPath === '/register';
    const hasToken = Boolean(localStorage.getItem('authToken'));

    if (isAuthPage) {
      // Если пользователь уже авторизован, показываем главную
      if (currentUser) {
        return <HomePage />;
      }
      return <AuthForm />;
    } else if (currentPath === '/profile') {
      // Если пользователь не авторизован, показываем форму авторизации
      if (!currentUser) {
        return <AuthForm />;
      }
      return <ProfilePage />;
    } else {
      if (!currentUser && !hasToken) {
        return <AuthForm />;
      }
      return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {getCurrentPage()}
      {/* Добавь Toast здесь */}
      <Toast />
    </div>
  );
}

export default App;
