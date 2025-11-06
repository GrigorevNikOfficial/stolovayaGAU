import React from 'react';
import { useUnit } from 'effector-react';
import { $currentUser, $isAuthenticated, logoutUser } from '../models/users';

export const HomePage: React.FC = () => {
  const [currentUser, isAuthenticated, handleLogout] = useUnit([
    $currentUser,
    $isAuthenticated,
    logoutUser,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Шапка */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Добро пожаловать в наше приложение
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Управляйте своими заказами, доставками и профилем в одном месте
          </p>
        </div>

        {/* Карточки функционала */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-600 text-xl">📦</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Заказы</h3>
            <p className="text-gray-600">
              Создавайте и отслеживайте свои заказы
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-green-600 text-xl">🚚</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Доставки
            </h3>
            <p className="text-gray-600">
              Управляйте доставками и отслеживайте статусы
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-purple-600 text-xl">👤</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Профиль
            </h3>
            <p className="text-gray-600">
              Управляйте своими данными и настройками
            </p>
          </div>
        </div>

        {/* Блок авторизации */}
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          {isAuthenticated && currentUser ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-2xl">
                  {currentUser.first_name.charAt(0)}
                  {currentUser.last_name.charAt(0)}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Привет, {currentUser.first_name}!
              </h2>
              <p className="text-gray-600 mb-2">
                {currentUser.phone} •{' '}
                {currentUser.role === 'admin'
                  ? 'Администратор'
                  : 'Пользователь'}
              </p>

              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={() => (window.location.href = '/profile')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                >
                  Перейти в профиль
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                >
                  Выйти
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-600 text-2xl">👤</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Войдите в систему
              </h2>
              <p className="text-gray-600 mb-6">
                Чтобы получить доступ ко всем функциям приложения
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => (window.location.href = '/login')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                >
                  Войти
                </button>
                <button
                  onClick={() => (window.location.href = '/register')}
                  className="w-full bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-600 py-3 px-4 rounded-lg transition-colors font-medium"
                >
                  Зарегистрироваться
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
