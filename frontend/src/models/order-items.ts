import { createEffect, createEvent, createStore, sample } from 'effector';
import { orderItemsApi } from '../api/order-items/order-items';
import type {
  CreateOrderItemRequest,
  OrderItem,
  UpdateOrderItemRequest,
} from '../types/order-items';

// Events
export const loadOrderItems = createEvent();
export const createOrderItem = createEvent<CreateOrderItemRequest>();
export const updateOrderItem = createEvent<UpdateOrderItemRequest>();
export const patchOrderItem = createEvent<{
  id: number;
  updates: Partial<UpdateOrderItemRequest>;
}>();
export const deleteOrderItem = createEvent<number>();
export const setEditingOrderItem = createEvent<OrderItem | null>();
export const resetForm = createEvent();
export const loadOrderItemsByOrder = createEvent<number>();
export const loadOrderItemsByItem = createEvent<number>();
export const loadOrderItemsByOrders = createEvent<number[]>();
export const clearOrderFilter = createEvent();
export const clearItemFilter = createEvent();

// Effects
export const loadOrderItemsFx = createEffect(async (): Promise<OrderItem[]> => {
  return await orderItemsApi.getOrderItems();
});

export const createOrderItemFx = createEffect(
  async (orderItem: CreateOrderItemRequest): Promise<OrderItem> => {
    return await orderItemsApi.createOrderItem(orderItem);
  }
);

export const updateOrderItemFx = createEffect(
  async (orderItem: UpdateOrderItemRequest): Promise<OrderItem> => {
    return await orderItemsApi.updateOrderItem(orderItem);
  }
);

export const patchOrderItemFx = createEffect(
  async ({
    id,
    updates,
  }: {
    id: number;
    updates: Partial<UpdateOrderItemRequest>;
  }): Promise<OrderItem> => {
    return await orderItemsApi.patchOrderItem(id, updates);
  }
);

export const deleteOrderItemFx = createEffect(
  async (id: number): Promise<number> => {
    await orderItemsApi.deleteOrderItem(id);
    return id;
  }
);

export const loadOrderItemsByOrderFx = createEffect(
  async (orderId: number): Promise<OrderItem[]> => {
    return await orderItemsApi.getOrderItemsByOrder(orderId);
  }
);

export const loadOrderItemsByItemFx = createEffect(
  async (itemId: number): Promise<OrderItem[]> => {
    return await orderItemsApi.getOrderItemsByItem(itemId);
  }
);

export const loadOrderItemsByOrdersFx = createEffect(
  async (orderIds: number[]): Promise<OrderItem[]> => {
    return await orderItemsApi.getOrderItemsByOrders(orderIds);
  }
);

// Stores
export const $orderItems = createStore<OrderItem[]>([])
  .on(loadOrderItemsFx.doneData, (_, orderItems) => orderItems)
  .on(createOrderItemFx.doneData, (state, newOrderItem) => [
    newOrderItem,
    ...state,
  ])
  .on(updateOrderItemFx.doneData, (state, updatedOrderItem) =>
    state.map(orderItem =>
      orderItem.id === updatedOrderItem.id ? updatedOrderItem : orderItem
    )
  )
  .on(patchOrderItemFx.doneData, (state, updatedOrderItem) =>
    state.map(orderItem =>
      orderItem.id === updatedOrderItem.id ? updatedOrderItem : orderItem
    )
  )
  .on(deleteOrderItemFx.doneData, (state, deletedId) =>
    state.filter(orderItem => orderItem.id !== deletedId)
  );

// Store для отображаемых orderItems (с учетом фильтрации)
export const $displayedOrderItems = createStore<OrderItem[]>([])
  .on(loadOrderItemsFx.doneData, (_, orderItems) => orderItems)
  .on(createOrderItemFx.doneData, (state, newOrderItem) => [
    newOrderItem,
    ...state,
  ])
  .on(updateOrderItemFx.doneData, (state, updatedOrderItem) =>
    state.map(orderItem =>
      orderItem.id === updatedOrderItem.id ? updatedOrderItem : orderItem
    )
  )
  .on(patchOrderItemFx.doneData, (state, updatedOrderItem) =>
    state.map(orderItem =>
      orderItem.id === updatedOrderItem.id ? updatedOrderItem : orderItem
    )
  )
  .on(deleteOrderItemFx.doneData, (state, deletedId) =>
    state.filter(orderItem => orderItem.id !== deletedId)
  )
  .on(loadOrderItemsByOrderFx.doneData, (_, orderItems) => orderItems)
  .on(loadOrderItemsByItemFx.doneData, (_, orderItems) => orderItems)
  .on(loadOrderItemsByOrdersFx.doneData, (_, orderItems) => orderItems);

export const $editingOrderItem = createStore<OrderItem | null>(null)
  .on(setEditingOrderItem, (_, orderItem) => orderItem)
  .reset([
    createOrderItemFx.done,
    updateOrderItemFx.done,
    patchOrderItemFx.done,
    resetForm,
  ]);

// Stores для состояний загрузки
export const $isLoading = createStore(false)
  .on(loadOrderItemsFx.pending, (_, pending) => pending)
  .on(loadOrderItemsByOrderFx.pending, (_, pending) => pending)
  .on(loadOrderItemsByItemFx.pending, (_, pending) => pending)
  .on(loadOrderItemsByOrdersFx.pending, (_, pending) => pending);

export const $isMutating = createStore(false)
  .on(createOrderItemFx.pending, (_, pending) => pending)
  .on(updateOrderItemFx.pending, (_, pending) => pending)
  .on(patchOrderItemFx.pending, (_, pending) => pending)
  .on(deleteOrderItemFx.pending, (_, pending) => pending);

// Store для ошибок
export const $error = createStore<string | null>(null)
  .on(loadOrderItemsFx.fail, (_, { error }) => error.message)
  .on(createOrderItemFx.fail, (_, { error }) => error.message)
  .on(updateOrderItemFx.fail, (_, { error }) => error.message)
  .on(patchOrderItemFx.fail, (_, { error }) => error.message)
  .on(deleteOrderItemFx.fail, (_, { error }) => error.message)
  .on(loadOrderItemsByOrderFx.fail, (_, { error }) => error.message)
  .on(loadOrderItemsByItemFx.fail, (_, { error }) => error.message)
  .on(loadOrderItemsByOrdersFx.fail, (_, { error }) => error.message)
  .reset([
    loadOrderItems,
    createOrderItem,
    updateOrderItem,
    patchOrderItem,
    deleteOrderItem,
    loadOrderItemsByOrder,
    loadOrderItemsByItem,
    loadOrderItemsByOrders,
    clearOrderFilter,
    clearItemFilter,
  ]);

// Stores для UI состояния
export const $currentOrderId = createStore<number | null>(null)
  .on(loadOrderItemsByOrder, (_, orderId) => orderId)
  .reset(clearOrderFilter);

export const $currentItemId = createStore<number | null>(null)
  .on(loadOrderItemsByItem, (_, itemId) => itemId)
  .reset(clearItemFilter);

export const $isFilteringByOrder = createStore(false).on(
  loadOrderItemsByOrderFx.pending,
  (_, pending) => pending
);

export const $isFilteringByItem = createStore(false).on(
  loadOrderItemsByItemFx.pending,
  (_, pending) => pending
);

// Samples
sample({
  clock: loadOrderItems,
  target: loadOrderItemsFx,
});

sample({
  clock: createOrderItem,
  target: createOrderItemFx,
});

sample({
  clock: updateOrderItem,
  target: updateOrderItemFx,
});

sample({
  clock: patchOrderItem,
  target: patchOrderItemFx,
});

sample({
  clock: deleteOrderItem,
  target: deleteOrderItemFx,
});

sample({
  clock: loadOrderItemsByOrder,
  target: loadOrderItemsByOrderFx,
});

sample({
  clock: loadOrderItemsByItem,
  target: loadOrderItemsByItemFx,
});

sample({
  clock: loadOrderItemsByOrders,
  target: loadOrderItemsByOrdersFx,
});

// Автоматическая очистка фильтров при загрузке всех orderItems
sample({
  clock: loadOrderItems,
  target: [clearOrderFilter, clearItemFilter],
});
