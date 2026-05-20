import { QueryClient } from '@tanstack/react-query';

/**
 * React Query configuration optimized for the dementia care system
 * Provides robust caching, error handling, and background synchronization
 */
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Stale time - data is fresh for 5 minutes in all environments
      staleTime: 5 * 60 * 1000, // 5 minutes - prevents excessive refetching
      // Keep data in cache for reasonable time after component unmount
      gcTime: 15 * 60 * 1000, // 15 minutes (formerly cacheTime)
      // Retry failed requests with exponential backoff
      retry: (failureCount: number, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for better reliability
        return failureCount < 2;
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
      // Background refetch settings - optimized to prevent excessive requests
      refetchOnWindowFocus: false, // Disable to prevent refetch loops
      refetchOnReconnect: true,
      refetchOnMount: true, // Refetch on mount if data is stale
      // Performance optimizations
      networkMode: 'online', // Only run queries when online
      // notifyOnChangeProps defaults to 'tracked' in TanStack Query v5 (always-on tracking)
    },
    mutations: {
      // Retry mutations once on failure for network errors only
      retry: (failureCount: number, error: any) => {
        // Don't retry client errors (validation, conflicts, etc.)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry once for server errors or network issues
        return failureCount < 1;
      },
      retryDelay: 1000,
      // Global error handling disabled - let individual mutations handle their own errors
      // This prevents unwanted console errors for validation failures
    },
  },
};

/**
 * Create a new QueryClient instance with our configuration
 */
export const createQueryClient = () => new QueryClient(queryClientConfig);

/**
 * Singleton QueryClient instance for the app
 */
let clientSingleton: QueryClient | undefined = undefined;

export const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server side - always create a new client
    return createQueryClient();
  }
  
  // Client side - reuse existing client or create new one
  if (!clientSingleton) {
    clientSingleton = createQueryClient();
  }
  return clientSingleton;
};

/**
 * Query invalidation helpers for better cache management
 */
export const invalidateQueries = {
  hospitals: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['hospitals'] });
  },
  doctors: (queryClient: QueryClient, hospitalId?: string) => {
    if (hospitalId) {
      queryClient.invalidateQueries({ queryKey: ['doctors', hospitalId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    }
  },
  patients: (queryClient: QueryClient, doctorId?: string) => {
    if (doctorId) {
      queryClient.invalidateQueries({ queryKey: ['patients', doctorId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    }
  },
  analytics: (queryClient: QueryClient, scope?: 'system' | 'hospital' | 'doctor') => {
    if (scope) {
      queryClient.invalidateQueries({ queryKey: ['analytics', scope] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }
  },
};

/**
 * Common error handler for React Query
 */
export const handleQueryError = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  
  if (error?.status) {
    switch (error.status) {
      case 401:
        return 'Unauthorized access. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return `Request failed with status ${error.status}`;
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
};
