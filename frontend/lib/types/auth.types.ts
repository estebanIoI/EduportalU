export interface AuthTokens {
  token: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export interface LoginData {
  token: string;
  refreshToken?: string;
  user: {
    id: number;
    username: string;
    email: string;
    primaryRole: string;
    additionalRoles: string[];
  };
}

export interface MateriaEstudiante {
  id: number;
  codigo: number;
  nombre: string;
  docente: {
    documento: string;
    nombre: string;
  };
}

export interface Rol {
  id: number;
  nombre: string;
}

export interface Roles {
  principal: Rol;
  adicionales: Rol[];
}

export interface ProfileData {
  tipo: "estudiante";
  sede: string;
  nombre_completo: string;
  tipo_doc: string;
  documento: string;
  estado_matricula: string;
  programa: string;
  periodo: string;
  semestre: string;
  grupo: string;
  materias: MateriaEstudiante[];
  roles: Roles;
}

export interface MateriaDocente {
  id: number;
  codigo: number;
  nombre: string;
  semestre: string;
  programa: string;
}

export interface PerfilDocente {
  tipo: "docente";
  email: string;
  documento: string;
  nombre_completo: string;
  sede: string;
  periodo: string;
  materias: MateriaDocente[];
  roles: Roles;
}

export interface LoginRequest {
  user_username: string;
  user_password: string;
}

export type PerfilUsuario = ProfileData | PerfilDocente;

