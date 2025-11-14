import type {
  Item,
  /* Category, */
  CreateItemRequest,
  UpdateItemRequest,
} from '../types/item';
import { httpClient } from './http-client';

export const itemsApi = {
  // Получить все товары
  getItems: async (params?: {
    category_slug?: string;
    available?: string;
  }): Promise<{ items: Item[]; total: number }> => {
    const response = await httpClient.get<{ items: Item[]; total: number }>(
      '/items',
      { params }
    );
    return response;
  },

  // Получить товар по ID
  getItem: async (id: string): Promise<Item> => {
    const response = await httpClient.get<Item>(`/items/${id}`);
    return response;
  },

  // Получить товары по категории
  getItemsByCategory: async (
    category_slug: string
  ): Promise<{
    category: string;
    items: Item[];
    total: number;
  }> => {
    const response = await httpClient.get<{
      category: string;
      items: Item[];
      total: number;
    }>(`/items/category/${category_slug}`);
    return response;
  },

  // Создать товар (админ)
  createItem: async (
    itemData: CreateItemRequest
  ): Promise<{
    message: string;
    item: Item;
  }> => {
    const response = await httpClient.post<{
      message: string;
      item: Item;
    }>('/items', itemData);
    return response;
  },

  // Обновить товар (админ)
  updateItem: async (
    id: string,
    itemData: UpdateItemRequest
  ): Promise<{
    message: string;
    item: Item;
  }> => {
    const response = await httpClient.put<{
      message: string;
      item: Item;
    }>(`/items/${id}`, itemData);
    return response;
  },

  // Удалить товар (админ)
  deleteItem: async (id: string): Promise<{ message: string }> => {
    const response = await httpClient.delete<{ message: string }>(
      `/items/${id}`
    );
    return response;
  },

  // Загрузить изображение для товара
  uploadItemImage: async (
    id: string,
    file: File
  ): Promise<{
    message: string;
    item: Item;
  }> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await httpClient.post<{
      message: string;
      item: Item;
    }>(`/items/${id}/image`, formData);
    return response;
  },
};
