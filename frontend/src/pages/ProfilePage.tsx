import React from 'react';
import { useUnit } from 'effector-react';
import { $currentUser, logoutUser } from '../models/users';

export const ProfilePage: React.FC = () => {
  const [currentUser, handleLogout] = useUnit([$currentUser, logoutUser]);

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  const handleLogoutClick = () => {
    handleLogout();
    // После выхода сразу перенаправляем на главную
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Пользователь не авторизован
          </h2>
          <button
            onClick={handleBackToHome}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Профиль пользователя
              </h1>
              <button
                onClick={handleBackToHome}
                className="text-indigo-600 hover:text-indigo-500 text-sm mt-2"
              >
                ← Назад на главную
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBackToHome}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                На главную
              </button>
              <button
                onClick={handleLogoutClick}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>

          {/* Остальной код профиля остается без изменений */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Имя
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {currentUser.first_name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Фамилия
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {currentUser.last_name}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Телефон
              </label>
              <p className="mt-1 text-sm text-gray-900">{currentUser.phone}</p>
            </div>

            {currentUser.mail && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <p className="mt-1 text-sm text-gray-900">{currentUser.mail}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Роль
              </label>
              <p className="mt-1 text-sm text-gray-900">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {currentUser.role === 'admin'
                    ? 'Администратор'
                    : 'Пользователь'}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                ID
              </label>
              <p className="mt-1 text-sm text-gray-900">{currentUser.id}</p>
            </div>

            {currentUser.created_at && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Дата регистрации
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(currentUser.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
