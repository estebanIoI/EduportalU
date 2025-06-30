import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';
import { Roles } from '@/lib/types/evaluacionInsitu';

export const rolesService = {
  getAll: async (): Promise<ApiResponse<Roles[]>> => {
    try {
      const response = await apiClient.get<Roles[]>('/roles');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getById: async (id: number): Promise<ApiResponse<Roles>> => {
    try {
      const response = await apiClient.get<Roles>(`/roles/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (data: Omit<Roles, 'ID'>): Promise<ApiResponse<Roles>> => {
    try {
      const response = await apiClient.post<Roles>('/roles', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (id: number, data: Partial<Roles>): Promise<ApiResponse<Roles>> => {
    try {
      const response = await apiClient.put<Roles>(`/roles/${id}`, data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete<null>(`/roles/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  }
};