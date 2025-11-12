import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types/category'; // Новый путь
import { httpClient } from './http-client';

export const categoriesApi = {
  // Получить все категории
  getCategories: async (): Promise<Category[]> => {
    const response = await httpClient.get<Category[]>('/categories');
    return response;
  },

  // Создать категорию (админ)
  createCategory: async (
    categoryData: CreateCategoryRequest
  ): Promise<{
    message: string;
    category: Category;
  }> => {
    const response = await httpClient.post<{
      message: string;
      category: Category;
    }>('/categories', categoryData);
    return response;
  },

  // Обновить категорию (админ)
  updateCategory: async (
    id: string,
    categoryData: UpdateCategoryRequest
  ): Promise<{
    message: string;
    category: Category;
  }> => {
    const response = await httpClient.put<{
      message: string;
      category: Category;
    }>(`/categories/${id}`, categoryData);
    return response;
  },

  // Удалить категорию (админ)
  deleteCategory: async (id: string): Promise<{ message: string }> => {
    const response = await httpClient.delete<{ message: string }>(
      `/categories/${id}`
    );
    return response;
  },
};
