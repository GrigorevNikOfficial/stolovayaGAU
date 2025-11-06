import type {
  CreateOrderRequest,
  Order,
  OrderWithDetails,
  UpdateOrderRequest,
} from '../../types/order';
import { httpClient } from '../http-client';

export const ordersApi = {
  // Получить все заказы (для админов) или свои заказы (для пользователей)
  getOrders: async (): Promise<{ orders: Order[] }> => {
    return httpClient.get<{ orders: Order[] }>('/orders');
  },

  // Получить заказ по ID
  getOrder: async (
    id: number
  ): Promise<{ order: OrderWithDetails; items: any[]; history: any[] }> => {
    return httpClient.get<{
      order: OrderWithDetails;
      items: any[];
      history: any[];
    }>(`/orders/${id}`);
  },

  // Создать заказ
  createOrder: async (
    order: CreateOrderRequest
  ): Promise<{
    message: string;
    order: Order;
    order_number: string;
  }> => {
    return httpClient.post<{
      message: string;
      order: Order;
      order_number: string;
    }>('/orders', order);
  },

  // Обновить статус заказа
  updateOrder: async (order: UpdateOrderRequest): Promise<Order> => {
    return httpClient.put<Order>(`/orders/${order.id}`, {
      status: order.status,
    });
  },

  // Получить историю заказа
  getOrderHistory: async (id: number): Promise<{ history: any[] }> => {
    return httpClient.get<{ history: any[] }>(`/orders/${id}/history`);
  },
};
