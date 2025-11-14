import React from 'react';
import { useUnit } from 'effector-react';
import { $currentUser, logout } from '../models/users';
import { $cartItemsCount, setCartOpen } from '../models/cart';

interface HeaderProps {
  onCartClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onCartClick }) => {
  const [currentUser, handleLogout, cartItemsCount, handleSetCartOpen] =
    useUnit([$currentUser, logout, $cartItemsCount, setCartOpen]);

  const avatarUrl = currentUser?.avatar?.url;
  const userInitials = currentUser
    ? `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`.toUpperCase() || 'U'
    : '';

  const handleCartClick = () => {
    handleSetCartOpen(true);
  };

  const handleLogoutClick = () => {
    handleLogout();
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Логотип и название */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Меню</h1>
          </div>

          {/* Правая часть - пользователь и корзина */}
          <div className="flex items-center space-x-4">
            {/* Корзина */}
            <button
              onClick={handleCartClick}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l2.5 5.5m0 0L17 21m-7.5-2.5h9"
                />
              </svg>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Профиль пользователя */}
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300 flex items-center justify-center text-sm font-semibold text-gray-600">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`${currentUser.first_name} ${currentUser.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{userInitials}</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser.first_name} {currentUser.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {currentUser.role === 'admin'
                      ? 'Администратор'
                      : 'Пользователь'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => (window.location.href = '/profile')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Профиль
                  </button>
                  <button
                    onClick={handleLogoutClick}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Выйти
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => (window.location.href = '/login')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  Войти
                </button>
                <button
                  onClick={() => (window.location.href = '/register')}
                  className="bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-600 px-4 py-2 rounded text-sm transition-colors"
                >
                  Регистрация
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
