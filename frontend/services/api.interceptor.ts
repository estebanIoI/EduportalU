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
          console.log(`🔄 Reintentando request (${retryCount}/${API_CONFIG.retryAttempts})`);
          
          await new Promise(resolve => 
            setTimeout(resolve, API_CONFIG.retryDelay * retryCount)
          );
          
          return apiInstance(originalRequest);
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
  const errorMessage = errorData?.message || 
                      error.message || 
                      'Ha ocurrido un error inesperado';

  // Log detallado del error
  console.error('🚨 Error en API:', {
    url: error.config?.url,
    method: error.config?.method?.toUpperCase(),
    status: error.response?.status,
    statusText: error.response?.statusText,
    message: errorMessage,
    error: errorData?.error,
    timestamp: new Date().toISOString(),
  });

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