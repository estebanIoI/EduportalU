/**
 * @fileoverview Servicio de Reportes para el módulo de administrador
 * @description Cliente API para todos los endpoints de reportes
 */

import { apiClient } from '@/services/api.client';
import { IA_TIMEOUT } from '@/config/api.config';
import {
  ApiResponse,
  Facultad,
  Programa,
  ReportePrograma,
  ReporteFacultad,
  ReporteInstitucional,
  DocenteDetalle,
  Rankings,
  IAStatusResponse,
  ResumenIARequest,
  ResumenIAResponse,
  FiltrosReporte,
  FiltrosRanking,
} from '@/lib/types/reportes.types';

const BASE_URL = '/reportes';

// ======================================
// ESTRUCTURA ORGANIZACIONAL
// ======================================

/**
 * Obtiene todas las facultades activas
 */
export const getFacultades = async (): Promise<ApiResponse<Facultad[]>> => {
  const response = await apiClient.get<Facultad[]>(`${BASE_URL}/facultades`, undefined, { showMessage: false });
  return response;
};

/**
 * Obtiene todos los programas, opcionalmente filtrados por facultad
 */
export const getProgramas = async (facultadId?: number): Promise<ApiResponse<Programa[]>> => {
  const params = facultadId ? { facultadId } : {};
  const response = await apiClient.get<Programa[]>(`${BASE_URL}/programas`, { params }, { showMessage: false });
  return response;
};

// ======================================
// REPORTES PRINCIPALES
// ======================================

/**
 * Obtiene el reporte completo de un programa
 */
export const getReportePrograma = async (
  programaId: number,
  filtros: FiltrosReporte
): Promise<ApiResponse<ReportePrograma>> => {
  const params = {
    idConfiguracion: filtros.idConfiguracion,
    incluirIA: filtros.incluirIA?.toString() || 'false',
  };
  // Usar timeout extendido si se solicita análisis con IA
  const timeout = filtros.incluirIA ? IA_TIMEOUT : undefined;
  const response = await apiClient.get<ReportePrograma>(
    `${BASE_URL}/programa/${programaId}`,
    { params },
    { showMessage: false, timeout }
  );
  return response;
};

/**
 * Obtiene el reporte consolidado de una facultad
 */
export const getReporteFacultad = async (
  facultadId: number,
  filtros: FiltrosReporte
): Promise<ApiResponse<ReporteFacultad>> => {
  const params = {
    idConfiguracion: filtros.idConfiguracion,
    incluirIA: filtros.incluirIA?.toString() || 'false',
  };
  // Usar timeout extendido si se solicita análisis con IA
  const timeout = filtros.incluirIA ? IA_TIMEOUT : undefined;
  const response = await apiClient.get<ReporteFacultad>(
    `${BASE_URL}/facultad/${facultadId}`,
    { params },
    { showMessage: false, timeout }
  );
  return response;
};

/**
 * Obtiene el reporte institucional consolidado
 */
export const getReporteInstitucional = async (
  filtros: FiltrosReporte
): Promise<ApiResponse<ReporteInstitucional>> => {
  const params = {
    idConfiguracion: filtros.idConfiguracion,
    incluirIA: filtros.incluirIA?.toString() || 'false',
  };
  // Usar timeout extendido si se solicita análisis con IA
  const timeout = filtros.incluirIA ? IA_TIMEOUT : undefined;
  const response = await apiClient.get<ReporteInstitucional>(
    `${BASE_URL}/institucional`,
    { params },
    { showMessage: false, timeout }
  );
  return response;
};

// ======================================
// DETALLE Y RANKINGS
// ======================================

/**
 * Obtiene el detalle completo de un docente con todas sus materias
 */
export const getDetalleDocente = async (
  documento: string,
  filtros: FiltrosReporte
): Promise<ApiResponse<DocenteDetalle>> => {
  const params = {
    idConfiguracion: filtros.idConfiguracion,
    incluirIA: filtros.incluirIA?.toString() || 'false',
  };
  // Usar timeout extendido si se solicita análisis con IA
  const timeout = filtros.incluirIA ? IA_TIMEOUT : undefined;
  const response = await apiClient.get<DocenteDetalle>(
    `${BASE_URL}/docente/${documento}`,
    { params },
    { showMessage: false, timeout }
  );
  return response;
};

/**
 * Obtiene los rankings de docentes
 */
export const getRankings = async (filtros: FiltrosRanking): Promise<ApiResponse<Rankings>> => {
  const params: Record<string, any> = {
    idConfiguracion: filtros.idConfiguracion,
  };

  if (filtros.tipo) params.tipo = filtros.tipo;
  if (filtros.programaId) params.programaId = filtros.programaId;
  if (filtros.facultadId) params.facultadId = filtros.facultadId;
  if (filtros.limite) params.limite = filtros.limite;

  const response = await apiClient.get<Rankings>(`${BASE_URL}/rankings`, { params }, { showMessage: false });
  return response;
};

// ======================================
// SERVICIOS DE IA
// ======================================

/**
 * Verifica el estado del servicio de IA (Ollama)
 */
export const getIAStatus = async (): Promise<ApiResponse<IAStatusResponse>> => {
  const response = await apiClient.get<IAStatusResponse>(`${BASE_URL}/ia/status`, undefined, { showMessage: false });
  return response;
};

/**
 * Genera resumen IA bajo demanda
 */
export const generarResumenIA = async (
  request: ResumenIARequest
): Promise<ApiResponse<ResumenIAResponse>> => {
  const response = await apiClient.post<ResumenIAResponse>(
    `${BASE_URL}/ia/resumen`,
    request,
    undefined,
    { showMessage: false }
  );
  return response;
};

// ======================================
// COMENTARIOS PARA ANÁLISIS
// ======================================

export interface ComentariosDocenteParams {
  idConfiguracion: number;
  codigoMateria?: string;
  analizarIA?: boolean;
}

export interface ComentariosResponse {
  documento_docente?: string;
  programa_id?: number;
  total_comentarios: number;
  comentarios_generales?: Array<{ texto: string; fecha?: string }>;
  comentarios_por_aspecto?: Record<string, any[]>;
  textos_para_analisis?: string[];
  comentarios?: Array<{ texto: string }>;
  resumen_ia?: ResumenIAResponse | null;
}

/**
 * Obtiene comentarios de un docente para análisis
 */
export const getComentariosDocente = async (
  documento: string,
  params: ComentariosDocenteParams
): Promise<ApiResponse<ComentariosResponse>> => {
  const queryParams: Record<string, any> = {
    idConfiguracion: params.idConfiguracion,
  };
  if (params.codigoMateria) queryParams.codigoMateria = params.codigoMateria;
  if (params.analizarIA) queryParams.analizarIA = 'true';

  const response = await apiClient.get<ComentariosResponse>(
    `${BASE_URL}/comentarios/docente/${documento}`,
    { params: queryParams },
    { showMessage: false }
  );
  return response;
};

/**
 * Obtiene comentarios de un programa para análisis
 */
export const getComentariosPrograma = async (
  programaId: number,
  idConfiguracion: number,
  analizarIA?: boolean
): Promise<ApiResponse<ComentariosResponse>> => {
  const params: Record<string, any> = { idConfiguracion };
  if (analizarIA) params.analizarIA = 'true';

  const response = await apiClient.get<ComentariosResponse>(
    `${BASE_URL}/comentarios/programa/${programaId}`,
    { params },
    { showMessage: false }
  );
  return response;
};

// ======================================
// UTILIDADES
// ======================================

/**
 * Prepara datos para gráfica de barras
 */
export const prepararDatosBarChart = (labels: string[], values: (number | string)[]) => {
  return {
    labels,
    datasets: [
      {
        label: 'Promedio',
        data: values.map((v) => (typeof v === 'string' ? parseFloat(v) : v)),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };
};

/**
 * Prepara datos para gráfica de radar
 */
export const prepararDatosRadarChart = (labels: string[], values: (number | string)[]) => {
  return {
    labels,
    datasets: [
      {
        label: 'Evaluación',
        data: values.map((v) => (typeof v === 'string' ? parseFloat(v) : v)),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  };
};

/**
 * Prepara datos para gráfica comparativa
 */
export const prepararDatosComparativos = (
  labels: string[],
  datasets: { label: string; values: number[]; color: string }[]
) => {
  return {
    labels,
    datasets: datasets.map((ds) => ({
      label: ds.label,
      data: ds.values,
      backgroundColor: ds.color,
      borderColor: ds.color.replace('0.6', '1'),
      borderWidth: 1,
    })),
  };
};

/**
 * Formatea número como porcentaje
 */
export const formatearPorcentaje = (valor: number): string => {
  return `${valor.toFixed(1)}%`;
};

/**
 * Formatea promedio con 2 decimales
 */
export const formatearPromedio = (valor: number): string => {
  return valor.toFixed(2);
};

/**
 * Obtiene color según el promedio
 */
export const getColorPorPromedio = (promedio: number): string => {
  if (promedio >= 4.5) return 'text-green-600';
  if (promedio >= 3.5) return 'text-blue-600';
  if (promedio >= 2.5) return 'text-yellow-600';
  return 'text-red-600';
};

/**
 * Obtiene badge color según polaridad
 */
export const getBadgeColorPolaridad = (
  polaridad: 'POSITIVO' | 'NEGATIVO' | 'NEUTRO'
): string => {
  switch (polaridad) {
    case 'POSITIVO':
      return 'bg-green-100 text-green-800';
    case 'NEGATIVO':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// ======================================
// EXPORT DEL SERVICIO
// ======================================

export const reportesService = {
  // Estructura
  getFacultades,
  getProgramas,

  // Reportes
  getReportePrograma,
  getReporteFacultad,
  getReporteInstitucional,

  // Detalle y rankings
  getDetalleDocente,
  getRankings,

  // Comentarios
  getComentariosDocente,
  getComentariosPrograma,

  // IA
  getIAStatus,
  generarResumenIA,

  // Utilidades
  prepararDatosBarChart,
  prepararDatosRadarChart,
  prepararDatosComparativos,
  formatearPorcentaje,
  formatearPromedio,
  getColorPorPromedio,
  getBadgeColorPolaridad,
};

export default reportesService;
