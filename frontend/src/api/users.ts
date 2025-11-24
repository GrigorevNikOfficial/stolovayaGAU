// api/users.ts
import type {
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  User,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
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

  getMe: async (): Promise<{ user: User }> => {
    const response = await httpClient.get<{ user: User }>('/users/me');
    return response;
  },

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

  getUsers: async (): Promise<{ users: User[] }> => {
    const response = await httpClient.get<{ users: User[] }>('/users');
    return response;
  },

  updateUserRole: async (
    id: string,
    role: 'user' | 'admin' | 'canteenManager' | 'storeManager',
    point_id?: string
  ): Promise<{
    message: string;
    user: User;
  }> => {
    const response = await httpClient.put<{
      message: string;
      user: User;
    }>(`/users/${id}/role`, { role, point_id });
    return response;
  },

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

  topUpBalance: async (
    id: string,
    amount: number
  ): Promise<{
    message: string;
    user: User;
  }> => {
    const response = await httpClient.post<{
      message: string;
      user: User;
    }>(`/users/${id}/balance/top-up`, { amount });
    return response;
  },

  createEmployee: async (
    employeeData: CreateEmployeeRequest
  ): Promise<{
    message: string;
    user: User;
  }> => {
    const response = await httpClient.post<{
      message: string;
      user: User;
    }>('/users/employees', employeeData);
    return response;
  },

  updateEmployee: async (
    id: string,
    employeeData: UpdateEmployeeRequest
  ): Promise<{
    message: string;
    user: User;
  }> => {
    const response = await httpClient.put<{
      message: string;
      user: User;
    }>(`/users/${id}`, employeeData);
    return response;
  },

  deleteUser: async (
    id: string
  ): Promise<{
    message: string;
  }> => {
    const response = await httpClient.delete<{
      message: string;
    }>(`/users/${id}`);
    return response;
  },
};
