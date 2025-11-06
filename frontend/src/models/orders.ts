import { createEffect, createEvent, createStore, sample } from 'effector';
import { ordersApi } from '../api/orders/orders';
import type {
  CreateOrderRequest,
  Order,
  UpdateOrderRequest,
} from '../types/order';

// Events
export const loadOrders = createEvent();
export const createOrder = createEvent<CreateOrderRequest>();
export const updateOrder = createEvent<UpdateOrderRequest>();
export const patchOrder = createEvent<{
  id: number;
  updates: Partial<UpdateOrderRequest>;
}>();
export const deleteOrder = createEvent<number>();
export const setEditingOrder = createEvent<Order | null>();
export const resetForm = createEvent();
export const searchOrders = createEvent<string>();
export const loadOrdersByUser = createEvent<number>();
export const loadOrdersByStatus = createEvent<Order['status']>();
export const clearSearch = createEvent();
export const clearUserFilter = createEvent();
export const clearStatusFilter = createEvent();

// Effects
export const loadOrdersFx = createEffect(async (): Promise<Order[]> => {
  return await ordersApi.getOrders();
});

export const createOrderFx = createEffect(
  async (order: CreateOrderRequest): Promise<Order> => {
    return await ordersApi.createOrder(order);
  }
);

export const updateOrderFx = createEffect(
  async (order: UpdateOrderRequest): Promise<Order> => {
    return await ordersApi.updateOrder(order);
  }
);

export const patchOrderFx = createEffect(
  async ({
    id,
    updates,
  }: {
    id: number;
    updates: Partial<UpdateOrderRequest>;
  }): Promise<Order> => {
    return await ordersApi.patchOrder(id, updates);
  }
);

export const deleteOrderFx = createEffect(
  async (id: number): Promise<number> => {
    await ordersApi.deleteOrder(id);
    return id;
  }
);

export const searchOrdersFx = createEffect(
  async (query: string): Promise<Order[]> => {
    if (!query.trim()) {
      return await ordersApi.getOrders();
    }
    return await ordersApi.searchOrders(query);
  }
);

export const loadOrdersByUserFx = createEffect(
  async (userId: number): Promise<Order[]> => {
    return await ordersApi.getOrdersByUser(userId);
  }
);

export const loadOrdersByStatusFx = createEffect(
  async (status: Order['status']): Promise<Order[]> => {
    return await ordersApi.getOrdersByStatus(status);
  }
);

// Stores
export const $orders = createStore<Order[]>([])
  .on(loadOrdersFx.doneData, (_, orders) => orders)
  .on(createOrderFx.doneData, (state, newOrder) => [newOrder, ...state])
  .on(updateOrderFx.doneData, (state, updatedOrder) =>
    state.map(order => (order.id === updatedOrder.id ? updatedOrder : order))
  )
  .on(patchOrderFx.doneData, (state, updatedOrder) =>
    state.map(order => (order.id === updatedOrder.id ? updatedOrder : order))
  )
  .on(deleteOrderFx.doneData, (state, deletedId) =>
    state.filter(order => order.id !== deletedId)
  );

// Store для отображаемых orders (с учетом фильтрации)
export const $displayedOrders = createStore<Order[]>([])
  .on(loadOrdersFx.doneData, (_, orders) => orders)
  .on(createOrderFx.doneData, (state, newOrder) => [newOrder, ...state])
  .on(updateOrderFx.doneData, (state, updatedOrder) =>
    state.map(order => (order.id === updatedOrder.id ? updatedOrder : order))
  )
  .on(patchOrderFx.doneData, (state, updatedOrder) =>
    state.map(order => (order.id === updatedOrder.id ? updatedOrder : order))
  )
  .on(deleteOrderFx.doneData, (state, deletedId) =>
    state.filter(order => order.id !== deletedId)
  )
  .on(searchOrdersFx.doneData, (_, orders) => orders)
  .on(loadOrdersByUserFx.doneData, (_, orders) => orders)
  .on(loadOrdersByStatusFx.doneData, (_, orders) => orders);

export const $editingOrder = createStore<Order | null>(null)
  .on(setEditingOrder, (_, order) => order)
  .reset([
    createOrderFx.done,
    updateOrderFx.done,
    patchOrderFx.done,
    resetForm,
  ]);

// Stores для состояний загрузки
export const $isLoading = createStore(false)
  .on(loadOrdersFx.pending, (_, pending) => pending)
  .on(searchOrdersFx.pending, (_, pending) => pending)
  .on(loadOrdersByUserFx.pending, (_, pending) => pending)
  .on(loadOrdersByStatusFx.pending, (_, pending) => pending);

export const $isMutating = createStore(false)
  .on(createOrderFx.pending, (_, pending) => pending)
  .on(updateOrderFx.pending, (_, pending) => pending)
  .on(patchOrderFx.pending, (_, pending) => pending)
  .on(deleteOrderFx.pending, (_, pending) => pending);

// Store для ошибок
export const $error = createStore<string | null>(null)
  .on(loadOrdersFx.fail, (_, { error }) => error.message)
  .on(createOrderFx.fail, (_, { error }) => error.message)
  .on(updateOrderFx.fail, (_, { error }) => error.message)
  .on(patchOrderFx.fail, (_, { error }) => error.message)
  .on(deleteOrderFx.fail, (_, { error }) => error.message)
  .on(searchOrdersFx.fail, (_, { error }) => error.message)
  .on(loadOrdersByUserFx.fail, (_, { error }) => error.message)
  .on(loadOrdersByStatusFx.fail, (_, { error }) => error.message)
  .reset([
    loadOrders,
    createOrder,
    updateOrder,
    patchOrder,
    deleteOrder,
    searchOrders,
    loadOrdersByUser,
    loadOrdersByStatus,
    clearSearch,
    clearUserFilter,
    clearStatusFilter,
  ]);

// Stores для UI состояния
export const $searchQuery = createStore('')
  .on(searchOrders, (_, query) => query)
  .reset(clearSearch);

export const $currentUserId = createStore<number | null>(null)
  .on(loadOrdersByUser, (_, userId) => userId)
  .reset(clearUserFilter);

export const $currentStatus = createStore<Order['status'] | null>(null)
  .on(loadOrdersByStatus, (_, status) => status)
  .reset(clearStatusFilter);

export const $isSearching = createStore(false).on(
  searchOrdersFx.pending,
  (_, pending) => pending
);

export const $isFilteringByUser = createStore(false).on(
  loadOrdersByUserFx.pending,
  (_, pending) => pending
);

export const $isFilteringByStatus = createStore(false).on(
  loadOrdersByStatusFx.pending,
  (_, pending) => pending
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
  clock: patchOrder,
  target: patchOrderFx,
});

sample({
  clock: deleteOrder,
  target: deleteOrderFx,
});

sample({
  clock: searchOrders,
  target: searchOrdersFx,
});

sample({
  clock: loadOrdersByUser,
  target: loadOrdersByUserFx,
});

sample({
  clock: loadOrdersByStatus,
  target: loadOrdersByStatusFx,
});

// Автоматическая очистка фильтров при загрузке всех orders
sample({
  clock: loadOrders,
  target: [clearSearch, clearUserFilter, clearStatusFilter],
});
