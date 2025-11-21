// api/settingsApi.ts
import type { DeliverySettings } from '../types/settings';
import { httpClient } from './http-client';

export const settingsApi = {
  getDeliverySettings: async (): Promise<DeliverySettings> => {
    const response =
      await httpClient.get<DeliverySettings>('/settings/delivery');
    return response;
  },

  updateDeliverySettings: async (
    data: Partial<DeliverySettings>
  ): Promise<DeliverySettings> => {
    const response = await httpClient.put<DeliverySettings>(
      '/settings/delivery',
      data
    );
    return response;
  },
};

// Оставляем старый экспорт для совместимости
export const settings = settingsApi;
