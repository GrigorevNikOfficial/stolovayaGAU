import type {
  CreateOrderRequest,
  Order,
  UpdateOrderRequest,
} from '../../types/order';
import { httpClient } from '../http-client';

export const ordersApi = {
  // Получить все заказы
  getOrders: async (): Promise<Order[]> => {
    return httpClient.get<Order[]>('/orders');
  },

  // Получить заказ по ID
  getOrder: async (id: number): Promise<Order> => {
    return httpClient.get<Order>(`/orders/${id}`);
  },

  // Создать заказ
  createOrder: async (order: CreateOrderRequest): Promise<Order> => {
    return httpClient.post<Order>('/orders', order);
  },

  // Обновить заказ
  updateOrder: async (order: UpdateOrderRequest): Promise<Order> => {
    return httpClient.put<Order>(`/orders/${order.id}`, order);
  },

  // Частичное обновление заказа
  patchOrder: async (
    id: number,
    updates: Partial<UpdateOrderRequest>
  ): Promise<Order> => {
    return httpClient.patch<Order>(`/orders/${id}`, updates);
  },

  // Удалить заказ
  deleteOrder: async (id: number): Promise<void> => {
    await httpClient.delete(`/orders/${id}`);
  },

  // Получить заказы по пользователю
  getOrdersByUser: async (userId: number): Promise<Order[]> => {
    return httpClient.get<Order[]>(`/orders/user/${userId}`);
  },

  // Получить заказы по статусу
  getOrdersByStatus: async (status: Order['status']): Promise<Order[]> => {
    return httpClient.get<Order[]>(`/orders/status/${status}`);
  },

  // Поиск заказов
  searchOrders: async (query: string): Promise<Order[]> => {
    return httpClient.get<Order[]>(
      `/orders/search?q=${encodeURIComponent(query)}`
    );
  },
};
