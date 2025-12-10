import React, { useEffect } from 'react';
import { useUnit } from 'effector-react';
import { CartBlock } from '../Items/CardBlock.tsx';
import { $currentUser } from '../../models/users.ts';
import { formatBalance } from '../../utils/formatBalance';

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
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Модальное окно корзины с анимацией */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white/98 border-l border-border-subtle text-text-primary shadow-[0_40px_90px_rgba(15,23,42,0.18)] transform transition-transform duration-400 ease-out">
        <div className="flex flex-col h-full">
          {/* Заголовок */}
          <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-gradient-to-r from-white to-emerald-50/60 gap-4">
            <div>
              <h2 className="text-xl font-bold text-brand-indigo">Корзина</h2>
              {currentUser && (
                <p className="text-sm text-text-secondary mt-1">
                  Баланс:{' '}
                  <span className="font-semibold text-emerald-600">
                    {formatBalance(currentUser.balance, { withDecimals: true })}
                  </span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-emerald-100 bg-white/80 hover:bg-white text-brand-indigo flex items-center justify-center transition-all duration-300 hover:scale-105"
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
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-emerald-50/40">
            <CartBlock onOrderCreated={handleOrderCreated} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartModal;
