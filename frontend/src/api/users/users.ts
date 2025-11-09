import type {
  CreateUserRequest,
  User,
  UpdateUserRequest,
} from '../../types/users';
import { httpClient } from '../http-client';
import { adaptUserFromBackend, adaptUserToBackend } from '../../types/users';

export const usersApi = {
  // Регистрация пользователя
  register: async (
    userData: CreateUserRequest
  ): Promise<{ user: User; token: string }> => {
    const backendData = adaptUserToBackend(userData);
    const response = await httpClient.post<{
      user: any;
      token: string;
      message: string;
    }>('/auth/register', backendData);

    return {
      user: adaptUserFromBackend(response.user),
      token: response.token,
    };
  },

  // Логин пользователя
  login: async (
    phone: string,
    password: string
  ): Promise<{ user: User; token: string }> => {
    const response = await httpClient.post<{
      user: any;
      token: string;
      message: string;
    }>('/auth/login', {
      phone,
      password,
    });

    return {
      user: adaptUserFromBackend(response.user),
      token: response.token,
    };
  },

  // Получить текущего пользователя
  getMe: async (): Promise<User> => {
    const response = await httpClient.get<{ user: any }>('/auth/me');
    return adaptUserFromBackend(response.user);
  },

  // Получить всех пользователей
  getUsers: async (): Promise<User[]> => {
    const users = await httpClient.get<any[]>('/users');
    return users.map(adaptUserFromBackend);
  },

  // Получить пользователя по ID
  getUser: async (id: number): Promise<User> => {
    const user = await httpClient.get<any>(`/users/${id}`);
    return adaptUserFromBackend(user);
  },

  // Создать пользователя (админ)
  createUser: async (user: CreateUserRequest): Promise<User> => {
    const backendData = adaptUserToBackend(user);
    const response = await httpClient.post<any>('/users', backendData);
    return adaptUserFromBackend(response);
  },

  // Обновить пользователя
  updateUser: async (user: UpdateUserRequest): Promise<User> => {
    const backendData = {
      first_name: user.firstName,
      last_name: user.lastName,
      phone: user.phone,
      password: user.password,
      role: user.role,
    };
    const response = await httpClient.put<any>(
      `/users/${user.id}`,
      backendData
    );
    return adaptUserFromBackend(response);
  },

  // Частичное обновление пользователя
  patchUser: async (
    id: number,
    updates: Partial<UpdateUserRequest>
  ): Promise<User> => {
    const backendData: any = {};
    if (updates.firstName) backendData.first_name = updates.firstName;
    if (updates.lastName) backendData.last_name = updates.lastName;
    if (updates.phone) backendData.phone = updates.phone;
    if (updates.password) backendData.password = updates.password;
    if (updates.role) backendData.role = updates.role;

    const response = await httpClient.patch<any>(`/users/${id}`, backendData);
    return adaptUserFromBackend(response);
  },

  // Удалить пользователя
  deleteUser: async (id: number): Promise<void> => {
    await httpClient.delete(`/users/${id}`);
  },

  // Поиск пользователей
  searchUsers: async (query: string): Promise<User[]> => {
    const users = await httpClient.get<any[]>(
      `/users/search?q=${encodeURIComponent(query)}`
    );
    return users.map(adaptUserFromBackend);
  },

  // Получить пользователя по телефону
  getUserByPhone: async (phone: string): Promise<User> => {
    const user = await httpClient.get<any>(`/users/phone/${phone}`);
    return adaptUserFromBackend(user);
  },

  // Получить пользователей по роли
  getUsersByRole: async (role: User['role']): Promise<User[]> => {
    const users = await httpClient.get<any[]>(`/users/role/${role}`);
    return users.map(adaptUserFromBackend);
  },

  // Выход из системы
  logout: async (): Promise<void> => {
    await httpClient.post('/auth/logout');
  },
};
