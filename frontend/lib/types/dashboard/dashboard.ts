export interface DashboardParams {
  idConfiguracion: number;
  periodo?: string;
  nombreSede?: string;
  nomPrograma?: string;
  semestre?: string;
  grupo?: string;
}

export interface FileDownloadResponse {
  data: Blob;
  headers: Record<string, any>;
  filename?: string;
}

export interface DashboardStatsResponse {
  total_estudiantes: number;
  total_evaluaciones: number;
  evaluaciones_completadas: number;
  evaluaciones_pendientes: number;
  porcentaje_completado: string;
  docentes_evaluados: number;
  total_docentes: number;
  porcentaje_docentes_evaluados: string;
}

export interface DashboardAspectosResponse {
  ASPECTO: string;
  PROMEDIO_GENERAL: number;
}

export interface DashboardRankingResponse {
  ID_DOCENTE: string;
  DOCENTE: string;
  TOTAL_PUNTAJE: number;
  TOTAL_RESPUESTAS: number;
  PROMEDIO_GENERAL: number;
  evaluaciones_esperadas: number;
  evaluaciones_realizadas: number;
  evaluaciones_pendientes: number;
  POSICION: string;
}

export interface DashboardPodioResponse {
  ID_DOCENTE: string;
  DOCENTE: string;
  TOTAL_PUNTAJE: number;
  TOTAL_RESPUESTAS: number;
  PROMEDIO_GENERAL: number;
  evaluaciones_esperadas: number;
  evaluaciones_realizadas: number;
  evaluaciones_pendientes: number;
  POSICION: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
}