import { apiClient } from '@/lib/api';
import { ApiResponse, ApiError } from '@/lib/types/api.types';
import { ConfiguracionValoracion, EstadoActivo } from '@/lib/types/evaluacionInsitu';

export const configuracionValoracionService = {
  getAll: async (): Promise<ApiResponse<ConfiguracionValoracion[]>> => {
    try {
      const response = await apiClient.get<ConfiguracionValoracion[]>('/configuracion-valoracion');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getById: async (id: number): Promise<ApiResponse<ConfiguracionValoracion>> => {
    try {
      const response = await apiClient.get<ConfiguracionValoracion>(`/configuracion-valoracion/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (
    data: Omit<ConfiguracionValoracion, 'ID'>
  ): Promise<ApiResponse<ConfiguracionValoracion>> => {
    try {
      const response = await apiClient.post<ConfiguracionValoracion>('/configuracion-valoracion', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (
    id: number,
    data: Partial<ConfiguracionValoracion>
  ): Promise<ApiResponse<ConfiguracionValoracion>> => {
    try {
      const response = await apiClient.put<ConfiguracionValoracion>(`/configuracion-valoracion/${id}`, data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete<null>(`/configuracion-valoracion/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  updateEstado: async (estado: EstadoActivo): Promise<ApiResponse<EstadoActivo>> => {
    try {
      const response = await apiClient.patch<EstadoActivo>(
        `/configuracion-valoracion/${estado.id}/estado`,
        estado
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  },
};