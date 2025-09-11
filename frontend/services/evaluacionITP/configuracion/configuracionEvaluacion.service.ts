import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/lib/types/api.types';
import { ConfiguracionEvaluacion, ConfiguracionEvaluacionInput, ConfiguracionEvaluacionUpdate, EstadoActivo } from '@/lib/types/evaluacionInsitu';

export const configuracionEvaluacionService = {
  getAll: async (): Promise<ApiResponse<ConfiguracionEvaluacion[]>> => {
    try {
      const response = await apiClient.get<ConfiguracionEvaluacion[]>('/configuracion-evaluacion');
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  getById: async (id: number): Promise<ApiResponse<ConfiguracionEvaluacion>> => {
    try {
      const response = await apiClient.get<ConfiguracionEvaluacion>(`/configuracion-evaluacion/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (
    data: Omit<ConfiguracionEvaluacionInput, 'ID'>
  ): Promise<ApiResponse<ConfiguracionEvaluacionInput>> => {
    try {
      // Solo log en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('Servicio - Datos a enviar:', JSON.stringify(data));
      }
      
      // Obtener el token de autenticación directamente
      const token = localStorage.getItem('token');
      if (process.env.NODE_ENV === 'development') {
        console.log('Token disponible:', !!token);
      }
      
      // Configurar headers con el token de autenticación
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Enviando solicitud con config:', config);
      }
      
      const response = await apiClient.post<ConfiguracionEvaluacionInput>(
        '/configuracion-evaluacion', 
        data,
        config
      );
      
      return response;
    } catch (error: any) {
      // Solo log detallado en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.error('Error en servicio configuracionEvaluacion.create:', error);
        console.log('Error response completo:', error?.response);
      }
      
      // Crear un error más específico si es 403
      if (error?.response?.status === 403) {
        // Imprimir información detallada de la respuesta solo en desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.log('Headers de respuesta 403:', error?.response?.headers);
          console.log('Datos de respuesta 403:', error?.response?.data);
        }
        
        let errorMsg = 'No tienes permisos para crear configuraciones de evaluación';
        // Si hay un mensaje específico en la respuesta, lo usamos
        if (error?.response?.data?.message) {
          errorMsg = error.response.data.message;
        }
        
        const authError: any = new Error(errorMsg);
        authError.name = 'ForbiddenError';
        authError.status = 403;
        throw authError;
      }
      
      throw error;
    }
  },

  update: async (
    id: number,
    data: Partial<ConfiguracionEvaluacionUpdate>
  ): Promise<ApiResponse<ConfiguracionEvaluacionUpdate>> => {
    try {
      const response = await apiClient.put<ConfiguracionEvaluacionUpdate>(`/configuracion-evaluacion/${id}`, data);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (id: number): Promise<ApiResponse<null>> => {
    try {
      const response = await apiClient.delete<null>(`/configuracion-evaluacion/${id}`);
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  updateEstado: async (estado: EstadoActivo): Promise<ApiResponse<EstadoActivo>> => {
    try {
      const response = await apiClient.patch<EstadoActivo>(
        `/configuracion-evaluacion/${estado.id}/estado`,
        estado
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  },
};
