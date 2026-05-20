import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { api, transformApiResponse, handleApiError } from '@/shared/lib/api';
import { Patient } from './usePatients';

// Types for patient update
export interface PatientUpdateData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  dementiaStage?: 'mild' | 'moderate' | 'severe';
  medicalHistory?: {
    conditions?: string[];
    medications?: Array<{
      name: string;
      dosage?: string;
      frequency?: string;
    }>;
    allergies?: string[];
    notes?: string;
  };
  // Caregiver details (now properly handled by the API)
  caregiverFirstName?: string;
  caregiverLastName?: string;
  caregiverPhone?: string;
  caregiverAddress?: string;
}

export interface PatientUpdateRequest {
  patientId: string;
  data: PatientUpdateData;
}

export interface PatientUpdateResponse {
  success: boolean;
  patient: Patient;
  message?: string;
}

// API function for updating patient
const updatePatientApi = async ({ patientId, data }: PatientUpdateRequest): Promise<PatientUpdateResponse> => {
  const response = await api.put<PatientUpdateResponse>(`/api/doctor/patients/${patientId}`, data);
  const result = transformApiResponse(response);
  
  return result;
};

// Enhanced error parser for patient updates
const parsePatientUpdateError = (error: any): string => {
  try {
    // Try to extract error message from various possible locations
    let errorMessage = 'Unknown error';
    
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error?.data?.message) {
      errorMessage = error.data.message;
    } else if (error?.response?.statusText) {
      errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
    }
    
    // Make sure errorMessage is a string
    errorMessage = String(errorMessage || 'Unknown error');
    
    // Specific error patterns
    if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
      return 'Patient not found or you do not have permission to edit this patient.';
    }
    
    if (errorMessage.includes('invalid dementia stage')) {
      return 'Please select a valid dementia stage (Mild, Moderate, or Severe).';
    }
    
    if (errorMessage.includes('invalid date')) {
      return 'Please provide a valid date of birth.';
    }
    
    if (errorMessage.includes('permission denied') || errorMessage.includes('unauthorized')) {
      return 'You do not have permission to edit this patient.';
    }
    
    if (errorMessage.includes('validation failed') || errorMessage.includes('invalid input')) {
      return 'Please check all fields and ensure they contain valid information.';
    }
    
    if (errorMessage.includes('Network Error') || errorMessage.includes('timeout')) {
      return 'Network error occurred. Please check your internet connection and try again.';
    }
    
    if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
      return 'Server error occurred. Please try again in a few moments.';
    }
    
    // Return original message if no specific pattern matches
    return errorMessage;
    
  } catch (parseError) {
    return 'An error occurred while updating the patient. Please try again.';
  }
};

// Hook for updating patient information
export const useUpdatePatient = (
  options?: UseMutationOptions<PatientUpdateResponse, Error, PatientUpdateRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePatientApi,
    onMutate: async ({ patientId, data }) => {
      // Cancel any outgoing refetches for patient data
      await queryClient.cancelQueries({ queryKey: queryKeys.patient(patientId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.patients });

      // Snapshot the previous patient data
      const previousPatient = queryClient.getQueryData<Patient>(queryKeys.patient(patientId));
      const previousPatients = queryClient.getQueryData<Patient[]>(queryKeys.patientsList());

      // Optimistically update the patient data
      if (previousPatient) {
        const optimisticPatient: Patient = {
          ...previousPatient,
          first_name: data.firstName !== undefined ? data.firstName : previousPatient.first_name,
          last_name: data.lastName !== undefined ? data.lastName : previousPatient.last_name,
          date_of_birth: data.dateOfBirth !== undefined ? data.dateOfBirth : previousPatient.date_of_birth,
          dementia_stage: data.dementiaStage !== undefined ? data.dementiaStage : previousPatient.dementia_stage,
          medical_history: data.medicalHistory !== undefined ? data.medicalHistory : previousPatient.medical_history,
          updated_at: new Date().toISOString(),
          // Optimistically update caregiver information if provided
          patient_caregiver_assignments: data.caregiverFirstName !== undefined || data.caregiverLastName !== undefined || data.caregiverPhone !== undefined || data.caregiverAddress !== undefined
            ? (Array.isArray(previousPatient.patient_caregiver_assignments) 
                ? previousPatient.patient_caregiver_assignments.map(assignment => ({
                    ...assignment,
                    caregivers: assignment.caregivers ? {
                      ...assignment.caregivers,
                      first_name: data.caregiverFirstName !== undefined ? data.caregiverFirstName : assignment.caregivers.first_name,
                      last_name: data.caregiverLastName !== undefined ? data.caregiverLastName : assignment.caregivers.last_name,
                      phone_number: data.caregiverPhone !== undefined ? data.caregiverPhone : assignment.caregivers.phone_number,
                      address: data.caregiverAddress !== undefined ? data.caregiverAddress : assignment.caregivers.address,
                    } : assignment.caregivers
                  }))
                : previousPatient.patient_caregiver_assignments)
            : previousPatient.patient_caregiver_assignments,
        };

        // Update individual patient query
        queryClient.setQueryData<Patient>(queryKeys.patient(patientId), optimisticPatient);

        // Update patients list query
        if (previousPatients) {
          const updatedPatients = previousPatients.map(patient =>
            patient.id === patientId ? optimisticPatient : patient
          );
          queryClient.setQueryData<Patient[]>(queryKeys.patientsList(), updatedPatients);
        }
      }

      return { previousPatient, previousPatients };
    },
    onError: (err, { patientId, data }, context) => {
      // More robust error logging
      const errorInfo = {
        message: err?.message || 'Unknown error',
        name: err?.name || 'Error',
        stack: err?.stack,
        patientId,
        requestData: data ? {
          firstName: data.firstName,
          lastName: data.lastName,
          dementiaStage: data.dementiaStage,
          hasCaregiver: !!(data.caregiverFirstName || data.caregiverLastName || data.caregiverPhone)
        } : 'No data'
      };
      
      // Rollback optimistic updates
      
      // Rollback optimistic updates
      if (context?.previousPatient) {
        queryClient.setQueryData<Patient>(queryKeys.patient(patientId), context.previousPatient);
      }
      
      if (context?.previousPatients) {
        queryClient.setQueryData<Patient[]>(queryKeys.patientsList(), context.previousPatients);
      }
      
      // Parse and enhance error message
      let errorMessage = 'Failed to update patient';
      try {
        errorMessage = parsePatientUpdateError(err);
      } catch (parseError) {
        // Error parsing failed, use default message
      }
      
      const enhancedError = new Error(errorMessage);
      enhancedError.name = err?.name || 'PatientUpdateError';
      
      // Call custom error handler if provided
      if (options?.onError) {
        try {
          options.onError(enhancedError, { patientId, data }, context);
        } catch (callbackError) {
          // Custom error handler failed
        }
      }
    },
    onSuccess: (response, { patientId, data }, context) => {
      // Update the cache with the real response data
      if (response.patient) {
        queryClient.setQueryData<Patient>(queryKeys.patient(patientId), response.patient);
        
        // Update patients list with the updated patient
        const previousPatients = queryClient.getQueryData<Patient[]>(queryKeys.patientsList());
        if (previousPatients) {
          const updatedPatients = previousPatients.map(patient =>
            patient.id === patientId ? response.patient : patient
          );
          queryClient.setQueryData<Patient[]>(queryKeys.patientsList(), updatedPatients);
        }
      }

      // Invalidate related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      
      // Call custom success handler
      options?.onSuccess?.(response, { patientId, data }, context);
    },
    onSettled: (data, error, { patientId, data: requestData }, context) => {
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.patient(patientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      
      // Call custom settled handler if provided
      options?.onSettled?.(data, error, { patientId, data: requestData }, context);
    },
    
    // Retry logic for transient errors
    retry: (failureCount, error: any) => {
      // Don't retry validation or authorization errors
      const errorMessage = error?.response?.data?.message || error?.message || '';
      
      if (
        errorMessage.includes('not found') ||
        errorMessage.includes('permission denied') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('validation failed') ||
        errorMessage.includes('invalid')
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
};

// Hook for updating patient dementia stage specifically
export const useUpdatePatientDementiaStage = (
  options?: UseMutationOptions<PatientUpdateResponse, Error, { patientId: string; stage: 'mild' | 'moderate' | 'severe' }>
) => {
  const updatePatient = useUpdatePatient();

  return useMutation({
    mutationFn: async ({ patientId, stage }) => {
      return updatePatient.mutateAsync({
        patientId,
        data: { dementiaStage: stage }
      });
    },
    ...options,
  });
};

// Export error handler for consistent error handling
export const usePatientUpdateError = () => {
  return { handleError: handleApiError, parseError: parsePatientUpdateError };
};