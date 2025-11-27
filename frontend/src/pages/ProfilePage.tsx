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
      <div className="min-h-screen flex items-center justify-center bg-[#161718] px-4 text-gray-100">
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
    <div className="min-h-screen bg-[#161718] text-gray-100 flex flex-col">
      {/* Основной контент */}
      <div className="flex-1 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <ProfileContent
            currentUser={currentUser}
            onUploadAvatar={handleUploadAvatar}
            onLoadOrders={handleLoadOrders}
            isAvatarUploading={isAvatarUploading}
          />
        </div>
      </div>

      {/* Футер */}
      <Footer />
    </div>
  );
};
