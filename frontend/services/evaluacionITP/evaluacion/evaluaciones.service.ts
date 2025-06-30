import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';
import { Evaluacion, BulkEvaluciones, BulkEvaluacionesResponse } from '@/lib/types/evaluacionInsitu';

export const evaluacionesService = {
  getAll: async (): Promise<ApiResponse<Evaluacion[]>> => {
    try {
      const response = await apiClient.get<Evaluacion[]>('/evaluaciones');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getById: async (id: number): Promise<ApiResponse<Evaluacion>> => {
    try {
      const response = await apiClient.get<Evaluacion>(`/evaluaciones/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (data: Partial<Evaluacion>): Promise<ApiResponse<Evaluacion>> => {
    try {
      const response = await apiClient.post<Evaluacion>('/evaluaciones', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (id: number, data: Partial<Evaluacion>): Promise<ApiResponse<Evaluacion>> => {
    try {
      const response = await apiClient.put<Evaluacion>(`/evaluaciones/${id}`, data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete<null>(`/evaluaciones/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  createInsitu: async (data: Partial<BulkEvaluciones>): Promise<ApiResponse<BulkEvaluacionesResponse>> => {
    try {
      const response = await apiClient.post<BulkEvaluacionesResponse>('/evaluaciones/insitu/crear', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getByDocente: async (documento: string): Promise<ApiResponse<Evaluacion[]>> => {
    try {
      const response = await apiClient.get<Evaluacion[]>(`/evaluaciones/insitu/${documento}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getByEstudiante: async (documento: string): Promise<ApiResponse<Evaluacion[]>> => {
    try {
      const response = await apiClient.get<Evaluacion[]>(`/evaluaciones/estudiante/${documento}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getByEstudianteByConfiguracion: async (documento: string, configuracionId: number): Promise<ApiResponse<Evaluacion[]>> => {
    try {
      const response = await apiClient.get<Evaluacion[]>(`/evaluaciones/estudiante/${documento}/configuracion/${configuracionId}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  }
};