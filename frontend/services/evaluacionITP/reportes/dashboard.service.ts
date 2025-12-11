import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';
import { 
  DashboardStatsResponse, 
  DashboardAspectosResponse, 
  DashboardRankingResponse, 
  DashboardPodioResponse, 
  DashboardParams,
  EstadisticaProgramaResponse,
  EstudianteEvaluacionResponse,
  DocenteProgramaResponse
} from '@/lib/types/dashboard/dashboard';

export const dashboardService = {
  /**
   * Obtiene las estadísticas principales del dashboard.
   */
  getStats: async (params: DashboardParams): Promise<ApiResponse<DashboardStatsResponse>> => {
    try {
      const urlParams = new URLSearchParams();
      urlParams.append('idConfiguracion', params.idConfiguracion.toString());

      if (params.periodo) urlParams.append('periodo', params.periodo);
      if (params.nombreSede) urlParams.append('nombreSede', params.nombreSede);
      if (params.nomPrograma) urlParams.append('nomPrograma', params.nomPrograma);
      if (params.semestre) urlParams.append('semestre', params.semestre);
      if (params.grupo) urlParams.append('grupo', params.grupo);

      const response = await apiClient.get<DashboardStatsResponse>(
        `/dashboard/stats?${urlParams.toString()}`
      );

      return response;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtiene los aspectos promedio del dashboard.
   */
  getAspectos: async (params: DashboardParams): Promise<ApiResponse<DashboardAspectosResponse[]>> => {
    try {
      const urlParams = new URLSearchParams();
      urlParams.append('idConfiguracion', params.idConfiguracion.toString());

      if (params.periodo) urlParams.append('periodo', params.periodo);
      if (params.nombreSede) urlParams.append('nombreSede', params.nombreSede);
      if (params.nomPrograma) urlParams.append('nomPrograma', params.nomPrograma);
      if (params.semestre) urlParams.append('semestre', params.semestre);
      if (params.grupo) urlParams.append('grupo', params.grupo);

      const response = await apiClient.get<DashboardAspectosResponse[]>(
        `/dashboard/aspectos?${urlParams.toString()}`
      );

      return response;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtiene el ranking de docentes.
   */
  getRanking: async (params: DashboardParams): Promise<ApiResponse<DashboardRankingResponse[]>> => {
    try {
      const urlParams = new URLSearchParams();
      urlParams.append('idConfiguracion', params.idConfiguracion.toString());

      if (params.periodo) urlParams.append('periodo', params.periodo);
      if (params.nombreSede) urlParams.append('nombreSede', params.nombreSede);
      if (params.nomPrograma) urlParams.append('nomPrograma', params.nomPrograma);
      if (params.semestre) urlParams.append('semestre', params.semestre);
      if (params.grupo) urlParams.append('grupo', params.grupo);

      const response = await apiClient.get<DashboardRankingResponse[]>(
        `/dashboard/ranking?${urlParams.toString()}`
      );

      return response;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtiene el podio de docentes destacados.
   */
  getPodio: async (params: DashboardParams): Promise<ApiResponse<DashboardPodioResponse[]>> => {
    try {
      const urlParams = new URLSearchParams();
      urlParams.append('idConfiguracion', params.idConfiguracion.toString());
      
      if (params.periodo) urlParams.append('periodo', params.periodo);
      if (params.nombreSede) urlParams.append('nombreSede', params.nombreSede);
      if (params.nomPrograma) urlParams.append('nomPrograma', params.nomPrograma);
      if (params.semestre) urlParams.append('semestre', params.semestre);
      if (params.grupo) urlParams.append('grupo', params.grupo);

      const response = await apiClient.get<DashboardPodioResponse[]>(
        `/dashboard/podio?${urlParams.toString()}`
      );

      return response;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtiene estadísticas de evaluaciones agrupadas por programa.
   */
  getEstadisticasPorPrograma: async (params: DashboardParams): Promise<ApiResponse<EstadisticaProgramaResponse[]>> => {
    try {
      const urlParams = new URLSearchParams();
      urlParams.append('idConfiguracion', params.idConfiguracion.toString());
      
      if (params.periodo) urlParams.append('periodo', params.periodo);
      if (params.nombreSede) urlParams.append('nombreSede', params.nombreSede);
      if (params.semestre) urlParams.append('semestre', params.semestre);
      if (params.grupo) urlParams.append('grupo', params.grupo);

      const response = await apiClient.get<EstadisticaProgramaResponse[]>(
        `/dashboard/estadisticas-programas?${urlParams.toString()}`
      );

      return response;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtiene los estudiantes de un programa con su estado de evaluación.
   */
  getEstudiantesPorPrograma: async (
    params: DashboardParams & { nomPrograma: string; estado?: 'completadas' | 'pendientes' }
  ): Promise<ApiResponse<EstudianteEvaluacionResponse[]>> => {
      try {
      const urlParams = new URLSearchParams();
      urlParams.append('idConfiguracion', params.idConfiguracion.toString());
      urlParams.append('nomPrograma', params.nomPrograma);
      
      if (params.periodo) urlParams.append('periodo', params.periodo);
      if (params.nombreSede) urlParams.append('nombreSede', params.nombreSede);
      if (params.semestre) urlParams.append('semestre', params.semestre);
      if (params.grupo) urlParams.append('grupo', params.grupo);
      if (params.estado) urlParams.append('estado', params.estado);

      const response = await apiClient.get<EstudianteEvaluacionResponse[]>(
        `/dashboard/estudiantes-programa?${urlParams.toString()}`
      );

      return response;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtiene los docentes de un programa con su rendimiento.
   */
  getDocentesPorPrograma: async (
    params: DashboardParams & { nomPrograma: string }
  ): Promise<ApiResponse<DocenteProgramaResponse[]>> => {
    try {
      const urlParams = new URLSearchParams();
      urlParams.append('idConfiguracion', params.idConfiguracion.toString());
      urlParams.append('nomPrograma', params.nomPrograma);
      
      if (params.periodo) urlParams.append('periodo', params.periodo);
      if (params.nombreSede) urlParams.append('nombreSede', params.nombreSede);
      if (params.semestre) urlParams.append('semestre', params.semestre);
      if (params.grupo) urlParams.append('grupo', params.grupo);

      const response = await apiClient.get<DocenteProgramaResponse[]>(
        `/dashboard/docentes-programa?${urlParams.toString()}`
      );

      return response;
    } catch (error: any) {
      throw error;
    }
  }
};