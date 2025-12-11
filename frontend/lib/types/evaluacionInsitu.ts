export interface Roles {
  ID: number;
  NOMBRE_ROL: string;
}

export interface UserRolesRequest {
  userId: number;  
  roleId: number;
}

export interface UserRoles {
  id: number;
  user_id: number;
  role_name: string;
  user_name: string
}

export interface User {
  user_id: number;
  user_name: string;
  user_username: string;
  user_email: string;
  role_name: string;
}

export interface AspectoEvaluacion {
  ID: number;
  ETIQUETA: string;
  DESCRIPCION: string;
}

export interface ConfiguracionAspecto {
  ID: number;
  CONFIGURACION_EVALUACION_ID: number;
  ASPECTO_ID: number;
  ORDEN: number;
  ACTIVO: boolean;
}

export interface ConfiguracionEvaluacion {
  ID: number;
  TIPO_EVALUACION_ID: number;
  TIPO_EVALUACION_NOMBRE: string;
  TIPO_EVALUACION_DESCRIPCION: string;
  FECHA_INICIO: string;
  FECHA_FIN: string;
  ACTIVO: boolean;
  ES_EVALUACION_DOCENTE: boolean;
  TITULO?: string;
  INSTRUCCIONES?: string;
  URL_FORMULARIO?: string;
}

export interface ConfiguracionEvaluacionInput {
  TIPO_EVALUACION_ID: number;
  FECHA_INICIO: string;
  FECHA_FIN: string;
  ACTIVO: boolean;
  ES_EVALUACION_DOCENTE: boolean;
  TITULO?: string;
  INSTRUCCIONES?: string;
  URL_FORMULARIO?: string;
}

// Tipo para actualizar (incluye ID)
export interface ConfiguracionEvaluacionUpdate extends ConfiguracionEvaluacionInput {
  ID: number;
}

export interface ConfiguracionValoracion {
  ID: number;
  CONFIGURACION_EVALUACION_ID: number;
  VALORACION_ID: number;
  PUNTAJE: number;
  ORDEN: number;
  ACTIVO: boolean;
}

export interface EscalaValoracion {
  ID: number;
  VALORACION_ID: number;
  VALOR: string;
  ETIQUETA: string;
  DESCRIPCION: string;
  PUNTAJE?: number;
  ORDEN?: number;
  ACTIVO?: boolean;
}

export interface Pregunta {
  ID: number;
  TEXTO: string;
  TIPO_PREGUNTA: string;
  ORDEN: number;
  ACTIVO: boolean;
  OPCIONES?: string;
}

export interface ConfiguracionPregunta {
  ID: number;
  CONFIGURACION_EVALUACION_ID: number;
  PREGUNTA_ID: number;
  ORDEN: number;
  ACTIVO: boolean;
  TEXTO?: string;
  TIPO_PREGUNTA?: string;
}

export interface TipoEvaluacion {
  ID: number;
  NOMBRE: string;
  DESCRIPCION: string;
  ACTIVO: boolean;
} 

export interface ConfiguracionResponse {
  configuracion: ConfiguracionInformacion;
  aspectos: AspectoEvaluacion[];
  valoraciones: EscalaValoracion[];
  preguntas?: Pregunta[];
}

export interface Evaluacion {
  ID: number;
  DOCUMENTO_ESTUDIANTE: string;
  DOCENTE: string;
  ASIGNATURA: string;
  DOCUMENTO_DOCENTE: string;
  CODIGO_MATERIA: string;
  ID_CONFIGURACION: number;
  SEMESTRE_PREDOMINANTE: string;
  PROGRAMA_PREDOMINANTE: string;
  ACTIVO: boolean;
}

export interface DetalleEvaluacionRequest {
  EVALUACION_ID: number;
  ASPECTO_ID: number;
  VALORACION_ID: number;
  COMENTARIO: string;
}

export interface BulkEvaluacionRequest {
  evaluacionId: number;
  comentarioGeneral: string;
  detalles: {
    aspectoId: number;
    valoracionId: number;
    comentario: string;
  }[];
}

export interface EstadoActivo {
  id: number;
  activo: number;
}

// -----------------------------------

export interface ConfiguracionInformacion {
  ID: number;
  NOMBRE: string;
  FECHA_INICIO: string;
  FECHA_FIN: string;
  ACTIVO: boolean;
  TIPO_EVALUACION_ID: number;
  TIPO_EVALUACION_NOMBRE: string;
  TIPO_EVALUACION_DESCRIPCION: string;
  ES_EVALUACION_DOCENTE: boolean;
  TITULO?: string;
  INSTRUCCIONES?: string;
  URL_FORMULARIO?: string;
}

// -----------------------------------
export interface BulkEvaluciones {
  tipoEvaluacionId: number;
}

// Respuesta de la API al crear evaluaciones
export interface BulkEvaluacionesResponse {
  success: boolean;
  message: string;
  data?: BulkEvaluacionesData;
  error?: string | null;
}

// Datos contenidos en la respuesta exitosa
export interface BulkEvaluacionesData {
  total: number;
  evaluaciones: EvaluacionCreada[];
  aspectos: AspectoResponse[];
  valoraciones: ValoracionResponse[];
}

// Estructura de evaluación creada
export interface EvaluacionCreada {
  id: number;
  materia: {
    codigo: number;
    nombre: string;
  };
  docente: {
    documento: string;
    nombre: string;
  };
  estudiante: {
    documento: string;
  };
  configuracion: {
    id: number;
  };
}

// Aspecto tal como lo devuelve la API
export interface AspectoResponse {
  ID: number;
  ASPECTO_ID: number;
  ETIQUETA: string;
  DESCRIPCION: string;
  ORDEN: string;
  ACTIVO: number;
}

// Valoración tal como la devuelve la API
export interface ValoracionResponse {
  ID: number;
  VALORACION_ID: number;
  ETIQUETA: string;
  VALOR: string;
  PUNTAJE: string;
  ORDEN: string;
  ACTIVO: number;
}