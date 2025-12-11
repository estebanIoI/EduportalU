import { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { 
  CustomAxiosRequestConfig, 
  ApiError, 
  FailedQueueItem 
} from '@/lib/types/api.types';
import { API_CONFIG } from '@/config/api.config';
import { authService } from '@/services/evaluacionITP/auth/auth.service';

// Estado para manejo de requests concurrentes
let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

// Función para procesar la cola de requests fallidos
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

// Configurar interceptores de request
export const setupRequestInterceptors = (apiInstance: AxiosInstance) => {
  apiInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = authService.getToken();
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Agregar timestamp para debugging
      (config as CustomAxiosRequestConfig).metadata = { 
        startTime: Date.now() 
      };
      
      return config;
    },
    (error: AxiosError) => {
      console.error('Error en interceptor de solicitudes:', error);
      return Promise.reject(error);
    }
  );
};

// Configurar interceptores de response
export const setupResponseInterceptors = (apiInstance: AxiosInstance) => {
  apiInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log de tiempo de respuesta para debugging
      const config = response.config as CustomAxiosRequestConfig;
      
      if (config.metadata?.startTime) {
        const duration = Date.now() - config.metadata.startTime;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 API call to ${config.url} took ${duration}ms`);
        }
      }

      return response;
    },
    async (error: AxiosError<ApiError>) => { // Cambiado a ApiError
      const originalRequest = error.config as CustomAxiosRequestConfig;

      // Manejo de errores de red con retry automático
      if (!error.response && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
        const retryCount = originalRequest._retryCount;

        if (retryCount <= API_CONFIG.retryAttempts) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔄 Reintentando request (${retryCount}/${API_CONFIG.retryAttempts}) - ${originalRequest.url}`);
          }
          
          // Backoff exponencial: 1s, 2s, 4s...
          const delay = API_CONFIG.retryDelay * Math.pow(2, retryCount - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return apiInstance(originalRequest);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log(`❌ Máximo de reintentos alcanzado para ${originalRequest.url}`);
          }
        }
      }

      // Manejo de errores 401 con refresh token
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiInstance(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await authService.refreshToken();
          processQueue(null, newToken);
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          
          return apiInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          authService.logout();
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Manejo de otros errores HTTP
      return handleApiError(error);
    }
  );
};

// Función para manejar errores de API - actualizada para tu backend
const handleApiError = (error: AxiosError<ApiError>): Promise<ApiError> => {
  const errorData = error.response?.data;
  let errorMessage = 'Ha ocurrido un error inesperado';
  
  // Manejar diferentes tipos de errores
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    errorMessage = 'El servidor tardó demasiado en responder. Por favor, intenta nuevamente.';
  } else if (error.code === 'ERR_NETWORK' || !error.response) {
    errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
  } else if (error.response?.status === 401) {
    errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
  } else if (error.response?.status === 403) {
    errorMessage = 'No tienes permisos para realizar esta acción.';
  } else if (error.response?.status === 404) {
    errorMessage = 'El recurso solicitado no fue encontrado.';
  } else if (error.response?.status === 500) {
    errorMessage = 'Error interno del servidor. Por favor, contacta al administrador.';
  } else if (errorData?.message) {
    errorMessage = errorData.message;
  }

  // Log detallado del error en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error en API:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: errorMessage,
      error: errorData?.error || error.code,
      timestamp: new Date().toISOString(),
    });
  }

  // Crear error tipado según tu estructura de backend
  const apiError: ApiError = {
    success: false,
    message: errorMessage,
    error: errorData?.error || error.code || 'UNKNOWN_ERROR',
  };

  return Promise.reject(apiError);
};

// Configurar todos los interceptores
export const setupInterceptors = (apiInstance: AxiosInstance) => {
  setupRequestInterceptors(apiInstance);
  setupResponseInterceptors(apiInstance);
};