// api/points.ts
import type {
  Point,
  CreatePointRequest,
  UpdatePointRequest,
} from '../types/points';
import { httpClient } from './http-client';

export const pointsApi = {
  getPoints: async (): Promise<{ points: Point[]; total: number }> => {
    const response = await httpClient.get<{ points: Point[]; total: number }>(
      '/points'
    );
    return response;
  },

  getPoint: async (id: string): Promise<Point> => {
    const response = await httpClient.get<Point>(`/points/${id}`);
    return response;
  },

  getPointsByManager: async (
    managerId: string
  ): Promise<{ points: Point[]; total: number }> => {
    const response = await httpClient.get<{ points: Point[]; total: number }>(
      `/points/manager/${managerId}`
    );
    return response;
  },

  getPointsWithoutManager: async (
    type?: string
  ): Promise<{ points: Point[]; total: number }> => {
    const params = type ? { type } : {};
    const response = await httpClient.get<{ points: Point[]; total: number }>(
      '/points/without-manager',
      { params }
    );
    return response;
  },

  createPoint: async (
    pointData: CreatePointRequest
  ): Promise<{ message: string; point: Point }> => {
    const response = await httpClient.post<{ message: string; point: Point }>(
      '/points',
      pointData
    );
    return response;
  },

  updatePoint: async (
    id: string,
    pointData: UpdatePointRequest
  ): Promise<{ message: string; point: Point }> => {
    const response = await httpClient.put<{ message: string; point: Point }>(
      `/points/${id}`,
      pointData
    );
    return response;
  },

  deletePoint: async (id: string): Promise<{ message: string }> => {
    const response = await httpClient.delete<{ message: string }>(
      `/points/${id}`
    );
    return response;
  },
};
