import React from 'react';
import type { User } from '../../types/user';

interface ProfileContentProps {
  currentUser: User;
  onUploadAvatar: (payload: { id: string; file: File }) => void;
  onLoadOrders: () => void;
  isAvatarUploading: boolean;
  layout?: 'standalone' | 'embedded';
  showHeader?: boolean;
}

export const ProfileContent: React.FC<ProfileContentProps> = ({
  currentUser,
  onUploadAvatar,
  onLoadOrders,
  isAvatarUploading,
  layout = 'standalone',
  showHeader = true,
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
      ? 'flex flex-col text-text-primary gap-4'
      : 'bg-white border border-border-soft shadow-brand-card rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-text-primary';

  const infoWrapperClasses = layout === 'embedded' ? 'space-y-4 sm:space-y-6' : 'space-y-4 sm:space-y-6';

  return (
    <div className={containerClasses}>
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <label htmlFor="avatar-input" className="cursor-pointer group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-brand-indigo to-brand-grape overflow-hidden border-2 border-white/70 shadow-brand-card flex items-center justify-center text-xl sm:text-2xl font-bold text-white group-hover:shadow-xl group-hover:scale-105 transition-all duration-200">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                {currentUser.first_name} {currentUser.last_name}
              </h1>
              <p className="text-text-secondary text-sm sm:text-base mt-1">Личный кабинет</p>
            </div>
          </div>
        </div>
      )}

      <div className={infoWrapperClasses}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-surface-muted rounded-xl p-4 sm:p-6 border border-border-soft">
            <label className="block text-sm sm:text-base font-medium text-text-muted mb-2 sm:mb-3">
              Имя
            </label>
            <p className="text-base sm:text-lg text-text-primary font-semibold">
              {currentUser.first_name}
            </p>
          </div>
          <div className="bg-surface-muted rounded-xl p-4 sm:p-6 border border-border-soft">
            <label className="block text-sm sm:text-base font-medium text-text-muted mb-2 sm:mb-3">
              Фамилия
            </label>
            <p className="text-base sm:text-lg text-text-primary font-semibold">
              {currentUser.last_name}
            </p>
          </div>
        </div>

        <div className="bg-surface-muted rounded-xl p-4 sm:p-6 border border-border-soft">
          <label className="block text-sm sm:text-base font-medium text-text-muted mb-2 sm:mb-3">
            Телефон
          </label>
          <p className="text-base sm:text-lg text-text-primary font-semibold">
            {currentUser.phone}
          </p>
        </div>

        {currentUser.mail && (
          <div className="bg-surface-muted rounded-xl p-4 sm:p-6 border border-border-soft">
            <label className="block text-sm sm:text-base font-medium text-text-muted mb-2 sm:mb-3">
              Email
            </label>
            <p className="text-base sm:text-lg text-text-primary font-semibold break-all">
              {currentUser.mail}
            </p>
          </div>
        )}

        <div className="bg-surface-muted rounded-xl p-4 sm:p-6 border border-border-soft">
          <label className="block text-sm sm:text-base font-medium text-text-muted mb-2 sm:mb-3">
            Баланс
          </label>
          <p className="text-2xl sm:text-3xl font-bold text-brand-indigo">
            {currentUser.balance.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
          </p>
          <p className="text-xs text-text-muted mt-1">
            Пополнить баланс может администратор системы
          </p>
        </div>

        <div className="bg-surface-muted rounded-xl p-4 sm:p-6 border border-border-soft">
          <label className="block text-sm sm:text-base font-medium text-text-muted mb-2 sm:mb-3">
            Роль
          </label>
          <p className="text-base sm:text-lg">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                currentUser.role === 'admin'
                  ? 'bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/30'
                  : currentUser.role === 'canteenManager' ||
                      currentUser.role === 'cateenManager'
                    ? 'bg-sky-100 text-sky-700 border border-sky-200'
                    : currentUser.role === 'storeManager'
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
          <div className="bg-surface-muted rounded-xl p-4 sm:p-6 border border-border-soft">
            <label className="block text-sm sm:text-base font-medium text-text-muted mb-2 sm:mb-3">
              Дата регистрации
            </label>
            <p className="text-base sm:text-lg text-text-primary">
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
