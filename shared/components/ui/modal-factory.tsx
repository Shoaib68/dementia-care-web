"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';

// Dynamic imports for all modal components to reduce bundle size
const modalLoadingFallback = (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6">
      <LoadingSpinner size="lg" />
    </div>
  </div>
);

// Lazy load modal components
export const DynamicModals = {
  // Hospital Management Modals
  HospitalCreate: dynamic(() => import('../modals/HospitalCreateModal').then(mod => ({ default: mod.HospitalCreateModal })), {
    loading: () => modalLoadingFallback,
    ssr: false
  }),
  
  HospitalEdit: dynamic(() => import('../modals/HospitalEditModal').then(mod => ({ default: mod.HospitalEditModal })), {
    loading: () => modalLoadingFallback,
    ssr: false
  }),
  
  HospitalDetails: dynamic(() => import('../modals/HospitalDetailsModal').then(mod => ({ default: mod.HospitalDetailsModal })), {
    loading: () => modalLoadingFallback,
    ssr: false
  }),

  // Doctor Management Modals  
  DoctorCreate: dynamic(() => import('../modals/DoctorCreateModal').then(mod => ({ default: mod.DoctorCreateModal })), {
    loading: () => modalLoadingFallback,
    ssr: false
  }),
  
  DoctorEdit: dynamic(() => import('../modals/DoctorEditModal').then(mod => ({ default: mod.DoctorEditModal })), {
    loading: () => modalLoadingFallback,
    ssr: false
  }),
  
  DoctorDetails: dynamic(() => import('../modals/DoctorDetailsModal').then(mod => ({ default: mod.DoctorDetailsModal })), {
    loading: () => modalLoadingFallback,
    ssr: false
  }),

  // Patient Management Modals
  PatientDetails: dynamic(() => import('../modals/PatientDetailsModal').then(mod => ({ default: mod.PatientDetailsModal })), {
    loading: () => modalLoadingFallback,
    ssr: false
  }),
  
  PatientEdit: dynamic(() => import('../modals/PatientEditModal').then(mod => ({ default: mod.PatientEditModal })), {
    loading: () => modalLoadingFallback,
    ssr: false
  }),

  // Specialized Dialogs
  AssignDoctor: dynamic(() => import('../hospital/AssignDoctorDialog').then(mod => ({ default: mod.AssignDoctorDialog })), {
    loading: () => modalLoadingFallback,
    ssr: false
  }),
  
  DoctorDeletion: dynamic(() => import('../hospital/DoctorDeletionDialog').then(mod => ({ default: mod.DoctorDeletionDialog })), {
    loading: () => modalLoadingFallback,
    ssr: false
  }),
  
  PatientReassignment: dynamic(() => import('../hospital/PatientReassignmentDialog').then(mod => ({ default: mod.PatientReassignmentDialog })), {
    loading: () => modalLoadingFallback,
    ssr: false
  }),

  // Credentials Modal
  Credentials: dynamic(() => import('../credentials/CredentialsModal').then(mod => ({ default: mod.CredentialsModal })), {
    loading: () => modalLoadingFallback,
    ssr: false
  })
};

// Modal component factory with error boundary
export const createModal = (ModalComponent: React.ComponentType<any>) => {
  return React.forwardRef<HTMLDivElement, any>((props, ref) => {
    return (
      <React.Suspense fallback={modalLoadingFallback}>
        <ModalComponent {...props} ref={ref} />
      </React.Suspense>
    );
  });
};