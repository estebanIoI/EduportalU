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
  estudiantes_completados: number;
  porcentaje_estudiantes_completados: number;
}

export interface DashboardAspectosResponse {
  ASPECTO: string;
  PROMEDIO_GENERAL: number;
}

export interface DashboardRankingResponse {
  ID_DOCENTE: string;
  DOCENTE: string;
  PERIODO: string;
  NOMBRE_SEDE: string;
  NOM_PROGRAMA: string;
  SEMESTRE: string;
  GRUPO: string;
  TOTAL_ESTUDIANTES: number;
  TOTAL_ASIGNATURAS: number;
  PROMEDIO_GENERAL: number;
  PUNTAJE_AJUSTADO: number;
  FACTOR_CONFIANZA: number;
  TOTAL_RESPUESTAS: number;
  EVALUACIONES_ESPERADAS: number;
  EVALUACIONES_REALIZADAS: number;
  EVALUACIONES_PENDIENTES: number;
  RESPUESTAS_POR_ESTUDIANTE: number;
  EFICIENCIA_RESPUESTAS: number;
  POSICION: string;
}

export interface DashboardPodioResponse {
  ID_DOCENTE: string;
  DOCENTE: string;
  PERIODO: string;
  NOMBRE_SEDE: string;
  NOM_PROGRAMA: string;
  SEMESTRE: string;
  GRUPO: string;
  TOTAL_ESTUDIANTES: number;
  TOTAL_ASIGNATURAS: number;
  PROMEDIO_GENERAL: number;
  PUNTAJE_AJUSTADO: number;
  FACTOR_CONFIANZA: number;
  TOTAL_RESPUESTAS: number;
  EVALUACIONES_ESPERADAS: number;
  EVALUACIONES_REALIZADAS: number;
  EVALUACIONES_PENDIENTES: number;
  RESPUESTAS_POR_ESTUDIANTE: number;
  EFICIENCIA_RESPUESTAS: number;
  POSICION: string;
}
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
}

// Tipos para Estadísticas por Programa
export interface EstadisticaProgramaResponse {
  programa: string;
  programaCorto?: string;
  completadas: number;
  pendientes: number;
  total: number;
  porcentajeCompletado: number;
  totalEstudiantes?: number;
}

export interface EstudianteEvaluacionResponse {
  id: string;
  nombre: string;
  codigo: string;
  estado: "completada" | "pendiente";
  fechaCompletado?: string | null;
  evaluacionesCompletadas?: number;
  evaluacionesTotales?: number;
  programa?: string;
}

export interface DocenteProgramaResponse {
  id: string;
  nombre: string;
  promedio: string;
  estado: "excelente" | "bueno" | "regular" | "necesita_mejora" | "sin_evaluar";
  evaluacionesRealizadas: number;
  evaluacionesEsperadas: number;
  porcentajeEvaluado: number;
  totalEstudiantes: number;
  totalAsignaturas: number;
  posicion: number;
  aspectos?: AspectoProgramaResponse[];
  aspectosAMejorar?: AspectoProgramaResponse[];
}

export interface AspectoProgramaResponse {
  aspecto: string;
  descripcion: string;
  promedio: string;
}