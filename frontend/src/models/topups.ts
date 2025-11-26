import { createEffect, createEvent, createStore, sample } from 'effector';
import { topUpsApi } from '../api/topups';
import type {
  CreateTopUpRequestPayload,
  ProcessTopUpRequestPayload,
  TopUpRequest,
  TopUpRequestStatus,
} from '../types/topup';
import { showToast } from '../components/layout/Toast/stores/toastStore.ts';

export const loadMyTopUpRequests = createEvent();
export const loadAdminTopUpRequests = createEvent<{
  status?: TopUpRequestStatus;
} | void>();
export const submitTopUpRequest = createEvent<CreateTopUpRequestPayload>();
export const handleTopUpRequestDecision =
  createEvent<ProcessTopUpRequestPayload>();

export const loadMyTopUpRequestsFx = createEffect(async () => {
  const response = await topUpsApi.getMyRequests();
  return response.requests;
});

export const loadAdminTopUpRequestsFx = createEffect(
  async (params?: { status?: TopUpRequestStatus }) => {
    const response = await topUpsApi.getAllRequests(params);
    return response.requests;
  }
);

export const createTopUpRequestFx = createEffect(
  async (payload: CreateTopUpRequestPayload) => {
    return await topUpsApi.createRequest(payload);
  }
);

export const processTopUpRequestFx = createEffect(
  async (payload: ProcessTopUpRequestPayload) => {
    return await topUpsApi.processRequest(payload);
  }
);

export const $myTopUpRequests = createStore<TopUpRequest[]>([])
  .on(loadMyTopUpRequestsFx.doneData, (_, requests) => requests)
  .on(createTopUpRequestFx.doneData, (state, { request }) => [
    request,
    ...state,
  ]);

export const $adminTopUpRequests = createStore<TopUpRequest[]>([])
  .on(loadAdminTopUpRequestsFx.doneData, (_, requests) => requests)
  .on(processTopUpRequestFx.doneData, (state, { request }) => {
    const index = state.findIndex(item => item._id === request._id);
    if (index === -1) {
      return [request, ...state];
    }
    return state.map(item => (item._id === request._id ? request : item));
  });

export const $myTopUpRequestsLoading = createStore(false).on(
  loadMyTopUpRequestsFx.pending,
  (_, pending) => pending
);

export const $adminTopUpRequestsLoading = createStore(false).on(
  loadAdminTopUpRequestsFx.pending,
  (_, pending) => pending
);

export const $isSubmittingTopUp = createStore(false).on(
  createTopUpRequestFx.pending,
  (_, pending) => pending
);

export const $isProcessingTopUp = createStore(false).on(
  processTopUpRequestFx.pending,
  (_, pending) => pending
);

sample({
  clock: loadMyTopUpRequests,
  target: loadMyTopUpRequestsFx,
});

sample({
  clock: loadAdminTopUpRequests,
  fn: params => params,
  target: loadAdminTopUpRequestsFx,
});

sample({
  clock: submitTopUpRequest,
  target: createTopUpRequestFx,
});

sample({
  clock: handleTopUpRequestDecision,
  target: processTopUpRequestFx,
});

sample({
  clock: createTopUpRequestFx.done,
  fn: () => ({
    message: 'Заявка на пополнение отправлена',
    type: 'success' as const,
  }),
  target: showToast,
});

sample({
  clock: createTopUpRequestFx.fail,
  fn: ({ error }) => ({
    message: error.message || 'Не удалось отправить заявку',
    type: 'error' as const,
  }),
  target: showToast,
});

sample({
  clock: processTopUpRequestFx.done,
  fn: ({ result }) => ({
    message: result.message,
    type: 'success' as const,
  }),
  target: showToast,
});

sample({
  clock: processTopUpRequestFx.fail,
  fn: ({ error }) => ({
    message: error.message || 'Не удалось обновить заявку',
    type: 'error' as const,
  }),
  target: showToast,
});
