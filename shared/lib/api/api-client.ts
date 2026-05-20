/**
 * Core API Client for React Query integration
 * Provides consistent error handling, request/response transformation, and type safety
 * 
 * @module api-client
 * @description Client-side API utilities for making HTTP requests with automatic error handling
 */

// Base API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>; // For validation errors
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Base API Error class
export class ApiError extends Error {
  public status: number;
  public code?: string;
  public errors?: Record<string, string[]>;
  public timestamp: string;
  public requestId?: string;

  constructor(
    message: string,
    status: number = 500,
    code?: string,
    errors?: Record<string, string[]>,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
  }
}

// Specific error types for better error handling
export class ValidationError extends ApiError {
  constructor(
    message: string = 'Validation failed',
    errors?: Record<string, string[]>,
    requestId?: string
  ) {
    super(message, 400, 'VALIDATION_ERROR', errors, requestId);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(
    message: string = 'Authentication required',
    requestId?: string
  ) {
    super(message, 401, 'AUTHENTICATION_ERROR', undefined, requestId);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(
    message: string = 'Insufficient permissions',
    requestId?: string
  ) {
    super(message, 403, 'AUTHORIZATION_ERROR', undefined, requestId);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(
    resource: string = 'Resource',
    requestId?: string
  ) {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR', undefined, requestId);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(
    message: string = 'Resource already exists',
    requestId?: string
  ) {
    super(message, 409, 'CONFLICT_ERROR', undefined, requestId);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  public retryAfter?: number;

  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number,
    requestId?: string
  ) {
    super(message, 429, 'RATE_LIMIT_ERROR', undefined, requestId);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends ApiError {
  constructor(
    message: string = 'Internal server error',
    requestId?: string
  ) {
    super(message, 500, 'SERVER_ERROR', undefined, requestId);
    this.name = 'ServerError';
  }
}

export class NetworkError extends ApiError {
  constructor(
    message: string = 'Network error occurred',
    requestId?: string
  ) {
    super(message, 0, 'NETWORK_ERROR', undefined, requestId);
    this.name = 'NetworkError';
  }
}

// Error factory function
export const createApiError = (
  status: number,
  message: string,
  code?: string,
  errors?: Record<string, string[]>,
  requestId?: string
): ApiError => {
  switch (status) {
    case 400:
      if (code === 'VALIDATION_ERROR' || errors) {
        return new ValidationError(message, errors, requestId);
      }
      return new ApiError(message, status, code, errors, requestId);
    case 401:
      return new AuthenticationError(message, requestId);
    case 403:
      return new AuthorizationError(message, requestId);
    case 404:
      return new NotFoundError(message, requestId);
    case 409:
      return new ConflictError(message, requestId);
    case 429:
      return new RateLimitError(message, undefined, requestId);
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message, requestId);
    case 0:
      return new NetworkError(message, requestId);
    default:
      return new ApiError(message, status, code, errors, requestId);
  }
};

// Request configuration
interface RequestConfig extends RequestInit {
  timeout?: number;
  baseURL?: string;
}

/**
 * Enhanced fetch wrapper with automatic error handling and timeouts
 */
async function apiRequest<T = any>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const { timeout = 10000, baseURL = '', ...requestConfig } = config;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const url = `${baseURL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...requestConfig,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...requestConfig.headers,
      },
    });

    clearTimeout(timeoutId);

    // Parse response
    let responseData: ApiResponse<T>;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      // Handle non-JSON responses
      const text = await response.text();
      responseData = {
        success: response.ok,
        data: text as any,
        message: response.ok ? 'Success' : 'Request failed',
      };
    }

    // Handle HTTP errors
    if (!response.ok) {
      const error = new ApiError(
        responseData.error || responseData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        responseData.code,
        responseData.errors
      );
      
      // Don't log client errors (4xx) to prevent console spam for expected validation errors
      if (response.status >= 400 && response.status < 500) {
        // Mark as expected error to prevent unnecessary logging
        error.name = 'ApiClientError';
      }
      
      throw error;
    }

    return responseData;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle different error types
    if (error instanceof ApiError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408, 'TIMEOUT');
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error. Please check your connection.', 0, 'NETWORK_ERROR');
    }

    // Generic error
    throw new ApiError(
      error.message || 'An unexpected error occurred',
      500,
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * API service methods for different HTTP verbs
 */
export const api = {
  get: <T = any>(endpoint: string, config?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...config, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, config?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any, config?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(endpoint: string, data?: any, config?: RequestConfig) =>
    apiRequest<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string, config?: RequestConfig) =>
    apiRequest<T>(endpoint, { ...config, method: 'DELETE' }),
};

/**
 * Utility functions for React Query integration
 */

// Transform API response for React Query
export const transformApiResponse = <T>(response: ApiResponse<T>): T => {
  if (!response.success) {
    throw new ApiError(
      response.error || 'API request failed',
      500,
      'API_ERROR'
    );
  }
  return response.data as T;
};

// Create paginated query function
export const createPaginatedQuery = <T>(
  endpoint: string,
  pageParam: number = 1,
  limit: number = 10,
  filters?: Record<string, any>
) => {
  const params = new URLSearchParams({
    page: pageParam.toString(),
    limit: limit.toString(),
    ...(filters && Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
    )),
  });

  return api.get<PaginatedResponse<T>>(`${endpoint}?${params.toString()}`);
};

// Error handler for React Query
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    // Handle validation errors
    if (error.errors) {
      const firstError = Object.values(error.errors)[0];
      return firstError?.[0] || error.message;
    }
    
    // Handle specific error codes
    switch (error.code) {
      case 'TIMEOUT':
        return 'Request timed out. Please try again.';
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection and try again.';
      case 'UNAUTHORIZED':
        return 'You are not authorized to perform this action.';
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};

// Retry logic for React Query
export const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (error instanceof ApiError) {
    // Don't retry client errors (4xx) except for timeouts
    if (error.status >= 400 && error.status < 500 && error.code !== 'TIMEOUT') {
      return false;
    }
  }
  
  // Retry up to 3 times for server errors and network issues
  return failureCount < 3;
};

// Exponential backoff delay
export const retryDelay = (attemptIndex: number): number => {
  return Math.min(1000 * 2 ** attemptIndex, 30000);
};
