import { createEffect, createEvent, createStore, sample } from 'effector';
import { deliveriesApi } from '../api/deliveries/deliveries';
import type {
  CreateDeliveryRequest,
  Delivery,
  UpdateDeliveryRequest,
} from '../types/deliveries';

// Events
export const loadDeliveries = createEvent();
export const createDelivery = createEvent<CreateDeliveryRequest>();
export const updateDelivery = createEvent<UpdateDeliveryRequest>();
export const patchDelivery = createEvent<{
  id: number;
  updates: Partial<UpdateDeliveryRequest>;
}>();
export const deleteDelivery = createEvent<number>();
export const setEditingDelivery = createEvent<Delivery | null>();
export const resetForm = createEvent();
export const searchDeliveries = createEvent<string>();
export const loadDeliveriesByOrder = createEvent<number>();
export const loadDeliveriesByStatus = createEvent<Delivery['status']>();
export const loadDeliveriesByDate = createEvent<number>();
export const loadDeliveryByTrackingNumber = createEvent<number>();
export const clearSearch = createEvent();
export const clearOrderFilter = createEvent();
export const clearStatusFilter = createEvent();
export const clearDateFilter = createEvent();

// Effects
export const loadDeliveriesFx = createEffect(async (): Promise<Delivery[]> => {
  return await deliveriesApi.getDeliveries();
});

export const createDeliveryFx = createEffect(
  async (delivery: CreateDeliveryRequest): Promise<Delivery> => {
    return await deliveriesApi.createDelivery(delivery);
  }
);

export const updateDeliveryFx = createEffect(
  async (delivery: UpdateDeliveryRequest): Promise<Delivery> => {
    return await deliveriesApi.updateDelivery(delivery);
  }
);

export const patchDeliveryFx = createEffect(
  async ({
    id,
    updates,
  }: {
    id: number;
    updates: Partial<UpdateDeliveryRequest>;
  }): Promise<Delivery> => {
    return await deliveriesApi.patchDelivery(id, updates);
  }
);

export const deleteDeliveryFx = createEffect(
  async (id: number): Promise<number> => {
    await deliveriesApi.deleteDelivery(id);
    return id;
  }
);

export const searchDeliveriesFx = createEffect(
  async (query: string): Promise<Delivery[]> => {
    if (!query.trim()) {
      return await deliveriesApi.getDeliveries();
    }
    return await deliveriesApi.searchDeliveries(query);
  }
);

export const loadDeliveriesByOrderFx = createEffect(
  async (orderId: number): Promise<Delivery[]> => {
    return await deliveriesApi.getDeliveriesByOrder(orderId);
  }
);

export const loadDeliveriesByStatusFx = createEffect(
  async (status: Delivery['status']): Promise<Delivery[]> => {
    return await deliveriesApi.getDeliveriesByStatus(status);
  }
);

export const loadDeliveriesByDateFx = createEffect(
  async (date: number): Promise<Delivery[]> => {
    return await deliveriesApi.getDeliveriesByDate(date);
  }
);

export const loadDeliveryByTrackingNumberFx = createEffect(
  async (trackingNumber: number): Promise<Delivery> => {
    return await deliveriesApi.getDeliveryByTrackingNumber(trackingNumber);
  }
);

// Stores
export const $deliveries = createStore<Delivery[]>([])
  .on(loadDeliveriesFx.doneData, (_, deliveries) => deliveries)
  .on(createDeliveryFx.doneData, (state, newDelivery) => [
    newDelivery,
    ...state,
  ])
  .on(updateDeliveryFx.doneData, (state, updatedDelivery) =>
    state.map(delivery =>
      delivery.id === updatedDelivery.id ? updatedDelivery : delivery
    )
  )
  .on(patchDeliveryFx.doneData, (state, updatedDelivery) =>
    state.map(delivery =>
      delivery.id === updatedDelivery.id ? updatedDelivery : delivery
    )
  )
  .on(deleteDeliveryFx.doneData, (state, deletedId) =>
    state.filter(delivery => delivery.id !== deletedId)
  );

// Store для отображаемых deliveries (с учетом фильтрации)
export const $displayedDeliveries = createStore<Delivery[]>([])
  .on(loadDeliveriesFx.doneData, (_, deliveries) => deliveries)
  .on(createDeliveryFx.doneData, (state, newDelivery) => [
    newDelivery,
    ...state,
  ])
  .on(updateDeliveryFx.doneData, (state, updatedDelivery) =>
    state.map(delivery =>
      delivery.id === updatedDelivery.id ? updatedDelivery : delivery
    )
  )
  .on(patchDeliveryFx.doneData, (state, updatedDelivery) =>
    state.map(delivery =>
      delivery.id === updatedDelivery.id ? updatedDelivery : delivery
    )
  )
  .on(deleteDeliveryFx.doneData, (state, deletedId) =>
    state.filter(delivery => delivery.id !== deletedId)
  )
  .on(searchDeliveriesFx.doneData, (_, deliveries) => deliveries)
  .on(loadDeliveriesByOrderFx.doneData, (_, deliveries) => deliveries)
  .on(loadDeliveriesByStatusFx.doneData, (_, deliveries) => deliveries)
  .on(loadDeliveriesByDateFx.doneData, (_, deliveries) => deliveries);

export const $editingDelivery = createStore<Delivery | null>(null)
  .on(setEditingDelivery, (_, delivery) => delivery)
  .reset([
    createDeliveryFx.done,
    updateDeliveryFx.done,
    patchDeliveryFx.done,
    resetForm,
  ]);

// Stores для состояний загрузки
export const $isLoading = createStore(false)
  .on(loadDeliveriesFx.pending, (_, pending) => pending)
  .on(searchDeliveriesFx.pending, (_, pending) => pending)
  .on(loadDeliveriesByOrderFx.pending, (_, pending) => pending)
  .on(loadDeliveriesByStatusFx.pending, (_, pending) => pending)
  .on(loadDeliveriesByDateFx.pending, (_, pending) => pending)
  .on(loadDeliveryByTrackingNumberFx.pending, (_, pending) => pending);

export const $isMutating = createStore(false)
  .on(createDeliveryFx.pending, (_, pending) => pending)
  .on(updateDeliveryFx.pending, (_, pending) => pending)
  .on(patchDeliveryFx.pending, (_, pending) => pending)
  .on(deleteDeliveryFx.pending, (_, pending) => pending);

// Store для ошибок
export const $error = createStore<string | null>(null)
  .on(loadDeliveriesFx.fail, (_, { error }) => error.message)
  .on(createDeliveryFx.fail, (_, { error }) => error.message)
  .on(updateDeliveryFx.fail, (_, { error }) => error.message)
  .on(patchDeliveryFx.fail, (_, { error }) => error.message)
  .on(deleteDeliveryFx.fail, (_, { error }) => error.message)
  .on(searchDeliveriesFx.fail, (_, { error }) => error.message)
  .on(loadDeliveriesByOrderFx.fail, (_, { error }) => error.message)
  .on(loadDeliveriesByStatusFx.fail, (_, { error }) => error.message)
  .on(loadDeliveriesByDateFx.fail, (_, { error }) => error.message)
  .on(loadDeliveryByTrackingNumberFx.fail, (_, { error }) => error.message)
  .reset([
    loadDeliveries,
    createDelivery,
    updateDelivery,
    patchDelivery,
    deleteDelivery,
    searchDeliveries,
    loadDeliveriesByOrder,
    loadDeliveriesByStatus,
    loadDeliveriesByDate,
    loadDeliveryByTrackingNumber,
    clearSearch,
    clearOrderFilter,
    clearStatusFilter,
    clearDateFilter,
  ]);

// Stores для UI состояния
export const $searchQuery = createStore('')
  .on(searchDeliveries, (_, query) => query)
  .reset(clearSearch);

export const $currentOrderId = createStore<number | null>(null)
  .on(loadDeliveriesByOrder, (_, orderId) => orderId)
  .reset(clearOrderFilter);

export const $currentStatus = createStore<Delivery['status'] | null>(null)
  .on(loadDeliveriesByStatus, (_, status) => status)
  .reset(clearStatusFilter);

export const $currentDate = createStore<number | null>(null)
  .on(loadDeliveriesByDate, (_, date) => date)
  .reset(clearDateFilter);

export const $currentTrackingNumber = createStore<number | null>(null).on(
  loadDeliveryByTrackingNumber,
  (_, trackingNumber) => trackingNumber
);

export const $isSearching = createStore(false).on(
  searchDeliveriesFx.pending,
  (_, pending) => pending
);

export const $isFilteringByOrder = createStore(false).on(
  loadDeliveriesByOrderFx.pending,
  (_, pending) => pending
);

export const $isFilteringByStatus = createStore(false).on(
  loadDeliveriesByStatusFx.pending,
  (_, pending) => pending
);

export const $isFilteringByDate = createStore(false).on(
  loadDeliveriesByDateFx.pending,
  (_, pending) => pending
);

// Samples
sample({
  clock: loadDeliveries,
  target: loadDeliveriesFx,
});

sample({
  clock: createDelivery,
  target: createDeliveryFx,
});

sample({
  clock: updateDelivery,
  target: updateDeliveryFx,
});

sample({
  clock: patchDelivery,
  target: patchDeliveryFx,
});

sample({
  clock: deleteDelivery,
  target: deleteDeliveryFx,
});

sample({
  clock: searchDeliveries,
  target: searchDeliveriesFx,
});

sample({
  clock: loadDeliveriesByOrder,
  target: loadDeliveriesByOrderFx,
});

sample({
  clock: loadDeliveriesByStatus,
  target: loadDeliveriesByStatusFx,
});

sample({
  clock: loadDeliveriesByDate,
  target: loadDeliveriesByDateFx,
});

sample({
  clock: loadDeliveryByTrackingNumber,
  target: loadDeliveryByTrackingNumberFx,
});

// Автоматическая очистка фильтров при загрузке всех deliveries
sample({
  clock: loadDeliveries,
  target: [clearSearch, clearOrderFilter, clearStatusFilter, clearDateFilter],
});
