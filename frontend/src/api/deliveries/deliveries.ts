import type {
  CreateDeliveryRequest,
  Delivery,
  UpdateDeliveryRequest,
} from '../../types/deliveries';
import { httpClient } from '../http-client';

export const deliveriesApi = {
  // Получить все доставки
  getDeliveries: async (): Promise<Delivery[]> => {
    return httpClient.get<Delivery[]>('/deliveries');
  },

  // Получить доставку по ID
  getDelivery: async (id: number): Promise<Delivery> => {
    return httpClient.get<Delivery>(`/deliveries/${id}`);
  },

  // Создать доставку
  createDelivery: async (
    delivery: CreateDeliveryRequest
  ): Promise<Delivery> => {
    return httpClient.post<Delivery>('/deliveries', delivery);
  },

  // Обновить доставку
  updateDelivery: async (
    delivery: UpdateDeliveryRequest
  ): Promise<Delivery> => {
    return httpClient.put<Delivery>(`/deliveries/${delivery.id}`, delivery);
  },

  // Частичное обновление доставки
  patchDelivery: async (
    id: number,
    updates: Partial<UpdateDeliveryRequest>
  ): Promise<Delivery> => {
    return httpClient.patch<Delivery>(`/deliveries/${id}`, updates);
  },

  // Удалить доставку
  deleteDelivery: async (id: number): Promise<void> => {
    await httpClient.delete(`/deliveries/${id}`);
  },

  // Получить доставки по заказу
  getDeliveriesByOrder: async (orderId: number): Promise<Delivery[]> => {
    return httpClient.get<Delivery[]>(`/deliveries/order/${orderId}`);
  },

  // Получить доставки по статусу
  getDeliveriesByStatus: async (
    status: Delivery['status']
  ): Promise<Delivery[]> => {
    return httpClient.get<Delivery[]>(`/deliveries/status/${status}`);
  },

  // Получить доставки по дате
  getDeliveriesByDate: async (date: number): Promise<Delivery[]> => {
    const startOfDay = new Date(date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(date).setHours(23, 59, 59, 999);

    return httpClient.get<Delivery[]>(
      `/deliveries/date?start=${startOfDay}&end=${endOfDay}`
    );
  },

  // Получить доставки по трек-номеру
  getDeliveryByTrackingNumber: async (
    trackingNumber: number
  ): Promise<Delivery> => {
    return httpClient.get<Delivery>(`/deliveries/tracking/${trackingNumber}`);
  },

  // Поиск доставок по адресу
  searchDeliveries: async (query: string): Promise<Delivery[]> => {
    return httpClient.get<Delivery[]>(
      `/deliveries/search?q=${encodeURIComponent(query)}`
    );
  },
};
