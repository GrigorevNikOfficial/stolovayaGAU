import React, { useEffect } from 'react';
import { useUnit } from 'effector-react';
import { CartBlock } from '../Items/CardBlock.tsx';
import { $currentUser } from '../../models/users.ts';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose }) => {
  const currentUser = useUnit($currentUser);
  const handleOrderCreated = () => {
    // Закрываем модальное окно после успешного создания заказа
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Затемнение фона с анимацией */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Модальное окно корзины с анимацией */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-400 ease-out">
        <div className="flex flex-col h-full">
          {/* Заголовок */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Корзина</h2>
              {currentUser && (
                <p className="text-sm text-gray-500 mt-1">
                  Баланс:{' '}
                  <span className="font-semibold text-green-dark">
                    {(currentUser.balance ?? 0).toFixed(2)} ₽
                  </span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-300 hover:scale-110"
            >
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Контент корзины */}
          <div className="flex-1 overflow-y-auto">
            <CartBlock onOrderCreated={handleOrderCreated} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
