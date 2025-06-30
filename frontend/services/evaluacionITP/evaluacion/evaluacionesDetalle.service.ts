import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';
import type { DetalleEvaluacionRequest, BulkEvaluacionRequest } from '@/lib/types/evaluacionInsitu';

export const evaluacionesDetalleService = {
  // Obtener todos los detalles
  getAll: async (): Promise<ApiResponse<any[]>> => {
    try {
      const response = await apiClient.get<any[]>('/evaluacion-detalle');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Obtener detalle por ID
  getById: async (id: number): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.get<any>(`/evaluacion-detalle/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Crear un detalle individual
  create: async (detalle: DetalleEvaluacionRequest): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post<any>('/evaluacion-detalle', detalle);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Actualizar un detalle
  update: async (id: number, detalle: DetalleEvaluacionRequest): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.put<any>(`/evaluacion-detalle/${id}`, detalle);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Eliminar un detalle
  delete: async (id: number): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete<null>(`/evaluacion-detalle/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Crear detalles en bulk (varios aspectos y comentario general)
  createBulk: async (bulk: BulkEvaluacionRequest): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post<any>('/evaluacion-detalle/bulk', bulk);
      return response;
    } catch (error: any) {
      throw error;
    }
  }
};