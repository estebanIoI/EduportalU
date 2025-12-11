export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface ProfesoresFilters {
  idConfiguracion?: number;
  periodo?: string;
  nombreSede?: string;
  nomPrograma?: string;
  semestre?: string;
  grupo?: string;
  idDocente?: string;
}

export interface FiltersAspectosPuntaje {
  idDocente?: string;
  idConfiguracion?: number;
  periodo?: string;
  nombreSede?: string;
  nomPrograma?: string;
  semestre?: string;
  grupo?: string;
}


export type ProfesoresParams = PaginationParams & ProfesoresFilters;

export interface GrupoAsignatura {
  GRUPO: string
  total_evaluaciones_esperadas: number
  evaluaciones_completadas: number
  porcentaje_completado: number
}

export interface AsignaturaInfo {
  SEMESTRE_PREDOMINANTE: string
  PROGRAMA_PREDOMINANTE: string
  COD_ASIGNATURA: number
  ASIGNATURA: string
  NOMBRE_SEDE: string
  grupos: GrupoAsignatura[]
  total_evaluaciones_esperadas: number
  evaluaciones_completadas: number
  porcentaje_completado: number
}

export interface AsignaturaDocente {
  ID_DOCENTE: string
  DOCENTE: string
  total_evaluaciones_esperadas: number
  evaluaciones_completadas: number
  asignaturas: AsignaturaInfo[]
  evaluaciones_pendientes: number
  porcentaje_completado: number
  estado_evaluacion: string
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
  nextPage: null
  prevPage: null
}

export interface EvaluacionesEstudiantes {
  total_estudiantes: number
  evaluaciones_realizadas: number
  evaluaciones_sin_realizar: number
}

export interface AspectoPuntaje {
  ID_DOCENTE: string
  DOCENTE: string
  ASPECTO: string
  descripcion: string
  PUNTAJE_PROMEDIO: string
}

export interface AsignaturasResponse {
  success: boolean
  data: AsignaturaDocente[]
}

export interface ProfesorDetalle {
  asignaturas: AsignaturaDocente[]
  evaluaciones: EvaluacionesEstudiantes
  aspectos: AspectoPuntaje[]
}

// Tipos para resultados de evaluación docente
export interface DistribucionValoracion {
  excelente: number
  bueno: number
  aceptable: number
  deficiente: number
}

export interface AspectoAMejorar {
  aspecto: string
  descripcion: string
  promedio: string
  codigoMateria: string
  totalEvaluaciones: number
  distribucion: DistribucionValoracion
}

export interface AspectoMateria {
  aspecto: string
  descripcion: string
  promedio: string
  totalEvaluaciones: number
  distribucion: DistribucionValoracion
}

export interface NotaFinalPorMateria {
  codigoMateria: string
  notaFinal: string
  totalEvaluaciones: number
  totalEstudiantes: number
  aspectos: AspectoMateria[]
}

export interface ComentarioEvaluacion {
  codigoMateria: string
  comentarioGeneral: string | null
  aspecto: string | null
  comentarioAspecto: string | null
  fecha: string
}

export interface ResultadosEvaluacionDocente {
  notaFinal: string
  notaFinalEscala5: string
  calificacionCualitativa: string
  totalEvaluaciones: number
  totalEstudiantes: number
  aspectosAMejorar: AspectoAMejorar[]
  notaFinalPorMateria: NotaFinalPorMateria[]
  comentarios: ComentarioEvaluacion[]
} 