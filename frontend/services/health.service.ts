import { apiClient } from '@/lib/api';

class HealthService {
  /**
   * Verifica si el backend está disponible
   * @returns Promise<boolean> - true si el backend responde, false en caso contrario
   */
  async checkBackendHealth(): Promise<{ 
    isHealthy: boolean; 
    message: string;
    responseTime?: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Intentar hacer una petición simple al backend
      // Usamos el endpoint /health que no requiere autenticación
      const response = await apiClient.getSilent('/health');
      const responseTime = Date.now() - startTime;
      
      // El endpoint /health ahora retorna el formato estándar ApiResponse
      if (response.success) {
        return {
          isHealthy: true,
          message: response.message || 'Servidor disponible',
          responseTime
        };
      }
      
      return {
        isHealthy: false,
        message: response.message || 'Servidor no disponible',
        responseTime
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Analizar el tipo de error
      let message = 'Servidor no disponible';
      
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        message = 'El servidor tardó demasiado en responder';
      } else if (error?.code === 'ERR_NETWORK' || !error?.status) {
        message = 'No se pudo conectar con el servidor';
      } else if (error?.status >= 500) {
        message = 'Error interno del servidor';
      } else if (error?.status === 404) {
        // Si el endpoint no existe, aún podemos considerar que el servidor está arriba
        return {
          isHealthy: true,
          message: 'Servidor disponible',
          responseTime
        };
      }
      
      return {
        isHealthy: false,
        message,
        responseTime
      };
    }
  }

  /**
   * Verifica la conexión periódicamente
   * @param intervalMs - Intervalo en milisegundos (default: 30 segundos)
   * @param onStatusChange - Callback que se ejecuta cuando cambia el estado
   * @returns Function para detener el monitoreo
   */
  startHealthMonitoring(
    intervalMs: number = 30000,
    onStatusChange?: (status: { isHealthy: boolean; message: string; responseTime?: number }) => void
  ): () => void {
    let lastStatus: boolean | null = null;
    
    const checkHealth = async () => {
      const status = await this.checkBackendHealth();
      
      // Solo notificar si el estado cambió
      if (lastStatus !== null && lastStatus !== status.isHealthy) {
        console.log(`🔄 Estado del servidor cambió: ${status.isHealthy ? 'Disponible' : 'No disponible'}`);
        
        if (onStatusChange) {
          onStatusChange(status);
        }
      }
      
      lastStatus = status.isHealthy;
    };
    
    // Primera verificación inmediata
    checkHealth();
    
    // Verificaciones periódicas
    const intervalId = setInterval(checkHealth, intervalMs);
    
    // Retornar función para detener el monitoreo
    return () => clearInterval(intervalId);
  }
}

export const healthService = new HealthService();
