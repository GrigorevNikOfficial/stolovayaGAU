import React from 'react';
import { useUnit } from 'effector-react';
import {
  $currentUser,
  logout,
  uploadAvatar,
  uploadAvatarFx,
} from '../models/users';
import { loadOrders } from '../models/orders';
import Button from '../components/layout/Button/Button.tsx';
import Footer from '../components/layout/Footer/Footer.tsx';

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
    handleUploadOrders: loadOrders,
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

  // Загружаем заказы при загрузке страницы профиля
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
          <Button
            onClick={() => handleNavigation('/')}
            variant="primary"
            size="md"
          >
            На главную
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Основной контент */}
      <div className="flex-1 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
            {/* Заголовок и кнопки */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-4 sm:gap-6">
                {/* Аватар с возможностью загрузки */}
                <label htmlFor="avatar-input" className="cursor-pointer group">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-light to-green-medium overflow-hidden border-2 border-white shadow-lg flex items-center justify-center text-xl sm:text-2xl font-bold text-green-darker group-hover:shadow-xl group-hover:scale-105 transition-all duration-200">
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
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={isAvatarUploading}
                  />
                </label>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {currentUser.first_name} {currentUser.last_name}
                  </h1>
                  <p className="text-gray-500 text-sm sm:text-base mt-1">
                    Личный кабинет
                  </p>
                </div>
              </div>

              {/* Кнопки навигации */}
              <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => handleNavigation('/')}
                  variant="outline"
                  size="lg"
                  className="flex-1 xs:flex-none"
                >
                  На главную
                </Button>
                <Button
                  onClick={handleLogoutClick}
                  variant="secondary"
                  size="xl"
                  className="flex-1 xs:flex-none bg-red-500 hover:bg-red-600 border-red-500"
                >
                  Выйти
                </Button>
              </div>
            </div>

            {/* Информация о пользователе */}
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                    Имя
                  </label>
                  <p className="text-base sm:text-lg text-gray-900 font-semibold">
                    {currentUser.first_name}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                    Фамилия
                  </label>
                  <p className="text-base sm:text-lg text-gray-900 font-semibold">
                    {currentUser.last_name}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                  Телефон
                </label>
                <p className="text-base sm:text-lg text-gray-900 font-semibold">
                  {currentUser.phone}
                </p>
              </div>

              {currentUser.mail && (
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                    Email
                  </label>
                  <p className="text-base sm:text-lg text-gray-900 font-semibold break-all">
                    {currentUser.mail}
                  </p>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                  Роль
                </label>
                <p className="text-base sm:text-lg">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : currentUser.role === 'canteenManager' ||
                            currentUser.role === 'cateenManager'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : currentUser.role === 'storeManager'
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : 'bg-green-100 text-green-800 border border-green-200'
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
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                  <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                    Дата регистрации
                  </label>
                  <p className="text-base sm:text-lg text-gray-900">
                    {new Date(currentUser.created_at).toLocaleDateString(
                      'ru-RU',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Футер */}
      <Footer />
    </div>
  );
};
