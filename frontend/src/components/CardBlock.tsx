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
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
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

    handleCreateOrder(deliveryMethod);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 h-full min-h-[600px] flex flex-col">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Корзина</h2>

      {/* Выбор способа получения */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Способ получения
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              value="pickup"
              checked={deliveryMethod === 'pickup'}
              onChange={e => setDeliveryMethod(e.target.value)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <span className="ml-3 text-sm text-gray-700">Самовывоз</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="delivery"
              checked={deliveryMethod === 'delivery'}
              onChange={e => setDeliveryMethod(e.target.value)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <span className="ml-3 text-sm text-gray-700">Доставка (скоро)</span>
          </label>
        </div>

        {deliveryMethod === 'delivery' && (
          <div className="mt-3 p-3 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-700">
              🚚 Функционал доставки будет добавлен позже
            </p>
          </div>
        )}
      </div>

      {/* Список товаров - занимает все доступное пространство */}
      <div className="flex-1 mb-6">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">🛒</div>
            <p className="text-gray-500 text-lg">Корзина пуста</p>
            <p className="text-gray-400 text-sm mt-2">
              Добавьте товары из меню
            </p>
          </div>
        ) : (
          <div className="space-y-4 h-full overflow-y-auto pr-2">
            {cart.map(({ item, quantity }) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-900">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 ml-3 text-lg font-bold"
                  >
                    ×
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">
                    {item.price * quantity} ₽
                  </p>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() =>
                        handleUpdateQuantity({
                          id: item.id,
                          quantity: quantity - 1,
                        })
                      }
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400"
                    >
                      -
                    </button>
                    <span className="text-lg font-medium text-gray-900 w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleUpdateQuantity({
                          id: item.id,
                          quantity: quantity + 1,
                        })
                      }
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400"
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
        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-medium text-gray-900">Итого:</span>
            <span className="text-xl font-bold text-gray-900">
              {cartTotal} ₽
            </span>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSubmitOrder}
              disabled={isCreating || deliveryMethod === 'delivery'}
              className="w-full bg-indigo-600 border border-transparent rounded-lg py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating
                ? 'Оформление...'
                : deliveryMethod === 'delivery'
                  ? 'Доставка временно недоступна'
                  : 'Оформить заказ'}
            </button>
            <button
              onClick={handleClearCart}
              className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Очистить корзину
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
