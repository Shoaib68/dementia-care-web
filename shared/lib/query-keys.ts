/**
 * Centralized query keys factory for React Query
 * Provides type-safe and consistent cache key management across the application
 */

// Base query key types for better TypeScript support
type QueryKeyBase = readonly unknown[];

/**
 * Query keys factory following React Query best practices
 * Hierarchical structure: [entity, scope, filters, etc.]
 */
export const queryKeys = {
  // Authentication queries
  auth: ['auth'] as const,
  currentUser: () => [...queryKeys.auth, 'current-user'] as const,

  // Hospital queries
  hospitals: ['hospitals'] as const,
  hospitalsList: (filters?: { search?: string; status?: string }) => 
    [...queryKeys.hospitals, 'list', filters] as const,
  hospitalsInfinite: (filters?: { search?: string; status?: string }) =>
    [...queryKeys.hospitals, 'infinite', filters] as const,
  hospital: {
    all: ['hospital'] as const,
    detail: (id: string) => [...queryKeys.hospitals, 'detail', id] as const,
    analytics: (id: string, period?: string) => 
      [...queryKeys.hospitals, 'analytics', id, period] as const,
    doctorPatients: (doctorId: string | null) => 
      [...queryKeys.hospitals, 'doctor-patients', doctorId] as const,
  },

  // Doctor queries  
  doctors: ['doctors'] as const,
  doctor: (id: string) => [...queryKeys.doctors, 'detail', id] as const,
  doctorsList: (filters?: { search?: string; specialization?: string; status?: string; hospitalId?: string }) =>
    [...queryKeys.doctors, 'list', filters] as const,
  doctorsInfinite: (filters?: { search?: string; specialization?: string; status?: string; hospitalId?: string }) =>
    [...queryKeys.doctors, 'infinite', filters] as const,
  doctorDetail: (id: string) => [...queryKeys.doctors, 'detail', id] as const,
  doctorPatients: (doctorId: string, filters?: { search?: string; stage?: string }) =>
    [...queryKeys.doctors, doctorId, 'patients', filters] as const,

  // Patient queries
  patients: ['patients'] as const,
  patientsList: (filters?: { 
    search?: string; 
    dementiaStage?: 'mild' | 'moderate' | 'severe';
    status?: 'active' | 'inactive';
    doctorId?: string;
    hospitalId?: string;
  }) => [...queryKeys.patients, 'list', filters] as const,
  patientsInfinite: (filters?: { 
    search?: string; 
    dementiaStage?: 'mild' | 'moderate' | 'severe';
    status?: 'active' | 'inactive';
    doctorId?: string;
    hospitalId?: string;
  }) => [...queryKeys.patients, 'infinite', filters] as const,
  patient: (id: string) => [...queryKeys.patients, 'detail', id] as const,
  patientHistory: (id: string) => [...queryKeys.patients, id, 'history'] as const,
  patientMRI: (id: string) => [...queryKeys.patients, id, 'mri'] as const,
  patientReport: (patientId: string, year: number, month: number) =>
    [...queryKeys.patients, patientId, 'report', year, month] as const,
  hospitalPatients: (hospitalId?: string, filters?: { 
    search?: string; 
    dementiaStage?: 'mild' | 'moderate' | 'severe';
    doctorId?: string;
    status?: 'active' | 'inactive';
  }) => [...queryKeys.patients, 'hospital', hospitalId, filters] as const,
  patientAssignments: (hospitalId: string) => 
    [...queryKeys.patients, 'assignments', hospitalId] as const,
  unassignedPatients: (hospitalId: string) => 
    [...queryKeys.patients, 'unassigned', hospitalId] as const,

  // Analytics queries
  analytics: ['analytics'] as const,
  systemAnalytics: (period?: string) => 
    [...queryKeys.analytics, 'system', period] as const,
  hospitalAnalytics: (hospitalId: string, period?: string) =>
    [...queryKeys.analytics, 'hospital', hospitalId, period] as const,
  doctorAnalytics: (doctorId: string, period?: string) =>
    [...queryKeys.analytics, 'doctor', doctorId, period] as const,

  // MRI queries
  mri: ['mri'] as const,
  mriScans: (patientId: string) => [...queryKeys.mri, 'scans', patientId] as const,
  mriAnalysis: (scanId: string) => [...queryKeys.mri, 'analysis', scanId] as const,
} as const;

/**
 * Helper function to get all query keys for a specific entity
 * Useful for invalidating all related queries
 */
export const getEntityQueryKeys = {
  hospitals: () => queryKeys.hospitals,
  doctors: (hospitalId?: string) => 
    hospitalId ? [queryKeys.doctors[0], 'list', hospitalId] : queryKeys.doctors,
  patients: (doctorId?: string) => 
    doctorId ? [queryKeys.patients[0], 'list', doctorId] : queryKeys.patients,
  analytics: (scope?: 'system' | 'hospital' | 'doctor') =>
    scope ? [queryKeys.analytics[0], scope] : queryKeys.analytics,
};

/**
 * Query key validation helper
 */
export const isQueryKeyValid = (queryKey: QueryKeyBase): boolean => {
  return Array.isArray(queryKey) && queryKey.length > 0 && typeof queryKey[0] === 'string';
};

/**
 * Debug helper to log query keys in development
 */
export const logQueryKey = (queryKey: QueryKeyBase, operation: 'fetch' | 'mutate' | 'invalidate') => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[React Query ${operation.toUpperCase()}]`, queryKey);
  }
};

// Export types for use in other files
export type QueryKeys = typeof queryKeys;
export type HospitalQueryKey = ReturnType<typeof queryKeys.hospitalsList>;
export type DoctorQueryKey = ReturnType<typeof queryKeys.doctorsList>;
export type PatientQueryKey = ReturnType<typeof queryKeys.patientsList>;
