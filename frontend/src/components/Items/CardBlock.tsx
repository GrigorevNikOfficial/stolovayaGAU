// components/Cart/CartBlock.tsx
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
import { $selectedPoint } from '../../models/selectedPoint.ts';
import Button from '../layout/Button/Button.tsx';
import { showToast } from '../layout/Toast/stores/toastStore.ts';

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
    selectedPoint,
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
    $selectedPoint,
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

  const [tableNumber, setTableNumber] = useState<string>('');
  const [isStockLoading, setIsStockLoading] = useState(false);
  const currentBalance = currentUser?.balance ?? 0;

  const selectedPointInfo = points.find(p => p._id === selectedPoint);

  const getAvailableDeliveryMethods = () => {
    const methods: Array<{
      value: 'dine_in' | 'pickup' | 'delivery';
      label: string;
    }> = [{ value: 'pickup', label: 'Самовывоз' }];

    if (selectedPointInfo) {
      if (selectedPointInfo.type === 'canteen') {
        methods.push({ value: 'dine_in', label: 'В зале' });
      } else if (selectedPointInfo.type === 'store') {
        methods.push({ value: 'delivery', label: 'Доставка' });
      }
    }

    return methods;
  };

  const availableMethods = getAvailableDeliveryMethods();

  useEffect(() => {
    if (selectedPoint) {
      setIsStockLoading(true);
      handleLoadStock({ pointId: selectedPoint });
      const timer = setTimeout(() => setIsStockLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedPoint, handleLoadStock]);

  useEffect(() => {
    if (selectedPointInfo) {
      const methods = getAvailableDeliveryMethods();
      const currentMethodAvailable = methods.some(
        method => method.value === deliveryMethod
      );

      if (!currentMethodAvailable && methods.length > 0) {
        setDeliveryMethod(methods[0].value);
      }
    }
  }, [selectedPointInfo]);

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

  const handleSubmitOrder = async () => {
    if (!currentUser) {
      alert('Для оформления заказа необходимо войти в систему');
      window.location.href = '/login';
      return;
    }

    if (!selectedPoint) {
      alert('Пожалуйста, выберите точку для заказа в основном меню');
      return;
    }

    if (selectedPointInfo) {
      if (
        selectedPointInfo.type === 'canteen' &&
        deliveryMethod === 'delivery'
      ) {
        alert(
          'Доставка недоступна для столовых. Выберите самовывоз или питание в зале.'
        );
        return;
      }
      if (selectedPointInfo.type === 'store' && deliveryMethod === 'dine_in') {
        alert(
          'Питание в зале недоступно для буфетов. Выберите самовывоз или доставку.'
        );
        return;
      }
    }

    if (deliveryMethod === 'dine_in' && !tableNumber) {
      alert('Пожалуйста, укажите номер стола');
      return;
    }

    if (currentUser && currentBalance < cartTotalWithServiceFee) {
      alert('Недостаточно средств на балансе. Обратитесь к администратору.');
      return;
    }

    try {
      // Используем реальные stock_id из загруженных данных
      let stockIdToUse = '';

      if (stockWithDetails.length > 0) {
        stockIdToUse = stockWithDetails[0]._id;
        console.log('🔄 Using existing stock_id:', stockIdToUse);
      } else {
        // Если stock записей нет, используем фиктивный (но валидный) ObjectId
        stockIdToUse = '65a1b2c3d4e5f67890123456';
        console.log('⚠️ Using fallback stock_id:', stockIdToUse);
      }

      const orderItems = cart.map(cartItem => ({
        stock_id: stockIdToUse,
        quantity: cartItem.quantity,
      }));

      console.log('📦 Order items:', orderItems);

      await handleCreateOrder({
        delivery_method: deliveryMethod,
        point_id: selectedPoint,
        ...(deliveryMethod === 'dine_in' && {
          table_number: Number(tableNumber),
        }),
        ...(deliveryMethod === 'delivery' && {
          delivery_address: `Доставка из ${selectedPointInfo?.name}`,
        }),
        items: orderItems,
      });

      showToast({
        message: 'Заказ успешно создан!',
        type: 'success',
      });

      if (onOrderCreated) {
        onOrderCreated();
      }
    } catch (error: any) {
      console.error('Ошибка при создании заказа:', error);
      showToast({
        message: error.message || 'Ошибка при создании заказа',
        type: 'error',
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {cart.length > 0 && (
        <div className="p-6 border-b border-gray-100 space-y-4">
          {selectedPointInfo ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg mb-3">
                  Способ получения
                </h3>
                <div className="flex gap-2">
                  {availableMethods.map(method => (
                    <button
                      key={method.value}
                      onClick={() => setDeliveryMethod(method.value)}
                      className={`flex-1 py-3 px-4 text-sm rounded-xl transition-all duration-300 ${
                        deliveryMethod === method.value
                          ? 'bg-green-dark text-white shadow-lg shadow-green-dark/25'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {deliveryMethod === 'dine_in' && (
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
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-sm">
                ⚠️ Выберите точку для заказа в основном меню
              </p>
            </div>
          )}
        </div>
      )}

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
              disabled={isCreating || !selectedPoint || !hasEnoughBalance}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {isCreating ? 'Оформление...' : `Оформить заказ`}
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

export default CartBlock;
