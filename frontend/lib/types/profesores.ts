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

export interface AsignaturaDocente {
  ID_DOCENTE: string
  DOCENTE: string
  total_evaluaciones_esperadas: number
  evaluaciones_completadas: number
  asignaturas: {
    SEMESTRE_PREDOMINANTE: string
    PROGRAMA_PREDOMINANTE: string
    COD_ASIGNATURA: number
    ASIGNATURA: string
    NOMBRE_SEDE: string
    grupos: {
      GRUPO: string
      total_evaluaciones_esperadas: number
      evaluaciones_completadas: number
      porcentaje_completado: number
    }[]
    total_evaluaciones_esperadas: number
    evaluaciones_completadas: number
    porcentaje_completado: number
  }[]
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