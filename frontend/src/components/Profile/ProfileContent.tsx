import React from 'react';
import type { User } from '../../types/user';

interface ProfileContentProps {
  currentUser: User;
  onUploadAvatar: (payload: { id: string; file: File }) => void;
  onLoadOrders: () => void;
  isAvatarUploading: boolean;
  layout?: 'standalone' | 'embedded';
}

export const ProfileContent: React.FC<ProfileContentProps> = ({
  currentUser,
  onUploadAvatar,
  onLoadOrders,
  isAvatarUploading,
  layout = 'standalone',
}) => {
  const avatarUrl = currentUser.avatar?.url;
  const userInitials = `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`
    .toUpperCase()
    .trim() || 'U';

  React.useEffect(() => {
    onLoadOrders();
  }, [onLoadOrders, currentUser._id]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadAvatar({ id: currentUser._id, file });
    }
    e.target.value = '';
  };

  const containerClasses =
    layout === 'embedded'
      ? 'bg-white rounded-2xl shadow-lg p-4 sm:p-6 h-full flex flex-col'
      : 'bg-white shadow-lg rounded-lg p-4 sm:p-6 mb-4 sm:mb-6';

  const infoWrapperClasses =
    layout === 'embedded'
      ? 'space-y-4 sm:space-y-6 flex-1 overflow-y-auto'
      : 'space-y-4 sm:space-y-6';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-4 sm:gap-6">
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
            <p className="text-gray-500 text-sm sm:text-base mt-1">Личный кабинет</p>
          </div>
        </div>
      </div>

      <div className={infoWrapperClasses}>
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
            Баланс
          </label>
          <p className="text-2xl sm:text-3xl font-bold text-green-dark">
            {(currentUser.balance ?? 0).toLocaleString('ru-RU')} ₽
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Пополнить баланс может администратор системы
          </p>
        </div>

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

        {currentUser.created_at && (
          <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
              Дата регистрации
            </label>
            <p className="text-base sm:text-lg text-gray-900">
              {new Date(currentUser.created_at).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileContent;
