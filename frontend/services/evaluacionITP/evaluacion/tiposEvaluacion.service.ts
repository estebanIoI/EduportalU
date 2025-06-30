import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';
import { TipoEvaluacion, EstadoActivo, ConfiguracionResponse } from '@/lib/types/evaluacionInsitu';

export const tiposEvaluacionService = {
  getAll: async (): Promise<ApiResponse<TipoEvaluacion[]>> => {
    try {
      const response = await apiClient.get<TipoEvaluacion[]>('/tipos-evaluaciones');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getById: async (id: number): Promise<ApiResponse<TipoEvaluacion>> => {
    try {
      const response = await apiClient.get<TipoEvaluacion>(`/tipos-evaluaciones/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (data: Omit<TipoEvaluacion, 'ID'>): Promise<ApiResponse<TipoEvaluacion>> => {
    try {
      const response = await apiClient.post<TipoEvaluacion>('/tipos-evaluaciones', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (id: number, data: Partial<TipoEvaluacion>): Promise<ApiResponse<TipoEvaluacion>> => {
    try {
      const response = await apiClient.put<TipoEvaluacion>(`/tipos-evaluaciones/${id}`, data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete<null>(`/tipos-evaluaciones/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getConfiguracion: async (id: number): Promise<ApiResponse<ConfiguracionResponse>> => {
    try {
      const response = await apiClient.get<ConfiguracionResponse>(`/tipos-evaluaciones/configuracion/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  updateEstado: async (estado: EstadoActivo): Promise<ApiResponse<EstadoActivo>> => {
    try {
      const response = await apiClient.patch<EstadoActivo>(`/tipos-evaluaciones/${estado.id}/estado`, estado);
      return response;
    } catch (error: any) {
      throw error;
    }
  }
};