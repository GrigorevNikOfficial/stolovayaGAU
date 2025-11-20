import type {
  CreateOrderRequest,
  Order,
  OrderHistory,
  OrderWithDetails,
  UpdateOrderRequest,
} from '../types/order';
import { httpClient } from './http-client.ts';

export const ordersApi = {
  // Получить все заказы
  getOrders: async (): Promise<{
    orders: Order[];
    totalPages?: number;
    currentPage?: number;
    total?: number;
  }> => {
    const response = await httpClient.get<{
      orders: Order[];
      totalPages?: number;
      currentPage?: number;
      total?: number;
    }>('/orders');
    return response;
  },

  // Получить заказы текущего пользователя
  getMyOrders: async (): Promise<{ orders: Order[] }> => {
    const response = await httpClient.get<{ orders: Order[] }>(
      '/orders/my-orders'
    );
    return response;
  },

  // Получить заказ по ID
  getOrder: async (id: string): Promise<OrderWithDetails> => {
    // id теперь string
    const response = await httpClient.get<OrderWithDetails>(`/orders/${id}`);
    return response;
  },

  // Создать заказ
  createOrder: async (
    order: CreateOrderRequest
  ): Promise<{
    message: string;
    order: Order;
    order_number: string;
    balance: number;
  }> => {
    const response = await httpClient.post<{
      message: string;
      order: Order;
      order_number: string;
      balance: number;
    }>('/orders', order);
    return response;
  },

  // Обновить статус заказа
  updateOrderStatus: async (
    order: UpdateOrderRequest
  ): Promise<{ order: Order; balance?: number | null }> => {
    const response = await httpClient.put<{
      order: Order;
      balance?: number | null;
    }>(`/orders/${order.id}/status`, {
      status: order.status,
    });
    return response;
  },

  // Обновить заказ (для admin и storeManager)
  updateOrder: async (
    order: UpdateOrderRequest
  ): Promise<{
    message: string;
    order: Order;
    balance?: number | null;
  }> => {
    const updateData: any = {};
    if (order.status !== undefined) updateData.status = order.status;
    if (order.delivery_method !== undefined)
      updateData.delivery_method = order.delivery_method;
    if (order.table_number !== undefined)
      updateData.table_number = order.table_number;
    if (order.delivery_address !== undefined)
      updateData.delivery_address = order.delivery_address;

    const response = await httpClient.put<{
      message: string;
      order: Order;
      balance?: number | null;
    }>(`/orders/${order.id}`, updateData);
    return response;
  },

  // Получить историю заказа
  getOrderHistory: async (id: string): Promise<{ history: OrderHistory[] }> => {
    const response = await httpClient.get<{ history: OrderHistory[] }>(
      `/orders/${id}/history`
    );
    return response;
  },
};
