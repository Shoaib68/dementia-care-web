import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';

export interface PatientAssignment {
  patientId: string;
  selectedDoctorId: string;
}

interface BulkAssignPatientsRequest {
  assignments: PatientAssignment[];
  notes?: string;
}

interface BulkAssignmentResult {
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  status: 'success' | 'no_change';
  previousDoctorId?: string;
  assignmentDate?: string;
  message?: string;
}

interface BulkAssignmentError {
  patientId: string;
  error: string;
}

interface BulkAssignmentResponse {
  success: boolean;
  totalAssignments: number;
  successCount: number;
  noChangeCount: number;
  errorCount: number;
  results: BulkAssignmentResult[];
  errors: BulkAssignmentError[];
  summary: {
    successful: number;
    noChangeNeeded: number;
    failed: number;
    message: string;
  };
}

interface BulkAssignmentMutationParams {
  assignments: PatientAssignment[];
  notes?: string;
}

/**
 * Hook to handle bulk patient reassignment
 * Used primarily for doctor deletion workflows where patients need to be reassigned
 */
export const useBulkPatientAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation<BulkAssignmentResponse, Error, BulkAssignmentMutationParams>({
    mutationFn: async ({ assignments, notes }: BulkAssignmentMutationParams) => {
      const response = await fetch('/api/hospital-admin/patients/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignments,
          notes
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate patient lists to reflect new assignments
      queryClient.invalidateQueries({
        queryKey: ['hospital', 'patients']
      });
      queryClient.invalidateQueries({
        queryKey: ['patients']
      });

      // Invalidate doctor lists as their patient counts may have changed
      queryClient.invalidateQueries({
        queryKey: ['doctors']
      });

      // Invalidate hospital analytics to update patient/doctor statistics
      queryClient.invalidateQueries({
        queryKey: ['hospital', 'analytics']
      });

      // Invalidate individual doctor patient lists for the affected doctors
      const affectedDoctorIds = new Set(variables.assignments.map(a => a.selectedDoctorId));
      affectedDoctorIds.forEach(doctorId => {
        queryClient.invalidateQueries({
          queryKey: ['doctor', doctorId, 'patients']
        });
      });
    },
    onError: (error) => {
      console.error('Bulk patient assignment error:', error);
    }
  });
};

/**
 * Hook to handle doctor deletion with patient reassignment
 * This combines the bulk assignment with doctor deletion
 */
export const useDoctorDeletionWithReassignment = () => {
  const queryClient = useQueryClient();
  const bulkAssignMutation = useBulkPatientAssignment();

  return useMutation<void, Error, { doctorId: string; hospitalId: string; assignments: PatientAssignment[] }>({
    mutationFn: async ({ doctorId, hospitalId, assignments }) => {
      // Step 1: Reassign all patients
      if (assignments.length > 0) {
        const assignmentResult = await bulkAssignMutation.mutateAsync({
          assignments,
          notes: `Patients reassigned due to doctor deletion`
        });

        // Check if all assignments were successful
        if (assignmentResult.errorCount > 0) {
          throw new Error(`Failed to reassign ${assignmentResult.errorCount} patients. Please resolve assignment issues before deleting the doctor.`);
        }
      }

      // Step 2: Delete the doctor
      const response = await fetch('/api/hospital-admin/doctors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, hospitalId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
        throw new Error(errorMessage);
      }
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
    onError: (error) => {
      console.error('Doctor deletion with reassignment error:', error);
    }
  });
};

export type {
  PatientAssignment,
  BulkAssignPatientsRequest,
  BulkAssignmentResult,
  BulkAssignmentError,
  BulkAssignmentResponse,
  BulkAssignmentMutationParams
};