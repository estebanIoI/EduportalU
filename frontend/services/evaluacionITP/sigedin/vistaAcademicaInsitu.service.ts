import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';
import { 
  SemestresResponse, 
  PeriodosResponse, 
  ProgramasResponse, 
  GruposResponse, 
  SedesResponse,
  OpcionFiltro 
} from '@/lib/types/vista/vistaAcademicaInsitu';

// Interfaces para los nuevos endpoints
interface FiltrosDinamicos {
  periodo?: string;
  sede?: string;
  programa?: string;
  semestre?: string;
  grupo?: string;
}

interface OpcionesFiltros {
  sedes?: Array<{value: string; label: string}>;
  programas?: Array<{value: string; label: string}>;
  semestres?: Array<{value: string; label: string}>;
  grupos?: Array<{value: string; label: string}>;
}

interface OpcionesFiltrosResponse {
  success: boolean;
  data: OpcionesFiltros;
  filters_applied: FiltrosDinamicos;
}

export const vistaAcademicaService = {
  /**
   * Obtiene opciones disponibles para filtros basado en filtros ya aplicados
   */
  getOpcionesFiltros: async (filtros: FiltrosDinamicos): Promise<ApiResponse<OpcionesFiltrosResponse>> => {
    try {
      const params = new URLSearchParams();
      
      if (filtros.periodo) params.append('periodo', filtros.periodo);
      if (filtros.sede) params.append('sede', filtros.sede);
      if (filtros.programa) params.append('programa', filtros.programa);
      if (filtros.semestre) params.append('semestre', filtros.semestre);

      const response = await apiClient.get<OpcionesFiltrosResponse>(`/academica/opciones-filtros?${params.toString()}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

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
  getPeriodos: async (): Promise<ApiResponse<OpcionFiltro>> => {
    try {
      const response = await apiClient.get<OpcionFiltro>('/academica/periodos');
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