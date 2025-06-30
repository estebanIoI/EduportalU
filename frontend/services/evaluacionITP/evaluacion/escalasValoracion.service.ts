import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';
import { EscalaValoracion } from '@/lib/types/evaluacionInsitu';

export const escalasValoracionService = {
  getAll: async (): Promise<ApiResponse<EscalaValoracion[]>> => {
    try {
      const response = await apiClient.get<EscalaValoracion[]>('/escala-valoracion');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getById: async (id: number): Promise<ApiResponse<EscalaValoracion>> => {
    try {
      const response = await apiClient.get<EscalaValoracion>(`/escala-valoracion/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (
    data: Omit<EscalaValoracion, 'ID'>
  ): Promise<ApiResponse<EscalaValoracion>> => {
    try {
      const response = await apiClient.post<EscalaValoracion>('/escala-valoracion', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (
    id: number,
    data: Partial<EscalaValoracion>
  ): Promise<ApiResponse<EscalaValoracion>> => {
    try {
      const response = await apiClient.put<EscalaValoracion>(`/escala-valoracion/${id}`, data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete<null>(`/escala-valoracion/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  }
};