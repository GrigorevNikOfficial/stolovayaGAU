import React from 'react';
import { useUnit } from 'effector-react';
import { $currentUser, logout } from '../models/users';
import { loadOrders } from '../models/orders';

export const ProfilePage: React.FC = () => {
  const [currentUser, handleLogout, handleLoadOrders] = useUnit([
    $currentUser,
    logout,
    loadOrders,
  ]);

  const handleNavigation = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Загружаем заказы ТОЛЬКО при загрузке страницы профиля
  React.useEffect(() => {
    if (currentUser) {
      console.log(
        'ProfilePage: загружаем заказы для пользователя',
        currentUser._id
      );
      handleLoadOrders();
    }
  }, [currentUser, handleLoadOrders]);

  const handleLogoutClick = () => {
    handleLogout();
    setTimeout(() => {
      handleNavigation('/');
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
            onClick={() => handleNavigation('/')}
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
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Профиль пользователя
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleNavigation('/')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                В меню
              </button>
              <button
                onClick={handleLogoutClick}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>

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

            {/* Дополнительная информация */}
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
