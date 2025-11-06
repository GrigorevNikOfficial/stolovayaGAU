import React, { useEffect } from 'react';
import { useUnit } from 'effector-react';
import {
  $displayedOrders,
  $isLoading,
  updateOrderStatus,
  cancelOrder,
  refreshOrders, // Добавляем refreshOrders
} from '../models/orders';
import { $currentUser } from '../models/users';

export const OrdersList: React.FC = () => {
  const [
    orders,
    isLoading,
    currentUser,
    handleUpdateStatus,
    handleCancelOrder,
    handleRefreshOrders, // Добавляем обработчик обновления
  ] = useUnit([
    $displayedOrders,
    $isLoading,
    $currentUser,
    updateOrderStatus,
    cancelOrder,
    refreshOrders,
  ]);

  // Автоматическое обновление каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefreshOrders();
    }, 30000); // 30 секунд

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
  };

  const statusLabels = {
    pending: 'Ожидание',
    confirmed: 'Подтвержден',
    cooking: 'Готовится',
    ready: 'Готов',
    delivering: 'В доставке',
    delivered: 'Доставлен',
    cancelled: 'Отменен',
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      pending: 'confirmed',
      confirmed: 'cooking',
      cooking: 'ready',
      ready: 'delivering',
      delivering: 'delivered',
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
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

      {orders.map(order => (
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
              {order.tracking_number && (
                <p className="text-sm text-gray-500">
                  Трек номер: {order.tracking_number}
                </p>
              )}
              {order.address && (
                <p className="text-sm text-gray-500">Адрес: {order.address}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}
              >
                {statusLabels[order.status]}
              </span>
              {order.status === 'pending' && (
                <button
                  onClick={() => handleCancelOrder(order.id)}
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
              {currentUser?.role === 'admin' &&
                order.status !== 'delivered' &&
                order.status !== 'cancelled' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        handleUpdateStatus({
                          id: order.id,
                          status: getNextStatus(order.status) as any,
                        })
                      }
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm transition-colors"
                    >
                      Следующий статус
                    </button>

                    {order.status !== 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
                      >
                        Отменить
                      </button>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      ))}

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
