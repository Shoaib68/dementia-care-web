import React from 'react';
import { UseQueryResult, UseInfiniteQueryResult, UseMutationResult } from '@tanstack/react-query';

/**
 * Enhanced loading state management for TanStack Query
 * Provides semantic loading states and integrates with skeleton components
 */

export interface LoadingStates {
  isLoading: boolean;
  isInitialLoading: boolean;
  isRefetching: boolean;
  isFetching: boolean;
  isStale: boolean;
  hasError: boolean;
  isEmpty: boolean;
  isSuccess: boolean;
}

/**
 * Extracts semantic loading states from TanStack Query result
 */
export const useLoadingStates = <T>(
  queryResult: UseQueryResult<T, Error> | UseInfiniteQueryResult<T, Error>
): LoadingStates => {
  const {
    isLoading,
    isFetching,
    isRefetching,
    isStale,
    error,
    data,
    isSuccess
  } = queryResult;

  // Check if this is initial loading (no data and currently loading)
  const isInitialLoading = isLoading && !data;

  // Check if data is empty (for arrays/objects)
  const isEmpty = React.useMemo(() => {
    if (!data) return true;
    
    // Handle paginated/infinite queries
    if ('pages' in queryResult && Array.isArray(queryResult.data?.pages)) {
      const pages = queryResult.data.pages;
      return pages.length === 0 || pages.every(page => {
        if (Array.isArray(page?.data)) {
          return page.data.length === 0;
        }
        return !page || (Array.isArray(page) && page.length === 0);
      });
    }
    
    // Handle regular arrays
    if (Array.isArray(data)) {
      return data.length === 0;
    }
    
    // Handle objects
    if (typeof data === 'object' && data !== null) {
      return Object.keys(data).length === 0;
    }
    
    return false;
  }, [data, queryResult]);

  return {
    isLoading,
    isInitialLoading,
    isRefetching,
    isFetching,
    isStale,
    hasError: !!error,
    isEmpty,
    isSuccess
  };
};

/**
 * Hook for managing mutation loading states
 */
export const useMutationLoadingStates = <TData, TError, TVariables>(
  mutationResult: UseMutationResult<TData, TError, TVariables>
) => {
  const { isPending, isError, isSuccess, error } = mutationResult;
  
  return {
    isLoading: isPending,
    hasError: isError,
    isSuccess,
    error
  };
};

/**
 * Skeleton configuration for different content types
 */
export interface SkeletonConfig {
  type: 'table' | 'card' | 'form' | 'grid' | 'list';
  props?: Record<string, any>;
}

/**
 * Hook that provides skeleton components based on loading state
 */
export const useSkeletonRenderer = (
  loadingStates: LoadingStates,
  config: SkeletonConfig
) => {
  return React.useMemo(() => {
    if (!loadingStates.isInitialLoading) return null;
    
    // Return skeleton configuration for components to render
    return {
      shouldShowSkeleton: true,
      skeletonType: config.type,
      skeletonProps: config.props || {}
    };
  }, [loadingStates.isInitialLoading, config]);
};

/**
 * Comprehensive loading state hook that combines query states with skeleton rendering
 */
export const useEnhancedLoadingStates = <T>(
  queryResult: UseQueryResult<T, Error> | UseInfiniteQueryResult<T, Error>,
  skeletonConfig?: SkeletonConfig
) => {
  const loadingStates = useLoadingStates(queryResult);
  const skeletonRenderer = useSkeletonRenderer(
    loadingStates, 
    skeletonConfig || { type: 'card' }
  );
  
  return {
    ...loadingStates,
    skeleton: skeletonRenderer
  };
};

/**
 * Hook for managing loading states across multiple queries
 */
export const useMultipleLoadingStates = <T extends Record<string, UseQueryResult<any, Error>>>(
  queries: T
) => {
  return React.useMemo(() => {
    const states = Object.entries(queries).reduce((acc, [key, query]) => {
      acc[key] = useLoadingStates(query);
      return acc;
    }, {} as Record<string, LoadingStates>);

    // Aggregate states
    const hasAnyLoading = Object.values(states).some(s => s.isLoading);
    const hasAnyInitialLoading = Object.values(states).some(s => s.isInitialLoading);
    const hasAnyError = Object.values(states).some(s => s.hasError);
    const isAllSuccess = Object.values(states).every(s => s.isSuccess);
    const hasAnyEmpty = Object.values(states).some(s => s.isEmpty);

    return {
      individual: states,
      aggregate: {
        isLoading: hasAnyLoading,
        isInitialLoading: hasAnyInitialLoading,
        hasError: hasAnyError,
        isSuccess: isAllSuccess,
        isEmpty: hasAnyEmpty
      }
    };
  }, [queries]);
};

/**
 * Type guards and utilities
 */
export const isInfiniteQuery = <T>(
  result: UseQueryResult<T, Error> | UseInfiniteQueryResult<T, Error>
): result is UseInfiniteQueryResult<T, Error> => {
  return 'hasNextPage' in result;
};

export const getDataFromQuery = <T>(
  result: UseQueryResult<T, Error> | UseInfiniteQueryResult<T, Error>
): T | undefined => {
  if (isInfiniteQuery(result)) {
    // For infinite queries, flatten the pages
    return result.data?.pages?.flat() as T;
  }
  return result.data;
};

/**
 * Hook for smooth loading transitions
 */
export const useLoadingTransition = (isLoading: boolean, delay: number = 200) => {
  const [showLoading, setShowLoading] = React.useState(false);
  
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isLoading) {
      // Show loading immediately or after delay
      timeoutId = setTimeout(() => setShowLoading(true), delay);
    } else {
      // Hide loading immediately
      setShowLoading(false);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, delay]);
  
  return showLoading;
};
