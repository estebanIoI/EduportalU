import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';
import { ConfiguracionEvaluacion, ConfiguracionEvaluacionInput, ConfiguracionEvaluacionUpdate, EstadoActivo } from '@/lib/types/evaluacionInsitu';

export const configuracionEvaluacionService = {
  getAll: async (): Promise<ApiResponse<ConfiguracionEvaluacion[]>> => {
    try {
      const response = await apiClient.get<ConfiguracionEvaluacion[]>('/configuracion-evaluacion');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getById: async (id: number): Promise<ApiResponse<ConfiguracionEvaluacion>> => {
    try {
      const response = await apiClient.get<ConfiguracionEvaluacion>(`/configuracion-evaluacion/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (
    data: Omit<ConfiguracionEvaluacionInput, 'ID'>
  ): Promise<ApiResponse<ConfiguracionEvaluacionInput>> => {
    try {
      const response = await apiClient.post<ConfiguracionEvaluacionInput>('/configuracion-evaluacion', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (
    id: number,
    data: Partial<ConfiguracionEvaluacionUpdate>
  ): Promise<ApiResponse<ConfiguracionEvaluacionUpdate>> => {
    try {
      const response = await apiClient.put<ConfiguracionEvaluacionUpdate>(`/configuracion-evaluacion/${id}`, data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete<null>(`/configuracion-evaluacion/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  updateEstado: async (estado: EstadoActivo): Promise<ApiResponse<EstadoActivo>> => {
    try {
      const response = await apiClient.patch<EstadoActivo>(
        `/configuracion-evaluacion/${estado.id}/estado`,
        estado
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  },
};
