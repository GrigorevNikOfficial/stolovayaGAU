// components/ItemModal/ItemModal.tsx
import { useUnit } from 'effector-react';
import React from 'react';
import {
    $cart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
} from '../../models/cart';
import { $currentUser } from '../../models/users';
import Button from '../layout/Button/Button.tsx';
import { showToast } from '../layout/Toast/stores/toastStore.ts';

interface ItemModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const [
    currentUser,
    cart,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveFromCart,
  ] = useUnit([
    $currentUser,
    $cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
  ]);

  const [desiredQuantity, setDesiredQuantity] = React.useState('1');
  const itemId = item?._id ?? '';

  // Получение количества товара в корзине
  const getItemQuantity = React.useCallback(() => {
    if (!itemId) return 0;
    const cartItem = cart.find(cartItem => cartItem.item._id === itemId);
    return cartItem ? cartItem.quantity : 0;
  }, [cart, itemId]);

  const quantity = getItemQuantity();
  const isAvailable = item?.is_available !== false;

  const clampQuantityValue = (value: number) =>
    Math.max(1, Math.min(999, Math.floor(value)));

  React.useEffect(() => {
    if (!isOpen || !itemId) return;
    const baseQuantity = quantity > 0 ? quantity : 1;
    setDesiredQuantity(String(baseQuantity));
  }, [isOpen, itemId, quantity]);

  const handleAddToCartClick = () => {
    if (!isAvailable) {
      return;
    }
    if (!itemId || !item) {
      return;
    }
    const normalizedDesired = clampQuantityValue(Number(desiredQuantity) || 1);

    if (quantity === 0) {
      handleAddToCart({
        _id: item._id,
        uniq_nom: item.uniq_nom || itemId,
        name: item.name,
        price: item.price,
        description: item.description,
        category_slug: item.category_slug,
        calories: item.calories,
        number_pribors: item.number_pribors,
        image_url: item.image_url,
        preparation_time: item.preparation_time,
      });
    }

    handleUpdateQuantity({
      id: itemId,
      quantity: normalizedDesired,
    });

    setDesiredQuantity(String(normalizedDesired));

    showToast({
      message: 'Товар добавлен в корзину',
      type: 'success' as const,
    });
  };

  const handleAdjustQuantity = (delta: number) => {
    if (!itemId) {
      return;
    }

    if (!isAvailable && delta > 0 && quantity === 0) {
      return;
    }

    if (quantity === 0) {
      const currentDesired = Number(desiredQuantity) || 1;
      const nextDesired = clampQuantityValue(currentDesired + delta);
      setDesiredQuantity(String(nextDesired));
      return;
    }

    const nextQuantity = quantity + delta;
    if (nextQuantity <= 0) {
      handleRemoveFromCart(itemId);
      setDesiredQuantity('1');
      return;
    }

    const normalized = clampQuantityValue(nextQuantity);
    handleUpdateQuantity({ id: itemId, quantity: normalized });
    setDesiredQuantity(String(normalized));
  };

  const handleQuantityInputChange = (value: string) => {
    if (!itemId) {
      return;
    }

    const sanitized = value.replace(/[^0-9]/g, '');
    if (sanitized === '') {
      setDesiredQuantity('1');
      if (quantity > 0) {
        handleUpdateQuantity({ id: itemId, quantity: 1 });
      }
      return;
    }

    const normalized = clampQuantityValue(Number(sanitized));
    setDesiredQuantity(String(normalized));
    if (quantity > 0) {
      handleUpdateQuantity({ id: itemId, quantity: normalized });
    }
  };

  const canAddToCart =
    currentUser &&
    (currentUser.role === 'admin' || currentUser.role === 'user');

  if (!isOpen || !item) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Затемнение фона */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Модальное окно */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Кнопка закрытия */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 backdrop-blur-sm transition-all duration-300 hover:scale-110"
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

          {/* Контент */}
          <div className="flex flex-col lg:flex-row">
            {/* Изображение */}
            <div className="lg:w-1/2">
              {item.image_url || item.image?.url ? (
                <img
                  src={item.image_url || item.image?.url}
                  alt={item.name}
                  className="w-full h-64 lg:h-full object-cover"
                />
              ) : (
                <div className="w-full h-64 lg:h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <span className="text-6xl text-gray-300">🍽️</span>
                </div>
              )}
            </div>

            {/* Информация */}
            <div className="lg:w-1/2 p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {item.name}
              </h2>

              {item.description && (
                <p className="text-gray-600 text-base leading-relaxed mb-6">
                  {item.description}
                </p>
              )}

              {/* Детали */}
              <div className="space-y-4 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-3xl font-bold text-green-dark">
                    {item.price} ₽
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border ${isAvailable ? 'bg-green-light text-green-darker border-green-lighter' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                    >
                      {isAvailable ? 'Доступно' : 'Недоступно'}
                    </span>
                    {item.category_slug && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-light text-green-darker border border-green-lighter">
                        {item.category_slug}
                      </span>
                    )}
                  </div>
                </div>

                {/* Характеристики */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  {item.calories && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">🔥</span>
                      <span>{item.calories} ккал</span>
                    </div>
                  )}
                  {item.preparation_time && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">⏱️</span>
                      <span>{item.preparation_time} мин</span>
                    </div>
                  )}
                  {item.number_pribors && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">🍴</span>
                      <span>{item.number_pribors} приборов</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Кнопки действий */}
              {canAddToCart && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Количество
                    </label>
                    <div className="flex items-center justify-center gap-3">
                      {quantity > 0 && (
                        <Button
                          onClick={() => handleAdjustQuantity(-1)}
                          variant="outline"
                          size="lg"
                          className="w-12 h-12 !p-0"
                        >
                          -
                        </Button>
                      )}
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={desiredQuantity}
                        onChange={e => handleQuantityInputChange(e.target.value)}
                        className="w-24 text-center text-2xl font-bold text-green-dark border border-gray-200 rounded-2xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-medium focus:border-transparent"
                        disabled={!isAvailable}
                      />
                      <Button
                        onClick={() => handleAdjustQuantity(1)}
                        variant="outline"
                        size="lg"
                        className="w-12 h-12 !p-0"
                        disabled={!isAvailable}
                      >
                        +
                      </Button>
                    </div>
                    {quantity === 0 && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Укажите нужное количество и добавьте товар в корзину
                      </p>
                    )}
                  </div>

                  {quantity === 0 ? (
                    <Button
                      onClick={handleAddToCartClick}
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={!isAvailable}
                    >
                      {isAvailable ? '🛒 Добавить в корзину' : 'Недоступно'}
                    </Button>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleRemoveFromCart(item._id)}
                        variant="outline"
                        size="lg"
                        className="flex-1"
                      >
                        Удалить из корзины
                      </Button>
                      <Button
                        onClick={onClose}
                        variant="primary"
                        size="lg"
                        className="flex-1"
                      >
                        Готово
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {!isAvailable && (
                <p className="text-sm text-red-500 text-center mt-4">
                  Товар временно недоступен для заказа
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemModal;
