// Auth types based on database schema
export type UserType = 'super_admin' | 'hospital_admin' | 'doctor' | 'patient' | 'caregiver';

// Base user from auth.users table
export interface AuthUser {
  id: string;
  email: string;
}

// User profile from database users table  
export interface UserProfile {
  id: string;
  email: string;
  user_type: UserType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Extended user with related data
export interface User extends UserProfile {
  // Hospital admin specific
  hospital?: {
    id: string;
    name: string;
  };
  // Doctor specific
  doctor_profile?: {
    hospital_id: string;
    hospital_name: string;
    specialization: string;
    license_number: string;
  };
}

// Web portal roles (excluding patient/caregiver as they use mobile apps)
export type WebPortalRole = 'super_admin' | 'hospital_admin' | 'doctor';

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: (options?: { silent?: boolean }) => Promise<void>;
  loading: boolean;
}

// Credential generation types
export interface GeneratedCredentials {
  email: string;
  password?: string; // Optional: not provided when using invite flow
  userId: string;
}

// User creation request types
export interface CreateHospitalAdminRequest {
  email: string;
  hospitalName: string;
  hospitalId?: string; // For linking to existing hospital
  adminDetails?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

export interface CreateDoctorRequest {
  email: string;
  hospitalId: string;
  specialization: string;
  licenseNumber: string;
  doctorDetails?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

export interface CreatePatientRequest {
  patientDetails: {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
    dementiaStage: 'mild' | 'moderate' | 'severe';
    medicalHistory?: any;
  };
  caregiverDetails: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    emergencyContact?: string;
    address?: string;
  };
  doctorId: string;
  hospitalId: string;
}

// Enhanced Authentication Error Types
export enum AuthErrorType {
  EMAIL_NOT_FOUND = 'EMAIL_NOT_FOUND',
  INCORRECT_PASSWORD = 'INCORRECT_PASSWORD',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  field?: 'email' | 'password' | 'general';
  code?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: AuthError;
}

// Login form validation types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}
