import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { api, transformApiResponse } from '@/shared/lib/api';

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

// Fetch last medical note for a patient
const fetchLastMedicalNoteApi = async (patientId: string): Promise<MedicalNote | null> => {
  try {
    const response = await api.get<MedicalNoteResponse>(`/api/doctor/medical-notes/${patientId}`);
    const result = transformApiResponse(response);
    return result || null;
  } catch (error: any) {
    // If it's a 404 or "not found" error, return null gracefully
    if (error?.response?.status === 404 || error?.message?.includes('not found')) {
      return null;
    }
    throw error;
  }
};

// Update medical note
interface UpdateMedicalNoteData {
  noteContent?: string;
  recommendations?: string;
  followUpDate?: string;
}

const updateMedicalNoteApi = async (noteId: string, data: UpdateMedicalNoteData): Promise<MedicalNoteResponse> => {
  const response = await api.put<MedicalNoteResponse>(`/api/doctor/medical-notes/update/${noteId}`, {
    noteContent: data.noteContent,
    recommendations: data.recommendations,
    followUpDate: data.followUpDate
  });
  
  return transformApiResponse(response);
};

// Parse error message
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
    }
    
    errorMessage = String(errorMessage || 'Unknown error');
    
    if (errorMessage.includes('not found')) {
      return 'Medical note not found.';
    }
    
    if (errorMessage.includes('permission')) {
      return 'You do not have permission to edit this note.';
    }
    
    if (errorMessage.includes('past') || errorMessage.includes('INVALID_DATE')) {
      return 'Follow-up date cannot be in the past. Please select today or a future date.';
    }
    
    if (errorMessage.includes('Network Error') || errorMessage.includes('timeout')) {
      return 'Network error occurred. Please check your internet connection and try again.';
    }
    
    return errorMessage;
  } catch {
    return 'An unexpected error occurred. Please try again.';
  }
};

// Hook to fetch last medical note
export function useFetchLastMedicalNote(patientId: string | undefined) {
  return useQuery({
    queryKey: patientId ? ['medical-note', patientId] : [],
    queryFn: () => fetchLastMedicalNoteApi(patientId!),
    enabled: !!patientId,
    staleTime: 0, // Always refetch when invalidated
    gcTime: 0 // Don't cache after unmount
  });
}

// Hook to update medical note
export function useUpdateMedicalNote(onSuccess?: (data: MedicalNoteResponse) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, data }: { noteId: string; data: UpdateMedicalNoteData }) =>
      updateMedicalNoteApi(noteId, data),
    onSuccess: (data, variables) => {
      // Invalidate all medical note queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['medical-note'] });
      
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError: (error: any) => {
      // Error is handled in the component
    }
  });
}
