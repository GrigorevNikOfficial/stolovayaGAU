// api/stock.ts
// api/stock.ts
import type {
  Stock,
  StockWithDetails,
  UpdateStockRequest,
  CreateStockRequest,
  StockResponse,
  StockListResponse,
  StockWithDetailsListResponse,
  ReserveStockRequest,
  ReleaseStockRequest,
} from '../types/stock';
import { httpClient } from './http-client';

export const stockApi = {
  // Получить весь склад
  getStock: async (pointId?: string): Promise<StockListResponse> => {
    const params = pointId ? { pointId } : {};
    const response = await httpClient.get<StockListResponse>('/stock', {
      params,
    });
    return response;
  },

  // Получить склад с деталями товаров и точек
  getStockWithDetails: async (
    pointId?: string
  ): Promise<StockWithDetailsListResponse> => {
    const params = pointId ? { pointId } : {};
    const response = await httpClient.get<StockWithDetailsListResponse>(
      '/stock/with-details',
      { params }
    );
    return response;
  },

  // Получить склад по конкретной точке
  getStockByPoint: async (
    pointId: string
  ): Promise<StockWithDetailsListResponse> => {
    const response = await httpClient.get<StockWithDetailsListResponse>(
      `/stock/point/${pointId}`
    );
    return response;
  },

  // Получить склад по конкретному товару
  getStockByProduct: async (
    productId: string
  ): Promise<StockWithDetailsListResponse> => {
    const response = await httpClient.get<StockWithDetailsListResponse>(
      `/stock/product/${productId}`
    );
    return response;
  },

  // Получить конкретную запись склада по ID
  getStockItem: async (id: string): Promise<Stock> => {
    const response = await httpClient.get<Stock>(`/stock/${id}`);
    return response;
  },

  // Получить конкретную запись склада с деталями по ID
  getStockItemWithDetails: async (id: string): Promise<StockWithDetails> => {
    const response = await httpClient.get<StockWithDetails>(
      `/stock/${id}/with-details`
    );
    return response;
  },

  createStock: async (
    stockData: CreateStockRequest
  ): Promise<StockResponse> => {
    try {
      const response = await httpClient.post<StockResponse>(
        '/stock',
        stockData
      );
      return response;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error('Товар уже существует на складе этой точки');
      }
      throw error;
    }
  },

  // Обновить запись на складе
  updateStock: async (
    id: string,
    stockData: UpdateStockRequest
  ): Promise<StockResponse> => {
    const response = await httpClient.put<StockResponse>(
      `/stock/${id}`,
      stockData
    );
    return response;
  },

  // Удалить запись со склада
  deleteStock: async (id: string): Promise<{ message: string }> => {
    const response = await httpClient.delete<{ message: string }>(
      `/stock/${id}`
    );
    return response;
  },

  // Резервирование товара (для заказов)
  reserveStock: async (
    reserveData: ReserveStockRequest
  ): Promise<StockResponse> => {
    const response = await httpClient.post<StockResponse>(
      '/stock/reserve',
      reserveData
    );
    return response;
  },

  // Освобождение резерва товара (отмена заказа)
  releaseStock: async (
    releaseData: ReleaseStockRequest
  ): Promise<StockResponse> => {
    const response = await httpClient.post<StockResponse>(
      '/stock/release',
      releaseData
    );
    return response;
  },

  // Обновление количества товара (поступление на склад)
  updateStockQuantity: async (
    id: string,
    quantity: number
  ): Promise<StockResponse> => {
    const response = await httpClient.patch<StockResponse>(
      `/stock/${id}/quantity`,
      { quantity }
    );
    return response;
  },

  // Получить склад по комбинации точки и товара
  getStockByPointAndProduct: async (
    pointId: string,
    productId: string
  ): Promise<Stock> => {
    const response = await httpClient.get<Stock>(
      `/stock/point/${pointId}/product/${productId}`
    );
    return response;
  },

  // Массовое обновление склада
  bulkUpdateStock: async (
    updates: Array<{ id: string; data: UpdateStockRequest }>
  ): Promise<{ message: string; updated: number }> => {
    const response = await httpClient.post<{
      message: string;
      updated: number;
    }>('/stock/bulk-update', { updates });
    return response;
  },
};
