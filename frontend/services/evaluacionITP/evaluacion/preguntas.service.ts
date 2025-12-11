import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';
import { Pregunta } from '@/lib/types/evaluacionInsitu';

export const preguntasService = {
  getAll: async (): Promise<ApiResponse<Pregunta[]>> => {
    try {
      // Solicitar todas las preguntas con un límite mayor para asegurar que se obtengan todas
      const response = await apiClient.get<Pregunta[]>('/preguntas?limit=50');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getById: async (id: number): Promise<ApiResponse<Pregunta>> => {
    try {
      const response = await apiClient.get<Pregunta>(`/preguntas/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (
    data: Omit<Pregunta, 'ID'>
  ): Promise<ApiResponse<Pregunta>> => {
    try {
      const response = await apiClient.post<Pregunta>('/preguntas', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (
    id: number,
    data: Partial<Pregunta>
  ): Promise<ApiResponse<Pregunta>> => {
    try {
      const response = await apiClient.put<Pregunta>(`/preguntas/${id}`, data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete<null>(`/preguntas/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },
};
