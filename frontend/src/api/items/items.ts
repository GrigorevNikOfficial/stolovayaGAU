import type {
  CreateItemRequest,
  Item,
  UpdateItemRequest,
} from '../../types/item';
import { httpClient } from '../http-client';

export const itemsApi = {
  // Получить все товары
  getItems: async (): Promise<Item[]> => {
    const response = await httpClient.get<{ items: Item[]; total: number }>(
      '/items'
    );
    return response.items;
  },

  // Получить товар по ID
  getItem: async (id: number): Promise<Item> => {
    return httpClient.get<Item>(`/items/${id}`);
  },

  // Создать товар
  createItem: async (item: CreateItemRequest): Promise<Item> => {
    const response = await httpClient.post<{ item: Item; message: string }>(
      '/items',
      item
    );
    return response.item;
  },

  // Обновить товар
  updateItem: async (item: UpdateItemRequest): Promise<Item> => {
    const response = await httpClient.put<{ item: Item; message: string }>(
      `/items/${item.id}`,
      item
    );
    return response.item;
  },

  // Частичное обновление товара
  patchItem: async (
    id: number,
    updates: Partial<UpdateItemRequest>
  ): Promise<Item> => {
    const response = await httpClient.patch<{ item: Item; message: string }>(
      `/items/${id}`,
      updates
    );
    return response.item;
  },

  // Удалить товар
  deleteItem: async (id: number): Promise<void> => {
    await httpClient.delete(`/items/${id}`);
  },

  // Получить товары по категории
  getItemsByCategory: async (category: string): Promise<Item[]> => {
    const response = await httpClient.get<{
      category: string;
      items: Item[];
      total: number;
    }>(`/items/category/${category}`);
    return response.items;
  },

  // Поиск товаров
  searchItems: async (query: string): Promise<Item[]> => {
    const response = await httpClient.get<{ items: Item[]; total: number }>(
      `/items/search?q=${encodeURIComponent(query)}`
    );
    return response.items;
  },
};
