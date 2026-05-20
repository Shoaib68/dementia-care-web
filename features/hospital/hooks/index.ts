// Export all hospital-related hooks
export * from './useDoctorManagement';
export * from './useHospitalData';
export * from './useHospitalAnalytics';
export * from './useDoctorEmailValidation';
export * from './usePatientAssignment';
export * from './useDoctorPatients';
export * from './useBulkPatientAssignment';

// Re-export types for convenience
export type {
  UseDoctorsOptions,
  CreateDoctorMutationParams,
  UpdateDoctorMutationParams,
  DoctorData,
  GetDoctorsFilters
} from './useDoctorManagement';

export type {
  HospitalData
} from './useHospitalData';

export type {
  DoctorEmailValidationResult,
  DoctorEmailValidationState
} from './useDoctorEmailValidation';

export type {
  HospitalPatient,
  PatientFilters
} from './usePatientAssignment';

export type {
  DoctorPatientInfo
} from './useDoctorPatients';

export type {
  PatientAssignment,
  BulkAssignmentResponse,
  BulkAssignmentResult,
  BulkAssignmentError
} from './useBulkPatientAssignment';
