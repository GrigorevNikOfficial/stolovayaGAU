import React, { useEffect, useState } from 'react';
import {
  $deliverySettings,
  fetchDeliverySettings,
} from '../../models/settings.ts';
import { useUnit } from 'effector-react';
import {
  $cart,
  $cartTotal,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  createOrderFromCart,
} from '../../models/cart.ts';
import { $isCreating } from '../../models/orders.ts';
import { $currentUser } from '../../models/users.ts';
import Button from '../layout/Button/Button.tsx';
import Select from '../layout/Select/Select.tsx';

interface CartBlockProps {
  onOrderCreated?: () => void; // Добавляем callback
}

export const CartBlock: React.FC<CartBlockProps> = ({ onOrderCreated }) => {
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

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const currentBalance = currentUser?.balance ?? 0;
  const hasEnoughBalance = currentUser ? currentBalance >= cartTotal : true;
  const remainingBalance = currentBalance - cartTotal;

  const deliveryAddressOptions = [
    { value: 'эк', label: 'Экономический корпус' },
    { value: 'гл', label: 'Главный корпус' },
  ];

  const [settings, handleFetchSettings] = useUnit([
    $deliverySettings,
    fetchDeliverySettings,
  ]);

  useEffect(() => {
    handleFetchSettings();
  }, [handleFetchSettings]);

  const handleSubmitOrder = async () => {
    if (!currentUser) {
      alert('Для оформления заказа необходимо войти в систему');
      window.location.href = '/login';
      return;
    }

    // Валидация для доставки
    if (deliveryMethod === 'delivery' && !deliveryAddress) {
      alert('Пожалуйста, выберите адрес доставки');
      return;
    }

    if (currentUser && currentBalance < cartTotal) {
      alert('Недостаточно средств на балансе. Обратитесь к администратору.');
      return;
    }

    try {
      await handleCreateOrder({
        delivery_method: deliveryMethod,
        ...(deliveryMethod === 'dine_in' && { table_number: 1 }),
        ...(deliveryMethod === 'delivery' && {
          delivery_address: deliveryAddress,
        }),
      });

      // После успешного создания заказа вызываем callback
      if (onOrderCreated) {
        onOrderCreated();
      }
    } catch (error) {
      console.error('Ошибка при создании заказа:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Выбор способа получения */}
      {cart.length > 0 && (
        <div className="p-6 border-b border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Способ получения
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setDeliveryMethod('pickup')}
              className={`flex-1 py-3 px-4 text-sm rounded-xl transition-all duration-300 ${
                deliveryMethod === 'pickup'
                  ? 'bg-green-dark text-white shadow-lg shadow-green-dark/25'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              Самовывоз
            </button>
            <button
              onClick={() => setDeliveryMethod('dine_in')}
              className={`flex-1 py-3 px-4 text-sm rounded-xl transition-all duration-300 ${
                deliveryMethod === 'dine_in'
                  ? 'bg-green-dark text-white shadow-lg shadow-green-dark/25'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              В зале
            </button>
            <button
              onClick={() => setDeliveryMethod('delivery')}
              disabled={!settings.deliveryEnabled}
              className={`flex-1 py-3 px-4 text-sm rounded-xl transition-all duration-300 ${
                deliveryMethod === 'delivery'
                  ? 'bg-green-dark text-white shadow-lg shadow-green-dark/25'
                  : settings.deliveryEnabled
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {settings.deliveryEnabled ? 'Доставка' : '✕'}
            </button>
          </div>

          {!settings.deliveryEnabled && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                Доставка временно недоступна
              </p>
            </div>
          )}
          {settings.deliveryEnabled && deliveryMethod === 'delivery' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите адрес доставки
              </label>
              <Select
                options={deliveryAddressOptions}
                value={deliveryAddress}
                onChange={setDeliveryAddress}
                placeholder="Выберите корпус"
                required={deliveryMethod === 'delivery'}
              />
            </div>
          )}
        </div>
      )}

      {/* Список товаров */}
      <div className="flex-1 overflow-y-auto p-6">
        {currentUser && (
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
              <span>Баланс</span>
              <span className="text-lg text-green-dark">
                {currentBalance} ₽
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>После заказа</span>
              <span
                className={
                  remainingBalance >= 0
                    ? 'text-green-darker font-semibold'
                    : 'text-red-500 font-semibold'
                }
              >
                {remainingBalance >= 0 ? remainingBalance : 0} ₽
              </span>
            </div>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-300 text-6xl mb-4">🛒</div>
            <p className="text-gray-500 text-lg font-medium mb-2">
              Корзина пуста
            </p>
            <p className="text-gray-400 text-sm">Добавьте товары из меню</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map(({ item, quantity }) => (
              <div
                key={item._id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-400 ease-out hover:translate-y-[-4px]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveFromCart(item._id)}
                    className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 hover:text-red-700 transition-all duration-300 hover:scale-110 text-lg font-bold"
                  >
                    ×
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-green-dark">
                    {item.price * quantity} ₽
                  </p>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() =>
                        handleUpdateQuantity({
                          id: item._id,
                          quantity: quantity - 1,
                        })
                      }
                      className="w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-300 hover:border-gray-400 text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="text-base font-semibold text-gray-900 w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleUpdateQuantity({
                          id: item._id,
                          quantity: quantity + 1,
                        })
                      }
                      className="w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-300 hover:border-gray-400 text-sm font-bold"
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

      {/* Футер корзины */}
      {cart.length > 0 && (
        <div className="border-t border-gray-100 p-6 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-900">Итого:</span>
            <span className="text-2xl font-bold text-green-dark">
              {cartTotal} ₽
            </span>
          </div>

          {!hasEnoughBalance && currentUser && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              Недостаточно средств на балансе. Попросите администратора
              пополнить баланс.
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleSubmitOrder}
              disabled={
                isCreating ||
                (deliveryMethod === 'delivery' && !settings.deliveryEnabled) ||
                (deliveryMethod === 'delivery' && !deliveryAddress) ||
                !hasEnoughBalance
              }
              variant="primary"
              size="lg"
              className="w-full"
            >
              {isCreating
                ? 'Оформление...'
                : deliveryMethod === 'delivery' && !settings.deliveryEnabled
                  ? 'Доставка недоступна'
                  : deliveryMethod === 'delivery' && !deliveryAddress
                    ? 'Выберите адрес'
                    : 'Оформить заказ'}
            </Button>
            <Button
              onClick={handleClearCart}
              variant="outline"
              size="md"
              className="w-full"
            >
              Очистить корзину
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
