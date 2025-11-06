import React from 'react';
import { useUnit } from 'effector-react';
import { $isAuthenticated, $currentUser, getMe } from './models/users';
import { HomePage } from './pages/HomePage';
import { AuthForm } from './components/AuthForm';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  const [isAuthenticated, currentUser, handleGetMe] = useUnit([
    $isAuthenticated,
    $currentUser,
    getMe,
  ]);

  const [currentPath, setCurrentPath] = React.useState(
    window.location.pathname
  );

  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && !currentUser) {
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

  const getCurrentPage = () => {
    if (currentPath === '/login' || currentPath === '/register') {
      return <AuthForm />;
    } else if (currentPath === '/profile') {
      return isAuthenticated ? <ProfilePage /> : <HomePage />;
    } else {
      return <HomePage />;
    }
  };

  return <div className="min-h-screen bg-gray-100">{getCurrentPage()}</div>;
}

export default App;
