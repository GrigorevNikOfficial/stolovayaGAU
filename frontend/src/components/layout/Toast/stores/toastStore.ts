// stores/toastStore.ts
import { createEvent, createStore } from 'effector';

// События
export const showToast = createEvent<{
  message: string;
  type: 'success' | 'error';
  persistent?: boolean;
  durationMs?: number;
}>();
export const hideToast = createEvent();

// Store
export const $toast = createStore<{
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
  persistent?: boolean;
  _timer?: ReturnType<typeof setTimeout> | null;
}>({
  message: '',
  type: 'success',
  isVisible: false,
  persistent: false,
  _timer: null,
})
  .on(showToast, (state, toast) => {
    if (state._timer) {
      clearTimeout(state._timer);
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!toast.persistent) {
      timer = setTimeout(() => {
        hideToast();
      }, toast.durationMs ?? 3000);
    }

    return {
      ...state,
      ...toast,
      isVisible: true,
      _timer: timer,
    };
  })
  .on(hideToast, state => {
    if (state._timer) {
      clearTimeout(state._timer);
    }
    return { ...state, isVisible: false, _timer: null };
  });
