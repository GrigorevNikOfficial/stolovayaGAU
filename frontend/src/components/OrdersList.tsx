import React, { useEffect, useState } from 'react';
import { useUnit } from 'effector-react';
import {
  $displayedOrders,
  $isLoading,
  $isUpdating,
  updateOrderStatus,
  updateOrder,
  cancelOrder,
  refreshOrders,
  loadOrders,
} from '../models/orders';
import { $currentUser } from '../models/users';
import type { UpdateOrderRequest } from '../types/order';

export const OrdersList: React.FC = () => {
  const [
    orders,
    isLoading,
    isUpdating,
    currentUser,
    handleUpdateStatus,
    handleUpdateOrder,
    handleCancelOrder,
    handleRefreshOrders,
  ] = useUnit([
    $displayedOrders,
    $isLoading,
    $isUpdating,
    $currentUser,
    updateOrderStatus,
    updateOrder,
    cancelOrder,
    refreshOrders,
  ]);

  const [selectedStatuses, setSelectedStatuses] = useState<{
    [key: string]: string;
  }>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const isAdminOrStoreManager =
    currentUser?.role === 'admin' || currentUser?.role === 'storeManager';

  const handleLoadOrders = useUnit(loadOrders);

  // Загружаем заказы при монтировании компонента
  useEffect(() => {
    if (currentUser) {
      console.log('OrdersList: загружаем заказы для пользователя', currentUser.role);
      handleLoadOrders();
    }
  }, [currentUser, handleLoadOrders]);

  // Инициализируем selectedStatuses текущими статусами заказов
  useEffect(() => {
    const initialStatuses: { [key: string]: string } = {};
    orders.forEach(order => {
      initialStatuses[order._id] = order.status;
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
    created: 'bg-yellow-100 text-yellow-800',
    cooking: 'bg-orange-100 text-orange-800',
    waiting_delivery: 'bg-blue-100 text-blue-800',
    in_transit: 'bg-purple-100 text-purple-800',
    ready_for_pickup: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    // Старые статусы для обратной совместимости
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-green-100 text-green-800',
    delivering: 'bg-purple-100 text-purple-800',
    delivered: 'bg-gray-100 text-gray-800',
  };

  const statusLabels = {
    created: 'Создан',
    cooking: 'Готовится',
    waiting_delivery: 'Ждёт отправления',
    in_transit: 'В пути',
    ready_for_pickup: 'Готов к получению',
    completed: 'Завершён',
    cancelled: 'Отменен',
    // Старые статусы для обратной совместимости
    pending: 'Создан',
    confirmed: 'Создан',
    ready: 'Готов к получению',
    delivering: 'В пути',
    delivered: 'Завершён',
  };

  // Получить следующий доступный статус для canteenManager
  const getNextStatusForCanteenManager = (currentStatus: string) => {
    // Нормализуем старые статусы
    const normalizedStatus = currentStatus === 'pending' || currentStatus === 'confirmed' 
      ? 'created' 
      : currentStatus === 'delivering' 
        ? 'in_transit' 
        : currentStatus;
    
    const statusFlow = {
      'created': 'cooking',
      'cooking': 'waiting_delivery',
      'waiting_delivery': 'in_transit',
    };
    return statusFlow[normalizedStatus as keyof typeof statusFlow] || null;
  };

  // Получить доступные действия для заказа в зависимости от роли
  const getAvailableActions = (order: any) => {
    const actions: Array<{ label: string; status: string; color: string }> = [];
    const role = currentUser?.role;

    if (role === 'admin') {
      // Админ может менять на любой статус, но показываем только следующие доступные статусы
      if (order.status === 'created') {
        actions.push({ label: 'Готовится', status: 'cooking', color: 'bg-orange-600' });
      } else if (order.status === 'cooking') {
        actions.push({ label: 'Ждёт отправления', status: 'waiting_delivery', color: 'bg-blue-600' });
      } else if (order.status === 'waiting_delivery') {
        actions.push({ label: 'В пути', status: 'in_transit', color: 'bg-purple-600' });
      } else if (order.status === 'in_transit') {
        actions.push({ label: 'Готов к получению', status: 'ready_for_pickup', color: 'bg-green-600' });
      } else if (order.status === 'ready_for_pickup') {
        actions.push({ label: 'Завершён', status: 'completed', color: 'bg-gray-600' });
      }
      // Для админа также доступны все статусы через модальное окно редактирования
    } else if (role === 'canteenManager' || role === 'cateenManager') {
      // Администратор столовой может переходить: created -> cooking -> waiting_delivery -> in_transit
      // Нормализуем статус для обработки старых статусов
      const normalizedStatus = order.status === 'pending' || order.status === 'confirmed' 
        ? 'created' 
        : order.status === 'delivering' 
          ? 'in_transit' 
          : order.status;
      
      const nextStatus = getNextStatusForCanteenManager(normalizedStatus);
      if (nextStatus) {
        const labels: { [key: string]: string } = {
          'cooking': 'Приступить к приготовлению',
          'waiting_delivery': 'Готов, ждёт доставщика',
          'in_transit': 'Передать в доставку',
        };
        actions.push({
          label: labels[nextStatus] || nextStatus,
          status: nextStatus,
          color: 'bg-orange-600',
        });
      }
    } else if (role === 'storeManager') {
      // Администратор буфета может: in_transit -> ready_for_pickup -> completed
      // Нормализуем статус для обработки старых статусов
      const normalizedStatus = order.status === 'delivering' ? 'in_transit' : order.status;
      
      if (normalizedStatus === 'in_transit') {
        actions.push({
          label: 'Готов к получению',
          status: 'ready_for_pickup',
          color: 'bg-green-600',
        });
      } else if (normalizedStatus === 'ready_for_pickup' || order.status === 'ready') {
        actions.push({
          label: 'Выдать заказ',
          status: 'completed',
          color: 'bg-gray-600',
        });
      }
    }

    return actions;
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
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

  const handleCancel = (orderId: string) => {
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
          {currentUser?.role === 'admin' || 
           currentUser?.role === 'storeManager' || 
           currentUser?.role === 'canteenManager' || 
           currentUser?.role === 'cateenManager'
            ? 'Все заказы' 
            : 'Мои заказы'}
        </h3>
        <button
          onClick={handleRefreshOrders}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm transition-colors"
        >
          Обновить
        </button>
      </div>

      {orders.map(order => {
        const currentStatusLabel =
          statusLabels[order.status as keyof typeof statusLabels] ||
          order.status;
        const availableActions = getAvailableActions(order);
        const isCanteenManager = currentUser?.role === 'canteenManager' || currentUser?.role === 'cateenManager';

        return (
          <div
            key={order._id}
            className="bg-white shadow rounded-lg p-6 border"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Заказ #{order.order_number}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleString('ru-RU')}
                </p>
                {(currentUser?.role === 'admin' || currentUser?.role === 'storeManager') && (
                  <p className="text-sm text-gray-500">
                    Пользователь ID: {order.user_id}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Способ:{' '}
                  {order.delivery_method === 'delivery'
                    ? 'Доставка'
                    : order.delivery_method === 'dine_in'
                      ? 'В зале'
                      : 'Самовывоз'}
                </p>
                {order.table_number && (
                  <p className="text-sm text-gray-500">
                    Стол: {order.table_number}
                  </p>
                )}
                {order.delivery_address && (
                  <p className="text-sm text-gray-500">
                    Адрес: {order.delivery_address}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}
                >
                  {currentStatusLabel}
                </span>
                {/* Пользователь может отменить только заказы в статусе "Создан" */}
                {order.status === 'created' &&
                  currentUser?.role === 'user' && (
                    <button
                      onClick={() => handleCancel(order._id)}
                      className="text-red-600 hover:text-red-500 text-sm font-medium"
                    >
                      Отменить
                    </button>
                  )}
              </div>
            </div>

            {/* Список товаров в заказе */}
            {order.items && order.items.length > 0 && (
              <div className="border-t pt-4 mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Состав заказа:
                </h4>
                <ul className="space-y-1">
                  {order.items.map((orderItem: any, index: number) => (
                    <li key={index} className="flex justify-between text-sm">
                      <span>{orderItem.name || `Товар ${index + 1}`}</span>
                      <span>
                        {orderItem.quantity} × {orderItem.price} ₽
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <p className="text-lg font-bold text-gray-900">
                  Итого: {order.total_amount} ₽
                </p>

                <div className="flex flex-wrap gap-2 items-center">
                  {/* Кнопки действий в зависимости от роли */}
                  {availableActions.length > 0 && (
                    <>
                      {availableActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleStatusChange(order._id, action.status)}
                          disabled={isUpdating}
                          className={`${action.color} hover:opacity-90 disabled:opacity-50 text-white px-4 py-2 rounded text-sm transition-colors font-medium`}
                        >
                          {action.label}
                        </button>
                      ))}
                      {isUpdating && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      )}
                    </>
                  )}

                  {/* Кнопка редактирования только для admin (для редактирования других полей) */}
                  {currentUser?.role === 'admin' && order.status !== 'completed' && (
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowEditModal(true);
                      }}
                      disabled={isUpdating}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded text-sm transition-colors"
                    >
                      Редактировать
                    </button>
                  )}

                  {/* Кнопка отмены для admin */}
                  {currentUser?.role === 'admin' &&
                    order.status !== 'completed' &&
                    order.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancel(order._id)}
                        disabled={isUpdating}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded text-sm transition-colors"
                      >
                        Отменить
                      </button>
                    )}
                </div>
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

      {/* Модальное окно для редактирования заказа */}
      {showEditModal && selectedOrder && (
        <OrderEditModal
          order={selectedOrder}
          onClose={() => {
            setShowEditModal(false);
            setSelectedOrder(null);
          }}
          onSave={(data) => {
            handleUpdateOrder({ id: selectedOrder._id, ...data });
            setShowEditModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

// Компонент модального окна для редактирования заказа
const OrderEditModal: React.FC<{
  order: any;
  onClose: () => void;
  onSave: (data: UpdateOrderRequest) => void;
}> = ({ order, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    status: order.status,
    delivery_method: order.delivery_method,
    table_number: order.table_number || '',
    delivery_address: order.delivery_address || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: UpdateOrderRequest = {
      status: formData.status,
      delivery_method: formData.delivery_method,
    };

    if (formData.delivery_method === 'dine_in' && formData.table_number) {
      submitData.table_number = Number(formData.table_number);
    }

    if (formData.delivery_method === 'delivery' && formData.delivery_address) {
      submitData.delivery_address = formData.delivery_address;
    }

    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Редактировать заказ</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Статус
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="created">Создан</option>
              <option value="cooking">Готовится</option>
              <option value="waiting_delivery">Ждёт отправления</option>
              <option value="in_transit">В пути</option>
              <option value="ready_for_pickup">Готов к получению</option>
              <option value="completed">Завершён</option>
              <option value="cancelled">Отменен</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Способ получения
            </label>
            <select
              value={formData.delivery_method}
              onChange={(e) =>
                setFormData({ ...formData, delivery_method: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="pickup">Самовывоз</option>
              <option value="dine_in">В зале</option>
              <option value="delivery">Доставка</option>
            </select>
          </div>
          {formData.delivery_method === 'dine_in' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Номер стола
              </label>
              <input
                type="number"
                min="1"
                value={formData.table_number}
                onChange={(e) =>
                  setFormData({ ...formData, table_number: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}
          {formData.delivery_method === 'delivery' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Адрес доставки
              </label>
              <input
                type="text"
                value={formData.delivery_address}
                onChange={(e) =>
                  setFormData({ ...formData, delivery_address: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
