// components/layout/Toast/Toast.tsx
import React from 'react';
import { useStore } from 'effector-react';
import { $toast } from './stores/toastStore';

export const Toast: React.FC = () => {
  const toast = useStore($toast);

  if (!toast.isVisible) return null;

  const bgColor = toast.type === 'success' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-right-full duration-300">
      <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg`}>
        {toast.message}
      </div>
    </div>
  );
};
