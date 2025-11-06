import React from 'react';
import { useStore } from 'effector-react';
import { $isAuthenticated, $currentUser } from './models/users';
import { AuthForm } from './components/AuthForm';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  const isAuthenticated = useStore($isAuthenticated);
  const currentUser = useStore($currentUser);

  return (
    <div className="min-h-screen bg-gray-100">
      {!isAuthenticated ? <AuthForm /> : <ProfilePage />}

      {/* Демо-код можно оставить для тестирования */}
      {isAuthenticated && currentUser?.role === 'admin' && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">
            Демо-счетчик (только для админа):
          </p>
          {/* Здесь можно добавить демо-функциональность */}
        </div>
      )}
    </div>
  );
}

export default App;
