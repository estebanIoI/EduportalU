import { ApiConfig } from '@/lib/types/api.types';

// Función para obtener la URL base de la API
const getApiBaseUrl = (): string => {
  // En producción, usar la IP del servidor
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://62.146.231.110:3000/api/v1';
  }
  
  // En desarrollo, usar localhost o la variable de entorno
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
};

// Validación de variables de entorno requeridas
const validateEnvironmentVariables = () => {
  const apiUrl = getApiBaseUrl();
  
  if (!apiUrl) {
    throw new Error('API URL is required');
  }

  console.log(`🌐 API configured for: ${apiUrl}`);
};

// Ejecutar validación
validateEnvironmentVariables();

// Configuración del entorno
export const API_CONFIG: ApiConfig = {
  baseURL: getApiBaseUrl(),
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000, 
  retryAttempts: Number(process.env.NEXT_PUBLIC_RETRY_ATTEMPTS) || 3,
  retryDelay: Number(process.env.NEXT_PUBLIC_RETRY_DELAY) || 1000,
};

// Headers por defecto
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Configuración para diferentes entornos
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV;
  
  const configs = {
    development: {
      ...API_CONFIG,
      debug: true,
    },
    production: {
      ...API_CONFIG,
      debug: false,
      baseURL: process.env.NEXT_PUBLIC_API_URL,
    }
  };

  return configs[env as keyof typeof configs] || configs.development;
};