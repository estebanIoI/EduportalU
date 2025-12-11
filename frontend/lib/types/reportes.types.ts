/**
 * @fileoverview Tipos TypeScript para el módulo de Reportes
 * @description Define las interfaces y tipos para reportes por programa, facultad e institucional
 */

// ======================================
// TIPOS BASE
// ======================================

export interface Facultad {
  ID: number;
  CODIGO: string;
  NOMBRE: string;
  DESCRIPCION: string | null;
  DECANO_DOCUMENTO: string | null;
  total_programas?: number;
  programas?: Programa[];
}

export interface Programa {
  ID: number;
  CODIGO: string;
  NOMBRE: string;
  DESCRIPCION: string | null;
  NIVEL: 'PREGRADO' | 'POSGRADO' | 'MAESTRIA' | 'DOCTORADO';
  MODALIDAD: 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDO';
  DIRECTOR_DOCUMENTO: string | null;
  facultad_id: number;
  facultad_codigo: string;
  facultad_nombre: string;
  total_docentes?: number;
}

// ======================================
// TIPOS DE ESTADÍSTICAS
// ======================================

export interface EstadisticasBase {
  total_docentes: number;
  total_estudiantes_evaluaron: number;
  total_evaluaciones: number;
  promedio_general: number;
  desviacion_general: number;
}

export interface EstadisticasPrograma extends EstadisticasBase {}

export interface EstadisticasFacultad extends EstadisticasBase {
  total_programas: number;
}

export interface EstadisticasInstitucional extends EstadisticasFacultad {
  total_facultades: number;
}

// ======================================
// TIPOS DE ASPECTOS Y VALORACIONES
// ======================================

export interface DistribucionValoracion {
  E: number; // Excelente
  B: number; // Bueno
  A: number; // Aceptable
  D: number; // Deficiente
}

export interface Aspecto {
  id: number;
  nombre: string;
  promedio: number;
  total_respuestas: number;
  distribucion: DistribucionValoracion;
  comentarios: ComentarioAspecto[];
}

export interface ComentarioAspecto {
  texto: string;
  valoracion: string;
  puntaje?: number;
}

export interface Comentario {
  texto: string;
  fecha?: string;
  aspecto?: string;
  valoracion?: string;
}

// ======================================
// TIPOS DE GRÁFICAS
// ======================================

export interface DatosGrafica {
  labels: string[];
  values: (number | string)[];
}

export interface DatosGraficaComparativa extends DatosGrafica {
  total_docentes?: number[];
  total_evaluaciones?: number[];
  total_programas?: number[];
}

// ======================================
// TIPOS DE IA
// ======================================

export interface FrasesRepresentativas {
  positivas: string[];
  negativas: string[];
}

export interface ResumenIA {
  fortalezas: string[];
  aspectos_mejora: string[];
  frases_representativas: FrasesRepresentativas | string[];
  resumen_ejecutivo: string;
  estadisticas?: {
    total_comentarios: number;
    positivos: number;
    negativos: number;
    neutros: number;
    porcentaje_positivos: string | number;
  };
  procesado_con_ia?: boolean;
  modelo_usado?: string;
  fecha_generacion?: string;
  modelo?: string;
}

export interface ClasificacionPolaridad {
  text: string;
  polaridad: 'POSITIVO' | 'NEGATIVO' | 'NEUTRO';
  confianza: number;
}

export interface ResultadoClustering {
  items: Array<{
    text: string;
    embedding: number[];
    cluster: number;
    similarity: number;
  }>;
  grupos: Record<number, any[]>;
  numClusters: number;
}

// ======================================
// TIPOS DE MATERIA
// ======================================

export interface Materia {
  codigo: string;
  nombre: string;
  total_evaluaciones: number;
  promedio: number;
  aspectos: Aspecto[];
  grafica: DatosGrafica;
  observaciones_crudas: Comentario[];
  observaciones?: Comentario[];
  resumen_ia: ResumenIA | null;
  periodo?: string;
}

export interface MateriaDetalle {
  codigo: string;
  nombre: string;
  promedios: Record<string, string | number>;
  grafica: DatosGrafica;
  observaciones_crudas: string[];
  resumen_ia: ResumenIA | null;
}

// ======================================
// TIPOS DE DOCENTE
// ======================================

export interface Docente {
  documento: string;
  nombre: string;
  total_evaluaciones: number;
  estudiantes_evaluaron: number;
  promedio_general: number;
  aspectos_positivos: number;
  aspectos_mejora: number;
  materias: Materia[];
  // Campos adicionales para UI
  programa?: string;
  total_comentarios?: number;
}

export interface DocenteDetalle {
  documento: string;
  nombre: string;
  materias: MateriaDetalle[];
}

export interface DocenteRanking {
  posicion: number;
  documento: string;
  nombre: string;
  total_positivos?: number;
  total_mejora?: number;
  promedio: number;
  programa?: string;
  facultad_nombre?: string;
}

// ======================================
// TIPOS DE RANKINGS
// ======================================

export interface Rankings {
  positivos: DocenteRanking[];
  mejora: DocenteRanking[];
}

// ======================================
// TIPOS DE REPORTE POR PROGRAMA
// ======================================

export interface ReportePrograma {
  programa: Programa;
  estadisticas: EstadisticasPrograma;
  docentes: Docente[];
  ranking_positivos: DocenteRanking[];
  ranking_mejora: DocenteRanking[];
}

// ======================================
// TIPOS DE REPORTE POR FACULTAD
// ======================================

export interface ProgramaEnFacultad {
  id: number;
  codigo: string;
  nombre: string;
  nivel: string;
  estadisticas: EstadisticasPrograma;
  ranking_positivos: DocenteRanking[];
  ranking_mejora: DocenteRanking[];
}

export interface ReporteFacultad {
  facultad: {
    id: number;
    codigo: string;
    nombre: string;
    descripcion: string | null;
  };
  estadisticas: EstadisticasFacultad;
  programas: ProgramaEnFacultad[];
  grafica_comparativa: DatosGraficaComparativa;
  ranking_positivos: DocenteRanking[];
  ranking_mejora: DocenteRanking[];
  resumen_ia: ResumenIA | null;
}

// ======================================
// TIPOS DE REPORTE INSTITUCIONAL
// ======================================

export interface FacultadEnInstitucional {
  id: number;
  codigo: string;
  nombre: string;
  estadisticas: EstadisticasFacultad;
  ranking_positivos: DocenteRanking[];
  ranking_mejora: DocenteRanking[];
}

export interface ReporteInstitucional {
  estadisticas: EstadisticasInstitucional;
  facultades: FacultadEnInstitucional[];
  grafica_aspectos: DatosGrafica;
  grafica_facultades: DatosGraficaComparativa;
  ranking_global_positivos: DocenteRanking[];
  ranking_global_mejora: DocenteRanking[];
  resumen_ia: ResumenIA | null;
  tendencias: string[] | null;
}

// ======================================
// TIPOS DE RESPUESTA API
// ======================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface IAStatusResponse {
  available: boolean;
  ollama_available?: boolean;
  models: string[];
  hasEmbeddingModel?: boolean;
  hasGenerativeModel?: boolean;
  error?: string;
}

export interface ResumenIARequest {
  comentarios: string[];
  tipo: 'fortalezas_mejora' | 'polaridad' | 'clustering';
}

export interface ResumenIAResponse {
  fortalezas?: string[];
  aspectos_mejora?: string[];
  frases_representativas?: FrasesRepresentativas;
  resumen_ejecutivo?: string;
  polaridades?: ClasificacionPolaridad[];
  clusters?: ResultadoClustering;
  procesado_con_ia: boolean;
}

// ======================================
// TIPOS DE FILTROS
// ======================================

export interface FiltrosReporte {
  idConfiguracion: number;
  incluirIA?: boolean;
}

export interface FiltrosRanking extends FiltrosReporte {
  tipo?: 'programa' | 'facultad' | 'institucional';
  programaId?: number;
  facultadId?: number;
  limite?: number;
}

// ======================================
// TIPOS DE COMPONENTES UI
// ======================================

export type NivelReporte = 'programa' | 'facultad' | 'institucional';

export interface OpcionSelector {
  value: string | number;
  label: string;
}

export interface TablaComentario {
  tipo: 'Fortaleza' | 'Mejora';
  comentario: string;
  materia: string;
  relevancia: number;
}

export interface DatosCardEstadistica {
  titulo: string;
  valor: number | string;
  icono: string;
  color?: string;
  tendencia?: 'up' | 'down' | 'neutral';
}
