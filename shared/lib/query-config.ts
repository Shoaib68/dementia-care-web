/**
 * Reusable query configuration options for consistent behavior across the application
 * Following feature-first clean architecture and TanStack Query best practices
 */

/**
 * Default query options that ensure data loads on initial mount
 * while maintaining performance and reducing server load in development
 */
export const defaultQueryOptions = {
  // Ensure data loads when component mounts
  refetchOnMount: true,
  
  // Manage refetch behavior based on environment
  refetchOnWindowFocus: process.env.NODE_ENV === 'development' ? false : true,
  
  // Always refetch on network reconnection
  refetchOnReconnect: true,
  
  // Environment-based stale time to fix data loading issues
  staleTime: process.env.NODE_ENV === 'development' ? 0 : 5 * 60 * 1000, // No cache in dev, 5 minutes in prod
  
  // Keep data in cache for reasonable time after unmount
  gcTime: 15 * 60 * 1000, // 15 minutes
  
  // Retry configuration for better reliability
  retry: (failureCount: number, error: any) => {
    // Don't retry on client errors (4xx)
    if (error?.status >= 400 && error?.status < 500) {
      return false;
    }
    // Retry up to 3 times for server errors and network issues
    return failureCount < 3;
  },
  
  // Exponential backoff for retries
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  
  // Performance optimization
  networkMode: 'online' as const,
  notifyOnChangeProps: 'tracked' as const,
};

/**
 * Analytics-specific query options with longer timeout
 * for complex database operations
 */
export const analyticsQueryOptions = {
  ...defaultQueryOptions,
  
  // Longer timeout for complex analytics queries
  timeout: 20000, // 20 seconds
  
  // More aggressive retry for analytics
  retry: (failureCount: number, error: any) => {
    // Don't retry on auth errors
    if (error?.status === 401 || error?.status === 403) {
      return false;
    }
    // Retry up to 5 times for better reliability
    return failureCount < 5;
  },
  
  // Faster retry delays for analytics
  retryDelay: (attemptIndex: number) => Math.min(500 * 2 ** attemptIndex, 10000),
  
  // Background refresh for analytics (disabled in development)
  refetchInterval: process.env.NODE_ENV === 'development' ? false : 30 * 60 * 1000, // 30 minutes in prod
};

/**
 * Hospital management query options with moderate caching
 */
export const hospitalQueryOptions = {
  ...defaultQueryOptions,
  
  // Moderate timeout for hospital operations
  timeout: 15000, // 15 seconds
};

/**
 * Real-time or frequently changing data query options
 * with minimal caching
 */
export const realtimeQueryOptions = {
  ...defaultQueryOptions,
  
  // Always fresh data
  staleTime: 0,
  
  // Shorter cache time
  gcTime: 5 * 60 * 1000, // 5 minutes
};

/**
 * Preview or temporary data query options
 * for data that changes quickly
 */
export const previewQueryOptions = {
  ...defaultQueryOptions,
  
  // Very short stale time for preview data
  staleTime: process.env.NODE_ENV === 'development' ? 0 : 1 * 60 * 1000, // No cache in dev, 1 minute in prod
  
  // Shorter cache time for preview data
  gcTime: 5 * 60 * 1000, // 5 minutes
};

/**
 * Helper function to create environment-aware query options
 * with custom overrides
 */
export const createQueryOptions = (overrides: Record<string, any> = {}) => ({
  ...defaultQueryOptions,
  ...overrides,
});

/**
 * Development-friendly query options that always fetch fresh data
 */
export const devQueryOptions = {
  ...defaultQueryOptions,
  staleTime: 0,
  gcTime: 0,
  refetchOnWindowFocus: false,
  refetchInterval: false,
};

/**
 * Production-optimized query options with longer caching
 */
export const prodQueryOptions = {
  ...defaultQueryOptions,
  staleTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: true,
  refetchInterval: 60 * 60 * 1000, // 1 hour
};

/**
 * Get environment-appropriate query options
 */
export const getEnvQueryOptions = () => {
  return process.env.NODE_ENV === 'development' ? devQueryOptions : prodQueryOptions;
};