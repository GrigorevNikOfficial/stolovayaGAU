import React from 'react';
import Button from '../layout/Button/Button';
import type { UpdateProfileRequest, User } from '../../types/user';
import { formatBalance } from '../../utils/formatBalance';

interface ProfileContentProps {
  currentUser: User;
  onUploadAvatar: (payload: { id: string; file: File }) => void;
  onLoadOrders: () => void;
  onUpdateProfile: (payload: UpdateProfileRequest) => void;
  isAvatarUploading: boolean;
  isProfileUpdating: boolean;
  layout?: 'standalone' | 'embedded';
  showHeader?: boolean;
}

export const ProfileContent: React.FC<ProfileContentProps> = ({
  currentUser,
  onUploadAvatar,
  onLoadOrders,
  onUpdateProfile,
  isAvatarUploading,
  isProfileUpdating,
  layout = 'standalone',
  showHeader = true,
}) => {
  const avatarUrl = currentUser.avatar?.url;
  const userInitials = `${currentUser.first_name?.[0] ?? ''}${currentUser.last_name?.[0] ?? ''}`
    .toUpperCase()
    .trim() || 'U';
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const formId = React.useMemo(() => `profile-data-${currentUser._id}`, [currentUser._id]);
  const initialFormValues = React.useMemo<UpdateProfileRequest>(
    () => ({
      first_name: currentUser.first_name ?? '',
      last_name: currentUser.last_name ?? '',
      phone: currentUser.phone ?? '',
      mail: currentUser.mail ?? '',
    }),
    [currentUser.first_name, currentUser.last_name, currentUser.phone, currentUser.mail]
  );
  const [formValues, setFormValues] = React.useState<UpdateProfileRequest>(initialFormValues);
  const [isEditing, setIsEditing] = React.useState(false);
  const formattedBalance = React.useMemo(() => formatBalance(currentUser.balance, { withDecimals: true }), [currentUser.balance]);
  const showRoleCard = currentUser.role !== 'user';

  React.useEffect(() => {
    onLoadOrders();
  }, [onLoadOrders, currentUser._id]);
  
  React.useEffect(() => {
    setFormValues(initialFormValues);
  }, [initialFormValues]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadAvatar({ id: currentUser._id, file });
    }
    e.target.value = '';
  };
  
  const triggerAvatarUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onUpdateProfile({
      first_name: formValues.first_name?.trim(),
      last_name: formValues.last_name?.trim(),
      phone: formValues.phone?.trim(),
      mail: formValues.mail?.trim(),
    });
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setFormValues(initialFormValues);
    setIsEditing(false);
  };
  
  const isSaveDisabled =
    !formValues.first_name?.trim() ||
    !formValues.last_name?.trim() ||
    !formValues.phone?.trim() ||
    isProfileUpdating;

  const containerClasses =
    layout === 'embedded'
      ? 'flex flex-col text-text-primary gap-4'
      : 'bg-white border border-border-soft shadow-brand-card rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-text-primary';

  const infoWrapperClasses = layout === 'embedded' ? 'space-y-4 sm:space-y-6' : 'space-y-4 sm:space-y-6';
  const inputClasses = 'w-full rounded-2xl border border-border-soft bg-white px-4 py-3 text-base text-text-primary focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/30 outline-none transition-shadow';
  const editActions = (
    <div className="flex flex-col justify-end gap-2 sm:flex-row sm:items-center">
      {isEditing ? (
        <>
          <Button
            type="submit"
            form={formId}
            size="sm"
            disabled={isSaveDisabled}
          >
            {isProfileUpdating ? 'Сохраняем…' : 'Сохранить'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleCancelEdit}
            disabled={isProfileUpdating}
          >
            Отмена
          </Button>
        </>
      ) : (
        <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
          Редактировать
        </Button>
      )}
    </div>
  );

  return (
    <div className={containerClasses}>
      {showHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-5 sm:gap-8">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={triggerAvatarUpload}
                disabled={isAvatarUploading}
                className="group relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-brand-indigo to-brand-grape overflow-hidden border-2 border-white/70 shadow-brand-card flex items-center justify-center text-2xl sm:text-3xl font-bold text-white transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/40 disabled:opacity-60"
                aria-label="Сменить аватар"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`${currentUser.first_name} ${currentUser.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{userInitials}</span>
                )}
                <span className="pointer-events-none absolute bottom-2 right-2 rounded-xl bg-white/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-brand-indigo shadow-sm">
                  ✎
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isAvatarUploading}
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                {currentUser.first_name} {currentUser.last_name}
              </h1>
              <p className="text-text-secondary text-sm sm:text-base mt-1">Личный кабинет</p>
            </div>
          </div>
          {editActions}
        </div>
      )}

      <form id={formId} className={infoWrapperClasses} onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-surface-muted rounded-xl p-4 sm:p-6 border border-border-soft">
            <label className="block text-sm sm:text-base font-medium text-text-muted mb-2 sm:mb-3">
              Имя
            </label>
            {isEditing ? (
              <input
                name="first_name"
                value={formValues.first_name ?? ''}
                onChange={handleInputChange}
                className={inputClasses}
                placeholder="Введите имя"
                autoComplete="given-name"
                required
                disabled={isProfileUpdating}
              />
            ) : (
              <p className="text-base sm:text-lg text-text-primary font-semibold">
                {currentUser.first_name}
              </p>
            )}
          </div>
          <div className="bg-surface-muted rounded-xl p-4 sm:p-6 border border-border-soft">
            <label className="block text-sm sm:text-base font-medium text-text-muted mb-2 sm:mb-3">
              Фамилия
            </label>
            {isEditing ? (
              <input
                name="last_name"
                value={formValues.last_name ?? ''}
                onChange={handleInputChange}
                className={inputClasses}
                placeholder="Введите фамилию"
                autoComplete="family-name"
                required
                disabled={isProfileUpdating}
              />
            ) : (
              <p className="text-base sm:text-lg text-text-primary font-semibold">
                {currentUser.last_name}
              </p>
            )}
          </div>
        </div>

        <div className="bg-surface-muted rounded-xl p-4 sm:p-6 border border-border-soft">
          <label className="block text-sm sm:text-base font-medium text-text-muted mb-2 sm:mb-3">
            Телефон
          </label>
          {isEditing ? (
            <input
              name="phone"
              value={formValues.phone ?? ''}
              onChange={handleInputChange}
              className={inputClasses}
              placeholder="Введите телефон"
              type="tel"
              autoComplete="tel"
              required
              disabled={isProfileUpdating}
            />
          ) : (
            <p className="text-base sm:text-lg text-text-primary font-semibold">
              {currentUser.phone}
            </p>
          )}
        </div>

        <div className="bg-surface-muted rounded-xl p-4 sm:p-6 border border-border-soft">
          <label className="block text-sm sm:text-base font-medium text-text-muted mb-2 sm:mb-3">
            Email
          </label>
          {isEditing ? (
            <input
              name="mail"
              value={formValues.mail ?? ''}
              onChange={handleInputChange}
              className={inputClasses}
              placeholder="Введите email"
              type="email"
              autoComplete="email"
              disabled={isProfileUpdating}
            />
          ) : (
            <p className="text-base sm:text-lg text-text-primary font-semibold break-all">
              {currentUser.mail || 'Не указано'}
            </p>
          )}
        </div>

        <div className="bg-surface-muted rounded-xl p-4 sm:p-6 border border-border-soft">
          <label className="block text-sm sm:text-base font-medium text-text-muted mb-2 sm:mb-3">
            Баланс
          </label>
          <p className="text-2xl sm:text-3xl font-bold text-brand-indigo">
            {formattedBalance}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Пополнить баланс может администратор системы
          </p>
        </div>

        {showRoleCard && (
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
        )}

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
      </form>
    </div>
  );
};

export default ProfileContent;
