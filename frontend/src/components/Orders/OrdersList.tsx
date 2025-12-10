import { useUnit } from 'effector-react';
import React, { useEffect, useState } from 'react';
import {
    $displayedOrders,
    $isUpdating,
    $ordersIsLoading,
    cancelOrder,
    loadOrders,
    refreshOrders,
    updateOrder,
    updateOrderStatus,
} from '../../models/orders.ts';
import { $currentUser } from '../../models/users.ts';
import type { UpdateOrderRequest } from '../../types/order.ts';
import Button from '../layout/Button/Button.tsx';
import Input from '../layout/Input/Input.tsx';
import StatusBadge from '../Settings/StatusBadge.tsx';
import {
  CalendarIcon,
  ClockIcon,
  DocumentIcon,
  ForkKnifeIcon,
  LocationIcon,
  PenIcon,
  TruckIcon,
} from '../icons/ServiceIcons';

export const OrdersList: React.FC = () => {
  console.log('OrdersList: компонент рендерится');

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
    $ordersIsLoading,
    $isUpdating,
    $currentUser,
    updateOrderStatus,
    updateOrder,
    cancelOrder,
    refreshOrders,
  ]);

  const [_selectedStatuses, setSelectedStatuses] = useState<{
    [key: string]: string;
  }>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const handleLoadOrders = useUnit(loadOrders);

  // Загружаем заказы при монтировании компонента
  useEffect(() => {
    if (currentUser) {
      console.log(
        'OrdersList: загружаем заказы для пользователя',
        currentUser.role,
        currentUser
      );
      handleLoadOrders();
    }
  }, [currentUser, handleLoadOrders]);

  // Логируем состояние заказов
  useEffect(() => {
    console.log('OrdersList: orders =', orders);
    console.log('OrdersList: orders.length =', orders.length);
    console.log('OrdersList: isLoading =', isLoading);
  }, [orders, isLoading]);

  // Инициализируем selectedStatuses текущими статусами заказов
  useEffect(() => {
    const initialStatuses: { [key: string]: string } = {};
    orders.forEach((order: any) => {
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

  // Получить следующий доступный статус для canteenManager
  const getNextStatusForCanteenManager = (currentStatus: string) => {
    const statusFlow: { [key: string]: string } = {
      created: 'cooking',
      cooking: 'waiting_delivery',
      waiting_delivery: 'in_transit',
    };
    return statusFlow[currentStatus] || null;
  };

  // Получить доступные действия для заказа в зависимости от роли
  const getAvailableActions = (order: any) => {
    const actions: Array<{ label: string; status: string; color: string }> = [];
    const role = currentUser?.role;

    if (role === 'admin') {
      if (order.status === 'created') {
        actions.push({
          label: 'Готовится',
          status: 'cooking',
          color: 'orange',
        });
      } else if (order.status === 'cooking') {
        actions.push({
          label: 'Ждёт отправления',
          status: 'waiting_delivery',
          color: 'blue',
        });
      } else if (order.status === 'waiting_delivery') {
        actions.push({
          label: 'В пути',
          status: 'in_transit',
          color: 'purple',
        });
      } else if (order.status === 'in_transit') {
        actions.push({
          label: 'Готов к получению',
          status: 'ready_for_pickup',
          color: 'green',
        });
      } else if (order.status === 'ready_for_pickup') {
        actions.push({
          label: 'Завершён',
          status: 'completed',
          color: 'gray',
        });
      }
    } else if (role === 'canteenManager' || role === 'cateenManager') {
      const normalizedStatus =
        order.status === 'pending' || order.status === 'confirmed'
          ? 'created'
          : order.status === 'delivering'
            ? 'in_transit'
            : order.status;

      const nextStatus = getNextStatusForCanteenManager(normalizedStatus);
      if (nextStatus) {
        const labels: { [key: string]: string } = {
          cooking: 'Приступить к приготовлению',
          waiting_delivery: 'Готов, ждёт доставщика',
          in_transit: 'Передать в доставку',
        };
        const colors: { [key: string]: string } = {
          cooking: 'orange',
          waiting_delivery: 'blue',
          in_transit: 'purple',
        };
        actions.push({
          label: labels[nextStatus] || nextStatus,
          status: nextStatus,
          color: colors[nextStatus] || 'primary',
        });
      }
    } else if (role === 'storeManager') {
      const normalizedStatus =
        order.status === 'delivering' ? 'in_transit' : order.status;

      if (normalizedStatus === 'in_transit') {
        actions.push({
          label: 'Готов к получению',
          status: 'ready_for_pickup',
          color: 'green',
        });
      } else if (
        normalizedStatus === 'ready_for_pickup' ||
        order.status === 'ready'
      ) {
        actions.push({
          label: 'Выдать заказ',
          status: 'completed',
          color: 'gray',
        });
      }
    }

    return actions;
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    console.log(`Changing order ${orderId} status to:`, newStatus);
    setSelectedStatuses(prev => ({ ...prev, [orderId]: newStatus }));
    handleUpdateStatus({ id: orderId, status: newStatus as any });
  };

  const handleCancel = (orderId: string) => {
    console.log(`Cancelling order:`, orderId);
    handleCancelOrder(orderId);
  };

  const staffRoles = ['admin', 'storeManager', 'canteenManager', 'cateenManager'];
  const isStaffUser = currentUser ? staffRoles.includes(currentUser.role) : false;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-dark"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-text-primary">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            {currentUser?.role === 'admin' ||
            currentUser?.role === 'storeManager' ||
            currentUser?.role === 'canteenManager' ||
            currentUser?.role === 'cateenManager'
              ? 'Все заказы'
              : 'Мои заказы'}
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            {orders.length} заказ(ов)
          </p>
        </div>
        {/* ЗЕЛЕНАЯ кнопка Обновить */}
        <Button
          onClick={handleRefreshOrders}
          variant="primary"
          size="md"
          className="flex items-center gap-2"
        >
          <span>🔄</span>
          <span>Обновить</span>
        </Button>
      </div>

      {orders.map((order: any) => {
        const readyTime = order.ready_time ? new Date(order.ready_time) : null;
        const isOrderOverdue =
          isStaffUser &&
          readyTime !== null &&
          new Date() > readyTime &&
          order.status !== 'completed' &&
          order.status !== 'cancelled';
        const readyTimeLabel = readyTime
          ? readyTime.toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : null;

        const availableActions = getAvailableActions(order);
        const serviceFeeLabel =
          order.service_fee_type === 'percent'
            ? ` (${order.service_fee_value ?? 0}%)`
            : order.service_fee_type === 'fixed'
              ? ` (${order.service_fee_value ?? order.service_fee} баллов)`
              : '';

        const cardBorderClass = isOrderOverdue
          ? 'border-red-200'
          : isStaffUser && readyTime
            ? 'border-emerald-200'
            : 'border-border-soft';

        return (
          <div
            key={order._id}
            className={`bg-white rounded-3xl shadow-brand-card p-6 border ${cardBorderClass} transition-all duration-300 hover:-translate-y-0.5`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-text-primary">
                    Заказ #{order.order_number}
                  </h3>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {new Date(order.created_at).toLocaleString('ru-RU')}
                  </span>
                  <span className="flex items-center gap-1">
                    <TruckIcon className="w-4 h-4" />
                    {order.delivery_method === 'delivery'
                      ? 'Доставка'
                      : order.delivery_method === 'dine_in'
                        ? 'В зале'
                        : 'Самовывоз'}
                  </span>
                  {order.table_number && (
                    <span className="flex items-center gap-1">
                      <ForkKnifeIcon className="w-4 h-4" /> Стол: {order.table_number}
                    </span>
                  )}
                </div>
                {(currentUser?.role === 'admin' ||
                  currentUser?.role === 'storeManager') && (
                  <p className="text-xs text-text-muted">
                    Пользователь ID: {order.user_id}
                  </p>
                )}
                {order.delivery_address && (
                  <p className="text-sm text-text-secondary flex items-center gap-2">
                    <LocationIcon className="w-4 h-4" />
                    Адрес: {order.delivery_address}
                  </p>
                )}
                {isStaffUser && readyTimeLabel && (
                  <p
                    className={`text-sm font-semibold flex items-center gap-2 ${isOrderOverdue ? 'text-red-500' : 'text-emerald-600'}`}
                  >
                    <ClockIcon className="w-4 h-4" />
                    Готовность: {readyTimeLabel}
                    {isOrderOverdue && <span className="text-xs">(не успеваем)</span>}
                  </p>
                )}
              </div>

              {order.status === 'created' && currentUser?.role === 'user' && (
                <Button
                  onClick={() => handleCancel(order._id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Отменить
                </Button>
              )}
            </div>

            {(order as any).items && (order as any).items.length > 0 && (
              <div className="border-t border-border-subtle pt-4 mb-4">
                <h4 className="text-sm font-semibold text-text-primary mb-3">
                  Состав заказа:
                </h4>
                <ul className="space-y-2">
                  {(order as any).items.map((orderItem: any, index: number) => (
                    <li
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-text-primary">
                          {orderItem.name || `Товар ${index + 1}`}
                        </span>
                        {orderItem.description && (
                          <p className="text-text-muted text-xs mt-1">
                            {orderItem.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-text-primary">
                          {orderItem.quantity} × {orderItem.price} баллов
                        </span>
                        <p className="text-brand-indigo font-bold">
                          {orderItem.quantity * orderItem.price} баллов
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t border-border-subtle pt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  {typeof order.items_total === 'number' && (
                    <p className="text-sm text-text-secondary">
                      Сумма товаров: {order.items_total} баллов
                    </p>
                  )}
                  {order.service_fee && order.service_fee > 0 && (
                    <p className="text-sm text-text-secondary">
                      Сервисный сбор{serviceFeeLabel}: {order.service_fee} баллов
                    </p>
                  )}
                  <p className="text-xl font-bold text-brand-indigo">
                    Итого: {order.total_amount} баллов
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {availableActions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {availableActions.map((action, index) => (
                        <Button
                          key={index}
                          onClick={() =>
                            handleStatusChange(order._id, action.status)
                          }
                          disabled={isUpdating}
                          className={`
                            ${action.color === 'orange' ? 'bg-orange-500 hover:bg-orange-600 border-orange-500 text-white' : ''}
                            ${action.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600 border-blue-500 text-white' : ''}
                            ${action.color === 'purple' ? 'bg-purple-500 hover:bg-purple-600 border-purple-500 text-white' : ''}
                            ${action.color === 'green' ? 'bg-green-500 hover:bg-green-600 border-green-500 text-white' : ''}
                            ${action.color === 'gray' ? 'bg-gray-500 hover:bg-gray-600 border-gray-500 text-white' : ''}
                          `}
                          size="sm"
                        >
                          {action.label}
                        </Button>
                      ))}
                      {isUpdating && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-dark"></div>
                      )}
                    </div>
                  )}
                  {currentUser?.role === 'admin' && (
                    <div className="flex gap-2">
                      {order.status !== 'completed' && (
                        <Button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowEditModal(true);
                          }}
                          disabled={isUpdating}
                          variant="outline"
                          size="sm"
                        >
                          <span className="flex items-center gap-2">
                            <PenIcon className="w-4 h-4" />
                            Редактировать
                          </span>
                        </Button>
                      )}
                      {order.status !== 'completed' &&
                        order.status !== 'cancelled' && (
                          <Button
                            onClick={() => handleCancel(order._id)}
                            disabled={isUpdating}
                            variant="secondary"
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 border-red-500 text-white"
                          >
                            Отменить
                          </Button>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {orders.length === 0 && (
        <div className="text-center py-16 fade-in text-text-secondary">
          <div className="flex items-center justify-center text-text-muted mb-4">
            <DocumentIcon className="w-16 h-16" />
          </div>
          <p className="text-text-primary text-xl font-medium mb-3">
            Заказы не найдены
          </p>
          <p className="text-text-secondary text-sm">
            {currentUser?.role === 'admin'
              ? 'Нет заказов в системе'
              : 'У вас еще нет заказов'}
          </p>
        </div>
      )}

      {showEditModal && selectedOrder && (
        <OrderEditModal
          order={selectedOrder}
          onClose={() => {
            setShowEditModal(false);
            setSelectedOrder(null);
          }}
          onSave={data => {
            handleUpdateOrder({ ...data, id: selectedOrder._id });
            setShowEditModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

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
      id: order._id,
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-border-soft rounded-3xl p-8 max-w-md w-full shadow-brand-card text-text-primary">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text-primary">
            Редактировать заказ
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-border-soft text-text-secondary hover:text-brand-indigo hover:border-brand-indigo/40 flex items-center justify-center transition-all duration-300"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Статус
            </label>
            <select
              value={formData.status}
              onChange={e =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full px-4 py-3 rounded-2xl bg-white border border-border-soft text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-indigo/30"
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
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Способ получения
            </label>
            <select
              value={formData.delivery_method}
              onChange={e =>
                setFormData({
                  ...formData,
                  delivery_method: e.target.value as any,
                })
              }
              className="w-full px-4 py-3 rounded-2xl bg-white border border-border-soft text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-indigo/30"
            >
              <option value="pickup">Самовывоз</option>
              <option value="dine_in">В зале</option>
              <option value="delivery">Доставка</option>
            </select>
          </div>
          {formData.delivery_method === 'dine_in' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Номер стола
              </label>
              <Input
                type="number"
                min="1"
                value={formData.table_number}
                onChange={value =>
                  setFormData({ ...formData, table_number: value })
                }
                placeholder="Введите номер стола"
              />
            </div>
          )}
          {formData.delivery_method === 'delivery' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Адрес доставки
              </label>
              <Input
                type="text"
                value={formData.delivery_address}
                onChange={value =>
                  setFormData({ ...formData, delivery_address: value })
                }
                placeholder="Введите адрес доставки"
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" onClick={onClose} variant="outline" size="md">
              Отмена
            </Button>
            <Button type="submit" variant="primary" size="md">
              Сохранить
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
