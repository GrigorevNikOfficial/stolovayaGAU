import {
    combine,
    createEffect,
    createEvent,
    createStore,
    sample,
} from 'effector';
import { ordersApi } from '../api/orders';
import { showToast } from '../components/layout/Toast/stores/toastStore.ts';
import { onSocketEvent } from '../lib/socket';
import type {
    CreateOrderRequest,
    Order,
    UpdateOrderRequest,
} from '../types/order';
import type { User } from '../types/user';
import { $currentUser, updateCurrentUserBalance } from './users';

type LoadOrdersParams = {
  role: 'admin' | 'user' | 'storeManager' | 'canteenManager' | 'cateenManager';
};

type OrderWithBalance = {
  order: Order;
  balance?: number | null;
};

const sortByCreatedAtDesc = (orders: Order[]): Order[] =>
  [...orders].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

const upsertOrder = (orders: Order[], candidate: Order): Order[] => {
  const existingIndex = orders.findIndex(order => order._id === candidate._id);

  if (existingIndex >= 0) {
    return orders.map(order => (order._id === candidate._id ? candidate : order));
  }

  return sortByCreatedAtDesc([candidate, ...orders]);
};

// Events (остаются те же)
export const loadOrders = createEvent();
export const createOrder = createEvent<CreateOrderRequest>();
export const updateOrderStatus = createEvent<UpdateOrderRequest>();
export const updateOrder = createEvent<UpdateOrderRequest>();
export const cancelOrder = createEvent<string>(); // Из number в string
export const clearOrders = createEvent();
export const refreshOrders = createEvent();
export const orderRealtimeCreated = createEvent<Order>();
export const orderRealtimeUpdated = createEvent<Order>();

if (typeof window !== 'undefined') {
  onSocketEvent('orders:created', orderRealtimeCreated);
  onSocketEvent('orders:updated', orderRealtimeUpdated);
}

// Effects с обновленными типами
export const loadOrdersFx = createEffect(
  async ({ role }: LoadOrdersParams): Promise<Order[]> => {
    console.log('loadOrdersFx: загрузка заказов для роли', role);
    // admin, storeManager и canteenManager видят все заказы (через getAllOrders)
    if (
      role === 'admin' ||
      role === 'storeManager' ||
      role === 'canteenManager' ||
      role === 'cateenManager'
    ) {
      const response = await ordersApi.getOrders();
      console.log('loadOrdersFx: получено заказов:', response.orders.length, response);
      return response.orders;
    }

    const response = await ordersApi.getMyOrders();
    console.log('loadOrdersFx: получено моих заказов:', response.orders.length, response);
    return response.orders;
  }
);

export const createOrderFx = createEffect(async (order: CreateOrderRequest) => {
  const response = await ordersApi.createOrder(order);
  return {
    order: response.order,
    order_number: response.order_number,
    balance: response.balance,
  };
});

export const updateOrderStatusFx = createEffect(
  async (order: UpdateOrderRequest): Promise<OrderWithBalance> => {
    console.log('Updating order status:', order);
    if (order.status !== undefined) {
      return await ordersApi.updateOrderStatus(order);
    }
    const response = await ordersApi.updateOrder(order);
    return { order: response.order, balance: response.balance ?? null };
  }
);

export const updateOrderFx = createEffect(
  async (order: UpdateOrderRequest): Promise<OrderWithBalance> => {
    console.log('Updating order:', order);
    const response = await ordersApi.updateOrder(order);
    return { order: response.order, balance: response.balance ?? null };
  }
);

export const cancelOrderFx = createEffect(
  async (orderId: string): Promise<OrderWithBalance> => {
    console.log('Cancelling order:', orderId);
    return await ordersApi.updateOrderStatus({
      id: orderId,
      status: 'cancelled',
    });
  }
);

// Stores (остаются те же, но работают с новыми типами)
export const $orders = createStore<Order[]>([])
  .on(loadOrdersFx.doneData, (_, orders) => orders)
  .on(createOrderFx.doneData, (state, { order }) => [order, ...state])
  .on(updateOrderStatusFx.doneData, (state, { order: updatedOrder }) =>
    state.map(order => (order._id === updatedOrder._id ? updatedOrder : order))
  )
  .on(updateOrderFx.doneData, (state, { order: updatedOrder }) =>
    state.map(order => (order._id === updatedOrder._id ? updatedOrder : order))
  )
  .on(cancelOrderFx.doneData, (state, { order: cancelledOrder }) =>
    state.map(order =>
      order._id === cancelledOrder._id ? cancelledOrder : order
    )
  )
  .on(orderRealtimeCreated, (state, order) => upsertOrder(state, order))
  .on(orderRealtimeUpdated, (state, order) => upsertOrder(state, order))
  .reset(clearOrders);

// Store для отображаемых заказов
export const $displayedOrders = combine(
  $orders,
  $currentUser,
  (orders, currentUser) => {
    console.log('$displayedOrders: orders =', orders.length, 'currentUser =', currentUser?.role);
    if (!currentUser) return [];

    // admin, storeManager и canteenManager видят все заказы (фильтрация по статусу уже на бэкенде)
    if (
      currentUser.role === 'admin' ||
      currentUser.role === 'storeManager' ||
      currentUser.role === 'canteenManager' ||
      currentUser.role === 'cateenManager'
    ) {
      console.log('$displayedOrders: возвращаем все заказы для', currentUser.role, ':', orders.length);
      return orders;
    } else {
      const filtered = orders.filter(order => order.user_id === currentUser._id);
      console.log('$displayedOrders: возвращаем отфильтрованные заказы:', filtered.length);
      return filtered; // _id вместо id
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
  clock: createOrderFx.doneData,
  filter: ({ balance }) => typeof balance === 'number',
  fn: ({ balance }) => balance,
  target: updateCurrentUserBalance,
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
  source: $currentUser,
  clock: updateOrderStatusFx.doneData,
  filter: (currentUser, { balance, order }) =>
    Boolean(
      currentUser &&
        typeof balance === 'number' &&
        order.user_id === currentUser._id
    ),
  fn: (_, { balance }) => balance as number,
  target: updateCurrentUserBalance,
});

sample({
  source: $currentUser,
  clock: updateOrderFx.doneData,
  filter: (currentUser, { balance, order }) =>
    Boolean(
      currentUser &&
        typeof balance === 'number' &&
        order.user_id === currentUser._id
    ),
  fn: (_, { balance }) => balance as number,
  target: updateCurrentUserBalance,
});

sample({
  source: $currentUser,
  clock: cancelOrderFx.doneData,
  filter: (currentUser, { balance, order }) =>
    Boolean(
      currentUser &&
        typeof balance === 'number' &&
        order.user_id === currentUser._id
    ),
  fn: (_, { balance }) => balance as number,
  target: updateCurrentUserBalance,
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
    message: 'Ошибка при обновлении статуса заказа',
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
    message: 'Не удалось отменить заказ',
    type: 'error' as const,
  }),
  target: showToast,
});
