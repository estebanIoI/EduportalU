// services/evaluacionITP/evaluacion/evaluacionesGenericas.service.ts
import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';

export interface EvaluacionGenericaBulkRequest {
  configuracionId: number;
  comentarioGeneral?: string;
  aspectos?: Array<{
    aspectoId: number;
    valoracionId: number;
    comentario?: string;
  }>;
  respuestas?: Array<{
    preguntaId: number;
    respuesta: string;
  }>;
}

export interface EvaluacionGenerica {
  ID: number;
  CONFIGURACION_ID: number;
  DOCUMENTO_ESTUDIANTE: string;
  COMENTARIO_GENERAL?: string;
  FECHA_EVALUACION: string;
  ESTADO: string;
}

export const evaluacionesGenericasService = {
  createBulk: async (data: EvaluacionGenericaBulkRequest): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post<any>('/evaluaciones-genericas/bulk', data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getByEstudianteAndConfiguracion: async (configuracionId: number): Promise<ApiResponse<EvaluacionGenerica[]>> => {
    try {
      const response = await apiClient.get<EvaluacionGenerica[]>(
        `/evaluaciones-genericas/estudiante/configuracion/${configuracionId}`
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getDetalleById: async (id: number): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.get<any>(`/evaluaciones-genericas/${id}/detalle`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  // Obtener evaluaciones completadas por lista de estudiantes (para vista docente)
  getCompletadasByEstudiantes: async (
    configuracionId: number, 
    estudiantes: string[]
  ): Promise<ApiResponse<{ DOCUMENTO_ESTUDIANTE: string; ESTADO: string; FECHA_EVALUACION: string }[]>> => {
    try {
      const response = await apiClient.post<any>(
        `/evaluaciones-genericas/completadas/${configuracionId}`,
        { estudiantes }
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  }
};
