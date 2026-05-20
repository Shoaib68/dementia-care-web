/**
 * useMRIAnalysis Hook
 * React Query hook for managing MRI image analysis with the deployed AI model
 */

import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MRIAnalysisService } from '../services/mri-analysis.service';
import { MRIValidationError } from '../types';
import type {
  DementiaClassificationResult,
  MRIHealthCheckResponse,
  MRIAnalysisState,
} from '../types';

/**
 * Hook for analyzing MRI images using the deployed dementia classifier
 */
export function useMRIAnalysis() {
  const queryClient = useQueryClient();
  
  // Local state for file and preview management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // fileSizeError is set immediately on selection so the UI shows feedback before the user clicks Analyze
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);

  // Mutation for analyzing images
  const analysisMutation = useMutation({
    mutationFn: (file: File) => MRIAnalysisService.analyzeImage(file),
    onSuccess: (data) => {
      // Optionally invalidate any related queries
      queryClient.invalidateQueries({ queryKey: ['mri-scans'] });
    },
    onError: (error: Error) => {
      // MRIValidationError is an expected, handled outcome (image is not a brain MRI).
      // The UI surfaces it via the `validationRejection` state — no console noise needed.
      if (!(error instanceof MRIValidationError)) {
        console.error('MRI Analysis error:', error);
      }
    },
  });

  // Handle file selection
  const handleFileSelect = useCallback((file: File | null) => {
    // Always clear previous errors on a new selection
    setFileSizeError(null);

    // Clean up previous preview URL
    if (previewUrl) {
      MRIAnalysisService.revokePreviewUrl(previewUrl);
    }

    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setPreviewUrl(null);
        setSelectedFile(null);
        return { success: false, error: 'Invalid file type. Please upload a JPG, PNG, or WebP image.' };
      }

      // Validate file size (max 1 MB) — immediate feedback before Analyze is clicked
      const MAX_SIZE = 1 * 1024 * 1024; // 1 MB
      if (file.size > MAX_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        setFileSizeError(
          `"${file.name}" is ${sizeMB} MB — maximum allowed size is 1 MB. Please choose a smaller image.`,
        );
        setPreviewUrl(null);
        setSelectedFile(null);
        return { success: false, error: 'File too large. Maximum size is 1 MB.' };
      }

      // Create preview URL
      const newPreviewUrl = MRIAnalysisService.createPreviewUrl(file);
      setPreviewUrl(newPreviewUrl);
      setSelectedFile(file);
      return { success: true };
    } else {
      setPreviewUrl(null);
      setSelectedFile(null);
      return { success: true };
    }
  }, [previewUrl]);

  // Analyze the selected image
  const analyzeImage = useCallback(async () => {
    if (!selectedFile) {
      throw new Error('No file selected');
    }
    return analysisMutation.mutateAsync(selectedFile);
  }, [selectedFile, analysisMutation]);

  // Clear selection and results
  const clearAnalysis = useCallback(() => {
    if (previewUrl) {
      MRIAnalysisService.revokePreviewUrl(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileSizeError(null);
    analysisMutation.reset();
  }, [previewUrl, analysisMutation]);

  /**
   * `validationRejection`  — non-null when Gemini rejected the image (not a brain MRI).
   *                          Contains the short description Gemini returned.
   * `analysisError`        — non-null for any other failure (network, Modal.com error, etc.).
   */
  const validationRejection: string | null =
    analysisMutation.error instanceof MRIValidationError
      ? analysisMutation.error.description
      : null;

  const analysisError: string | null =
    analysisMutation.error !== null &&
    !(analysisMutation.error instanceof MRIValidationError)
      ? analysisMutation.error.message
      : null;

  return {
    // File state
    selectedFile,
    previewUrl,
    handleFileSelect,
    fileSizeError,        // set immediately when selected file exceeds 1 MB

    // Analysis state
    isAnalyzing:        analysisMutation.isPending,
    analysisResult:     analysisMutation.data || null,
    validationRejection,  // image was not a brain MRI
    analysisError,        // any other error

    // Actions
    analyzeImage,
    clearAnalysis,

    // Mutation state for advanced use
    mutation: analysisMutation,
  };
}

/**
 * Hook for checking the health status of the MRI analysis API
 */
export function useMRIApiHealth() {
  return useQuery({
    queryKey: ['mri-api-health'],
    queryFn: () => MRIAnalysisService.healthCheck(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 1,
  });
}

/**
 * Hook for getting available classification classes
 */
export function useMRIClasses() {
  return useQuery({
    queryKey: ['mri-classes'],
    queryFn: () => MRIAnalysisService.getClasses(),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - classes rarely change
    retry: 1,
  });
}

export default useMRIAnalysis;
