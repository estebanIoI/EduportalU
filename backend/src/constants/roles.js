/**
 * Constantes de roles del sistema
 */

// Roles administrativos con permisos completos
const ADMIN_ROLES = ['Admin', 'Director Programa'];

// Roles de usuario estándar
const USER_ROLES = {
  ADMIN: 'Admin',
  DIRECTOR_PROGRAMA: 'Director Programa',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
};

// Configuraciones de acceso por funcionalidad
const ROLE_PERMISSIONS = {
  // Gestión de roles
  MANAGE_ROLES: ADMIN_ROLES,
  
  // Gestión de evaluaciones (configuración)
  MANAGE_EVALUATIONS: ADMIN_ROLES,
  
  // Crear evaluaciones
  CREATE_EVALUATION: ['Admin', 'Estudiante'],
  
  // Ver evaluaciones
  VIEW_EVALUATIONS: ['Admin', 'Director Programa', 'Docente', 'Estudiante'],
  
  // Gestión de aspectos
  MANAGE_ASPECTS: ADMIN_ROLES,
  
  // Gestión de escalas de valoración
  MANAGE_SCALES: ADMIN_ROLES,
  
  // Gestión de configuración
  MANAGE_CONFIGURATION: ADMIN_ROLES,
};

module.exports = {
  ADMIN_ROLES,
  USER_ROLES,
  ROLE_PERMISSIONS,
};
