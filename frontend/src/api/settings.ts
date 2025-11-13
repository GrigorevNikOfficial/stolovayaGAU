// api/settingsApi.ts
import { httpClient } from './http-client';
import type { DeliverySettings } from '../types/settings';

export const settings = {
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
