"use client";

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';

// Form loading fallback
const FormLoadingFallback = ({ formName }: { formName: string }) => (
  <div className="bg-white rounded-lg border p-8">
    <div className="flex items-center justify-center space-x-3">
      <LoadingSpinner size="md" />
      <p className="text-gray-600">Loading {formName} form...</p>
    </div>
  </div>
);

// Large form components split into smaller chunks for better performance
export const LazyForms = {
  // Hospital Management Forms
  CreateHospital: dynamic(() => import('../modals/HospitalCreateModal').then(mod => ({
    default: mod.HospitalCreateModal
  })), {
    loading: () => <FormLoadingFallback formName="Create Hospital" />,
    ssr: false
  }),

  EditHospital: dynamic(() => import('../modals/HospitalEditModal').then(mod => ({
    default: mod.HospitalEditModal
  })), {
    loading: () => <FormLoadingFallback formName="Edit Hospital" />,
    ssr: false
  }),

  // Doctor Management Forms
  CreateDoctor: dynamic(() => import('../modals/DoctorCreateModal').then(mod => ({
    default: mod.DoctorCreateModal
  })), {
    loading: () => <FormLoadingFallback formName="Create Doctor" />,
    ssr: false
  }),

  EditDoctor: dynamic(() => import('../modals/DoctorEditModal').then(mod => ({
    default: mod.DoctorEditModal
  })), {
    loading: () => <FormLoadingFallback formName="Edit Doctor" />,
    ssr: false
  }),

  // Patient Management Forms
  EditPatient: dynamic(() => import('../modals/PatientEditModal').then(mod => ({
    default: mod.PatientEditModal
  })), {
    loading: () => <FormLoadingFallback formName="Edit Patient" />,
    ssr: false
  }),

  // Assignment Forms
  AssignDoctor: dynamic(() => import('../hospital/AssignDoctorDialog').then(mod => ({
    default: mod.AssignDoctorDialog
  })), {
    loading: () => <FormLoadingFallback formName="Assign Doctor" />,
    ssr: false
  }),

  ReassignPatients: dynamic(() => import('../hospital/PatientReassignmentDialog').then(mod => ({
    default: mod.PatientReassignmentDialog
  })), {
    loading: () => <FormLoadingFallback formName="Reassign Patients" />,
    ssr: false
  })
};

// Form section components for breaking down large forms
export const FormSections = {
  // Hospital form sections
  HospitalBasicInfo: dynamic(() => import('../forms/sections/HospitalBasicInfoSection'), {
    loading: () => <FormLoadingFallback formName="Hospital Information" />,
    ssr: false
  }),

  HospitalAdminInfo: dynamic(() => import('../forms/sections/HospitalAdminInfoSection'), {
    loading: () => <FormLoadingFallback formName="Administrator Information" />,
    ssr: false
  }),

  // Doctor form sections
  DoctorPersonalInfo: dynamic(() => import('../forms/sections/DoctorPersonalInfoSection'), {
    loading: () => <FormLoadingFallback formName="Personal Information" />,
    ssr: false
  }),

  DoctorProfessionalInfo: dynamic(() => import('../forms/sections/DoctorProfessionalInfoSection'), {
    loading: () => <FormLoadingFallback formName="Professional Information" />,
    ssr: false
  }),

  // Patient form sections
  PatientBasicInfo: dynamic(() => import('../forms/sections/PatientBasicInfoSection'), {
    loading: () => <FormLoadingFallback formName="Patient Information" />,
    ssr: false
  }),

  PatientMedicalInfo: dynamic(() => import('../forms/sections/PatientMedicalInfoSection'), {
    loading: () => <FormLoadingFallback formName="Medical Information" />,
    ssr: false
  }),

  CaregiverInfo: dynamic(() => import('../forms/sections/CaregiverInfoSection'), {
    loading: () => <FormLoadingFallback formName="Caregiver Information" />,
    ssr: false
  })
};

// Preload form utilities
export const preloadForms = {
  hospitalManagement: () => {
    Promise.all([
      import('../modals/HospitalCreateModal'),
      import('../modals/HospitalEditModal')
    ]).catch(() => {});
  },

  doctorManagement: () => {
    Promise.all([
      import('../modals/DoctorCreateModal'),
      import('../modals/DoctorEditModal'),
      import('../hospital/AssignDoctorDialog')
    ]).catch(() => {});
  },

  patientManagement: () => {
    Promise.all([
      import('../modals/PatientEditModal'),
      import('../hospital/PatientReassignmentDialog')
    ]).catch(() => {});
  }
};