import React, { useState } from 'react';
import { useUnit } from 'effector-react';
import {
  $cart,
  $cartTotal,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  createOrderFromCart,
} from '../models/cart';
import { $isCreating } from '../models/orders';
import { $currentUser } from '../models/users';

export const CartBlock: React.FC = () => {
  const [deliveryMethod, setDeliveryMethod] = useState<
    'dine_in' | 'pickup' | 'delivery'
  >('pickup');
  const [
    cart,
    cartTotal,
    currentUser,
    isCreating,
    handleRemoveFromCart,
    handleUpdateQuantity,
    handleClearCart,
    handleCreateOrder,
  ] = useUnit([
    $cart,
    $cartTotal,
    $currentUser,
    $isCreating,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    createOrderFromCart,
  ]);

  const handleSubmitOrder = () => {
    if (!currentUser) {
      alert('Для оформления заказа необходимо войти в систему');
      window.location.href = '/login';
      return;
    }

    handleCreateOrder({
      delivery_method: deliveryMethod,
      ...(deliveryMethod === 'dine_in' && { table_number: 1 }),
      ...(deliveryMethod === 'delivery' && {
        delivery_address: 'Адрес доставки',
      }),
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
      {' '}
      {/* Уменьшил padding */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Корзина</h2>{' '}
      {/* Уменьшил размер заголовка */}
      {/* Выбор способа получения - компактный вариант */}
      {cart.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Способ получения
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setDeliveryMethod('pickup')}
              className={`flex-1 py-2 px-3 text-xs rounded-md transition-colors ${
                deliveryMethod === 'pickup'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Самовывоз
            </button>
            <button
              onClick={() => setDeliveryMethod('dine_in')}
              className={`flex-1 py-2 px-3 text-xs rounded-md transition-colors ${
                deliveryMethod === 'dine_in'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              В зале
            </button>
            <button
              onClick={() => setDeliveryMethod('delivery')}
              disabled
              className="flex-1 py-2 px-3 text-xs rounded-md bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              Доставка
            </button>
          </div>
        </div>
      )}
      {/* Список товаров с прокруткой */}
      <div className="flex-1 overflow-y-auto mb-4">
        {' '}
        {/* Добавил прокрутку */}
        {cart.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">🛒</div>{' '}
            {/* Уменьшил иконку */}
            <p className="text-gray-500 text-sm">Корзина пуста</p>{' '}
            {/* Уменьшил текст */}
            <p className="text-gray-400 text-xs mt-1">
              Добавьте товары из меню
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {' '}
            {/* Уменьшил отступы между товарами */}
            {cart.map(({ item, quantity }) => (
              <div key={item._id} className="bg-gray-50 rounded-lg p-3 border">
                {' '}
                {/* Уменьшил padding */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {' '}
                      {/* Уменьшил текст */}
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {' '}
                        {/* Уменьшил и обрезал описание */}
                        {item.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveFromCart(item._id)}
                    className="text-red-500 hover:text-red-700 ml-2 text-md font-bold"
                  >
                    ×
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    {' '}
                    {/* Уменьшил текст цены */}
                    {item.price * quantity} ₽
                  </p>
                  <div className="flex items-center space-x-2">
                    {' '}
                    {/* Уменьшил отступы */}
                    <button
                      onClick={() =>
                        handleUpdateQuantity({
                          id: item._id,
                          quantity: quantity - 1,
                        })
                      }
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 text-xs" /* Уменьшил кнопки */
                    >
                      -
                    </button>
                    <span className="text-sm font-medium text-gray-900 w-6 text-center">
                      {' '}
                      {/* Уменьшил счетчик */}
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleUpdateQuantity({
                          id: item._id,
                          quantity: quantity + 1,
                        })
                      }
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 text-xs" /* Уменьшил кнопки */
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Футер с общей суммой и кнопками */}
      {cart.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-base font-medium text-gray-900">Итого:</span>{' '}
            {/* Уменьшил текст */}
            <span className="text-lg font-bold text-gray-900">
              {' '}
              {/* Уменьшил текст */}
              {cartTotal} ₽
            </span>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleSubmitOrder}
              disabled={isCreating || deliveryMethod === 'delivery'}
              className="w-full bg-indigo-600 border border-transparent rounded-lg py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" /* Уменьшил кнопку */
            >
              {isCreating
                ? 'Оформление...'
                : deliveryMethod === 'delivery'
                  ? 'Доставка недоступна'
                  : 'Оформить заказ'}
            </button>
            <button
              onClick={handleClearCart}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors" /* Уменьшил кнопку */
            >
              Очистить корзину
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
