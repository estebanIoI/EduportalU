import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';
import { UserRolesRequest, UserRoles, User } from '@/lib/types/evaluacionInsitu';

export const userRolesService = {
  getAll: async (): Promise<ApiResponse<UserRoles[]>> => {
    try {
      const response = await apiClient.get<UserRoles[]>('/user-roles');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  SearchUser: async (username: string): Promise<ApiResponse<User>> => {
    try {
      const response = await apiClient.get<User>(`/user-roles/search/${username}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getById: async (userId: number): Promise<ApiResponse<UserRoles>> => {
    try {
      const response = await apiClient.get<UserRoles>(`/user-roles/${userId}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (data: UserRolesRequest): Promise<ApiResponse<UserRoles>> => {
    try {
      const response = await apiClient.post<UserRoles>('/user-roles', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (id: number, data: Partial<UserRolesRequest>): Promise<ApiResponse<UserRoles>> => {
    try {
      const response = await apiClient.put<UserRoles>(`/user-roles/${id}`, data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete<null>(`/user-roles/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  }
};