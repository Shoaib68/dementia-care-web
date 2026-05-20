import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { api, transformApiResponse } from '@/shared/lib/api';

export interface HospitalStatistics {
  totalDoctors: number;
  totalPatients: number;
}

/**
 * Hook to fetch hospital statistics for super admin
 */
export const useHospitalStatistics = (
  hospitalId: string | undefined,
  options?: UseQueryOptions<HospitalStatistics, Error>
) => {
  return useQuery({
    queryKey: [...queryKeys.hospital.detail(hospitalId || ''), 'statistics'],
    queryFn: async (): Promise<HospitalStatistics> => {
      if (!hospitalId) {
        throw new Error('Hospital ID is required');
      }

      const response = await api.get<HospitalStatistics>(
        `/api/super-admin/hospitals/${hospitalId}/statistics`
      );
      
      return transformApiResponse(response);
    },
    enabled: Boolean(hospitalId),
    staleTime: 2 * 60 * 1000, // 2 minutes - statistics don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Refetch when component mounts (fresh data)
    retry: (failureCount, error: any) => {
      // Don't retry if it's a client error (400-499)
      if (error?.message?.includes('4')) {
        return false;
      }
      // Retry up to 2 times for server errors
      return failureCount < 2;
    },
    ...options,
  });
};

export default useHospitalStatistics;
