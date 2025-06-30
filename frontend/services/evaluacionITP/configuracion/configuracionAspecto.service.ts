import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';
import { ConfiguracionAspecto, EstadoActivo } from '@/lib/types/evaluacionInsitu';

export const configuracionAspectoService = {
  getAll: async (): Promise<ApiResponse<ConfiguracionAspecto[]>> => {
    try {
      const response = await apiClient.get<ConfiguracionAspecto[]>('/configuracion-aspecto');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getById: async (id: number): Promise<ApiResponse<ConfiguracionAspecto>> => {
    try {
      const response = await apiClient.get<ConfiguracionAspecto>(`/configuracion-aspecto/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (
    data: Omit<ConfiguracionAspecto, 'ID'>
  ): Promise<ApiResponse<ConfiguracionAspecto>> => {
    try {
      const response = await apiClient.post<ConfiguracionAspecto>('/configuracion-aspecto', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (
    id: number,
    data: Partial<ConfiguracionAspecto>
  ): Promise<ApiResponse<ConfiguracionAspecto>> => {
    try {
      const response = await apiClient.put<ConfiguracionAspecto>(`/configuracion-aspecto/${id}`, data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete<null>(`/configuracion-aspecto/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  updateEstado: async (estado: EstadoActivo): Promise<ApiResponse<EstadoActivo>> => {
    try {
      const response = await apiClient.patch<EstadoActivo>(
        `/configuracion-aspecto/${estado.id}/estado`,
        estado
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  },
};