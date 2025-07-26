import { InternalAxiosRequestConfig } from 'axios';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  error: string;
}

// Nueva interfaz para respuestas de descarga de archivos
export interface FileDownloadResponse {
  data: Blob;
  headers: Record<string, any>;
  filename?: string;
}

export interface MessageTypes {
  SUCCESS: {
    FETCH: string;
    CREATE: string;
    UPDATE: string;
    DELETE: string;
    UPLOAD: string;
    DOWNLOAD: string; // Agregado para descargas
  };
  ERROR: {
    NOT_FOUND: string;
    VALIDATION: string;
    SERVER: string;
    NETWORK: string;
    DOWNLOAD: string; // Agregado para errores de descarga
  };
}

// Interfaz para extender la configuración de axios con metadata
export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
  _retry?: boolean;
  _retryCount?: number;
}

// Tipos para la cola de requests fallidos
export interface FailedQueueItem {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

// Configuración del API
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// Tipos para opciones de requests
export interface RequestOptions {
  showMessage?: boolean;
  silent?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

// Tipos específicos para diferentes tipos de respuesta
export interface ApiPaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: null;
    prevPage: null;
  };
}

export interface BatchResponse<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: string;
  }>;
}

// Enums para tipos de contenido comunes
export enum ContentType {
  JSON = 'application/json',
  FORM_DATA = 'multipart/form-data',
  URL_ENCODED = 'application/x-www-form-urlencoded',
  OCTET_STREAM = 'application/octet-stream',
  TEXT_PLAIN = 'text/plain',
  PDF = 'application/pdf',
  EXCEL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  CSV = 'text/csv'
}

// Tipos para manejo de uploads
export interface FileUploadResponse {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  url?: string;
  path?: string;
}