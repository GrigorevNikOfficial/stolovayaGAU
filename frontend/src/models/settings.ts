// models/settings.ts
import { createEffect, createStore } from 'effector';
import { settings } from '../api/settings';
import type { DeliverySettings } from '../types/settings';

// События
export const fetchDeliverySettings = createEffect<
  void,
  DeliverySettings,
  Error
>();
export const updateDeliverySettings = createEffect<
  Partial<DeliverySettings>,
  DeliverySettings,
  Error
>();

// Стор
export const $deliverySettings = createStore<DeliverySettings>({
  deliveryEnabled: false,
  deliveryTimeStart: '',
  deliveryTimeEnd: '',
});

// Обработчики
$deliverySettings
  .on(fetchDeliverySettings.doneData, (_, settings) => settings)
  .on(updateDeliverySettings.doneData, (_, settings) => settings);

// Эффекты с правильными типами
fetchDeliverySettings.use(async () => {
  return await settings.getDeliverySettings();
});

updateDeliverySettings.use(async data => {
  return await settings.updateDeliverySettings(data);
});
