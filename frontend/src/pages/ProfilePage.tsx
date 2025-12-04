import React from 'react';
import { useUnit } from 'effector-react';
import { $currentUser, uploadAvatar, uploadAvatarFx } from '../models/users';
import { loadOrders } from '../models/orders';
import Button from '../components/layout/Button/Button.tsx';
import Footer from '../components/layout/Footer/Footer.tsx';
import ProfileContent from '../components/Profile/ProfileContent.tsx';

export const ProfilePage: React.FC = () => {
  const {
    currentUser,
    handleLoadOrders,
    handleUploadAvatar,
    isAvatarUploading,
  } = useUnit({
    currentUser: $currentUser,
    handleLoadOrders: loadOrders,
    handleUploadAvatar: uploadAvatar,
    isAvatarUploading: uploadAvatarFx.pending,
  });

  const handleNavigation = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-primary px-4">
        <div className="text-center space-y-4 max-w-md bg-white/90 border border-border-soft rounded-3xl p-8 shadow-brand-card">
            <p className="text-xs uppercase tracking-[0.35em] text-text-muted">доступ ограничен</p>
            <h2 className="text-2xl font-bold">Пользователь не авторизован</h2>
            <p className="text-text-secondary text-sm">Чтобы увидеть персональные данные и историю заказов, войдите в личный кабинет.</p>
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
    <div className="min-h-screen text-text-primary flex flex-col">
        <header className="px-4 sm:px-8 pt-8 pb-6">
          <div className="max-w-5xl mx-auto text-center sm:text-left">
            <p className="text-xs uppercase tracking-[0.4em] text-text-muted">личный кабинет</p>
            <h1 className="text-3xl sm:text-4xl font-semibold mt-3">Добро пожаловать, {currentUser.first_name}</h1>
            <p className="text-text-secondary mt-2">
              Управляйте своими заказами, настройками и данными профиля в одном месте.
            </p>
          </div>
        </header>

        <main className="flex-1 pb-8 px-3 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-[32px] border border-border-soft bg-white/85 backdrop-blur-md shadow-brand-card p-4 sm:p-8">
              <ProfileContent
                currentUser={currentUser}
                onUploadAvatar={handleUploadAvatar}
                onLoadOrders={handleLoadOrders}
                isAvatarUploading={isAvatarUploading}
              />
            </div>
          </div>
        </main>

        <Footer />
    </div>
  );
};
