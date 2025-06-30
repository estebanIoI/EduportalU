import { apiClient, ApiClient } from '@/services/api.client';
import { authService } from '@/services/evaluacionITP/auth/auth.service';

export { apiClient, ApiClient };
export { authService };

export type {
  ApiResponse,
  ApiError,
  CustomAxiosRequestConfig,
  FailedQueueItem,
  ApiConfig,

} from '@/lib/types/api.types';

import { AuthTokens, RefreshTokenResponse } from '@/lib/types/auth.types'; 

export { API_CONFIG, DEFAULT_HEADERS, getEnvironmentConfig } from '@/config/api.config';

export default apiClient;
