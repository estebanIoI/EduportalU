import { apiClient } from '@/lib/api';
import { ApiResponse, ApiError } from '@/lib/types/api.types';
import { LoginRequest, LoginData, AuthTokens, PerfilUsuario } from '@/lib/types/auth.types';

// Cache para el perfil del usuario
interface ProfileCache {
  data: PerfilUsuario | null;
  timestamp: number;
  promise: Promise<ApiResponse<PerfilUsuario>> | null;
}

class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly PROFILE_CACHE_KEY = 'profileCache';
  private readonly PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutos de caché
  
  // Caché en memoria para el perfil
  private profileCache: ProfileCache = {
    data: null,
    timestamp: 0,
    promise: null
  };

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setTokens({ token, refreshToken }: AuthTokens): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  removeTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    // Limpiar caché del perfil al remover tokens
    this.clearProfileCache();
  }

  // Limpiar caché del perfil
  clearProfileCache(): void {
    this.profileCache = {
      data: null,
      timestamp: 0,
      promise: null
    };
    // También limpiar del localStorage si existe
    try {
      localStorage.removeItem(this.PROFILE_CACHE_KEY);
    } catch (e) {
      // Ignorar errores de localStorage
    }
  }

  // Verificar si el caché del perfil es válido
  private isProfileCacheValid(): boolean {
    const now = Date.now();
    return (
      this.profileCache.data !== null &&
      (now - this.profileCache.timestamp) < this.PROFILE_CACHE_TTL
    );
  }

  // Guardar perfil en caché
  private cacheProfile(profile: PerfilUsuario): void {
    this.profileCache = {
      data: profile,
      timestamp: Date.now(),
      promise: null
    };
    // También guardar en localStorage para persistencia
    try {
      localStorage.setItem(this.PROFILE_CACHE_KEY, JSON.stringify({
        data: profile,
        timestamp: Date.now()
      }));
    } catch (e) {
      // Ignorar errores de localStorage
    }
  }

  // Obtener perfil del caché (incluyendo localStorage)
  private getCachedProfile(): PerfilUsuario | null {
    // Primero verificar caché en memoria
    if (this.isProfileCacheValid()) {
      return this.profileCache.data;
    }
    
    // Intentar recuperar de localStorage
    try {
      const cached = localStorage.getItem(this.PROFILE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const now = Date.now();
        if (parsed.data && (now - parsed.timestamp) < this.PROFILE_CACHE_TTL) {
          // Restaurar caché en memoria
          this.profileCache = {
            data: parsed.data,
            timestamp: parsed.timestamp,
            promise: null
          };
          return parsed.data;
        }
      }
    } catch (e) {
      // Ignorar errores de localStorage
    }
    
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginData>> {
    try {
      // IMPORTANTE: Limpiar caché del perfil anterior antes de iniciar nueva sesión
      this.clearProfileCache();
      
      const response = await apiClient.post<LoginData>('/auth/login', credentials);
      
      // Si es exitoso, guardar tokens
      if (response.success && response.data) {
        const { token, refreshToken } = response.data;
        this.setTokens({ token, refreshToken: refreshToken || '' });
        
        apiClient.setHeader('Authorization', `Bearer ${token}`);
      }
      
      return response;
      
    } catch (error: any) {
      throw error;
    }
  }

  async getProfile(forceRefresh: boolean = false): Promise<ApiResponse<PerfilUsuario>> {
    // Verificar autenticación
    const token = this.getToken();
    if (process.env.NODE_ENV === 'development') {
      console.log('Token disponible en getProfile:', !!token);
    }
    
    if (!this.isAuthenticated()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Usuario no autenticado en getProfile');
      }
      const authError: ApiError = {
        success: false,
        message: 'Sesión expirada. Por favor, inicie sesión nuevamente.',
        error: 'UNAUTHENTICATED'
      };
      throw authError;
    }

    // Verificar caché primero (si no se fuerza refresh)
    if (!forceRefresh) {
      const cachedProfile = this.getCachedProfile();
      if (cachedProfile) {
        if (process.env.NODE_ENV === 'development') {
          console.log('📦 Perfil obtenido del caché');
        }
        return {
          success: true,
          message: 'Perfil obtenido del caché',
          data: cachedProfile
        };
      }
      
      // Si ya hay una petición en curso, reutilizarla (deduplicación)
      if (this.profileCache.promise) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Reutilizando petición de perfil en curso');
        }
        return this.profileCache.promise;
      }
    }

    // Crear la promesa de la petición
    const profilePromise = this._fetchProfile(token!);
    this.profileCache.promise = profilePromise;

    try {
      const response = await profilePromise;
      return response;
    } finally {
      // Limpiar la promesa en curso
      this.profileCache.promise = null;
    }
  }

  // Método interno para hacer la petición real del perfil
  private async _fetchProfile(token: string): Promise<ApiResponse<PerfilUsuario>> {
    try {
      // Configurar headers explícitamente con el token
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🌐 Solicitando perfil al servidor...');
      }
      
      // Usar getSilent para evitar mostrar mensaje de éxito en cada consulta de perfil
      const response = await apiClient.getSilent<PerfilUsuario>('/auth/profile', config);
      if (process.env.NODE_ENV === 'development') {
        console.log('Respuesta de perfil:', response);
      }

      // Discriminar por tipo de usuario y guardar en caché
      if (response.success && response.data) {
        const perfil = response.data;
        
        // Guardar en caché
        this.cacheProfile(perfil);

        switch (perfil.tipo) {
          case "estudiante":
            if (process.env.NODE_ENV === 'development') {
              console.log("Perfil Estudiante cargado:", perfil);
            }
            // Aquí puedes disparar eventos específicos para estudiantes
            window.dispatchEvent(new CustomEvent('auth:student-profile-loaded', { 
              detail: perfil 
            }));
            break;
            
          case "docente":
            console.log("Perfil Docente cargado:", perfil);
            // Aquí puedes disparar eventos específicos para docentes
            window.dispatchEvent(new CustomEvent('auth:teacher-profile-loaded', { 
              detail: perfil 
            }));
            break;
            
          default:
            console.log("Perfil cargado:", perfil);
        }
      }

      return response;
      
    } catch (error: any) {
      // Si hay error 401, limpiar sesión
      if (error.response?.status === 401) {
        this.logout();
        // El interceptor ya mostrará el mensaje de error
      }
      throw error;
    }
  }

  // Refresh token mejorado
  async refreshToken(): Promise<string> {
    const refreshTokenValue = this.getRefreshToken();
    
    if (!refreshTokenValue) {
      const refreshError: ApiError = {
        success: false,
        message: 'Sesión expirada. Por favor, inicie sesión nuevamente.',
        error: 'NO_REFRESH_TOKEN'
      };
      throw refreshError;
    }

    try {
      // Usar postSilent para evitar mostrar mensaje de éxito en refresh automático
      const response = await apiClient.postSilent<{ token: string; refreshToken: string }>('/auth/refresh', {
        refreshToken: refreshTokenValue,
      });

      if (response.success && response.data) {
        const { token, refreshToken: newRefreshToken } = response.data;
        
        this.setTokens({
          token,
          refreshToken: newRefreshToken,
        });
        
        // Actualizar header de autorización
        apiClient.setHeader('Authorization', `Bearer ${token}`);
        
        return token;
      }
      
      // Si llegamos aquí, algo salió mal
      throw new Error('Error al refrescar el token de sesión');
      
    } catch (error) {
      // Limpiar tokens si falla el refresh
      this.removeTokens();
      apiClient.removeHeader('Authorization');
      throw error;
    }
  }

  // Logout mejorado con mejor manejo
  async logout(): Promise<void> {
    try {
      // Intentar hacer logout en el servidor si hay token
      const token = this.getToken();
      if (token) {
        try {
          // Usar postSilent para no mostrar mensaje de éxito/error al hacer logout
          await apiClient.postSilent('/auth/logout');
        } catch (error) {
          // Si falla el logout del servidor, continuar con logout local
          console.warn('Error al hacer logout en servidor:', error);
        }
      }
    } finally {
      // Siempre limpiar tokens localmente
      this.removeTokens();
      
      // Remover header de autorización
      apiClient.removeHeader('Authorization');
      
      // Emitir evento de logout
      window.dispatchEvent(new CustomEvent('auth:logout'));
      
      // Opcionalmente, redirigir al login
      // window.location.href = '/login';
    }
  }

  // Método para inicializar la sesión (llamar al inicio de la app)
  initializeAuth(): void {
    const token = this.getToken();
    
    if (token && !this.isTokenExpired(token)) {
      // Configurar header de autorización si hay token válido
      apiClient.setHeader('Authorization', `Bearer ${token}`);
      
      // Emitir evento de sesión inicializada
      window.dispatchEvent(new CustomEvent('auth:session-initialized'));
    } else if (token) {
      // Token expirado, limpiar
      this.removeTokens();
    }
  }

  // Verificar y renovar token automáticamente
  async ensureValidToken(): Promise<boolean> {
    const token = this.getToken();
    
    if (!token) return false;
    
    if (this.isTokenExpired(token)) {
      try {
        await this.refreshToken();
        return true;
      } catch (error) {
        console.error('Error al renovar token:', error);
        return false;
      }
    }
    
    return true;
  }

  // Utilidades para JWT (mejoradas)
  decodeToken(token?: string): any {
    const tokenToUse = token || this.getToken();
    
    if (!tokenToUse) return null;

    try {
      const base64Url = tokenToUse.split('.')[1];
      if (!base64Url) return null;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  isTokenExpired(token?: string): boolean {
    const decoded = this.decodeToken(token);
    
    if (!decoded?.exp) return true;
    
    const currentTime = Date.now() / 1000;
    // Considerar token como expirado 5 minutos antes para renovarlo proactivamente
    return (decoded.exp - 300) < currentTime;
  }

  // Obtener tiempo restante del token en segundos
  getTokenTimeRemaining(): number {
    const decoded = this.decodeToken();
    if (!decoded?.exp) return 0;
    
    const currentTime = Date.now() / 1000;
    return Math.max(0, decoded.exp - currentTime);
  }

  // Método para obtener información del usuario desde el token (mejorado)
  getCurrentUser(): any {
    const decoded = this.decodeToken();
    return decoded ? {
      id: decoded.sub || decoded.id,
      username: decoded.username,
      email: decoded.email,
      roles: decoded.roles || [],
      tipo: decoded.tipo,
      exp: decoded.exp,
      iat: decoded.iat
    } : null;
  }

  // Verificar si el usuario tiene un rol específico
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) || false;
  }

  // Verificar si el usuario es de un tipo específico
  isUserType(tipo: 'estudiante' | 'docente' | 'admin'): boolean {
    const user = this.getCurrentUser();
    return user?.tipo === tipo;
  }

  // Verificar múltiples roles
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return roles.some(role => user?.roles?.includes(role)) || false;
  }

  // Obtener roles del usuario actual
  getUserRoles(): string[] {
    const user = this.getCurrentUser();
    return user?.roles || [];
  }
}

// Exportar instancia singleton
export const authService = new AuthService();