import React, { useEffect, useState } from 'react';
import { useUnit } from 'effector-react';
import {
  $displayedOrders,
  $isLoading,
  $isUpdating,
  updateOrderStatus,
  cancelOrder,
  refreshOrders,
} from '../models/orders';
import { $currentUser } from '../models/users';

export const OrdersList: React.FC = () => {
  const [
    orders,
    isLoading,
    isUpdating,
    currentUser,
    handleUpdateStatus,
    handleCancelOrder,
    handleRefreshOrders,
  ] = useUnit([
    $displayedOrders,
    $isLoading,
    $isUpdating,
    $currentUser,
    updateOrderStatus,
    cancelOrder,
    refreshOrders,
  ]);

  const [selectedStatuses, setSelectedStatuses] = useState<{
    [key: number]: string;
  }>({});

  // Инициализируем selectedStatuses текущими статусами заказов
  useEffect(() => {
    const initialStatuses: { [key: number]: string } = {};
    orders.forEach(order => {
      initialStatuses[order.id] = order.status;
    });
    setSelectedStatuses(initialStatuses);
  }, [orders]);

  // Автоматическое обновление каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefreshOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, [handleRefreshOrders]);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    cooking: 'bg-orange-100 text-orange-800',
    ready: 'bg-green-100 text-green-800',
    delivering: 'bg-purple-100 text-purple-800',
    delivered: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
  };

  const statusLabels = {
    pending: 'Создан',
    confirmed: 'Принят',
    cooking: 'Готовится',
    ready: 'Готов',
    delivering: 'В доставке',
    delivered: 'Доставлен',
    cancelled: 'Отменен',
    completed: 'Завершен',
  };

  // Получить доступные статусы в зависимости от типа доставки
  const getAvailableStatuses = (order: any) => {
    const allStatuses = [
      { value: 'pending', label: 'Создан' },
      { value: 'confirmed', label: 'Принят' },
      { value: 'cooking', label: 'Готовится' },
      { value: 'ready', label: 'Готов' },
      { value: 'delivering', label: 'В доставке' },
      { value: 'delivered', label: 'Доставлен' },
      { value: 'completed', label: 'Завершен' },
      { value: 'cancelled', label: 'Отменен' },
    ];

    // Фильтруем статусы в зависимости от типа доставки
    if (order.delivery_method === 'delivery') {
      // Для доставки убираем 'completed'
      return allStatuses.filter(status => status.value !== 'completed');
    } else {
      // Для самовывоза убираем 'delivering' и 'delivered'
      return allStatuses.filter(
        status => status.value !== 'delivering' && status.value !== 'delivered'
      );
    }
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    console.log(`Changing order ${orderId} status to:`, newStatus);

    // Сразу обновляем локальное состояние
    setSelectedStatuses(prev => ({
      ...prev,
      [orderId]: newStatus,
    }));

    // Отправляем запрос на сервер
    handleUpdateStatus({
      id: orderId,
      status: newStatus as any,
    });
  };

  const handleCancel = (orderId: number) => {
    console.log(`Cancelling order:`, orderId);
    handleCancelOrder(orderId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Кнопка ручного обновления */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {currentUser?.role === 'admin' ? 'Все заказы' : 'Мои заказы'}
        </h3>
        <button
          onClick={handleRefreshOrders}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm transition-colors"
        >
          Обновить
        </button>
      </div>

      {orders.map(order => {
        const availableStatuses = getAvailableStatuses(order);
        const currentStatusLabel = statusLabels[order.status];

        return (
          <div key={order.id} className="bg-white shadow rounded-lg p-6 border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Заказ #{order.order_number}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleString('ru-RU')}
                </p>
                {currentUser?.role === 'admin' && (
                  <p className="text-sm text-gray-500">
                    Пользователь ID: {order.user_id}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Способ:{' '}
                  {order.delivery_method === 'delivery'
                    ? 'Доставка'
                    : 'Самовывоз'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}
                >
                  {currentStatusLabel}
                </span>
                {/* Пользователь может отменить только заказы в статусе "Создан" */}
                {order.status === 'pending' &&
                  currentUser?.role !== 'admin' && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      className="text-red-600 hover:text-red-500 text-sm font-medium"
                    >
                      Отменить
                    </button>
                  )}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-bold text-gray-900">
                  Итого: {order.total_amount} ₽
                </p>

                {/* Кнопки для админов */}
                {currentUser?.role === 'admin' && (
                  <div className="flex space-x-4 items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Статус:</span>
                      <select
                        value={selectedStatuses[order.id] || order.status}
                        onChange={e =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        disabled={isUpdating}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                      >
                        {availableStatuses.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      {isUpdating && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      )}
                    </div>

                    {/* Админ может отменить заказ в любом статусе кроме завершенных */}
                    {order.status !== 'completed' &&
                      order.status !== 'delivered' &&
                      order.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          disabled={isUpdating}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded text-sm transition-colors"
                        >
                          Отменить
                        </button>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {orders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <p className="text-gray-500 text-lg">Заказы не найдены</p>
          <p className="text-gray-400 text-sm mt-2">
            {currentUser?.role === 'admin'
              ? 'Нет заказов в системе'
              : 'У вас еще нет заказов'}
          </p>
        </div>
      )}
    </div>
  );
};
