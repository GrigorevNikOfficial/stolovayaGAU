import React, { useEffect } from 'react';
import { useUnit } from 'effector-react';
import { CartBlock } from '../Items/CardBlock.tsx';
import { $currentUser } from '../../models/users.ts';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ isOpen, onClose, onOrderCreated }) => {
  const currentUser = useUnit($currentUser);
  const handleOrderCreated = () => {
    // Закрываем модальное окно после успешного создания заказа
    onClose();
    onOrderCreated?.();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Затемнение фона с анимацией */}
      <div
        className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Модальное окно корзины с анимацией */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#1f2022] border-l border-[#2f3032] text-gray-100 shadow-2xl transform transition-transform duration-400 ease-out">
        <div className="flex flex-col h-full">
          {/* Заголовок */}
          <div className="flex items-center justify-between p-6 border-b border-[#2f3032] bg-[#1c1d1f] gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-100">Корзина</h2>
              {currentUser && (
                <p className="text-sm text-gray-400 mt-1">
                  Баланс:{' '}
                  <span className="font-semibold text-[#69e7b6]">
                    {(currentUser.balance ?? 0).toFixed(2)} ₽
                  </span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-[#2f3032] bg-[#2d2d2c] hover:bg-[#343536] text-gray-300 hover:text-white flex items-center justify-center transition-all duration-300 hover:scale-105"
            >
              <svg
                className="w-4 h-4"
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
          <div className="flex-1 overflow-y-auto bg-[#161718]">
            <CartBlock onOrderCreated={handleOrderCreated} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
