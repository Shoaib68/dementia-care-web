/**
 * API Module - Centralized Export
 * 
 * @module api
 * @description Main entry point for all API utilities
 * 
 * This module provides a clean, organized API for making HTTP requests
 * and handling server-side API routes.
 * 
 * ## Usage
 * 
 * ### Client-Side (Basic API)
 * ```typescript
 * import { api, ApiError, handleApiError } from '@/shared/lib/api';
 * 
 * const response = await api.get('/endpoint');
 * ```
 * 
 * ### Client-Side (Enhanced with Deduplication)
 * ```typescript
 * import { enhancedApi } from '@/shared/lib/api';
 * 
 * const response = await enhancedApi.get('/endpoint', { deduplicate: true });
 * ```
 * 
 * ### Server-Side (Next.js Routes)
 * ```typescript
 * import { verifyAuth, createSuccessResponse, handleApiError } from '@/shared/lib/api';
 * 
 * export async function GET(request: NextRequest) {
 *   const auth = await verifyAuth('super-admin');
 *   return createSuccessResponse(data);
 * }
 * ```
 */

// ============================================================================
// CLIENT-SIDE API EXPORTS
// ============================================================================

/**
 * Core API client with error handling and HTTP methods
 */
export {
  // Main API client
  api,
  
  // Type definitions
  type ApiResponse,
  type PaginatedResponse,
  
  // Error classes
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  NetworkError,
  
  // Error utilities
  createApiError,
  handleApiError,
  
  // React Query utilities
  transformApiResponse,
  createPaginatedQuery,
  shouldRetry,
  retryDelay,
} from './api-client';

/**
 * Enhanced API client with request deduplication and compression
 */
export {
  // Enhanced API client (singleton)
  enhancedApi,
  
  // Default export alias
  default as enhancedApiDefault,
  
  // Data prefetching
  dataPrefetcher,
  DataPrefetcher,
  
  // Utilities
  withDeduplication,
} from './api-client-enhanced';

// ============================================================================
// SERVER-SIDE API EXPORTS
// ============================================================================

/**
 * Server-side utilities for Next.js API routes
 * 
 * NOTE: These are NOT exported from this index file to prevent accidental
 * client-side imports. Import directly from './api-server' in server-side code:
 * 
 * import { verifyAuth, createSuccessResponse } from '@/shared/lib/api/api-server';
 */

