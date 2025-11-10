import React from 'react';
import { useUnit } from 'effector-react';
import { $currentUser, getMeFx } from './models/users';
import { HomePage } from './pages/HomePage';
import { AuthForm } from './components/AuthForm';
import { ProfilePage } from './pages/ProfilePage';

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
    if (currentPath === '/login' || currentPath === '/register') {
      // Если пользователь уже авторизован, перенаправляем на главную
      if (currentUser) {
        navigate('/');
      }
    } else if (currentPath === '/profile') {
      // Если пользователь не авторизован, перенаправляем на логин
      if (!currentUser) {
        navigate('/login');
      }
    }
  }, [currentPath, currentUser, navigate]);

  // Рендер текущей страницы
  const getCurrentPage = () => {
    console.log('App: текущий путь', currentPath, 'пользователь', currentUser);

    if (currentPath === '/login' || currentPath === '/register') {
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
      return <HomePage />;
    }
  };

  return <div className="min-h-screen bg-gray-100">{getCurrentPage()}</div>;
}

export default App;
