import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';
import { AspectoEvaluacion } from '@/lib/types/evaluacionInsitu';

export const aspectosEvaluacionService = {
  getAll: async (): Promise<ApiResponse<AspectoEvaluacion[]>> => {
    try {
      const response = await apiClient.get<AspectoEvaluacion[]>('/aspectos-evaluacion');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getById: async (id: number): Promise<ApiResponse<AspectoEvaluacion>> => {
    try {
      const response = await apiClient.get<AspectoEvaluacion>(`/aspectos-evaluacion/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (
    data: Omit<AspectoEvaluacion, 'ID'>
  ): Promise<ApiResponse<AspectoEvaluacion>> => {
    try {
      const response = await apiClient.post<AspectoEvaluacion>('/aspectos-evaluacion', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (
    id: number,
    data: Partial<AspectoEvaluacion>
  ): Promise<ApiResponse<AspectoEvaluacion>> => {
    try {
      const response = await apiClient.put<AspectoEvaluacion>(`/aspectos-evaluacion/${id}`, data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete<null>(`/aspectos-evaluacion/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  }
};