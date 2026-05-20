/**
 * API request and response types for all endpoints
 * Provides type safety for client-server communication
 */

// Base API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token?: string;
}

// Hospital management types
export interface CreateHospitalRequest {
  hospitalName: string;
  address: string;
  phone: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
}

export interface CreateHospitalResponse {
  hospitalId: string;
  adminCredentials: GeneratedCredentials;
}

export interface Hospital {
  id: string;
  name: string;
  address?: string;
  phone_number?: string;
  location?: string;
  email?: string;
  phone?: string;
  is_approved: boolean;
  created_at: string;
  users: {
    email: string;
    is_active: boolean;
    updated_at: string;
  };
}

// Doctor management types
export interface CreateDoctorRequest {
  email: string;
  firstName: string;
  lastName: string;
  specialization: string;
  licenseNumber: string;
  phone?: string;
  hospitalId?: string;
}

export interface CreateDoctorResponse {
  doctor: Doctor;
  credentials: GeneratedCredentials;
}

export interface Doctor {
  id: string;
  hospital_id: string;
  specialization: string;
  license_number: string;
  created_at: string;
  updated_at?: string;
  users: {
    email: string;
    is_active: boolean;
  };
  hospitals?: {
    name: string;
  };
}

// Patient management types
export interface CreatePatientRequest {
  patientDetails: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    dementiaStage: 'mild' | 'moderate' | 'severe';
    medicalHistory?: Record<string, any>;
  };
  caregiverDetails: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    emergencyContact?: string;
    address?: string;
  };
  doctorId: string;
  hospitalId: string;
}

export interface CreatePatientResponse {
  patientId: string;
  caregiverId: string;
  patientCredentials: GeneratedCredentials;
  caregiverCredentials: GeneratedCredentials;
}

export interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  dementiaStage?: 'mild' | 'moderate' | 'severe';
  medicalHistory?: Record<string, any>;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  dementia_stage: 'mild' | 'moderate' | 'severe';
  medical_history?: Record<string, any>;
  hospital_id: string;
  primary_doctor_id: string;
  created_at: string;
  users: {
    email: string;
    is_active: boolean;
  };
  patient_caregiver_assignments: Array<{
    caregivers: {
      id: string;
      first_name: string;
      last_name: string;
      phone_number: string;
      emergency_contact?: string;
      address?: string;
    };
  }>;
  hospitals?: {
    name: string;
  };
  doctors?: {
    id: string;
    specialization: string;
    license_number: string;
    users: {
      email: string;
    };
  };
}

export interface Caregiver {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  emergency_contact?: string;
  address?: string;
}

// MRI and diagnosis types
export interface CreateMRIScanRequest {
  patientId: string;
  imageFiles: File[];
  notes?: string;
  uploadedBy: string;
}

export interface MRIScan {
  id: string;
  patient_id: string;
  image_urls: string[];
  ai_diagnosis_stage?: 'mild' | 'moderate' | 'severe';
  ai_confidence_score?: number;
  notes?: string;
  uploaded_by: string;
  hospital_id: string;
  created_at: string;
  updated_at?: string;
}

// Analytics types
export interface HospitalAnalytics {
  totalDoctors: number;
  totalPatients: number;
  patientsByStage: {
    mild: number;
    moderate: number;
    severe: number;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface SystemAnalytics {
  totalHospitals: number;
  totalDoctors: number;
  totalPatients: number;
  hospitalsByStatus: {
    active: number;
    pending: number;
    inactive: number;
  };
  patientsByStage: {
    mild: number;
    moderate: number;
    severe: number;
  };
  monthlyGrowth: Array<{
    month: string;
    hospitals: number;
    doctors: number;
    patients: number;
  }>;
}

// User and authentication types
export interface User {
  id: string;
  email: string;
  user_type: 'super_admin' | 'hospital_admin' | 'doctor' | 'patient' | 'caregiver';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  
  // Optional nested data based on user type
  hospital?: {
    id: string;
    name: string;
  };
  
  doctor_profile?: {
    hospital_id: string;
    hospital_name: string;
    specialization: string;
    license_number: string;
  };
}

export type WebPortalRole = 'super_admin' | 'hospital_admin' | 'doctor';

export interface GeneratedCredentials {
  email: string;
  password?: string; // Optional: not provided when using invite flow
  userId: string;
}

export interface CreateHospitalAdminRequest {
  email: string;
  hospitalName: string;
  adminDetails?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

// Filter types
export interface HospitalFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'pending';
}

export interface DoctorFilters {
  search?: string;
  status?: 'active' | 'inactive';
  hospitalId?: string;
  specialization?: string;
}

export interface PatientFilters {
  search?: string;
  dementiaStage?: 'mild' | 'moderate' | 'severe';
  status?: 'active' | 'inactive';
  doctorId?: string;
  hospitalId?: string;
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  errors?: Record<string, string[]>;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Query key types for React Query
export interface QueryKeys {
  hospitals: readonly string[];
  hospitalsList: (filters?: HospitalFilters) => readonly string[];
  hospitalsInfinite: (filters?: HospitalFilters) => readonly string[];
  
  doctors: readonly string[];
  doctorsList: (filters?: DoctorFilters) => readonly string[];
  hospitalDoctors: (hospitalId: string) => readonly string[];
  
  patients: readonly string[];
  patientsList: (filters?: PatientFilters) => readonly string[];
  patient: (id: string) => readonly string[];
  doctorPatients: (doctorId: string) => readonly string[];
  hospitalPatients: (hospitalId: string) => readonly string[];
  
  analytics: readonly string[];
  systemAnalytics: () => readonly string[];
  hospitalAnalytics: (hospitalId: string) => readonly string[];
  
  mriScans: readonly string[];
  patientMRIScans: (patientId: string) => readonly string[];
  mriScan: (id: string) => readonly string[];
}

// Form data types
export interface HospitalFormData {
  hospitalName: string;
  address: string;
  phone: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
}

export interface DoctorFormData {
  email: string;
  firstName: string;
  lastName: string;
  specialization: string;
  licenseNumber: string;
  phone?: string;
}

export interface PatientFormData {
  patientDetails: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    dementiaStage: 'mild' | 'moderate' | 'severe';
    medicalHistory?: Record<string, any>;
  };
  caregiverDetails: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    emergencyContact?: string;
    address?: string;
  };
  doctorId: string;
  hospitalId: string;
}

// Export all types
export type {
  // Keep compatibility with existing imports
  Patient as PatientType,
  Doctor as DoctorType,
  Hospital as HospitalType,
  User as UserType,
  Caregiver as CaregiverType,
  MRIScan as MRIScanType,
};
