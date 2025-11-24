// models/points.ts
import { createEffect, createEvent, createStore, sample } from 'effector';
import { pointsApi } from '../api/points';
import type {
  Point,
  CreatePointRequest,
  UpdatePointRequest,
} from '../types/points';
import { showToast } from '../components/layout/Toast/stores/toastStore';

// Events
export const loadPoints = createEvent();
export const loadPoint = createEvent<string>();
export const loadPointsByManager = createEvent<string>();
export const loadPointsWithoutManager = createEvent<{ type?: string }>(); // НОВОЕ
export const createPoint = createEvent<CreatePointRequest>();
export const updatePoint = createEvent<{
  id: string;
  data: UpdatePointRequest;
}>();
export const deletePoint = createEvent<string>();

// Effects
export const loadPointsFx = createEffect(async () => {
  const response = await pointsApi.getPoints();
  return response;
});

export const loadPointFx = createEffect(async (id: string): Promise<Point> => {
  return await pointsApi.getPoint(id);
});

export const loadPointsByManagerFx = createEffect(async (managerId: string) => {
  const response = await pointsApi.getPointsByManager(managerId);
  return response;
});

export const loadPointsWithoutManagerFx = createEffect(
  async (params: { type?: string }) => {
    const response = await pointsApi.getPointsWithoutManager(params.type);
    return response;
  }
);

export const createPointFx = createEffect(async (data: CreatePointRequest) => {
  const response = await pointsApi.createPoint(data);
  return response;
});

export const updatePointFx = createEffect(
  async ({ id, data }: { id: string; data: UpdatePointRequest }) => {
    const response = await pointsApi.updatePoint(id, data);
    return response;
  }
);

export const deletePointFx = createEffect(async (id: string) => {
  const response = await pointsApi.deletePoint(id);
  return { id, response };
});

// Stores
export const $points = createStore<Point[]>([])
  .on(loadPointsFx.doneData, (_, { points }) => points)
  .on(loadPointsByManagerFx.doneData, (_, { points }) => points)
  .on(loadPointsWithoutManagerFx.doneData, (_, { points }) => points)
  .on(createPointFx.doneData, (state, { point }) => [...state, point])
  .on(updatePointFx.doneData, (state, { point }) =>
    state.map(p => (p._id === point._id ? point : p))
  )
  .on(deletePointFx.doneData, (state, { id }) =>
    state.filter(point => point._id !== id)
  );

export const $currentPoint = createStore<Point | null>(null)
  .on(loadPointFx.doneData, (_, point) => point)
  .reset([loadPoints, loadPointsByManager, loadPointsWithoutManager]);

export const $pointsError = createStore<string | null>(null)
  .on(loadPointsFx.fail, (_, { error }) => error.message)
  .on(createPointFx.fail, (_, { error }) => error.message)
  .on(updatePointFx.fail, (_, { error }) => error.message)
  .on(deletePointFx.fail, (_, { error }) => error.message)
  .reset([loadPoints, createPoint, updatePoint, deletePoint]);

// Samples
sample({
  source: loadPoints,
  target: loadPointsFx,
});

sample({
  source: loadPoint,
  target: loadPointFx,
});

sample({
  source: loadPointsByManager,
  target: loadPointsByManagerFx,
});

sample({
  source: loadPointsWithoutManager,
  target: loadPointsWithoutManagerFx,
});

sample({
  source: createPoint,
  target: createPointFx,
});

sample({
  source: updatePoint,
  target: updatePointFx,
});

sample({
  source: deletePoint,
  target: deletePointFx,
});

// Toast уведомления
sample({
  source: createPointFx.done,
  fn: () => ({ message: 'Точка успешно создана', type: 'success' as const }),
  target: showToast,
});

sample({
  source: createPointFx.fail,
  fn: () => ({ message: 'Ошибка при создании точки', type: 'error' as const }),
  target: showToast,
});

sample({
  source: updatePointFx.done,
  fn: () => ({ message: 'Точка успешно обновлена', type: 'success' as const }),
  target: showToast,
});

sample({
  source: updatePointFx.fail,
  fn: () => ({
    message: 'Ошибка при обновлении точки',
    type: 'error' as const,
  }),
  target: showToast,
});

sample({
  source: deletePointFx.done,
  fn: () => ({ message: 'Точка успешно удалена', type: 'success' as const }),
  target: showToast,
});
