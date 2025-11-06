import { createEffect, createEvent, createStore, sample } from 'effector';
import { ordersApi } from '../api';
import type {
  CreateOrderRequest,
  Order,
  UpdateOrderRequest,
} from '../types/order';

// Events
export const loadOrders = createEvent();
export const createOrder = createEvent<CreateOrderRequest>();
export const updateOrder = createEvent<UpdateOrderRequest>();
export const updateOrderStatus = createEvent<{
  id: number;
  status: Order['status'];
}>();
export const deleteOrder = createEvent<number>();
export const setEditingOrder = createEvent<Order | null>();
export const resetOrderForm = createEvent();
export const loadUserOrders = createEvent<number>();
export const loadOrdersByStatus = createEvent<Order['status']>();
export const cancelOrder = createEvent<number>();

// Effects
export const loadOrdersFx = createEffect(async () => {
  return await ordersApi.getOrders();
});

export const createOrderFx = createEffect(async (order: CreateOrderRequest) => {
  return await ordersApi.createOrder(order);
});

export const updateOrderFx = createEffect(async (order: UpdateOrderRequest) => {
  return await ordersApi.updateOrder(order);
});

export const updateOrderStatusFx = createEffect(
  async ({ id, status }: { id: number; status: Order['status'] }) => {
    return await ordersApi.updateOrderStatus(id, status);
  }
);

export const deleteOrderFx = createEffect(async (id: number) => {
  await ordersApi.deleteOrder(id);
  return id;
});

export const loadUserOrdersFx = createEffect(async (userId: number) => {
  return await ordersApi.getUserOrders(userId);
});

export const loadOrdersByStatusFx = createEffect(
  async (status: Order['status']) => {
    return await ordersApi.getOrdersByStatus(status);
  }
);

export const cancelOrderFx = createEffect(async (id: number) => {
  return await ordersApi.cancelOrder(id);
});

// Stores
export const $orders = createStore<Order[]>([])
  .on(loadOrdersFx.doneData, (_, orders) => orders)
  .on(createOrderFx.doneData, (state, newOrder) => [newOrder, ...state])
  .on(updateOrderFx.doneData, (state, updatedOrder) =>
    state.map(order => (order.id === updatedOrder.id ? updatedOrder : order))
  )
  .on(updateOrderStatusFx.doneData, (state, updatedOrder) =>
    state.map(order => (order.id === updatedOrder.id ? updatedOrder : order))
  )
  .on(deleteOrderFx.doneData, (state, deletedId) =>
    state.filter(order => order.id !== deletedId)
  )
  .on(loadUserOrdersFx.doneData, (_, orders) => orders)
  .on(loadOrdersByStatusFx.doneData, (_, orders) => orders)
  .on(cancelOrderFx.doneData, (state, cancelledOrder) =>
    state.map(order =>
      order.id === cancelledOrder.id ? cancelledOrder : order
    )
  );

export const $editingOrder = createStore<Order | null>(null)
  .on(setEditingOrder, (_, order) => order)
  .reset([createOrderFx.done, updateOrderFx.done, resetOrderForm]);

export const $isLoading = createStore(false)
  .on(loadOrdersFx.pending, (_, pending) => pending)
  .on(loadUserOrdersFx.pending, (_, pending) => pending)
  .on(loadOrdersByStatusFx.pending, (_, pending) => pending);

export const $isMutating = createStore(false)
  .on(createOrderFx.pending, (_, pending) => pending)
  .on(updateOrderFx.pending, (_, pending) => pending)
  .on(updateOrderStatusFx.pending, (_, pending) => pending)
  .on(deleteOrderFx.pending, (_, pending) => pending)
  .on(cancelOrderFx.pending, (_, pending) => pending);

export const $error = createStore<string | null>(null)
  .on(loadOrdersFx.fail, (_, { error }) => error.message)
  .on(createOrderFx.fail, (_, { error }) => error.message)
  .on(updateOrderFx.fail, (_, { error }) => error.message)
  .on(updateOrderStatusFx.fail, (_, { error }) => error.message)
  .on(deleteOrderFx.fail, (_, { error }) => error.message)
  .on(loadUserOrdersFx.fail, (_, { error }) => error.message)
  .on(loadOrdersByStatusFx.fail, (_, { error }) => error.message)
  .on(cancelOrderFx.fail, (_, { error }) => error.message)
  .reset([
    loadOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    loadUserOrders,
    loadOrdersByStatus,
    cancelOrder,
  ]);

export const $currentUserId = createStore<number | null>(null).on(
  loadUserOrders,
  (_, userId) => userId
);

export const $currentStatus = createStore<Order['status'] | null>(null).on(
  loadOrdersByStatus,
  (_, status) => status
);

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
  clock: updateOrder,
  target: updateOrderFx,
});

sample({
  clock: updateOrderStatus,
  target: updateOrderStatusFx,
});

sample({
  clock: deleteOrder,
  target: deleteOrderFx,
});

sample({
  clock: loadUserOrders,
  target: loadUserOrdersFx,
});

sample({
  clock: loadOrdersByStatus,
  target: loadOrdersByStatusFx,
});

sample({
  clock: cancelOrder,
  target: cancelOrderFx,
});
