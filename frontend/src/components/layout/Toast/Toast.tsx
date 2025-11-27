// components/layout/Toast/Toast.tsx
import React from 'react';
import { useStore } from 'effector-react';
import { $toast, hideToast } from './stores/toastStore';

export const Toast: React.FC = () => {
  const toast = useStore($toast);

  if (!toast.isVisible) return null;

  const bgColor = toast.type === 'success' ? 'bg-green-500' : 'bg-red-500';

  const handleActionClick = () => {
    toast.onAction?.();
    hideToast();
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-right-full duration-300">
      <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4`}>
        <div className="flex-1">{toast.message}</div>
        {toast.actionLabel && toast.onAction && (
          <button
            onClick={handleActionClick}
            className="text-white bg-black bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md text-sm"
          >
            {toast.actionLabel}
          </button>
        )}
        <button
          onClick={() => hideToast()}
          className="text-white bg-black bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-md text-sm"
        >
          Скрыть
        </button>
      </div>
    </div>
  );
};
