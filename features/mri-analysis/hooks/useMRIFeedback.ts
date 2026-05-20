/**
 * useMRIFeedback Hook
 * Handles submitting doctor feedback for an MRI scan result,
 * uploading the image to Supabase Storage, and persisting the
 * complete record (AI result + doctor verdict) to the mri_scans table.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DementiaStage } from '../types';

export interface MRIFeedbackPayload {
  /** The original MRI image file selected by the doctor */
  file: File;
  /** Stage the AI model predicted */
  aiDiagnosisStage: DementiaStage;
  /** Confidence score returned by the model (0–1) */
  aiConfidenceScore: number;
  /** True if the doctor agrees with the AI prediction */
  doctorVerified: boolean;
  /** The stage the doctor considers correct (same as AI if verified) */
  doctorFinalStage: DementiaStage;
  /** Optional clinical notes from the doctor */
  doctorNotes?: string;
  /** Optional patient UUID to link this scan to a patient record */
  patientId?: string;
}

export interface SavedScanResult {
  scanId: string;
  fileUrl: string;
  feedbackStatus: 'correct' | 'incorrect';
}

async function saveMRIScanWithFeedback(
  payload: MRIFeedbackPayload
): Promise<SavedScanResult> {
  const formData = new FormData();
  formData.append('file',                payload.file);
  formData.append('ai_diagnosis_stage',  payload.aiDiagnosisStage);
  formData.append('ai_confidence_score', String(payload.aiConfidenceScore));
  formData.append('doctor_verified',     String(payload.doctorVerified));
  formData.append('doctor_final_stage',  payload.doctorFinalStage);

  if (payload.doctorNotes?.trim()) {
    formData.append('doctor_notes', payload.doctorNotes.trim());
  }
  if (payload.patientId?.trim()) {
    formData.append('patient_id', payload.patientId.trim());
  }

  const response = await fetch('/api/doctor/mri-scans/save', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to save MRI scan');
  }

  return result.data as SavedScanResult;
}

/**
 * Hook for submitting doctor feedback and persisting the MRI scan record.
 *
 * Usage:
 *   const { mutate, isPending, isSuccess, data, error } = useMRIFeedback();
 *   mutate({ file, aiDiagnosisStage, aiConfidenceScore, doctorVerified, doctorFinalStage, ... });
 */
export function useMRIFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveMRIScanWithFeedback,
    onSuccess: () => {
      // Invalidate any cached MRI scan lists so they reflect the new record
      queryClient.invalidateQueries({ queryKey: ['mri-scans'] });
      queryClient.invalidateQueries({ queryKey: ['mri'] });
    },
  });
}

export default useMRIFeedback;
