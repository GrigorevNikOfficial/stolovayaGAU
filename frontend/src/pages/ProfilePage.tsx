import React from 'react';
import { useUnit } from 'effector-react';
import {
  $currentUser,
  logout,
  uploadAvatar,
  uploadAvatarFx,
} from '../models/users';
import { loadOrders } from '../models/orders';

export const ProfilePage: React.FC = () => {
  const {
    currentUser,
    handleLogout,
    handleLoadOrders,
    handleUploadAvatar,
    isAvatarUploading,
  } = useUnit({
    currentUser: $currentUser,
    handleLogout: logout,
    handleLoadOrders: loadOrders,
    handleUploadAvatar: uploadAvatar,
    isAvatarUploading: uploadAvatarFx.pending,
  });

  const avatarUrl = currentUser?.avatar?.url;
  const userInitials = currentUser
    ? `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`.toUpperCase() ||
      'U'
    : '';

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      handleUploadAvatar({ id: currentUser._id, file });
    }
    e.target.value = '';
  };

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            Пользователь не авторизован
          </h2>
          <button
            onClick={() => handleNavigation('/')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm sm:text-base"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Заголовок и кнопки */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <label htmlFor="avatar-input" className="group cursor-pointer">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 overflow-hidden border border-gray-300 flex items-center justify-center text-lg sm:text-xl font-semibold text-gray-600 group-hover:ring-2 group-hover:ring-indigo-500 group-hover:border-indigo-500 transition">
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
                <p className="text-xs text-center text-gray-500 mt-1 sm:mt-2 group-hover:text-indigo-600">
                  {isAvatarUploading ? 'Загрузка...' : 'Изменить'}
                </p>
              </label>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isAvatarUploading}
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Профиль пользователя
                </h1>
                <p className="text-gray-500 text-xs sm:text-sm">
                  Управляйте личными данными
                </p>
              </div>
            </div>

            {/* Кнопки навигации */}
            <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleNavigation('/')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base flex-1 xs:flex-none text-center"
              >
                На главную
              </button>
              <button
                onClick={handleLogoutClick}
                className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base flex-1 xs:flex-none text-center"
              >
                Выйти
              </button>
            </div>
          </div>

          {/* Информация о пользователе */}
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Имя
                </label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">
                  {currentUser.first_name}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Фамилия
                </label>
                <p className="text-sm sm:text-base text-gray-900 font-medium">
                  {currentUser.last_name}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Телефон
              </label>
              <p className="text-sm sm:text-base text-gray-900 font-medium">
                {currentUser.phone}
              </p>
            </div>

            {currentUser.mail && (
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Email
                </label>
                <p className="text-sm sm:text-base text-gray-900 font-medium break-all">
                  {currentUser.mail}
                </p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Роль
              </label>
              <p className="text-sm sm:text-base text-gray-900">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : currentUser.role === 'canteenManager' ||
                          currentUser.role === 'cateenManager'
                        ? 'bg-blue-100 text-blue-800'
                        : currentUser.role === 'storeManager'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                  }`}
                >
                  {currentUser.role === 'admin'
                    ? 'Администратор системы'
                    : currentUser.role === 'canteenManager' ||
                        currentUser.role === 'cateenManager'
                      ? 'Администратор столовой'
                      : currentUser.role === 'storeManager'
                        ? 'Администратор буфета'
                        : 'Пользователь'}
                </span>
              </p>
            </div>

            {/* Дополнительная информация */}
            {currentUser.created_at && (
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Дата регистрации
                </label>
                <p className="text-sm sm:text-base text-gray-900">
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
