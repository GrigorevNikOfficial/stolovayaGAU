import { useUnit } from 'effector-react';
import React, { useEffect, useState } from 'react';
import {
  $cart,
  $cartTotal,
  clearCart,
  createOrderFromCart,
  removeFromCart,
  updateCartItemQuantity,
} from '../../models/cart.ts';
import { $isCreating } from '../../models/orders.ts';
import {
  $deliverySettings,
  fetchDeliverySettings,
} from '../../models/settings.ts';
import { $currentUser } from '../../models/users.ts';
import { $points, loadPoints } from '../../models/points.ts';
import { $stockWithDetails, loadStockWithDetails } from '../../models/stock.ts';
import type { Point } from '../../types/points.ts';
import type { StockWithDetails } from '../../types/stock.ts';
import Button from '../layout/Button/Button.tsx';
import Select from '../layout/Select/Select.tsx';

const formatCurrency = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(2);

interface CartBlockProps {
  onOrderCreated?: () => void;
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
    points,
    stockWithDetails,
    handleRemoveFromCart,
    handleUpdateQuantity,
    handleClearCart,
    handleCreateOrder,
    handleLoadPoints,
    handleLoadStock,
  ] = useUnit([
    $cart,
    $cartTotal,
    $currentUser,
    $isCreating,
    $points,
    $stockWithDetails,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    createOrderFromCart,
    loadPoints,
    loadStockWithDetails,
  ]);

  const [settings, handleFetchSettings] = useUnit([
    $deliverySettings,
    fetchDeliverySettings,
  ]);

  const [selectedPoint, setSelectedPoint] = useState<string>('');
  const [tableNumber, setTableNumber] = useState<string>('');
  const currentBalance = currentUser?.balance ?? 0;

  // Фильтруем точки по типу доставки
  const availablePoints = points.filter(point => {
    if (deliveryMethod === 'delivery') {
      return point.type === 'store' && point.isActive;
    } else if (deliveryMethod === 'dine_in') {
      return point.type === 'canteen' && point.isActive;
    }
    return point.isActive; // для pickup доступны все точки
  });

  const serviceFeeValue = Number(settings.serviceFeeValue) || 0;
  const serviceFeeType = settings.serviceFeeType || 'percent';
  const shouldApplyServiceFee = cart.length > 0 && serviceFeeValue > 0;
  const rawServiceFeeAmount = shouldApplyServiceFee
    ? serviceFeeType === 'percent'
      ? (cartTotal * serviceFeeValue) / 100
      : serviceFeeValue
    : 0;
  const serviceFeeAmount = Math.round(rawServiceFeeAmount * 100) / 100;
  const cartTotalWithServiceFee =
    Math.round((cartTotal + serviceFeeAmount) * 100) / 100;
  const hasEnoughBalance = currentUser
    ? currentBalance >= cartTotalWithServiceFee
    : true;
  const remainingBalance =
    Math.round((currentBalance - cartTotalWithServiceFee) * 100) / 100;

  useEffect(() => {
    handleFetchSettings();
    handleLoadPoints();
  }, [handleFetchSettings, handleLoadPoints]);

  // Загружаем stock при выборе точки
  useEffect(() => {
    if (selectedPoint) {
      handleLoadStock({ pointId: selectedPoint });
    }
  }, [selectedPoint, handleLoadStock]);

  // Сбрасываем выбранную точку при смене метода доставки
  useEffect(() => {
    setSelectedPoint('');
    setTableNumber('');
  }, [deliveryMethod]);

  // Проверка доступности товаров в корзине для выбранной точки
  const getCartAvailability = () => {
    if (!selectedPoint) return { allAvailable: true, unavailableItems: [] };

    const unavailableItems = cart.filter(cartItem => {
      const stock = stockWithDetails.find(
        s => s.pointId === selectedPoint && s.productId === cartItem.item._id
      );
      return !stock || stock.available < cartItem.quantity;
    });

    return {
      allAvailable: unavailableItems.length === 0,
      unavailableItems,
    };
  };

  const { allAvailable, unavailableItems } = getCartAvailability();

  // Проверка доступности методов получения по времени
  const checkTimeAvailability = (
    method: 'delivery' | 'pickup' | 'dine_in'
  ): { available: boolean; message: string } => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (method === 'delivery') {
      if (!settings.deliveryEnabled) {
        return { available: false, message: 'Доставка временно недоступна' };
      }
      const start = settings.deliveryTimeStart || '00:00';
      const end = settings.deliveryTimeEnd || '23:59';
      if (currentTime < start || currentTime > end) {
        return { available: false, message: `Доставка с ${start} до ${end}` };
      }
    } else if (method === 'pickup') {
      const start = settings.pickupTimeStart || '00:00';
      const end = settings.pickupTimeEnd || '23:59';
      if (currentTime < start || currentTime > end) {
        return { available: false, message: `Самовывоз с ${start} до ${end}` };
      }
    } else if (method === 'dine_in') {
      const start = settings.dineInTimeStart || '00:00';
      const end = settings.dineInTimeEnd || '23:59';
      if (currentTime < start || currentTime > end) {
        return {
          available: false,
          message: `Зал работает с ${start} до ${end}`,
        };
      }
    }

    return { available: true, message: '' };
  };

  const deliveryAvailability = checkTimeAvailability('delivery');
  const pickupAvailability = checkTimeAvailability('pickup');
  const dineInAvailability = checkTimeAvailability('dine_in');

  const handleSubmitOrder = async () => {
    if (!currentUser) {
      alert('Для оформления заказа необходимо войти в систему');
      window.location.href = '/login';
      return;
    }

    // Валидация
    if (!selectedPoint) {
      alert('Пожалуйста, выберите точку для заказа');
      return;
    }

    if (deliveryMethod === 'dine_in' && !tableNumber) {
      alert('Пожалуйста, укажите номер стола');
      return;
    }

    if (!allAvailable) {
      alert(
        'Некоторые товары в корзине недоступны в выбранной точке. Пожалуйста, обновите корзину.'
      );
      return;
    }

    if (currentUser && currentBalance < cartTotalWithServiceFee) {
      alert('Недостаточно средств на балансе. Обратитесь к администратору.');
      return;
    }

    try {
      // Подготавливаем items с stock_id
      const orderItems = cart.map(cartItem => {
        const stock = stockWithDetails.find(
          s => s.pointId === selectedPoint && s.productId === cartItem.item._id
        );
        return {
          stock_id: stock?._id || '', // Используем stock_id
          quantity: cartItem.quantity,
        };
      });

      await handleCreateOrder({
        delivery_method: deliveryMethod,
        point_id: selectedPoint, // Добавляем ID точки
        ...(deliveryMethod === 'dine_in' && {
          table_number: Number(tableNumber),
        }),
        ...(deliveryMethod === 'delivery' && {
          delivery_address: 'доставка в точку', // Можно уточнить адрес если нужно
        }),
        items: orderItems,
      });

      if (onOrderCreated) {
        onOrderCreated();
      }
    } catch (error) {
      console.error('Ошибка при создании заказа:', error);
    }
  };

  // Получаем информацию о выбранной точке
  const getSelectedPointInfo = () => {
    return availablePoints.find(point => point._id === selectedPoint);
  };

  const selectedPointInfo = getSelectedPointInfo();

  return (
    <div className="h-full flex flex-col">
      {/* Выбор способа получения */}
      {cart.length > 0 && (
        <div className="p-6 border-b border-gray-100 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Способ получения
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => setDeliveryMethod('pickup')}
              disabled={!pickupAvailability.available}
              className={`flex-1 py-3 px-4 text-sm rounded-xl transition-all duration-300 ${
                deliveryMethod === 'pickup'
                  ? 'bg-green-dark text-white shadow-lg shadow-green-dark/25'
                  : pickupAvailability.available
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {pickupAvailability.available ? 'Самовывоз' : '✕'}
            </button>

            <button
              onClick={() => setDeliveryMethod('dine_in')}
              disabled={!dineInAvailability.available}
              className={`flex-1 py-3 px-4 text-sm rounded-xl transition-all duration-300 ${
                deliveryMethod === 'dine_in'
                  ? 'bg-green-dark text-white shadow-lg shadow-green-dark/25'
                  : dineInAvailability.available
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {dineInAvailability.available ? 'В зале' : '✕'}
            </button>

            <button
              onClick={() => setDeliveryMethod('delivery')}
              disabled={!deliveryAvailability.available}
              className={`flex-1 py-3 px-4 text-sm rounded-xl transition-all duration-300 ${
                deliveryMethod === 'delivery'
                  ? 'bg-green-dark text-white shadow-lg shadow-green-dark/25'
                  : deliveryAvailability.available
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {deliveryAvailability.available ? 'Доставка' : '✕'}
            </button>
          </div>

          {/* Выбор точки */}
          {availablePoints.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {deliveryMethod === 'dine_in'
                  ? 'Выберите столовую'
                  : deliveryMethod === 'delivery'
                    ? 'Выберите буфет'
                    : 'Выберите точку получения'}
              </label>
              <Select
                options={[
                  {
                    value: '',
                    label: `Выберите ${deliveryMethod === 'dine_in' ? 'столовую' : deliveryMethod === 'delivery' ? 'буфет' : 'точку'}`,
                    disabled: true,
                  },
                  ...availablePoints.map(point => ({
                    value: point._id,
                    label: `${point.name} (${point.location})`,
                  })),
                ]}
                value={selectedPoint}
                onChange={setSelectedPoint}
                required={true}
              />
            </div>
          )}

          {/* Номер стола для dine_in */}
          {deliveryMethod === 'dine_in' && selectedPoint && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Номер стола
              </label>
              <input
                type="number"
                min="1"
                value={tableNumber}
                onChange={e => setTableNumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-medium focus:border-transparent"
                placeholder="Введите номер стола"
                required
              />
            </div>
          )}

          {/* Информация о выбранной точке */}
          {selectedPointInfo && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                📍 {selectedPointInfo.name} • {selectedPointInfo.location}
                {deliveryMethod === 'dine_in' &&
                  tableNumber &&
                  ` • Стол №${tableNumber}`}
              </p>
            </div>
          )}

          {/* Предупреждение о недоступных товарах */}
          {selectedPoint && !allAvailable && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700 font-semibold mb-2">
                ❌ Некоторые товары недоступны в выбранной точке:
              </p>
              {unavailableItems.map(item => (
                <p key={item.item._id} className="text-xs text-red-600">
                  • {item.item.name} (нужно: {item.quantity}, доступно:{' '}
                  {stockWithDetails.find(
                    s =>
                      s.pointId === selectedPoint &&
                      s.productId === item.item._id
                  )?.available || 0}
                  )
                </p>
              ))}
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
                {formatCurrency(currentBalance)} ₽
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
                {formatCurrency(Math.max(remainingBalance, 0))} ₽
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
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Сумма товаров</span>
              <span>{formatCurrency(cartTotal)} ₽</span>
            </div>
            {serviceFeeAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Сервисный сбор</span>
                <span>{formatCurrency(serviceFeeAmount)} ₽</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">
                Итого:
              </span>
              <span className="text-2xl font-bold text-green-dark">
                {formatCurrency(cartTotalWithServiceFee)} ₽
              </span>
            </div>
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
                (deliveryMethod === 'delivery' &&
                  !deliveryAvailability.available) ||
                (deliveryMethod === 'delivery' && !selectedPoint) ||
                !hasEnoughBalance
              }
              variant="primary"
              size="lg"
              className="w-full"
            >
              {isCreating
                ? 'Оформление...'
                : deliveryMethod === 'delivery' &&
                    !deliveryAvailability.available
                  ? 'Доставка недоступна'
                  : deliveryMethod === 'delivery' && !selectedPoint
                    ? 'Выберите буфет'
                    : `Оформить заказ ${deliveryMethod === 'delivery' ? `в ${getSelectedStoreName()}` : ''}`}
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
