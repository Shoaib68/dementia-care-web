import React from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { api, transformApiResponse, handleApiError } from '@/shared/lib/api';
import type { MRIScan, CreateMRIScanRequest } from '@/shared/types/api';

// Types
export interface MRIFilters {
  patientId?: string;
  hospitalId?: string;
  uploadedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: 'pending' | 'analyzed' | 'failed';
}

export interface MRIAnalysisResult {
  scanId: string;
  predictedStage: 'mild' | 'moderate' | 'severe';
  confidenceScore: number;
  analysisTimestamp: string;
  imageUrl: string;
  notes?: string;
}

// API functions
const mriApi = {
  getMRIScans: async (patientId: string): Promise<MRIScan[]> => {
    const response = await api.get<MRIScan[]>(`/api/doctor/mri-scans?patientId=${patientId}`);
    return transformApiResponse(response);
  },

  getMRIScan: async (scanId: string): Promise<MRIScan> => {
    const response = await api.get<MRIScan>(`/api/doctor/mri-scans/${scanId}`);
    return transformApiResponse(response);
  },

  uploadMRIScan: async (data: CreateMRIScanRequest): Promise<MRIScan> => {
    const formData = new FormData();
    formData.append('patientId', data.patientId);
    formData.append('uploadedBy', data.uploadedBy);
    if (data.notes) {
      formData.append('notes', data.notes);
    }
    
    // Add image files
    data.imageFiles.forEach((file, index) => {
      formData.append(`images`, file);
    });

    const response = await api.post<MRIScan>('/api/doctor/mri-scans', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return transformApiResponse(response);
  },

  analyzeMRIScan: async (scanId: string): Promise<MRIAnalysisResult> => {
    const response = await api.post<MRIAnalysisResult>(`/api/doctor/mri-scans/${scanId}/analyze`);
    return transformApiResponse(response);
  },

  deleteMRIScan: async (scanId: string): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(`/api/doctor/mri-scans/${scanId}`);
    return transformApiResponse(response);
  },

  getAllMRIScans: async (filters?: MRIFilters): Promise<MRIScan[]> => {
    const params = new URLSearchParams();
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.hospitalId) params.append('hospitalId', filters.hospitalId);
    if (filters?.uploadedBy) params.append('uploadedBy', filters.uploadedBy);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get<MRIScan[]>(
      `/api/doctor/mri-scans${params.toString() ? `?${params.toString()}` : ''}`
    );
    return transformApiResponse(response);
  },
};

// Query hooks
export const usePatientMRIScans = (
  patientId: string,
  options?: Omit<UseQueryOptions<MRIScan[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: queryKeys.mriScans(patientId),
    queryFn: () => mriApi.getMRIScans(patientId),
    staleTime: 2 * 60 * 1000, // 2 minutes - MRI data doesn't change frequently
    enabled: !!patientId,
    ...options,
  });
};

export const useMRIScan = (
  scanId: string,
  options?: Omit<UseQueryOptions<MRIScan, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: queryKeys.mriAnalysis(scanId),
    queryFn: () => mriApi.getMRIScan(scanId),
    staleTime: 2 * 60 * 1000,
    enabled: !!scanId,
    ...options,
  });
};

export const useAllMRIScans = (
  filters?: MRIFilters,
  options?: Omit<UseQueryOptions<MRIScan[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: [...queryKeys.mri, 'all', filters],
    queryFn: () => mriApi.getAllMRIScans(filters),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

// Mutation hooks
export const useUploadMRIScan = (
  options?: UseMutationOptions<MRIScan, Error, CreateMRIScanRequest>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mriApi.uploadMRIScan,
    onSuccess: (data, variables) => {
      // Invalidate patient's MRI scans
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.mriScans(variables.patientId) 
      });
      
      // Invalidate patient's data as it may affect overall assessment
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.patient(variables.patientId) 
      });
      
      // Invalidate all MRI scans query if it exists
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.mri 
      });
    },
    ...options,
  });
};

export const useAnalyzeMRIScan = (
  options?: UseMutationOptions<MRIAnalysisResult, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mriApi.analyzeMRIScan,
    onMutate: async (scanId) => {
      // Cancel any outgoing refetches for this scan
      await queryClient.cancelQueries({ queryKey: queryKeys.mriAnalysis(scanId) });

      // Snapshot the previous value
      const previousScan = queryClient.getQueryData<MRIScan>(queryKeys.mriAnalysis(scanId));

      // Optimistically update to show processing state
      if (previousScan) {
        queryClient.setQueryData<MRIScan>(queryKeys.mriAnalysis(scanId), {
          ...previousScan,
          ai_diagnosis_stage: undefined, // Clear previous diagnosis
          ai_confidence_score: undefined,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousScan };
    },
    onError: (err, scanId, context) => {
      // Rollback on error
      if (context?.previousScan) {
        queryClient.setQueryData<MRIScan>(
          queryKeys.mriAnalysis(scanId),
          context.previousScan
        );
      }
    },
    onSuccess: (analysisResult, scanId) => {
      // Update the scan with analysis results
      queryClient.setQueryData<MRIScan>(queryKeys.mriAnalysis(scanId), (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ai_diagnosis_stage: analysisResult.predictedStage,
          ai_confidence_score: analysisResult.confidenceScore,
          updated_at: analysisResult.analysisTimestamp,
        };
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.mri });
    },
    ...options,
  });
};

export const useDeleteMRIScan = (
  options?: UseMutationOptions<{ success: boolean }, Error, { scanId: string; patientId: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scanId }) => mriApi.deleteMRIScan(scanId),
    onMutate: async ({ scanId, patientId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.mriScans(patientId) });

      // Snapshot the previous value
      const previousScans = queryClient.getQueryData<MRIScan[]>(queryKeys.mriScans(patientId));

      // Optimistically remove the scan from the list
      if (previousScans) {
        const updatedScans = previousScans.filter(scan => scan.id !== scanId);
        queryClient.setQueryData<MRIScan[]>(queryKeys.mriScans(patientId), updatedScans);
      }

      return { previousScans };
    },
    onError: (err, { patientId }, context) => {
      // Rollback on error
      if (context?.previousScans) {
        queryClient.setQueryData<MRIScan[]>(
          queryKeys.mriScans(patientId),
          context.previousScans
        );
      }
    },
    onSuccess: (data, { patientId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.mriScans(patientId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.mri });
    },
    ...options,
  });
};

// Utility hooks
export const useMRIAnalysisStatus = (scanId: string) => {
  const { data: scan } = useMRIScan(scanId);
  
  return React.useMemo(() => {
    if (!scan) return 'pending';
    if (scan.ai_diagnosis_stage && scan.ai_confidence_score) return 'completed';
    if (scan.ai_diagnosis_stage === null) return 'failed';
    return 'analyzing';
  }, [scan]);
};

export const usePatientMRIHistory = (patientId: string) => {
  const { data: scans, ...rest } = usePatientMRIScans(patientId);
  
  const history = React.useMemo(() => {
    if (!scans) return [];
    
    return scans
      .filter(scan => scan.ai_diagnosis_stage) // Only include analyzed scans
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(scan => ({
        date: scan.created_at,
        stage: scan.ai_diagnosis_stage!,
        confidence: scan.ai_confidence_score || 0,
        scanId: scan.id,
      }));
  }, [scans]);
  
  return { data: history, ...rest };
};

// Export error handler for consistent error handling
export const useMRIError = () => {
  return { handleError: handleApiError };
};
