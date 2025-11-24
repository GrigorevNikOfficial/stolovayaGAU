import { createEffect, createEvent, createStore, sample } from 'effector';
import { stockApi } from '../api/stock';
import type {
  Stock,
  StockWithDetails,
  UpdateStockRequest,
  CreateStockRequest,
} from '../types/stock.ts';
import { showToast } from '../components/layout/Toast/stores/toastStore.ts';

// Events
export const loadStock = createEvent<{ pointId?: string }>();
export const loadStockWithDetails = createEvent<{ pointId?: string }>();
export const loadStockByPoint = createEvent<string>();
export const loadStockByProduct = createEvent<string>();
export const updateStock = createEvent<{
  id: string;
  data: UpdateStockRequest;
}>();
export const createStock = createEvent<CreateStockRequest>();
export const deleteStock = createEvent<string>();
export const reserveStock = createEvent<{
  pointId: string;
  productId: string;
  quantity: number;
}>();
export const releaseStock = createEvent<{
  pointId: string;
  productId: string;
  quantity: number;
}>();

// Effects
export const loadStockFx = createEffect(
  async (params: { pointId?: string }) => {
    const response = await stockApi.getStock(params.pointId);
    return response;
  }
);

export const loadStockWithDetailsFx = createEffect(
  async (params: { pointId?: string }) => {
    const response = await stockApi.getStockWithDetails(params.pointId);
    return response;
  }
);

export const loadStockByPointFx = createEffect(async (pointId: string) => {
  const response = await stockApi.getStockByPoint(pointId);
  return response;
});

export const loadStockByProductFx = createEffect(async (productId: string) => {
  const response = await stockApi.getStockByProduct(productId);
  return response;
});

export const updateStockFx = createEffect(
  async ({ id, data }: { id: string; data: UpdateStockRequest }) => {
    const response = await stockApi.updateStock(id, data);
    return response;
  }
);

export const createStockFx = createEffect(async (data: CreateStockRequest) => {
  const response = await stockApi.createStock(data);
  return response;
});

export const deleteStockFx = createEffect(async (id: string) => {
  const response = await stockApi.deleteStock(id);
  return { id, response };
});

export const reserveStockFx = createEffect(
  async ({
    pointId,
    productId,
    quantity,
  }: {
    pointId: string;
    productId: string;
    quantity: number;
  }) => {
    // Исправить: передавать объект, а не отдельные параметры
    const response = await stockApi.reserveStock({
      pointId,
      productId,
      quantity,
    });
    return response;
  }
);

export const releaseStockFx = createEffect(
  async ({
    pointId,
    productId,
    quantity,
  }: {
    pointId: string;
    productId: string;
    quantity: number;
  }) => {
    // Исправить: передавать объект, а не отдельные параметры
    const response = await stockApi.releaseStock({
      pointId,
      productId,
      quantity,
    });
    return response;
  }
); // Stores
export const $stock = createStore<Stock[]>([])
  .on(loadStockFx.doneData, (_, { stock }) => stock)
  .on(updateStockFx.doneData, (state, { stock }) =>
    state.map(s => (s._id === stock._id ? stock : s))
  )
  .on(createStockFx.doneData, (state, { stock }) => [...state, stock])
  .on(deleteStockFx.doneData, (state, { id }) =>
    state.filter(item => item._id !== id)
  );

export const $stockWithDetails = createStore<StockWithDetails[]>([])
  .on(loadStockWithDetailsFx.doneData, (_, { stock }) => stock)
  .on(loadStockByPointFx.doneData, (_, { stock }) => stock)
  .on(loadStockByProductFx.doneData, (_, { stock }) => stock);

export const $stockError = createStore<string | null>(null)
  .on(loadStockFx.fail, (_, { error }) => error.message)
  .on(updateStockFx.fail, (_, { error }) => error.message)
  .on(createStockFx.fail, (_, { error }) => error.message)
  .on(deleteStockFx.fail, (_, { error }) => error.message)
  .reset(loadStock, updateStock, createStock, deleteStock);

// Samples
sample({
  source: loadStock,
  target: loadStockFx,
});

sample({
  source: loadStockWithDetails,
  target: loadStockWithDetailsFx,
});

sample({
  source: loadStockByPoint,
  target: loadStockByPointFx,
});

sample({
  source: loadStockByProduct,
  target: loadStockByProductFx,
});

sample({
  source: updateStock,
  target: updateStockFx,
});

sample({
  source: createStock,
  target: createStockFx,
});

sample({
  source: deleteStock,
  target: deleteStockFx,
});

sample({
  source: reserveStock,
  target: reserveStockFx,
});

sample({
  source: releaseStock,
  target: releaseStockFx,
});

// Toast уведомления
sample({
  source: updateStockFx.done,
  fn: () => ({ message: 'Склад обновлен', type: 'success' as const }),
  target: showToast,
});

sample({
  source: updateStockFx.fail,
  fn: () => ({
    message: 'Ошибка при обновлении склада',
    type: 'error' as const,
  }),
  target: showToast,
});

sample({
  source: createStockFx.done,
  fn: () => ({ message: 'Товар добавлен на склад', type: 'success' as const }),
  target: showToast,
});

sample({
  source: createStockFx.fail,
  fn: () => ({
    message: 'Ошибка при добавлении товара на склад',
    type: 'error' as const,
  }),
  target: showToast,
});
