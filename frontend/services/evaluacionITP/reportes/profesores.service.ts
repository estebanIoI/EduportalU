import { apiClient } from '@/lib/api';
import { ApiResponse, PaginationParams, ApiPaginatedResponse } from '@/lib/types/api.types';
import {
  FiltersAspectosPuntaje,
  ProfesoresFilters,
  ProfesoresParams,
  AsignaturaDocente,
  EvaluacionesEstudiantes,
  AspectoPuntaje,
  AsignaturasResponse,
  ProfesorDetalle
} from '@/lib/types/profesores';

export const profesoresService = {
  getAsignaturas: async (
    pagination?: PaginationParams,
    filters?: ProfesoresParams
  ): Promise<ApiPaginatedResponse<AsignaturaDocente>> => {
    try {
      const response = await apiClient.getPaginatedSilent<AsignaturaDocente>(
        '/reportes/docentes/asignaturas',
        {
          ...pagination,
          ...filters
        }
      );

      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getEvaluacionesEstudiantes: async (
    idDocente: string,
    codAsignatura: number,
    grupo: string
  ): Promise<ApiResponse<EvaluacionesEstudiantes>> => {
    try {
      const response = await apiClient.get<EvaluacionesEstudiantes>(
        `/reportes/docentes/estudiantes-evaluados/${idDocente}/${codAsignatura}/${grupo}`,
        undefined,
        { showMessage: false }
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getAspectosPuntaje: async (
    filters?: FiltersAspectosPuntaje
  ): Promise<ApiResponse<AspectoPuntaje[]>> => {
    try {
      const response = await apiClient.get<AspectoPuntaje[]>(
        `/reportes/docentes/aspectos-puntaje`,
        { params: filters },
        { showMessage: false }
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  },

};