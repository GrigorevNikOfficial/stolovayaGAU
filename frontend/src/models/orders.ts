import {
  combine,
  createEffect,
  createEvent,
  createStore,
  sample,
} from 'effector';
import { ordersApi } from '../api/orders';
import type {
  CreateOrderRequest,
  Order,
  UpdateOrderRequest,
} from '../types/order';
import type { User } from '../types/user';
import { $currentUser } from './users';
import { showToast } from '../components/layout/Toast/stores/toastStore.ts';

type LoadOrdersParams = {
  role: 'admin' | 'user' | 'storeManager' | 'canteenManager' | 'cateenManager';
};

// Events (остаются те же)
export const loadOrders = createEvent();
export const createOrder = createEvent<CreateOrderRequest>();
export const updateOrderStatus = createEvent<UpdateOrderRequest>();
export const updateOrder = createEvent<UpdateOrderRequest>();
export const cancelOrder = createEvent<string>(); // Из number в string
export const clearOrders = createEvent();
export const refreshOrders = createEvent();

// Effects с обновленными типами
export const loadOrdersFx = createEffect(
  async ({ role }: LoadOrdersParams): Promise<Order[]> => {
    // admin, storeManager и canteenManager видят все заказы (через getAllOrders)
    if (
      role === 'admin' ||
      role === 'storeManager' ||
      role === 'canteenManager' ||
      role === 'cateenManager'
    ) {
      const response = await ordersApi.getOrders();
      return response.orders;
    }

    const response = await ordersApi.getMyOrders();
    return response.orders;
  }
);

export const createOrderFx = createEffect(async (order: CreateOrderRequest) => {
  const response = await ordersApi.createOrder(order);
  return {
    order: response.order,
    order_number: response.order_number,
  };
});

export const updateOrderStatusFx = createEffect(
  async (order: UpdateOrderRequest): Promise<Order> => {
    console.log('Updating order status:', order);
    if (order.status !== undefined) {
      return await ordersApi.updateOrderStatus(order);
    }
    const response = await ordersApi.updateOrder(order);
    return response.order;
  }
);

export const updateOrderFx = createEffect(
  async (order: UpdateOrderRequest): Promise<Order> => {
    console.log('Updating order:', order);
    const response = await ordersApi.updateOrder(order);
    return response.order;
  }
);

export const cancelOrderFx = createEffect(
  async (orderId: string): Promise<Order> => {
    // Из number в string
    console.log('Cancelling order:', orderId);
    const response = await ordersApi.updateOrder({
      id: orderId,
      status: 'cancelled',
    });
    return response.order;
  }
);

// Stores (остаются те же, но работают с новыми типами)
export const $orders = createStore<Order[]>([])
  .on(loadOrdersFx.doneData, (_, orders) => orders)
  .on(createOrderFx.doneData, (state, { order }) => [order, ...state])
  .on(
    updateOrderStatusFx.doneData,
    (state, updatedOrder) =>
      state.map(order =>
        order._id === updatedOrder._id ? updatedOrder : order
      ) // _id вместо id
  )
  .on(updateOrderFx.doneData, (state, updatedOrder) =>
    state.map(order => (order._id === updatedOrder._id ? updatedOrder : order))
  )
  .on(cancelOrderFx.doneData, (state, cancelledOrder) =>
    state.map(
      order => (order._id === cancelledOrder._id ? cancelledOrder : order) // _id вместо id
    )
  )
  .reset(clearOrders);

// Store для отображаемых заказов
export const $displayedOrders = combine(
  $orders,
  $currentUser,
  (orders, currentUser) => {
    if (!currentUser) return [];

    // admin, storeManager и canteenManager видят все заказы (фильтрация по статусу уже на бэкенде)
    if (
      currentUser.role === 'admin' ||
      currentUser.role === 'storeManager' ||
      currentUser.role === 'canteenManager' ||
      currentUser.role === 'cateenManager'
    ) {
      return orders;
    } else {
      return orders.filter(order => order.user_id === currentUser._id); // _id вместо id
    }
  }
);

// Остальные stores и samples остаются без изменений
export const $ordersIsLoading = createStore(false).on(
  loadOrdersFx.pending,
  (_, pending) => pending
);

export const $isCreating = createStore(false).on(
  createOrderFx.pending,
  (_, pending) => pending
);

export const $isUpdating = createStore(false)
  .on(updateOrderStatusFx.pending, (_, pending) => pending)
  .on(updateOrderFx.pending, (_, pending) => pending)
  .on(cancelOrderFx.pending, (_, pending) => pending);

export const $orderError = createStore<string | null>(null)
  .on(loadOrdersFx.fail, (_, { error }) => error.message)
  .on(createOrderFx.fail, (_, { error }) => error.message)
  .on(updateOrderStatusFx.fail, (_, { error }) => error.message)
  .on(updateOrderFx.fail, (_, { error }) => error.message)
  .on(cancelOrderFx.fail, (_, { error }) => error.message)
  .reset([
    loadOrders,
    createOrder,
    updateOrderStatus,
    updateOrder,
    cancelOrder,
    refreshOrders,
  ]);

sample({
  clock: loadOrders,
  source: $currentUser,
  filter: (user): user is User => user !== null,
  fn: user => ({ role: user!.role }),
  target: loadOrdersFx,
});

sample({
  clock: refreshOrders,
  source: $currentUser,
  filter: (user): user is User => user !== null,
  fn: user => ({ role: user!.role }),
  target: loadOrdersFx,
});

sample({
  clock: createOrder,
  target: createOrderFx,
});

sample({
  clock: updateOrderStatus,
  target: updateOrderStatusFx,
});

sample({
  clock: updateOrder,
  target: updateOrderFx,
});

sample({
  clock: cancelOrder,
  target: cancelOrderFx,
});

sample({
  clock: $currentUser.updates,
  filter: (user): user is User => user !== null,
  fn: user => ({ role: user!.role }),
  target: loadOrdersFx,
});

sample({
  clock: createOrderFx.done,
  fn: () => ({ message: 'Заказ успешно создан', type: 'success' as const }),
  target: showToast,
});

sample({
  clock: createOrderFx.fail,
  fn: () => ({ message: 'Ошибка при создании заказа', type: 'error' as const }),
  target: showToast,
});

sample({
  clock: updateOrderStatusFx.done,
  fn: () => ({ message: 'Статус заказа обновлен', type: 'success' as const }),
  target: showToast,
});

sample({
  clock: updateOrderStatusFx.fail,
  fn: () => ({
    message: 'Ошика при удалении статуса заказа',
    type: 'error' as const,
  }),
  target: showToast,
});

sample({
  clock: updateOrderFx.done,
  fn: () => ({
    message: 'Заказ успешно обновлен',
    type: 'success' as const,
  }),
  target: showToast,
});

sample({
  clock: updateOrderFx.fail,
  fn: () => ({
    message: 'Ошибка при обновлении заказа',
    type: 'error' as const,
  }),
  target: showToast,
});

sample({
  clock: cancelOrderFx.done,
  fn: () => ({
    message: 'Заказ успешно удален',
    type: 'success' as const,
  }),
  target: showToast,
});

sample({
  clock: cancelOrderFx.fail,
  fn: () => ({
    message: 'Заказ успешно удален',
    type: 'success' as const,
  }),
  target: showToast,
});
