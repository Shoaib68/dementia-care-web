"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import DoctorDeletionDialog, { DoctorInfo, AssignedPatient } from './DoctorDeletionDialog';
import PatientReassignmentDialog from './PatientReassignmentDialog';
import { useAssignPatient } from '@/features/hospital/hooks/usePatientAssignment';
import { useDoctors } from '@/features/hospital/hooks/useDoctorManagement';
import { api, transformApiResponse } from '@/shared/lib/api';
import { queryKeys } from '@/shared/lib/query-keys';

type WorkflowStep = 'deletion-check' | 'patient-reassignment' | 'deletion-complete';

interface PatientAssignment {
  patientId: string;
  selectedDoctorId: string;
}

interface DoctorDeletionWorkflowProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: DoctorInfo | null;
  hospitalId: string;
  onComplete?: () => void;
}

interface DoctorPatientsResponse {
  patients: AssignedPatient[];
}

interface DeletionResponse {
  success: boolean;
  hasPatients?: boolean;
  patientCount?: number;
  error?: string;
}

export function DoctorDeletionWorkflow({
  isOpen,
  onOpenChange,
  doctor,
  hospitalId,
  onComplete
}: DoctorDeletionWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('deletion-check');
  const [assignedPatients, setAssignedPatients] = useState<AssignedPatient[]>([]);
  const [deletionError, setDeletionError] = useState<string | null>(null);
  const [hasPatients, setHasPatients] = useState(false);
  const [patientCount, setPatientCount] = useState(0);

  const queryClient = useQueryClient();
  const assignPatientMutation = useAssignPatient();

  // Get available doctors for reassignment (excluding the doctor being deleted)
  const { data: allDoctors = [] } = useDoctors({
    hospitalId,
    enabled: isOpen && !!hospitalId
  });

  const availableDoctors = allDoctors.filter(d => d.id !== doctor?.id);

  // Fetch assigned patients when needed
  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ['doctor', doctor?.id, 'patients'],
    queryFn: async () => {
      if (!doctor) return null;
      const response = await api.get<DoctorPatientsResponse>(`/api/hospital-admin/doctors/${doctor.id}/patients`);
      return transformApiResponse(response);
    },
    enabled: isOpen && !!doctor && currentStep === 'patient-reassignment',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Doctor deletion mutation
  const deleteDoctorMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      const response = await fetch('/api/hospital-admin/doctors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, hospitalId }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        const error = new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
        // Attach additional error data for dependency issues
        (error as any).hasPatients = result.data?.hasPatients;
        (error as any).patientCount = result.data?.patientCount;
        (error as any).assignedPatients = result.data?.assignedPatients;
        (error as any).code = result.code;
        throw error;
      }
      
      // Check if deletion was blocked due to patients (409 status)
      if (response.status === 409 || result.data?.hasPatients) {
        const error = new Error(result.message || 'Doctor has assigned patients');
        (error as any).hasPatients = result.data?.hasPatients;
        (error as any).patientCount = result.data?.patientCount;
        (error as any).assignedPatients = result.data?.assignedPatients;
        throw error;
      }
      
      return result;
    },
    onSuccess: () => {
      // Invalidate doctors query to refresh the list using correct query key
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.doctorsList({ hospitalId }) 
      });
      
      // Also invalidate hospital analytics to update doctor count
      queryClient.invalidateQueries({
        queryKey: ['hospital', 'analytics']
      });
      
      setCurrentStep('deletion-complete');
      
      // Close workflow after a brief delay
      setTimeout(() => {
        handleWorkflowComplete();
      }, 2000);
    },
    onError: (error: any) => {
      // Check if error indicates patient assignments (expected behavior)
      if (error?.hasPatients || error?.message?.includes('patient')) {
        // This is expected behavior - don't log as error
        console.log(`ℹ️ Doctor has ${error?.patientCount || 0} assigned patients - showing reassignment dialog`);
        setHasPatients(true);
        setPatientCount(error?.patientCount || 0);
        setAssignedPatients(error?.assignedPatients || []);
        setCurrentStep('patient-reassignment');
      } else {
        // This is an actual error - log it
        console.error('Doctor deletion failed:', error);
        setDeletionError(error?.message || 'Failed to delete doctor');
        console.error(`❌ Doctor deletion failed: ${error?.message || 'Unknown error'}`);
      }
    },
  });

  // Reset workflow state when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep('deletion-check');
      setAssignedPatients([]);
      setDeletionError(null);
      setHasPatients(false);
      setPatientCount(0);
    }
  }, [isOpen, doctor]);

  const handleInitialDeletionAttempt = useCallback(() => {
    if (!doctor) return;
    
    setDeletionError(null);
    deleteDoctorMutation.mutate(doctor.id);
  }, [doctor, deleteDoctorMutation]);

  const handleRequestReassignment = useCallback(() => {
    if (!doctor) return;
    
    setCurrentStep('patient-reassignment');
    
    // If we don't have patient data from the error, we'll fetch it
    if (patientsData?.patients) {
      setAssignedPatients(patientsData.patients);
    }
  }, [doctor, patientsData]);

  const handleReassignPatients = useCallback(async (assignments: PatientAssignment[]) => {
    try {
      // Process assignments sequentially to avoid overwhelming the API
      for (const assignment of assignments) {
        await assignPatientMutation.mutateAsync({
          patientId: assignment.patientId,
          doctorId: assignment.selectedDoctorId,
          notes: `Patient reassigned during doctor deletion process`
        });
      }

      console.log(`✅ Patient reassignment successful: Successfully reassigned ${assignments.length} patient${assignments.length !== 1 ? 's' : ''} to other doctors.`);

      // Reset state and attempt deletion again
      setHasPatients(false);
      setPatientCount(0);
      setAssignedPatients([]);
      setCurrentStep('deletion-check');
      
      // Short delay before attempting deletion
      setTimeout(() => {
        handleInitialDeletionAttempt();
      }, 1000);

    } catch (error: any) {
      console.error('Patient reassignment failed:', error);
      console.error(`❌ Patient reassignment failed: ${error?.message || 'Unknown error'}`);
    }
  }, [assignPatientMutation, handleInitialDeletionAttempt]);

  const handleWorkflowComplete = useCallback(() => {
    onOpenChange(false);
    setCurrentStep('deletion-check');
    setAssignedPatients([]);
    setDeletionError(null);
    setHasPatients(false);
    setPatientCount(0);
    onComplete?.();
  }, [onOpenChange, onComplete]);

  const handleCancel = useCallback(() => {
    // Reset any pending mutations
    if (deleteDoctorMutation.isPending) {
      queryClient.cancelMutations({ mutationKey: ['delete-doctor'] });
    }
    if (assignPatientMutation.isPending) {
      queryClient.cancelMutations({ mutationKey: ['assign-patient'] });
    }
    
    // Force close the workflow
    setCurrentStep('deletion-check');
    setAssignedPatients([]);
    setDeletionError(null);
    setHasPatients(false);
    setPatientCount(0);
    onOpenChange(false);
    onComplete?.();
  }, [deleteDoctorMutation.isPending, assignPatientMutation.isPending, queryClient, onOpenChange, onComplete]);

  const handleGoBackToDelection = useCallback(() => {
    console.log('DoctorDeletionWorkflow: Going back to deletion check');
    setCurrentStep('deletion-check');
  }, []);

  if (!doctor) return null;

  return (
    <AnimatePresence mode="wait">
      {currentStep === 'deletion-check' && (
        <DoctorDeletionDialog
          key="deletion-dialog"
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          doctor={doctor}
          isLoading={deleteDoctorMutation.isPending}
          hasPatients={hasPatients}
          patientCount={patientCount}
          assignedPatients={assignedPatients}
          onConfirmDeletion={handleInitialDeletionAttempt}
          onRequestReassignment={handleRequestReassignment}
          onCancel={handleCancel}
        />
      )}

      {currentStep === 'patient-reassignment' && (
        <PatientReassignmentDialog
          key="reassignment-dialog"
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          doctorToDelete={doctor}
          assignedPatients={patientsData?.patients || assignedPatients}
          availableDoctors={availableDoctors}
          isLoading={loadingPatients}
          isAssigning={assignPatientMutation.isPending}
          onReassignPatients={handleReassignPatients}
          onCancel={handleCancel}
          onGoBack={handleGoBackToDelection}
        />
      )}
    </AnimatePresence>
  );
}

export default DoctorDeletionWorkflow;