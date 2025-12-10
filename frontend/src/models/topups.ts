import {
  createEffect,
  createEvent,
  createStore,
  sample,
} from 'effector';
import { topUpsApi } from '../api/topups';
import type {
  CreateTopUpRequestPayload,
  ProcessTopUpRequestPayload,
  TopUpRequest,
  TopUpRequestStatus,
} from '../types/topup';
import { showToast } from '../components/layout/Toast/stores/toastStore.ts';
import { onSocketEvent } from '../lib/socket';
import { $currentUser, updateCurrentUserBalance } from './users.ts';

export const loadMyTopUpRequests = createEvent();
export const loadAdminTopUpRequests = createEvent<{ status?: TopUpRequestStatus } | void>();
export const submitTopUpRequest = createEvent<CreateTopUpRequestPayload>();
export const handleTopUpRequestDecision = createEvent<ProcessTopUpRequestPayload>();
export const topUpRequestRealtimeCreated = createEvent<TopUpRequest>();
export const topUpRequestRealtimeUpdated = createEvent<TopUpRequest>();

const sortByCreatedAtAsc = (list: TopUpRequest[]) =>
  [...list].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

const formatCurrency = (value: number) =>
  `${value.toLocaleString('ru-RU', { minimumFractionDigits: 0 })} баллов`;

if (typeof window !== 'undefined') {
  onSocketEvent('topups:created', topUpRequestRealtimeCreated);
  onSocketEvent('topups:updated', topUpRequestRealtimeUpdated);
}

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
  .on(createTopUpRequestFx.doneData, (state, { request }) => [request, ...state])
  .on(topUpRequestRealtimeCreated, (state, request) => [request, ...state])
  .on(topUpRequestRealtimeUpdated, (state, request) =>
    state.map(item => (item._id === request._id ? request : item))
  );

export const $adminTopUpRequests = createStore<TopUpRequest[]>([])
  .on(loadAdminTopUpRequestsFx.doneData, (_, requests) => sortByCreatedAtAsc(requests))
  .on(processTopUpRequestFx.doneData, (state, { request }) => {
    const index = state.findIndex(item => item._id === request._id);
    if (index === -1) {
      return sortByCreatedAtAsc([...state, request]);
    }
    const next = state.slice();
    next[index] = request;
    return next;
  })
  .on(topUpRequestRealtimeCreated, (state, request) => {
    if (state.some(item => item._id === request._id)) {
      return state;
    }
    return [...state, request];
  })
  .on(topUpRequestRealtimeUpdated, (state, request) =>
    state.map(item => (item._id === request._id ? request : item))
  );

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
  clock: processTopUpRequestFx.fail,
  fn: ({ error }) => ({
    message: error.message || 'Не удалось обновить заявку',
    type: 'error' as const,
  }),
  target: showToast,
});

const userTopUpStatusChanged = sample({
  source: {
    currentUser: $currentUser,
    myRequests: $myTopUpRequests,
  },
  clock: topUpRequestRealtimeUpdated,
  filter: ({ currentUser }, request) =>
    Boolean(
      currentUser &&
        currentUser.role === 'user' &&
        request.user_id === currentUser._id
    ),
  fn: ({ myRequests }, request) => ({
    request,
    previousStatus: myRequests.find(item => item._id === request._id)?.status,
  }),
});

sample({
  clock: userTopUpStatusChanged,
  filter: ({ previousStatus, request }) =>
    Boolean(
      previousStatus &&
        previousStatus !== request.status &&
        (request.status === 'approved' || request.status === 'rejected')
    ),
  fn: ({ request }) => {
    const isApproved = request.status === 'approved';
    const amountSuffix =
      isApproved && typeof request.amount_approved === 'number'
        ? ` на ${formatCurrency(request.amount_approved)}`
        : '';
    const noteText = request.note?.trim();
    const noteSuffix = noteText ? ` (${noteText})` : '';

    const toastPayload: Parameters<typeof showToast>[0] = {
      message: isApproved
        ? `Заявка на пополнение одобрена${amountSuffix}`
        : `Заявка на пополнение отклонена${noteSuffix}`,
      type: isApproved ? 'success' : 'error',
      persistent: true,
    };
    return toastPayload;
  },
  target: showToast,
});

sample({
  source: $currentUser,
  clock: topUpRequestRealtimeUpdated,
  filter: (currentUser, request) =>
    Boolean(
      currentUser &&
        request.status === 'approved' &&
        request.user_id === currentUser._id &&
        typeof request.user_info?.balance === 'number'
    ),
  fn: (_, request) => request.user_info?.balance as number,
  target: updateCurrentUserBalance,
});

