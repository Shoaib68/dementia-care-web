import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { GeneratedCredentials } from '@/features/auth/types';

// Move interfaces here instead of importing from service
export interface CreateDoctorRequest {
  email: string;
  firstName: string;
  lastName: string;
  specialization: string;
  department?: string;
  licenseNumber: string;
  phone?: string;
}

export interface DoctorData {
  id: string;
  hospital_id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  department?: string;
  license_number: string;
  phone_number?: string;
  created_by: string;
  updated_at: string;
  users: {
    email: string;
    is_active: boolean;
  };
  hospitals?: {
    name: string;
  };
}

export interface GetDoctorsFilters {
  search?: string;
  status?: 'active' | 'inactive';
}

// Types for the hooks
interface UseDoctorsOptions {
  hospitalId: string;
  filters?: GetDoctorsFilters;
  enabled?: boolean;
}

interface CreateDoctorMutationParams {
  request: CreateDoctorRequest;
  hospitalId: string;
  createdBy: string;
}

interface UpdateDoctorMutationParams {
  doctorId: string;
  hospitalId: string;
  updates: {
    firstName?: string;
    lastName?: string;
    specialization?: string;
    department?: string;
    licenseNumber?: string;
    phone?: string;
    isActive?: boolean;
  };
}

// Hook to fetch doctors for a hospital
export const useDoctors = ({ hospitalId, filters, enabled = true }: UseDoctorsOptions) => {
  // Properly validate hospitalId - check for truthy value AND non-empty string
  const isValidHospitalId = hospitalId && hospitalId.trim() !== '';
  
  return useQuery({
    queryKey: queryKeys.doctorsList({ ...filters, hospitalId }),
    queryFn: async () => {
      // Double-check hospitalId before making the API call
      if (!isValidHospitalId) {
        throw new Error('Hospital ID is required to fetch doctors');
      }
      
      const params = new URLSearchParams({
        hospitalId,
        ...(filters?.search && { search: filters.search }),
        ...(filters?.status && { status: filters.status }),
      });
      
      const response = await fetch(`/api/hospital-admin/doctors?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      return result.data || [];
    },
    // Only enable query when all conditions are met
    enabled: enabled && isValidHospitalId,
    staleTime: 2 * 60 * 1000, // 2 minutes - use cached data
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    refetchOnMount: true, // Fetch on mount if data is stale or absent
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: (failureCount, error: any) => {
      // Don't retry if it's a client error (400-499)
      if (error?.message?.includes('4')) {
        return false;
      }
      // Retry up to 2 times for server errors
      return failureCount < 2;
    },
  });
};

// Hook to get a single doctor by ID
export const useDoctor = (doctorId: string, hospitalId?: string) => {
  return useQuery({
    queryKey: queryKeys.doctor(doctorId),
    queryFn: async () => {
      // TODO: Replace with API call when needed
      throw new Error('This hook is temporarily disabled - use useDoctors instead');
    },
    enabled: false, // Disabled for now
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook to create a new doctor
export const useCreateDoctor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ request, hospitalId, createdBy }: CreateDoctorMutationParams) => {
      const response = await fetch('/api/hospital-admin/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          hospitalId,
          createdBy
        }),
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          // If JSON parsing fails, create a basic error
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          (error as any).status = response.status;
          throw error;
        }
        
        // API returns 'error' field, not 'message'
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        
        // Create error with enumerable properties so React Query can serialize it properly
        const error = new Error(errorMessage);
        Object.defineProperty(error, 'code', { value: errorData.code, enumerable: true });
        Object.defineProperty(error, 'status', { value: response.status, enumerable: true });
        
        throw error;
      }
      
      const result = await response.json();
      return {
        doctor: result.data.doctor,
        credentials: result.data.credentials
      };
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch doctors list for the hospital
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctorsList({ hospitalId: variables.hospitalId })
      });
      
      // Invalidate hospital analytics to update doctor count
      queryClient.invalidateQueries({
        queryKey: ['hospital', 'analytics']
      });
      
      // Add the new doctor to the cache
      queryClient.setQueryData(
        queryKeys.doctor(data.doctor.id),
        data.doctor
      );
    },
    // Don't log validation errors (they're handled by the UI)
    meta: {
      suppressErrorLog: true
    }
  });
};

// Hook to update a doctor
export const useUpdateDoctor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ doctorId, hospitalId, updates }: UpdateDoctorMutationParams) => {
      const response = await fetch('/api/hospital-admin/doctors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          hospitalId,
          ...updates
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // API returns 'error' field, not 'message'
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        
        // Create error with enumerable properties for React Query serialization
        const error = new Error(errorMessage);
        Object.defineProperty(error, 'code', { value: errorData.code, enumerable: true });
        Object.defineProperty(error, 'status', { value: response.status, enumerable: true });
        
        throw error;
      }
      
      return await response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate doctors list
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctorsList({ hospitalId: variables.hospitalId })
      });
      
      // Invalidate hospital analytics to update doctor count
      queryClient.invalidateQueries({
        queryKey: ['hospital', 'analytics']
      });
      
      // Invalidate specific doctor
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctor(variables.doctorId)
      });
    },
    // Don't log validation errors (they're handled by the UI)
    meta: {
      suppressErrorLog: true
    }
  });
};

// Hook to deactivate a doctor
export const useDeactivateDoctor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ doctorId, hospitalId }: { doctorId: string; hospitalId: string }) => {
      // TODO: Replace with API call when needed
      throw new Error('Deactivate doctor functionality temporarily disabled');
    },
    onSuccess: (data, variables) => {
      // Invalidate doctors list
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctorsList({ hospitalId: variables.hospitalId })
      });
      
      // Update the specific doctor cache to show as inactive
      queryClient.setQueryData(
        queryKeys.doctor(variables.doctorId),
        (oldData: DoctorData | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            users: {
              ...oldData.users,
              is_active: false
            }
          };
        }
      );
    },
    onError: (error) => {
      console.error('Deactivate doctor error:', error);
    }
  });
};

// Hook to delete a doctor permanently
export const useDeleteDoctor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ doctorId, hospitalId }: { doctorId: string; hospitalId: string }) => {
      const response = await fetch('/api/hospital-admin/doctors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, hospitalId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // API returns 'error' field, not 'message'
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        
        // Create error with enumerable properties for React Query serialization
        const error = new Error(errorMessage);
        Object.defineProperty(error, 'code', { value: errorData.code, enumerable: true });
        Object.defineProperty(error, 'status', { value: response.status, enumerable: true });
        Object.defineProperty(error, 'hasPatients', { value: errorData.hasPatients, enumerable: true });
        Object.defineProperty(error, 'patientCount', { value: errorData.patientCount, enumerable: true });
        
        throw error;
      }
      
      return await response.json();
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      const queryKey = queryKeys.doctorsList({ hospitalId: variables.hospitalId });
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousDoctors = queryClient.getQueryData<DoctorData[]>(queryKey);

      // Optimistically remove the doctor from the list
      if (previousDoctors) {
        const updatedDoctors = previousDoctors.filter(doctor => doctor.id !== variables.doctorId);
        queryClient.setQueryData(queryKey, updatedDoctors);
      }

      // Return a context object with the snapshotted value
      return { previousDoctors, queryKey };
    },
    onSuccess: (data, variables) => {
      // Invalidate doctors list to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctorsList({ hospitalId: variables.hospitalId })
      });
      
      // Invalidate hospital analytics to update doctor count
      queryClient.invalidateQueries({
        queryKey: ['hospital', 'analytics']
      });
      
      // Invalidate patient lists in case doctor assignments were cleaned up
      queryClient.invalidateQueries({
        queryKey: ['hospital', 'patients']
      });
      queryClient.invalidateQueries({
        queryKey: ['patients']
      });
      
      // Remove the specific doctor from cache
      queryClient.removeQueries({
        queryKey: queryKeys.doctor(variables.doctorId)
      });
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousDoctors) {
        queryClient.setQueryData(context.queryKey, context.previousDoctors);
      }
      console.error('Delete doctor error:', error);
    }
  });
};

// Hook with optimistic updates for better UX
export const useCreateDoctorOptimistic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ request, hospitalId, createdBy }: CreateDoctorMutationParams) => {
      // TODO: Replace with API call when needed
      throw new Error('Optimistic doctor creation temporarily disabled - use useCreateDoctor instead');
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      const queryKey = queryKeys.doctorsList({ hospitalId: variables.hospitalId });
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousDoctors = queryClient.getQueryData<DoctorData[]>(queryKey);

      // Optimistically update to the new value
      if (previousDoctors) {
        const optimisticDoctor: DoctorData = {
          id: 'temp-' + Date.now(), // Temporary ID
          hospital_id: variables.hospitalId,
          first_name: variables.request.firstName,
          last_name: variables.request.lastName,
          specialization: variables.request.specialization,
          department: variables.request.department,
          license_number: variables.request.licenseNumber,
          phone_number: variables.request.phone,
          created_by: variables.createdBy,
          updated_at: new Date().toISOString(),
          users: {
            email: variables.request.email,
            is_active: true
          },
          hospitals: {
            name: 'Loading...'
          }
        };

        queryClient.setQueryData(queryKey, [...previousDoctors, optimisticDoctor]);
      }

      // Return a context object with the snapshotted value
      return { previousDoctors, queryKey };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousDoctors) {
        queryClient.setQueryData(context.queryKey, context.previousDoctors);
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({
        queryKey: queryKeys.doctorsList({ hospitalId: variables.hospitalId })
      });
    },
  });
};

// Export all hooks with proper types
export type {
  UseDoctorsOptions,
  CreateDoctorMutationParams,
  UpdateDoctorMutationParams,
  DoctorData,
  GetDoctorsFilters
};
