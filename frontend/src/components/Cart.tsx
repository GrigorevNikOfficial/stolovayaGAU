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

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
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
      onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="relative w-screen max-w-md">
            <div className="h-full flex flex-col bg-white shadow-xl">
              <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Корзина</h2>
                  <button
                    onClick={onClose}
                    className="ml-3 h-7 flex items-center"
                  >
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Выбор способа получения */}
                {cart.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Способ получения
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="pickup"
                          checked={deliveryMethod === 'pickup'}
                          onChange={e =>
                            setDeliveryMethod(e.target.value as 'pickup')
                          }
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Самовывоз
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="dine_in"
                          checked={deliveryMethod === 'dine_in'}
                          onChange={e =>
                            setDeliveryMethod(e.target.value as 'dine_in')
                          }
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          В зале
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="delivery"
                          checked={deliveryMethod === 'delivery'}
                          onChange={e =>
                            setDeliveryMethod(e.target.value as 'delivery')
                          }
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Доставка (скоро)
                        </span>
                      </label>
                    </div>

                    {deliveryMethod === 'delivery' && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                        <p className="text-sm text-yellow-700">
                          🚚 Функционал доставки будет добавлен позже.
                          Пожалуйста, выберите самовывоз.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Список товаров */}
                <div className="mt-8">
                  <div className="flow-root">
                    {cart.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        Корзина пуста
                      </p>
                    ) : (
                      <ul className="-my-6 divide-y divide-gray-200">
                        {cart.map(({ item, quantity }) => (
                          <li key={item._id} className="py-6 flex">
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between">
                                <h3 className="text-sm font-medium text-gray-900">
                                  {item.name}
                                </h3>
                                <p className="ml-4 text-sm font-medium text-gray-900">
                                  {item.price * quantity} ₽
                                </p>
                              </div>
                              {item.description && (
                                <p className="mt-1 text-sm text-gray-500 truncate">
                                  {item.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center space-x-2">
                                <button
                                  onClick={() =>
                                    handleUpdateQuantity({
                                      id: item._id,
                                      quantity: quantity - 1,
                                    })
                                  }
                                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700"
                                >
                                  -
                                </button>
                                <span className="text-sm text-gray-900">
                                  {quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleUpdateQuantity({
                                      id: item._id,
                                      quantity: quantity + 1,
                                    })
                                  }
                                  className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => handleRemoveFromCart(item._id)}
                                  className="ml-4 text-sm text-red-600 hover:text-red-500"
                                >
                                  Удалить
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {cart.length > 0 && (
                <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <p>Итого</p>
                    <p>{cartTotal} ₽</p>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {deliveryMethod === 'pickup'
                      ? 'Самовывоз из ресторана'
                      : deliveryMethod === 'dine_in'
                        ? 'Потребление в зале'
                        : 'Доставка временно недоступна'}
                  </p>
                  <div className="mt-6 space-y-2">
                    <button
                      onClick={handleSubmitOrder}
                      disabled={isCreating || deliveryMethod === 'delivery'}
                      className="w-full bg-indigo-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating
                        ? 'Оформление...'
                        : deliveryMethod === 'delivery'
                          ? 'Доставка временно недоступна'
                          : 'Оформить заказ'}
                    </button>
                    <button
                      onClick={handleClearCart}
                      className="w-full bg-white border border-gray-300 rounded-md shadow-sm py-3 px-4 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Очистить корзину
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
