import React from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  useInfiniteQuery,
  UseQueryOptions,
  UseMutationOptions,
  InfiniteData 
} from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { api, transformApiResponse, handleApiError, PaginatedResponse } from '@/shared/lib/api';
import { CreatePatientRequest, GeneratedCredentials } from '@/features/auth/types';

// Types
export interface Patient {
  id: string;
  patient_code: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  dementia_stage: 'mild' | 'moderate' | 'severe';
  medical_history?: Record<string, any>;
  hospital_id: string;
  primary_doctor_id: string;
  updated_at: string;
  created_at: string;
  created_by: string;
  users: {
    email: string;
    is_active: boolean;
    created_at: string;
  };
  patient_caregiver_assignments: Array<{
    caregivers: {
      id: string;
      first_name: string;
      last_name: string;
      phone_number: string;
      address?: string;
    };
  }>;
}

export interface Caregiver {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  emergency_contact?: string;
  address?: string;
}

export interface PatientFormData {
  patientDetails: {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
    dementiaStage: 'mild' | 'moderate' | 'severe';
    medicalHistory?: Record<string, any>;
  };
  caregiverDetails: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    emergencyContact?: string;
    address?: string;
  };
  doctorId: string;
  hospitalId: string;
}

export interface CreatePatientResponse {
  patientId: string;
  caregiverId: string;
  patientCredentials: GeneratedCredentials;
  caregiverCredentials: GeneratedCredentials;
}

export interface PatientFilters {
  search?: string;
  dementiaStage?: 'mild' | 'moderate' | 'severe';
  status?: 'active' | 'inactive';
  doctorId?: string;
  hospitalId?: string;
}

// API functions
const patientsApi = {
  getPatients: async (filters?: PatientFilters): Promise<Patient[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.dementiaStage) params.append('dementiaStage', filters.dementiaStage);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.doctorId) params.append('doctorId', filters.doctorId);
    if (filters?.hospitalId) params.append('hospitalId', filters.hospitalId);
    
    const queryString = params.toString();
    const url = `/api/doctor/patients${queryString ? '?' + queryString : ''}`;
    
    const response = await api.get<Patient[]>(url);
    return transformApiResponse(response);
  },

  getPatientsPaginated: async (
    page: number = 1, 
    limit: number = 10, 
    filters?: PatientFilters
  ): Promise<PaginatedResponse<Patient>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.dementiaStage && { dementiaStage: filters.dementiaStage }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.doctorId && { doctorId: filters.doctorId }),
      ...(filters?.hospitalId && { hospitalId: filters.hospitalId }),
    });

    const response = await api.get<PaginatedResponse<Patient>>(
      `/api/doctor/patients?${params.toString()}`
    );
    return transformApiResponse(response);
  },

  createPatient: async (data: PatientFormData): Promise<CreatePatientResponse> => {
    const response = await api.post<CreatePatientResponse>('/api/doctor/patients', data);
    return transformApiResponse(response);
  },

  updatePatient: async (id: string, data: Partial<Patient>): Promise<Patient> => {
    const response = await api.put<Patient>(`/api/doctor/patients/${id}`, data);
    return transformApiResponse(response);
  },

  updatePatientDementiaStage: async (
    patientId: string, 
    stage: 'mild' | 'moderate' | 'severe'
  ): Promise<{ success: boolean }> => {
    const response = await api.patch<{ success: boolean }>(
      `/api/doctor/patients/${patientId}/dementia-stage`, 
      { stage }
    );
    return transformApiResponse(response);
  },

  deactivatePatient: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.patch<{ success: boolean }>(`/api/doctor/patients/${id}/deactivate`);
    return transformApiResponse(response);
  },

  activatePatient: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.patch<{ success: boolean }>(`/api/doctor/patients/${id}/activate`);
    return transformApiResponse(response);
  },

  getPatientById: async (id: string): Promise<Patient> => {
    const response = await api.get<Patient>(`/api/doctor/patients/${id}`);
    return transformApiResponse(response);
  },

  getDoctorPatients: async (doctorId: string): Promise<Patient[]> => {
    const response = await api.get<Patient[]>(`/api/doctor/${doctorId}/patients`);
    return transformApiResponse(response);
  },

  getPatientsByHospital: async (hospitalId: string): Promise<Patient[]> => {
    const response = await api.get<Patient[]>(`/api/hospital-admin/${hospitalId}/patients`);
    return transformApiResponse(response);
  },
};

// Query hooks
export const usePatients = (
  filters?: PatientFilters,
  options?: Omit<UseQueryOptions<Patient[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: queryKeys.patientsList(filters),
    queryFn: () => patientsApi.getPatients(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes - increased to match other dashboards
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true, // Fetch on mount if data is stale or absent
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const usePatient = (
  id: string,
  options?: Omit<UseQueryOptions<Patient, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: queryKeys.patient(id),
    queryFn: () => patientsApi.getPatientById(id),
    staleTime: 3 * 60 * 1000,
    enabled: !!id,
    ...options,
  });
};

export const useDoctorPatients = (
  doctorId: string,
  options?: Omit<UseQueryOptions<Patient[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: queryKeys.doctorPatients(doctorId),
    queryFn: () => patientsApi.getPatients({ doctorId }),
    staleTime: 5 * 60 * 1000, // 5 minutes - increased to match other dashboards
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true, // Fetch on mount if data is stale or absent
    refetchOnWindowFocus: false,
    enabled: !!doctorId,
    ...options,
  });
};

export const useHospitalPatients = (
  hospitalId: string,
  options?: Omit<UseQueryOptions<Patient[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: queryKeys.hospitalPatients(hospitalId),
    queryFn: () => patientsApi.getPatientsByHospital(hospitalId),
    staleTime: 5 * 60 * 1000, // 5 minutes - increased to match other dashboards
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true, // Fetch on mount if data is stale or absent
    refetchOnWindowFocus: false,
    enabled: !!hospitalId,
    ...options,
  });
};

// Infinite query
export const usePatientsInfinite = (
  filters?: PatientFilters,
  limit: number = 20
) => {
  return useInfiniteQuery({
    queryKey: queryKeys.patientsInfinite(filters),
    queryFn: ({ pageParam = 1 }) => 
      patientsApi.getPatientsPaginated(pageParam, limit, filters),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.hasNext) {
        return (lastPage.pagination.page || 0) + 1;
      }
      return undefined;
    },
    getPreviousPageParam: (firstPage) => {
      if (firstPage.pagination?.hasPrev) {
        return (firstPage.pagination.page || 1) - 1;
      }
      return undefined;
    },
    staleTime: 3 * 60 * 1000,
  });
};

// Enhanced error parser for patient creation
const parsePatientCreationError = (error: any): string => {
  const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
  
  // Specific error patterns
  if (errorMessage.includes('already been registered') || errorMessage.includes('email address has already been registered')) {
    return 'This email address is already registered in the system. Please use a different email address.';
  }
  
  if (errorMessage.includes('email_address_not_authorized')) {
    return 'The provided email address is not authorized. Please check the email address and try again.';
  }
  
  if (errorMessage.includes('Invalid reference data')) {
    return 'Invalid doctor or hospital information. Please refresh the page and try again.';
  }
  
  if (errorMessage.includes('A record with this information already exists')) {
    return 'A patient with this information already exists in the system.';
  }
  
  if (errorMessage.includes('Failed to create patient authentication account')) {
    return 'Failed to create patient login account. This email may already be in use.';
  }
  
  if (errorMessage.includes('Failed to create caregiver authentication account')) {
    return 'Failed to create caregiver login account. This email may already be in use.';
  }
  
  if (errorMessage.includes('Network Error') || errorMessage.includes('timeout')) {
    return 'Network error occurred. Please check your internet connection and try again.';
  }
  
  if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
    return 'Server error occurred. Please try again in a few moments.';
  }
  
  // Return original message if no specific pattern matches
  return errorMessage;
};

// Mutation hooks with optimistic updates
export const useCreatePatient = (
  options?: UseMutationOptions<CreatePatientResponse, Error, PatientFormData, { previousPatients?: Patient[] }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patientsApi.createPatient,
    onMutate: async (newPatient) => {
      // Validate data structure before proceeding
      if (!newPatient || !newPatient.patientDetails || !newPatient.caregiverDetails) {
        throw new Error('Invalid patient data: patientDetails and caregiverDetails are required');
      }

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.patients });

      // Snapshot the previous value
      const previousPatients = queryClient.getQueryData<Patient[]>(queryKeys.patientsList());

      // Optimistically update to the new value
      if (previousPatients) {
        const optimisticPatient: Patient = {
          id: `temp-${Date.now()}`,
          patient_code: `PAT-TEMP-${Date.now()}`,
          first_name: newPatient.patientDetails?.firstName || '',
          last_name: newPatient.patientDetails?.lastName || '',
          date_of_birth: newPatient.patientDetails?.dateOfBirth || '',
          dementia_stage: newPatient.patientDetails?.dementiaStage || 'mild',
          medical_history: newPatient.patientDetails?.medicalHistory,
          hospital_id: newPatient.hospitalId || '',
          primary_doctor_id: newPatient.doctorId || '',
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          created_by: 'temp-user',
          users: {
            email: newPatient.patientDetails?.email || '',
            is_active: true,
            created_at: new Date().toISOString(),
          },
          patient_caregiver_assignments: [{
            caregivers: {
              id: `temp-caregiver-${Date.now()}`,
              first_name: newPatient.caregiverDetails?.firstName || '',
              last_name: newPatient.caregiverDetails?.lastName || '',
              phone_number: newPatient.caregiverDetails?.phoneNumber || '',
            }
          }]
        };

        queryClient.setQueryData<Patient[]>(
          queryKeys.patientsList(),
          [optimisticPatient, ...previousPatients]
        );
      }

      return { previousPatients };
    },
    onError: (err, newPatient, context) => {
      // Rollback optimistic update
      if (context?.previousPatients) {
        queryClient.setQueryData<Patient[]>(
          queryKeys.patientsList(),
          context.previousPatients
        );
      }
      
      // Parse and enhance error message
      const enhancedError = new Error(parsePatientCreationError(err));
      enhancedError.name = err.name || 'PatientCreationError';
      
      // Call custom error handler if provided
      options?.onError?.(enhancedError, newPatient, context);
    },
    onSuccess: (data, variables, context) => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      
      // Invalidate related doctor and hospital queries
      queryClient.invalidateQueries({ queryKey: queryKeys.doctorPatients(variables.doctorId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.hospitalPatients(variables.hospitalId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.hospitalAnalytics(variables.hospitalId) });
      
      // Always call the custom success handler
      options?.onSuccess?.(data, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      // Always invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      
      // Call custom settled handler if provided
      options?.onSettled?.(data, error, variables, context);
    },
    
    // Retry logic for transient errors
    retry: (failureCount, error: any) => {
      // Don't retry authentication or validation errors
      const errorMessage = error?.response?.data?.message || error?.message || '';
      
      if (
        errorMessage.includes('already been registered') ||
        errorMessage.includes('email_address_not_authorized') ||
        errorMessage.includes('Missing required') ||
        errorMessage.includes('Invalid reference data') ||
        errorMessage.includes('not found')
      ) {
        return false; // Don't retry validation/auth errors
      }
      
      // Retry network and server errors up to 2 times
      if (
        (errorMessage.includes('Network Error') ||
         errorMessage.includes('timeout') ||
         errorMessage.includes('500') ||
         error?.response?.status >= 500) &&
        failureCount < 2
      ) {
        return true;
      }
      
      return false;
    },
    
    // Exponential backoff for retries
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export const useDeactivatePatient = (
  options?: UseMutationOptions<{ success: boolean }, Error, string, { previousPatients?: Patient[] }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patientsApi.deactivatePatient,
    onMutate: async (patientId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.patients });

      const previousPatients = queryClient.getQueryData<Patient[]>(queryKeys.patientsList());

      if (previousPatients) {
        const updatedPatients = previousPatients.map(patient =>
          patient.id === patientId
            ? { ...patient, users: { ...patient.users, is_active: false } }
            : patient
        );
        queryClient.setQueryData<Patient[]>(queryKeys.patientsList(), updatedPatients);
      }

      return { previousPatients };
    },
    onError: (err, patientId, context) => {
      if (context?.previousPatients) {
        queryClient.setQueryData<Patient[]>(
          queryKeys.patientsList(),
          context.previousPatients
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
    },
    ...options,
  });
};

export const useActivatePatient = (
  options?: UseMutationOptions<{ success: boolean }, Error, string, { previousPatients?: Patient[] }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patientsApi.activatePatient,
    onMutate: async (patientId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.patients });

      const previousPatients = queryClient.getQueryData<Patient[]>(queryKeys.patientsList());

      if (previousPatients) {
        const updatedPatients = previousPatients.map(patient =>
          patient.id === patientId
            ? { ...patient, users: { ...patient.users, is_active: true } }
            : patient
        );
        queryClient.setQueryData<Patient[]>(queryKeys.patientsList(), updatedPatients);
      }

      return { previousPatients };
    },
    onError: (err, patientId, context) => {
      if (context?.previousPatients) {
        queryClient.setQueryData<Patient[]>(
          queryKeys.patientsList(),
          context.previousPatients
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
    },
    ...options,
  });
};

// Utility hooks
export const usePatientSearch = (searchTerm: string, debounceMs: number = 300) => {
  const [debouncedSearch, setDebouncedSearch] = React.useState(searchTerm);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  return usePatients({ search: debouncedSearch });
};

export const usePatientsByDementiaStage = (stage: 'mild' | 'moderate' | 'severe') => {
  return usePatients({ dementiaStage: stage }, { enabled: !!stage });
};

export const usePatientsByDoctor = (doctorId: string) => {
  return useDoctorPatients(doctorId);
};

export const usePatientsByHospital = (hospitalId: string) => {
  return useHospitalPatients(hospitalId);
};

// Export error handler for consistent error handling
export const usePatientError = () => {
  return { handleError: handleApiError };
};
