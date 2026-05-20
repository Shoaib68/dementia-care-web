import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { api, transformApiResponse } from '@/shared/lib/api';
import type { MRIRetrainingStats } from '@/features/super-admin/services/mri-retraining.service';

// Re-export the type so pages can import it from the hook layer
export type { MRIRetrainingStats };

/**
 * Hook to fetch MRI retraining dataset statistics for the super admin.
 * Follows the same caching / retry / staleTime strategy as useSystemAnalytics.
 */
export function useMRIRetrainingStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.systemAnalytics('mri-retraining'),
    queryFn: async (): Promise<MRIRetrainingStats> => {
      const response = await api.get<MRIRetrainingStats>(
        '/api/super-admin/mri-retraining'
      );
      return transformApiResponse(response);
    },
    enabled: options?.enabled ?? true,
    staleTime: 2 * 60 * 1000,        // 2 minutes – data changes infrequently
    gcTime:    5 * 60 * 1000,        // Keep in cache for 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on auth / validation errors
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnWindowFocus: false,
    refetchOnReconnect:   true,
    refetchOnMount:       true, // Fetch on mount if data is stale or absent
    networkMode: 'online' as const,
  });
}

// Export the stats type alias consumed by the page
export type MRIRetrainingStatsData = MRIRetrainingStats;
