import type {
  User,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from '../types/user';
import { httpClient } from './http-client';

export const usersApi = {
  register: async (
    userData: RegisterRequest
  ): Promise<{
    message: string;
    user: User;
    token: string;
  }> => {
    const response = await httpClient.post<{
      message: string;
      user: User;
      token: string;
    }>('/users/register', userData);
    return response;
  },

  // Вход
  login: async (
    credentials: LoginRequest
  ): Promise<{
    message: string;
    user: User;
    token: string;
  }> => {
    const response = await httpClient.post<{
      message: string;
      user: User;
      token: string;
    }>('/users/login', credentials);
    return response;
  },

  // Получить профиль
  getMe: async (): Promise<{ user: User }> => {
    const response = await httpClient.get<{ user: User }>('/users/me');
    return response;
  },

  // Обновить профиль
  updateProfile: async (
    userData: UpdateProfileRequest
  ): Promise<{
    message: string;
    user: User;
  }> => {
    const response = await httpClient.put<{
      message: string;
      user: User;
    }>('/users/profile', userData);
    return response;
  },

  // Получить всех пользователей (админ)
  getUsers: async (): Promise<{ users: User[] }> => {
    const response = await httpClient.get<{ users: User[] }>('/users');
    return response;
  },

  // Обновить роль пользователя (админ)
  updateUserRole: async (
    id: string,
    role: 'user' | 'admin'
  ): Promise<{
    message: string;
    user: User;
  }> => {
    const response = await httpClient.put<{
      message: string;
      user: User;
    }>(`/users/${id}/role`, { role });
    return response;
  },

  // Обновить аватар пользователя
  uploadAvatar: async (
    id: string,
    file: File
  ): Promise<{
    message: string;
    user: User;
  }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await httpClient.patch<{
      message: string;
      user: User;
    }>(`/users/${id}/avatar`, formData);
    return response;
  },
};
