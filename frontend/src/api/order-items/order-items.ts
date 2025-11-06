import type {
  CreateOrderItemRequest,
  OrderItem,
  UpdateOrderItemRequest,
} from '../../types/order-items';
import { httpClient } from '../http-client';

export const orderItemsApi = {
  // Получить все позиции заказов
  getOrderItems: async (): Promise<OrderItem[]> => {
    return httpClient.get<OrderItem[]>('/order-items');
  },

  // Получить позицию заказа по ID
  getOrderItem: async (id: number): Promise<OrderItem> => {
    return httpClient.get<OrderItem>(`/order-items/${id}`);
  },

  // Создать позицию заказа
  createOrderItem: async (
    orderItem: CreateOrderItemRequest
  ): Promise<OrderItem> => {
    return httpClient.post<OrderItem>('/order-items', orderItem);
  },

  // Обновить позицию заказа
  updateOrderItem: async (
    orderItem: UpdateOrderItemRequest
  ): Promise<OrderItem> => {
    return httpClient.put<OrderItem>(`/order-items/${orderItem.id}`, orderItem);
  },

  // Частичное обновление позиции заказа
  patchOrderItem: async (
    id: number,
    updates: Partial<UpdateOrderItemRequest>
  ): Promise<OrderItem> => {
    return httpClient.patch<OrderItem>(`/order-items/${id}`, updates);
  },

  // Удалить позицию заказа
  deleteOrderItem: async (id: number): Promise<void> => {
    await httpClient.delete(`/order-items/${id}`);
  },

  // Получить позиции по заказу
  getOrderItemsByOrder: async (orderId: number): Promise<OrderItem[]> => {
    return httpClient.get<OrderItem[]>(`/order-items/order/${orderId}`);
  },

  // Получить позиции по товару
  getOrderItemsByItem: async (itemId: number): Promise<OrderItem[]> => {
    return httpClient.get<OrderItem[]>(`/order-items/item/${itemId}`);
  },

  // Получить позиции по нескольким заказам
  getOrderItemsByOrders: async (orderIds: number[]): Promise<OrderItem[]> => {
    return httpClient.post<OrderItem[]>('/order-items/by-orders', { orderIds });
  },
};
