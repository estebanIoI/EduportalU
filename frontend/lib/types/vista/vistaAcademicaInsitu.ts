export interface Periodo {
  PERIODO: string;
}

export interface Sede {
  NOMBRE_SEDE: string;
}

export interface Programa {
  NOM_PROGRAMA: string;
  ABREV_PROGRAMA: string;
}

export interface Semestre {
  SEMESTRE: string;
}

export interface Grupo {
  GRUPO: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export type PeriodosResponse = ApiResponse<Periodo[]>;
export type SedesResponse = ApiResponse<Sede[]>;
export type ProgramasResponse = ApiResponse<Programa[]>;
export type SemestresResponse = ApiResponse<Semestre[]>;
export type GruposResponse = ApiResponse<Grupo[]>;


export interface OpcionFiltro {
  value: string
  label: string
}
