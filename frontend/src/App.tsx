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

  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && !currentUser) {
      handleGetMe();
    }
  }, [currentUser, handleGetMe]);

  const getCurrentPage = () => {
    const path = window.location.pathname;

    if (path === '/login') {
      return <AuthForm />;
    } else if (path === '/register') {
      return <AuthForm />;
    } else if (path === '/profile') {
      return isAuthenticated ? <ProfilePage /> : <HomePage />;
    } else {
      return <HomePage />;
    }
  };

  return <div className="min-h-screen bg-gray-100">{getCurrentPage()}</div>;
}

export default App;
