import type {
  CreateUserRequest,
  User,
  UpdateUserRequest,
} from '../../types/users';
import { httpClient } from '../http-client';

export const usersApi = {
  // Получить всех пользователей
  getUsers: async (): Promise<User[]> => {
    return httpClient.get<User[]>('/users');
  },

  // Получить пользователя по ID
  getUser: async (id: number): Promise<User> => {
    return httpClient.get<User>(`/users/${id}`);
  },

  // Создать пользователя
  createUser: async (user: CreateUserRequest): Promise<User> => {
    return httpClient.post<User>('/users', user);
  },

  // Обновить пользователя
  updateUser: async (user: UpdateUserRequest): Promise<User> => {
    return httpClient.put<User>(`/users/${user.id}`, user);
  },

  // Частичное обновление пользователя
  patchUser: async (
    id: number,
    updates: Partial<UpdateUserRequest>
  ): Promise<User> => {
    return httpClient.patch<User>(`/users/${id}`, updates);
  },

  // Удалить пользователя
  deleteUser: async (id: number): Promise<void> => {
    await httpClient.delete(`/users/${id}`);
  },

  // Поиск пользователей
  searchUsers: async (query: string): Promise<User[]> => {
    return httpClient.get<User[]>(
      `/users/search?q=${encodeURIComponent(query)}`
    );
  },

  // Получить пользователя по телефону
  getUserByPhone: async (phone: string): Promise<User> => {
    return httpClient.get<User>(`/users/phone/${phone}`);
  },

  // Получить пользователей по роли
  getUsersByRole: async (role: User['role']): Promise<User[]> => {
    return httpClient.get<User[]>(`/users/role/${role}`);
  },

  // Аутентификация пользователя
  login: async (
    phone: string,
    password: string
  ): Promise<{ user: User; token: string }> => {
    return httpClient.post<{ user: User; token: string }>('/users/login', {
      phone,
      password,
    });
  },

  // Выход из системы
  logout: async (): Promise<void> => {
    return httpClient.post('/users/logout');
  },

  // Обновление токена
  refreshToken: async (): Promise<{ user: User; token: string }> => {
    return httpClient.post<{ user: User; token: string }>(
      '/users/refresh-token'
    );
  },
};
