import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { api, transformApiResponse } from '@/shared/lib/api';
import { 
  HospitalPatient, 
  PatientFilters, 
  AssignPatientRequest 
} from '@/features/hospital/services/patient-assignment';

// Types for the hooks
interface UseHospitalPatientsOptions {
  hospitalId?: string;
  filters?: PatientFilters;
  enabled?: boolean;
}

interface AssignPatientMutationParams {
  patientId: string;
  doctorId: string;
  notes?: string;
}

interface AssignPatientResponse {
  success: boolean;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  assignmentDate: string;
  previousDoctorId?: string;
  noChangeNeeded?: boolean;
}

// API functions
const patientAssignmentApi = {
  getHospitalPatients: async (hospitalId: string, filters?: PatientFilters): Promise<HospitalPatient[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.dementiaStage) params.append('dementiaStage', filters.dementiaStage);
    if (filters?.doctorId !== undefined) params.append('doctorId', filters.doctorId);
    if (filters?.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    const url = `/api/hospital-admin/patients${queryString ? '?' + queryString : ''}`;
    
    const response = await api.get<HospitalPatient[]>(url);
    return transformApiResponse(response);
  },

  assignPatient: async (params: AssignPatientMutationParams): Promise<AssignPatientResponse> => {
    const response = await api.post<AssignPatientResponse>('/api/hospital-admin/patients/assign', params);
    return transformApiResponse(response);
  }
};

// Hook to fetch hospital patients
export const useHospitalPatients = ({ hospitalId, filters, enabled = true }: UseHospitalPatientsOptions) => {
  return useQuery({
    queryKey: queryKeys.hospitalPatients(hospitalId, filters),
    queryFn: () => hospitalId ? patientAssignmentApi.getHospitalPatients(hospitalId, filters) : Promise.resolve([]),
    enabled: enabled && !!hospitalId,
    staleTime: 2 * 60 * 1000, // 2 minutes - patient data changes frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    refetchOnMount: false, // Check cache first, refetch if stale
    refetchOnWindowFocus: false, // Don't refetch on tab switch
  });
};

// Hook to assign/reassign patients to doctors
export const useAssignPatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ patientId, doctorId, notes }: AssignPatientMutationParams) => {
      return patientAssignmentApi.assignPatient({ patientId, doctorId, notes });
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches for hospital patients
      await queryClient.cancelQueries({ 
        queryKey: ['hospital', 'patients'] 
      });

      // Snapshot the previous value
      const previousPatients = queryClient.getQueriesData<HospitalPatient[]>({
        queryKey: ['hospital', 'patients']
      });

      // Optimistically update patient assignment in cache
      queryClient.setQueriesData<HospitalPatient[]>(
        { queryKey: ['hospital', 'patients'] },
        (old) => {
          if (!old) return old;
          return old.map(patient => 
            patient.id === variables.patientId
              ? { ...patient, primary_doctor_id: variables.doctorId }
              : patient
          );
        }
      );

      return { previousPatients };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates on error
      if (context?.previousPatients) {
        context.previousPatients.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch hospital patients
      queryClient.invalidateQueries({ 
        queryKey: ['hospital', 'patients'] 
      });
      
      // Also invalidate doctor-specific patient queries
      queryClient.invalidateQueries({ 
        queryKey: ['doctor', 'patients'] 
      });
      
      // Invalidate hospital analytics to update patient counts
      queryClient.invalidateQueries({ 
        queryKey: ['hospital', 'analytics'] 
      });
    },
    onSettled: () => {
      // Always refetch hospital patients after assignment
      queryClient.invalidateQueries({ 
        queryKey: ['hospital', 'patients'] 
      });
    },
  });
};

// Hook for filtered patients by doctor
export const usePatientsByDoctor = (hospitalId: string, doctorId: string, enabled: boolean = true) => {
  return useHospitalPatients({
    hospitalId,
    filters: { doctorId },
    enabled: enabled && !!doctorId
  });
};

// Hook for patients by dementia stage
export const usePatientsByStage = (
  hospitalId: string, 
  stage: 'mild' | 'moderate' | 'severe', 
  enabled: boolean = true
) => {
  return useHospitalPatients({
    hospitalId,
    filters: { dementiaStage: stage },
    enabled: enabled && !!stage
  });
};

// Hook for searching patients
export const usePatientSearch = (
  hospitalId: string,
  searchTerm: string,
  debounceMs: number = 300
) => {
  const [debouncedSearch, setDebouncedSearch] = React.useState(searchTerm);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  return useHospitalPatients({
    hospitalId,
    filters: { search: debouncedSearch },
    enabled: !!hospitalId && debouncedSearch.length > 0
  });
};

// Hook to get unassigned patients (if any exist)
export const useUnassignedPatients = (hospitalId: string) => {
  return useQuery({
    queryKey: ['hospital', hospitalId, 'patients', 'unassigned'],
    queryFn: async () => {
      const patients = await patientAssignmentApi.getHospitalPatients(hospitalId);
      return patients.filter(patient => !patient.primary_doctor_id);
    },
    enabled: !!hospitalId,
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false, // Check cache first, refetch if stale
    refetchOnWindowFocus: false, // Don't refetch on tab switch
  });
};

// Export for easier imports
export { type HospitalPatient, type PatientFilters };
