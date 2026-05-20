import { useQuery } from '@tanstack/react-query';
import { api, transformApiResponse } from '@/shared/lib/api';
import { queryKeys } from '@/shared/lib/query-keys';

export interface DoctorPatientInfo {
  id: string;
  patient_code: string;
  first_name: string;
  last_name: string;
  dementia_stage: string;
  users: {
    created_at: string;
  };
}

interface DoctorPatientsResponse {
  patients: DoctorPatientInfo[];
  diagnosesThisMonth: number;
}

export interface DoctorPatientsResult {
  patients: DoctorPatientInfo[];
  diagnosesThisMonth: number;
}

/**
 * Hook to fetch patients assigned to a specific doctor
 * Optimized with proper API utilities and centralized query keys
 */
export function useDoctorPatients(doctorId: string | null) {
  return useQuery({
    queryKey: queryKeys.doctorPatients(doctorId || '', undefined),
    queryFn: async (): Promise<DoctorPatientsResult> => {
      if (!doctorId) {
        return { patients: [], diagnosesThisMonth: 0 };
      }
      
      const response = await api.get<DoctorPatientsResponse>(
        `/api/hospital-admin/doctors/${doctorId}/patients`,
        { timeout: 15000 }
      );
      
      const data = transformApiResponse(response);
      return {
        patients: data.patients || [],
        diagnosesThisMonth: data.diagnosesThisMonth ?? 0,
      };
    },
    enabled: !!doctorId,
    staleTime: 2 * 60 * 1000, // 2 minutes - patient assignments change infrequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    refetchOnMount: false, // Check cache first, refetch if stale
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    retry: (failureCount, error: any) => {
      // Don't retry if it's a client error (400-499)
      if (error?.message?.includes('4')) {
        return false;
      }
      // Retry up to 2 times for server errors
      return failureCount < 2;
    },
  });
}
