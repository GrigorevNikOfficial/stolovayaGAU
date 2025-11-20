// stores/toastStore.ts
import { createEvent, createStore } from 'effector';

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
  .on(showToast, (_, toast) => {
    // Автоматически скрываем предыдущий таймер
    const timer = setTimeout(() => {
      hideToast();
    }, 3000);

    return {
      ...toast,
      isVisible: true,
      _timer: timer, // сохраняем таймер для очистки
    };
  })
  .on(hideToast, state => {
    if (state._timer) {
      clearTimeout(state._timer);
    }
    return { ...state, isVisible: false };
  });
