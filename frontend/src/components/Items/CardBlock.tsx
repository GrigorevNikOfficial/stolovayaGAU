import { useUnit } from 'effector-react';
import React, { useEffect, useState } from 'react';
import {
  $cart,
  $cartTotal,
  $cartPreparationTime,
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
import Button from '../layout/Button/Button.tsx';
import Select from '../layout/Select/Select.tsx';

const formatCurrency = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(2);

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

  const [settings, handleFetchSettings] = useUnit([
    $deliverySettings,
    fetchDeliverySettings,
  ]);

  const [cartPreparationTime] = useUnit([$cartPreparationTime]);
  const [selectedReadyTimeIso, setSelectedReadyTimeIso] = useState<string | null>(null);
  const [readyTimeOptions, setReadyTimeOptions] = useState<Array<{ label: string; iso: string }>>([]);

  const roundUpToInterval = (date: Date, intervalMinutes: number) => {
    const ms = 1000 * 60 * intervalMinutes;
    return new Date(Math.ceil(date.getTime() / ms) * ms);
  };

  const formatHM = (date: Date) =>
    `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  const generateReadyTimeOptions = (start: Date, hours = 4, interval = 15) => {
    const opts: Array<{ label: string; iso: string }> = [];
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
    let cur = new Date(start);
    while (cur <= end) {
      opts.push({ label: formatHM(cur), iso: cur.toISOString() });
      cur = new Date(cur.getTime() + interval * 60 * 1000);
    }
    return opts;
  };

  // compute default ready time options when cartPreparationTime or deliveryMethod changes
  useEffect(() => {
    if (!(deliveryMethod === 'pickup' || deliveryMethod === 'dine_in')) return;

    const now = new Date();
    const minimal = Math.max(10, (cartPreparationTime || 0) + 5); // минимум 10 минут, плюс буфер 5 минут
    const roundedStart = roundUpToInterval(new Date(now.getTime() + minimal * 60 * 1000), 5);
    const opts = generateReadyTimeOptions(roundedStart, 6, 15); // next 6 hours
    setReadyTimeOptions(opts);
    if (opts.length > 0) setSelectedReadyTimeIso(opts[0].iso);
  }, [cartPreparationTime, deliveryMethod]);

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const currentBalance = currentUser?.balance ?? 0;

  const deliveryAddressOptions = [
    { value: 'эк', label: 'Экономический корпус' },
    { value: 'гл', label: 'Главный корпус' },
  ];

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
  const serviceFeeLabel =
    serviceFeeType === 'percent'
      ? `${serviceFeeValue}%`
      : `${formatCurrency(serviceFeeValue)} ₽`;

  useEffect(() => {
    handleFetchSettings();
  }, [handleFetchSettings]);

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

  const handleQuantityInputChange = (
    itemId: string,
    value: string,
    fallbackQuantity: number
  ) => {
    if (value === '') {
      return;
    }
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return;
    }
    const normalized = Math.max(1, Math.floor(parsed));
    if (normalized === fallbackQuantity) {
      return;
    }
    handleUpdateQuantity({ id: itemId, quantity: normalized });
  };

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

    if (currentUser && currentBalance < cartTotalWithServiceFee) {
      alert('Недостаточно средств на балансе. Обратитесь к администратору.');
      return;
    }

    try {
      if (
        (deliveryMethod === 'pickup' || deliveryMethod === 'dine_in') &&
        !selectedReadyTimeIso
      ) {
        alert('Пожалуйста, выберите время, к которому нужно приготовить заказ.');
        return;
      }

      const payload: any = {
        delivery_method: deliveryMethod,
        ...(deliveryMethod === 'dine_in' && { table_number: 1 }),
        ...(deliveryMethod === 'delivery' && {
          delivery_address: deliveryAddress,
        }),
      };

      if (deliveryMethod === 'pickup' || deliveryMethod === 'dine_in') {
        if (selectedReadyTimeIso) {
          payload.ready_time = selectedReadyTimeIso;
        }
      }

      await handleCreateOrder(payload);

      // После успешного создания заказа вызываем callback
      if (onOrderCreated) {
        onOrderCreated();
      }
    } catch (error) {
      console.error('Ошибка при создании заказа:', error);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Выбор способа получения */}
      {cart.length > 0 && (
        <div className="p-6 border-b border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">
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
              {pickupAvailability.available ? 'Забрать с собой' : '✕'}
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
              {dineInAvailability.available ? 'В столовой' : '✕'}
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
              {deliveryAvailability.available ? 'В буфете' : '✕'}
            </button>
          </div>

          {/* Сообщения о времени работы */}
          {!pickupAvailability.available && deliveryMethod === 'pickup' && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                ⏰ {pickupAvailability.message}
              </p>
            </div>
          )}
          {!dineInAvailability.available && deliveryMethod === 'dine_in' && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                ⏰ {dineInAvailability.message}
              </p>
            </div>
          )}
          {!deliveryAvailability.available && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                ⏰ {deliveryAvailability.message}
              </p>
            </div>
          )}
          {deliveryMethod === 'delivery' && settings.deliveryEnabled && deliveryAvailability.available && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-darker">
              ⏰ Доставка активна с {settings.deliveryTimeStart || '00:00'} до {settings.deliveryTimeEnd || '23:59'}
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

          {/* Время готовности для самовывоза/в зале */}
          {(deliveryMethod === 'pickup' || deliveryMethod === 'dine_in') && (
            <div className="p-6 border-b border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Время готовности
              </label>
              {readyTimeOptions.length > 0 ? (
                <Select
                  options={readyTimeOptions.map(o => ({ value: o.iso, label: o.label }))}
                  value={selectedReadyTimeIso ?? ''}
                  onChange={val => setSelectedReadyTimeIso(val)}
                  placeholder="Выберите время"
                />
              ) : (
                <p className="text-sm text-gray-500">Загрузка вариантов времени...</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Минимальное время: {readyTimeOptions[0]?.label ?? '-'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Список товаров */}
      <div className="p-6">
        {/* Баланс перенесен в заголовок модального окна */}

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
                        quantity <= 1
                          ? handleRemoveFromCart(item._id)
                          : handleUpdateQuantity({
                              id: item._id,
                              quantity: quantity - 1,
                            })
                      }
                      className="w-8 h-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all duration-300 hover:border-gray-400 text-sm font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={e =>
                        handleQuantityInputChange(
                          item._id,
                          e.target.value,
                          quantity
                        )
                      }
                      className="w-16 text-center border border-gray-300 rounded-lg py-1 px-2 focus:outline-none focus:ring-2 focus:ring-green-dark/40 focus:border-green-dark"
                    />
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
                <span>Сервисный сбор ({serviceFeeLabel})</span>
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
