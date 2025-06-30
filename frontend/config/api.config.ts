import { ApiConfig } from '@/lib/types/api.types';

// Configuración del entorno
export const API_CONFIG: ApiConfig = {
  baseURL: String(process.env.NEXT_PUBLIC_API_URL),
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT), 
  retryAttempts: Number(process.env.NEXT_PUBLIC_RETRY_ATTEMPTS),
  retryDelay: Number(process.env.NEXT_PUBLIC_RETRY_DELAY),
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