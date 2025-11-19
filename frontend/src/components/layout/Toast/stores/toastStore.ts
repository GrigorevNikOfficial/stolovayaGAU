// stores/toastStore.ts
import { createEvent, createStore, sample } from 'effector';

// События
export const showToast = createEvent<{
  message: string;
  type: 'success' | 'error';
}>();
export const hideToast = createEvent();

// Стор
export const $toast = createStore<{
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
}>({
  message: '',
  type: 'success',
  isVisible: false,
})
  .on(showToast, (_, toast) => ({ ...toast, isVisible: true }))
  .on(hideToast, state => ({ ...state, isVisible: false }));

// Автоскрытие через 3 секунды
sample({
  clock: showToast,
  target: hideToast,
  delay: 3000,
});
