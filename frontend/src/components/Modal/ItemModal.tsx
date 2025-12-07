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
import { ClockIcon, FlameIcon, ForkKnifeIcon } from '../icons/ServiceIcons';

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

  const restoreItemToCart = (qty: number) => {
    if (!itemId || !item || qty <= 0) {
      return;
    }
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
    handleUpdateQuantity({ id: itemId, quantity: qty });
    setDesiredQuantity(String(qty));

    showToast({
      message: 'Товар возвращен в корзину',
      type: 'success',
    });
  };

  const showRemovalToast = (removedQty: number) => {
    if (removedQty <= 0) {
      return;
    }

    showToast({
      message: `Товар "${item?.name ?? ''}" удален из корзины`,
      type: 'success',
      persistent: true,
      actionLabel: 'Вернуть',
      onAction: () => restoreItemToCart(removedQty),
    });
  };

  const removeItemCompletely = (removedQty: number) => {
    if (!itemId || removedQty <= 0) {
      return;
    }
    handleRemoveFromCart(itemId);
    setDesiredQuantity('1');
    showRemovalToast(removedQty);
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
      removeItemCompletely(quantity);
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
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-[#121314] border border-[#343536] rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.55)] overflow-hidden text-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-2xl bg-[#1e1f20]/80 hover:bg-[#2a2b2c] border border-[#3f4042] flex items-center justify-center text-gray-300 hover:text-white transition-all duration-200"
            aria-label="Закрыть"
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

          <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8">
            <div className="lg:w-1/2">
              <div className="relative w-full rounded-2xl overflow-hidden border border-[#3a3b3a] bg-[#1a1b1c] min-h-[280px]">
                {item.image_url || item.image?.url ? (
                  <img
                    src={item.image_url || item.image?.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                    <ForkKnifeIcon className="w-16 h-16" />
                  </div>
                )}
              </div>
            </div>

            <div className="lg:w-1/2 space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                  Информация о блюде
                </p>
                <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
                  {item.name}
                </h2>
                {item.description && (
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-3xl font-bold text-[#69e7b6]">
                    {item.price} ₽
                  </span>
                  <div className="flex items-center flex-wrap gap-2">
                    <span
                      className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${isAvailable ? 'bg-[#106157]/20 text-[#69e7b6] border-[#106157]/40' : 'bg-[#1f2122] text-gray-400 border-[#3a3b3a]'}`}
                    >
                      {isAvailable ? 'Доступно' : 'Недоступно'}
                    </span>
                    {item.category_slug && (
                      <span className="text-[11px] font-semibold px-3 py-1 rounded-full border border-[#3a3b3a] text-gray-300">
                        {item.category_slug}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                  {item.calories && (
                    <div className="rounded-xl border border-[#2f3031] bg-[#1a1b1c] px-3 py-2 flex items-center gap-2">
                      <FlameIcon className="w-4 h-4 text-gray-500" />
                      <span>{item.calories} ккал</span>
                    </div>
                  )}
                  {item.preparation_time && (
                    <div className="rounded-xl border border-[#2f3031] bg-[#1a1b1c] px-3 py-2 flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-gray-500" />
                      <span>{item.preparation_time} мин</span>
                    </div>
                  )}
                  {item.number_pribors && (
                    <div className="rounded-xl border border-[#2f3031] bg-[#1a1b1c] px-3 py-2 flex items-center gap-2">
                      <ForkKnifeIcon className="w-4 h-4 text-gray-500" />
                      <span>{item.number_pribors} приборов</span>
                    </div>
                  )}
                </div>
              </div>

              {canAddToCart && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                      Количество
                    </label>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => handleAdjustQuantity(-1)}
                        disabled={!isAvailable}
                        className="w-10 h-10 rounded-full bg-[#1f2122] text-[#69e7b6] border border-[#106157]/40 flex items-center justify-center text-lg font-bold hover:bg-[#106157] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        type="button"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={desiredQuantity}
                        onChange={e => handleQuantityInputChange(e.target.value)}
                        className="w-28 text-center text-2xl font-bold text-white border border-[#343536] rounded-2xl py-2 px-3 bg-[#1b1c1d] focus:outline-none focus:ring-2 focus:ring-[#106157]"
                        disabled={!isAvailable}
                      />
                      <button
                        onClick={() => handleAdjustQuantity(1)}
                        disabled={!isAvailable}
                        className="w-10 h-10 rounded-full bg-[#1f2122] text-[#69e7b6] border border-[#106157]/40 flex items-center justify-center text-lg font-bold hover:bg-[#106157] hover:text-white transition-all disabled:opacity-50"
                        type="button"
                      >
                        +
                      </button>
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
                      {isAvailable ? 'Добавить в корзину' : 'Недоступно'}
                    </Button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => removeItemCompletely(quantity)}
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
                <p className="text-sm text-red-400 text-center">
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
