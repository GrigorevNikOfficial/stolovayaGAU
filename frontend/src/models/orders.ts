import {
  createEffect,
  createEvent,
  createStore,
  sample,
  combine,
} from 'effector';
import { ordersApi } from '../api/orders/orders';
import type {
  CreateOrderRequest,
  Order,
  UpdateOrderRequest,
} from '../types/order';
import { $currentUser } from './users';

// Events
export const loadOrders = createEvent();
export const createOrder = createEvent<CreateOrderRequest>();
export const updateOrderStatus = createEvent<UpdateOrderRequest>();
export const cancelOrder = createEvent<number>();
export const clearOrders = createEvent();

// Effects
export const loadOrdersFx = createEffect(async (): Promise<Order[]> => {
  const response = await ordersApi.getOrders();
  return response.orders;
});

export const createOrderFx = createEffect(
  async (
    order: CreateOrderRequest
  ): Promise<{
    order: Order;
    order_number: string;
  }> => {
    const response = await ordersApi.createOrder(order);
    return {
      order: response.order,
      order_number: response.order_number,
      // Убираем tracking_number, так как его больше нет в ответе
    };
  }
);

export const updateOrderStatusFx = createEffect(
  async (order: UpdateOrderRequest): Promise<Order> => {
    return await ordersApi.updateOrder(order);
  }
);

export const cancelOrderFx = createEffect(
  async (orderId: number): Promise<Order> => {
    return await ordersApi.updateOrder({ id: orderId, status: 'cancelled' });
  }
);

// Stores
export const $orders = createStore<Order[]>([])
  .on(loadOrdersFx.doneData, (_, orders) => orders)
  .on(createOrderFx.doneData, (state, { order }) => [order, ...state])
  .on(updateOrderStatusFx.doneData, (state, updatedOrder) =>
    state.map(order => (order.id === updatedOrder.id ? updatedOrder : order))
  )
  .on(cancelOrderFx.doneData, (state, cancelledOrder) =>
    state.map(order =>
      order.id === cancelledOrder.id ? cancelledOrder : order
    )
  )
  .reset(clearOrders);

// Store для отображаемых заказов (зависит от роли пользователя)
export const $displayedOrders = combine(
  $orders,
  $currentUser,
  (orders, currentUser) => {
    if (!currentUser) return [];

    if (currentUser.role === 'admin') {
      // Админы видят все заказы
      return orders;
    } else {
      // Пользователи видят только свои заказы
      return orders.filter(order => order.user_id === currentUser.id);
    }
  }
);

// Stores для UI состояния
export const $isLoading = createStore(false).on(
  loadOrdersFx.pending,
  (_, pending) => pending
);

export const $isCreating = createStore(false).on(
  createOrderFx.pending,
  (_, pending) => pending
);

export const $isUpdating = createStore(false)
  .on(updateOrderStatusFx.pending, (_, pending) => pending)
  .on(cancelOrderFx.pending, (_, pending) => pending);

export const $orderError = createStore<string | null>(null)
  .on(loadOrdersFx.fail, (_, { error }) => error.message)
  .on(createOrderFx.fail, (_, { error }) => error.message)
  .on(updateOrderStatusFx.fail, (_, { error }) => error.message)
  .on(cancelOrderFx.fail, (_, { error }) => error.message)
  .reset([loadOrders, createOrder, updateOrderStatus, cancelOrder]);

// Samples
sample({
  clock: loadOrders,
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
  clock: cancelOrder,
  target: cancelOrderFx,
});

// Автоматическая загрузка заказов при изменении пользователя
sample({
  clock: $currentUser.updates,
  source: $currentUser,
  filter: user => user !== null,
  target: loadOrders,
});
