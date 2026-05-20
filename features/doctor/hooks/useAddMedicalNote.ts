import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { api, transformApiResponse } from '@/shared/lib/api';

// Types for medical note
export interface MedicalNoteData {
  patientId: string;
  noteContent: string;
  recommendations?: string;
  followUpDate?: string;
}

export interface MedicalNote {
  id: string;
  patient_id: string;
  doctor_id: string;
  note_content: string;
  recommendations?: string;
  follow_up_date?: string;
  created_at: string;
  hospital_id: string;
  created_by: string;
  updated_at: string;
}

export interface MedicalNoteResponse {
  success: boolean;
  data: MedicalNote;
  message?: string;
}

// API function for creating medical note
const createMedicalNoteApi = async (data: MedicalNoteData): Promise<MedicalNoteResponse> => {
  const response = await api.post<MedicalNoteResponse>('/api/doctor/medical-notes', {
    patientId: data.patientId,
    noteContent: data.noteContent,
    recommendations: data.recommendations,
    followUpDate: data.followUpDate
  });
  
  return transformApiResponse(response);
};

// Parse medical note creation error
const parseMedicalNoteError = (error: any): string => {
  try {
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
    
    errorMessage = String(errorMessage || 'Unknown error');
    
    if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
      return 'Patient not found or you do not have permission to add notes for this patient.';
    }
    
    if (errorMessage.includes('past') || errorMessage.includes('INVALID_DATE')) {
      return 'Follow-up date cannot be in the past. Please select today or a future date.';
    }
    
    if (errorMessage.includes('permission denied') || errorMessage.includes('unauthorized')) {
      return 'You do not have permission to add notes for this patient.';
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
    
    return errorMessage;
  } catch {
    return 'An unexpected error occurred. Please try again.';
  }
};

interface UseAddMedicalNoteOptions extends UseMutationOptions<MedicalNoteResponse, Error, MedicalNoteData> {
  onSuccess?: (data: MedicalNoteResponse) => void;
  onError?: (error: Error) => void;
}

export function useAddMedicalNote(options?: UseAddMedicalNoteOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMedicalNoteApi,
    onSuccess: (data, variables) => {
      // Invalidate patients queries to refresh if needed
      queryClient.invalidateQueries({ queryKey: queryKeys.patientsList() });
      
      // Invalidate the specific patient's medical note query
      queryClient.invalidateQueries({ queryKey: ['medical-note', variables.patientId] });
      
      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error: any) => {
      const parsedError = new Error(parseMedicalNoteError(error));
      
      if (options?.onError) {
        options.onError(parsedError);
      }
    },
    ...options
  });
}
