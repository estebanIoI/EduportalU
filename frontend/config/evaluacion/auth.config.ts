// Configuración para autenticación
export const AUTH_CONFIG = {
  // Rutas de autenticación
  endpoints: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
  },
  
  // Configuración de tokens
  token: {
    storageKey: 'token',
    refreshStorageKey: 'refreshToken',
    headerPrefix: 'Bearer',
  },
  
  // Configuración de redirecciones
  routes: {
    login: '/login',
    dashboard: '/dashboard',
    unauthorized: '/unauthorized',
  },
  
  // Configuración de roles
  roles: {
    ADMIN: 'admin',
    DOCENTE: 'docente',
    ESTUDIANTE: 'estudiante',
    COORDINADOR: 'coordinador',
  },
  
  // Configuración de sesión
  session: {
    autoRefresh: true,
    refreshThreshold: 5 * 60 * 1000, // 5 minutos antes del vencimiento
    maxRetries: 3,
  },
} as const;

// Tipos derivados de la configuración
export type UserRole = typeof AUTH_CONFIG.roles[keyof typeof AUTH_CONFIG.roles];
export type AuthEndpoint = typeof AUTH_CONFIG.endpoints[keyof typeof AUTH_CONFIG.endpoints];
export type AuthRoute = typeof AUTH_CONFIG.routes[keyof typeof AUTH_CONFIG.routes];