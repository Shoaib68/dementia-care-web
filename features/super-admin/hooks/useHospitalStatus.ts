import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { queryKeys } from '@/shared/lib/query-keys';

export interface HospitalDoctorCount {
  hospitalId: string;
  totalDoctors: number;
  activeDoctors: number;
  inactiveDoctors: number;
}

export interface HospitalStatusUpdateRequest {
  hospitalId: string;
  isActive: boolean;
}

/**
 * Hook to fetch doctor count statistics for a hospital
 * Used for displaying warning messages before status changes
 */
export function useHospitalDoctorCount(hospitalId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['hospitals', hospitalId, 'doctor-count'],
    queryFn: async (): Promise<HospitalDoctorCount> => {
      const response = await api.get(`/api/super-admin/hospitals/${hospitalId}/doctor-count`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch doctor count');
      }
      
      return response.data;
    },
    enabled: enabled && !!hospitalId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to update hospital status with cascading effects
 * Automatically invalidates related queries on success
 */
export function useUpdateHospitalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ hospitalId, isActive }: HospitalStatusUpdateRequest) => {
      try {
        const response = await api.put(`/api/super-admin/hospitals/${hospitalId}`, {
          isActive
        });
        
        if (!response.success) {
          throw new Error(response.error || `Failed to ${isActive ? 'activate' : 'deactivate'} hospital`);
        }
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      try {
        const { hospitalId, isActive } = variables;
      
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.hospitals
      });
      
      // Invalidate specific hospital data
      queryClient.invalidateQueries({
        queryKey: ['hospitals', hospitalId]
      });
      
      // Invalidate doctor count for this hospital
      queryClient.invalidateQueries({
        queryKey: ['hospitals', hospitalId, 'doctor-count']
      });
      
      // Invalidate hospital doctors list
      queryClient.invalidateQueries({
        queryKey: ['hospitals', hospitalId, 'doctors']
      });
      
      // Invalidate analytics that might be affected
      queryClient.invalidateQueries({
        queryKey: queryKeys.analytics
      });
      
      // Invalidate system-wide doctor lists since their status changed
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctors
      });
      
      // Future: Add toast notification here
      // toast.success(`Hospital ${action.toLowerCase()} successfully`);
      } catch (successHandlerError) {
        console.error('😱 Error in onSuccess handler:', {
          error: successHandlerError,
          variables,
          data
        });
        // Don't throw here as the mutation was actually successful
      }
    },
    onError: (error: any, variables) => {
      // Error handling for failed hospital status updates
      
      // Future: Add toast notification here
      // toast.error(`Failed to ${action} hospital: ${error?.message || 'Unknown error'}`);
    },
    retry: 1,
    retryDelay: 2000,
  });
}