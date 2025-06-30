import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { ApiResponse, ApiError, FileDownloadResponse } from '@/lib/types/api.types';
import { API_CONFIG, DEFAULT_HEADERS, getEnvironmentConfig } from '@/config/api.config';
import { setupInterceptors } from '@/services/api.interceptor';
import { toast } from '@/hooks/use-toast';

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    const config = getEnvironmentConfig();
    
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: DEFAULT_HEADERS,
    });

    setupInterceptors(this.axiosInstance);
  }

  // Método privado para manejar respuestas y mostrar mensajes
  private handleResponse<T>(response: ApiResponse<T>, showMessage = true): ApiResponse<T> {
    if (showMessage && response.success) {
      toast({
        title: "Éxito",
        description: response.message,
        variant: "default"
      });
    }
    return response;
  }

  // Método privado para manejar errores
  private handleError(error: AxiosError<ApiError>): never {
    const errorMessage = error.response?.data?.message || 'Error de conexión';
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive"
    });
    throw error;
  }

  // Método específico para descargas de archivos
  async downloadFile(
    url: string,
    config?: any,
    options?: { showMessage?: boolean }
  ): Promise<FileDownloadResponse> {
    try {
      const response: AxiosResponse<Blob> = await this.axiosInstance.get(url, {
        ...config,
        responseType: 'blob',
      });

      // Extraer el nombre del archivo de los headers
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          filename = fileNameMatch[1].replace(/['"]/g, '');
        }
      }

      if (options?.showMessage !== false) {
        toast({
          title: "Descarga completada",
          description: "El archivo se ha descargado correctamente",
          variant: "default"
        });
      }

      return {
        data: response.data,
        headers: response.headers,
        filename
      };
    } catch (error) {
      const errorMessage = 'Error al descargar el archivo';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error;
    }
  }

  // Métodos HTTP básicos con manejo inteligente de mensajes
  async get<T = any>(
    url: string, 
    config?: any,
    options?: { showMessage?: boolean }
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get(url, config);
      return this.handleResponse(response.data, options?.showMessage);
    } catch (error) {
      return this.handleError(error as AxiosError<ApiError>);
    }
  }

  async post<T = any>(
    url: string, 
    data?: any, 
    config?: any,
    options?: { showMessage?: boolean }
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post(url, data, config);
      const result = response.data;
      
      // Usar siempre el mensaje del backend
      if (options?.showMessage !== false && result.success) {
        toast({
          title: "Éxito",
          description: result.message,
          variant: "default"
        });
      }
      
      return result;
    } catch (error) {
      return this.handleError(error as AxiosError<ApiError>);
    }
  }

  async put<T = any>(
    url: string, 
    data?: any, 
    config?: any,
    options?: { showMessage?: boolean }
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put(url, data, config);
      const result = response.data;
      
      // Usar siempre el mensaje del backend
      if (options?.showMessage !== false && result.success) {
        toast({
          title: "Éxito", 
          description: result.message,
          variant: "default"
        });
      }
      
      return result;
    } catch (error) {
      return this.handleError(error as AxiosError<ApiError>);
    }
  }

  async delete<T = any>(
    url: string, 
    config?: any,
    options?: { showMessage?: boolean }
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete(url, config);
      const result = response.data;
      
      // Usar siempre el mensaje del backend
      if (options?.showMessage !== false && result.success) {
        toast({
          title: "Éxito",
          description: result.message, 
          variant: "default"
        });
      }
      
      return result;
    } catch (error) {
      return this.handleError(error as AxiosError<ApiError>);
    }
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: any,
    options?: { showMessage?: boolean }
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.patch(url, data, config);
      const result = response.data;

      if (options?.showMessage !== false && result.success) {
        toast({
          title: "Éxito",
          description: result.message,
          variant: "default"
        });
      }

      return result;
    } catch (error) {
      return this.handleError(error as AxiosError<ApiError>);
    }
  }

  // Método silencioso para cuando no queremos mostrar notificaciones
  async getSilent<T = any>(url: string, config?: any): Promise<ApiResponse<T>> {
    return this.get(url, config, { showMessage: false });
  }

  async postSilent<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    return this.post(url, data, config, { showMessage: false });
  }

  // Método silencioso para descargas
  async downloadFileSilent(url: string, config?: any): Promise<FileDownloadResponse> {
    return this.downloadFile(url, config, { showMessage: false });
  }

  // Resto de métodos...
  setBaseURL(baseURL: string): void {
    this.axiosInstance.defaults.baseURL = baseURL;
  }

  setHeader(key: string, value: string): void {
    this.axiosInstance.defaults.headers.common[key] = value;
  }

  removeHeader(key: string): void {
    delete this.axiosInstance.defaults.headers.common[key];
  }

  getInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

export const apiClient = new ApiClient();
export { ApiClient };