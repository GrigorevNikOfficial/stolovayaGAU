import type {
  CreateItemRequest,
  Item,
  UpdateItemRequest,
} from '../../types/item';
import { httpClient } from '../http-client';

export const itemsApi = {
  // Получить все товары
  getItems: async (): Promise<Item[]> => {
    return httpClient.get<Item[]>('/items');
  },

  // Получить товар по ID
  getItem: async (id: number): Promise<Item> => {
    return httpClient.get<Item>(`/items/${id}`);
  },

  // Создать товар
  createItem: async (item: CreateItemRequest): Promise<Item> => {
    return httpClient.post<Item>('/items', item);
  },

  // Обновить товар
  updateItem: async (item: UpdateItemRequest): Promise<Item> => {
    return httpClient.put<Item>(`/items/${item.id}`, item);
  },

  // Частичное обновление товара
  patchItem: async (
    id: number,
    updates: Partial<UpdateItemRequest>
  ): Promise<Item> => {
    return httpClient.patch<Item>(`/items/${id}`, updates);
  },

  // Удалить товар
  deleteItem: async (id: number): Promise<void> => {
    await httpClient.delete(`/items/${id}`);
  },

  // Получить товары по категории
  getItemsByCategory: async (category: string): Promise<Item[]> => {
    return httpClient.get<Item[]>(`/items/category/${category}`);
  },

  // Поиск товаров
  searchItems: async (query: string): Promise<Item[]> => {
    return httpClient.get<Item[]>(
      `/items/search?q=${encodeURIComponent(query)}`
    );
  },
};
