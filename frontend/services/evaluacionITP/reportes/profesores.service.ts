import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';
import {
  ProfesoresParams,
  AsignaturaDocente,
  EvaluacionesEstudiantes,
  AspectoPuntaje,
  AsignaturasResponse,
  ProfesorDetalle
} from '@/lib/types/profesores';

export const profesoresService = {
  getAsignaturas: async (params?: ProfesoresParams): Promise<ApiResponse<AsignaturaDocente[]>> => {
    try {
      const response = await apiClient.get<AsignaturaDocente[]>(
        '/reportes/docentes/asignaturas',
        { params },
        { showMessage: false }
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

  getAspectosPuntaje: async (idDocente: string): Promise<ApiResponse<AspectoPuntaje[]>> => {
    try {
      const response = await apiClient.get<AspectoPuntaje[]>(
        `/reportes/docentes/aspectos-puntaje/${idDocente}`,
        undefined,
        { showMessage: false }
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getProfesorDetalle: async (idDocente: string): Promise<ApiResponse<ProfesorDetalle>> => {
    try {
      const [asignaturasResponse, aspectosResponse] = await Promise.all([
        profesoresService.getAsignaturas(),
        profesoresService.getAspectosPuntaje(idDocente)
      ]);

      const asignaturas = asignaturasResponse.data;
      const aspectos = aspectosResponse.data;

      const asignaturasDocente = asignaturas.filter(
        asig => asig.ID_DOCENTE === idDocente
      );

      const evaluacionesPromises = asignaturasDocente.map(asig =>
        profesoresService.getEvaluacionesEstudiantes(
          idDocente,
          asig.COD_ASIGNATURA,
          asig.SEMESTRE_PREDOMINANTE
        )
      );
      const evaluacionesResponses = await Promise.all(evaluacionesPromises);

      const profesorDetalle: ProfesorDetalle = {
        asignaturas: asignaturasDocente,
        evaluaciones: evaluacionesResponses[0]?.data || null,
        aspectos
      };

      return {
        success: true,
        data: profesorDetalle,
        message: 'Detalles del profesor obtenidos exitosamente'
      };
    } catch (error: any) {
      throw error;
    }
  }
};