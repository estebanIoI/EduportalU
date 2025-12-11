import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';
import { ConfiguracionPregunta, EstadoActivo } from '@/lib/types/evaluacionInsitu';

export const configuracionPreguntaService = {
  getAll: async (): Promise<ApiResponse<ConfiguracionPregunta[]>> => {
    try {
      const response = await apiClient.get<ConfiguracionPregunta[]>('/configuracion-preguntas');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getById: async (id: number): Promise<ApiResponse<ConfiguracionPregunta>> => {
    try {
      const response = await apiClient.get<ConfiguracionPregunta>(`/configuracion-preguntas/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getByConfiguracionId: async (configuracionId: number): Promise<ApiResponse<ConfiguracionPregunta[]>> => {
    try {
      const response = await apiClient.get<ConfiguracionPregunta[]>(
        `/configuracion-preguntas/configuracion/${configuracionId}`
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (
    data: Omit<ConfiguracionPregunta, 'ID'>
  ): Promise<ApiResponse<ConfiguracionPregunta>> => {
    try {
      const response = await apiClient.post<ConfiguracionPregunta>('/configuracion-preguntas', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (
    id: number,
    data: Partial<ConfiguracionPregunta>
  ): Promise<ApiResponse<ConfiguracionPregunta>> => {
    try {
      const response = await apiClient.put<ConfiguracionPregunta>(`/configuracion-preguntas/${id}`, data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  updateEstado: async (estado: EstadoActivo): Promise<ApiResponse<ConfiguracionPregunta>> => {
    try {
      const response = await apiClient.put<ConfiguracionPregunta>(
        `/configuracion-preguntas/${estado.id}/estado`,
        { activo: estado.activo }
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete<null>(`/configuracion-preguntas/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },
};
