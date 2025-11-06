import React from 'react';
import { useStore, useEvent } from 'effector-react';
import { $currentUser, logoutUser } from '../models/users';

export const ProfilePage: React.FC = () => {
  const currentUser = useStore($currentUser);
  const handleLogout = useEvent(logoutUser);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Пользователь не авторизован
          </h2>
          <p>Пожалуйста, войдите в систему</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Профиль пользователя
            </h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Выйти
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Имя
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {currentUser.firstName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Фамилия
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {currentUser.lastName}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Телефон
              </label>
              <p className="mt-1 text-sm text-gray-900">{currentUser.phone}</p>
            </div>

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
          </div>
        </div>
      </div>
    </div>
  );
};
