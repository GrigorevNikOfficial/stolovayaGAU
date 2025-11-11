import {
  createEffect,
  createEvent,
  createStore,
  sample,
  combine,
} from 'effector';
import { ordersApi } from '../api/orders';
import type {
  CreateOrderRequest,
  Order,
  UpdateOrderRequest,
} from '../types/order';
import type { User } from '../types/user';
import { $currentUser } from './users';

type LoadOrdersParams = {
  role: 'admin' | 'user';
};

// Events (остаются те же)
export const loadOrders = createEvent();
export const createOrder = createEvent<CreateOrderRequest>();
export const updateOrderStatus = createEvent<UpdateOrderRequest>();
export const cancelOrder = createEvent<string>(); // Из number в string
export const clearOrders = createEvent();
export const refreshOrders = createEvent();

// Effects с обновленными типами
export const loadOrdersFx = createEffect(
  async ({ role }: LoadOrdersParams): Promise<Order[]> => {
    if (role === 'admin') {
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
    return await ordersApi.updateOrder(order);
  }
);

export const cancelOrderFx = createEffect(
  async (orderId: string): Promise<Order> => {
    // Из number в string
    console.log('Cancelling order:', orderId);
    return await ordersApi.updateOrder({
      id: orderId,
      status: 'cancelled',
    });
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

    if (currentUser.role === 'admin') {
      return orders;
    } else {
      return orders.filter(order => order.user_id === currentUser._id); // _id вместо id
    }
  }
);

// Остальные stores и samples остаются без изменений
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
  .reset([
    loadOrders,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    refreshOrders,
  ]);

// Samples (остаются те же)
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
  target: refreshOrders,
});

sample({
  clock: updateOrderStatusFx.done,
  target: refreshOrders,
});

sample({
  clock: cancelOrderFx.done,
  target: refreshOrders,
});
