import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';
import { 
  SemestresResponse, 
  PeriodosResponse, 
  ProgramasResponse, 
  GruposResponse, 
  SedesResponse 
} from '@/lib/types/vista/vistaAcademicaInsitu';

export const vistaAcademicaService = {
  /**
   * Obtiene todas las sedes disponibles.
   */
  getSedes: async (): Promise<ApiResponse<SedesResponse>> => {
    try {
      const response = await apiClient.get<SedesResponse>('/academica/sedes');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtiene todos los semestres disponibles.
   */
  getSemestres: async (): Promise<ApiResponse<SemestresResponse>> => {
    try {
      const response = await apiClient.get<SemestresResponse>('/academica/semestres');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtiene todos los periodos disponibles.
   */
  getPeriodos: async (): Promise<ApiResponse<PeriodosResponse>> => {
    try {
      const response = await apiClient.get<PeriodosResponse>('/academica/periodos');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtiene todos los programas académicos disponibles.
   */
  getProgramas: async (): Promise<ApiResponse<ProgramasResponse>> => {
    try {
      const response = await apiClient.get<ProgramasResponse>('/academica/programas');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtiene todos los grupos disponibles.
   */
  getGrupos: async (): Promise<ApiResponse<GruposResponse>> => {
    try {
      const response = await apiClient.get<GruposResponse>('/academica/grupos');
      return response;
    } catch (error: any) {
      throw error;
    }
  }
};