"use client";

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClientConfig } from '@/shared/lib/react-query';

interface ReactQueryProviderProps {
  children: React.ReactNode;
}

/**
 * React Query Provider component that wraps the application
 * Provides caching, background synchronization, and error handling for server state
 */
export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  // Create a stable QueryClient instance
  const [queryClient] = useState(() => new QueryClient(queryClientConfig));

  // Suppress console errors for expected validation errors
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      
      // Suppress console errors for expected client errors (validation, conflicts, etc.)
      if (error?.status >= 400 && error?.status < 500 && 
          ['EMAIL_ALREADY_EXISTS', 'VALIDATION_ERROR', 'CONFLICT_ERROR', 'ApiClientError'].includes(error?.code || error?.name)) {
        event.preventDefault(); // Prevent the error from being logged to console
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show dev tools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          buttonPosition="bottom-right"
          position="bottom"
        />
      )}
    </QueryClientProvider>
  );
}

export default ReactQueryProvider;
