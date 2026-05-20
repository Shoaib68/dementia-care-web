/**
 * Centralized type definitions for the entire application
 * Re-exports all types from different modules for easy import
 */

// Re-export all API types
export * from './api';

// Common component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form-related types
export interface FieldError {
  message: string;
}

export type FormErrors<T = any> = {
  [K in keyof T]?: FieldError | FormErrors<T[K]>;
};

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// System-wide constants
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HOSPITAL_ADMIN: 'hospital_admin', 
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  CAREGIVER: 'caregiver'
} as const;

export const USER_TYPES = {
  WEB_PORTAL: ['super_admin', 'hospital_admin', 'doctor'],
  MOBILE_APP: ['patient', 'caregiver']
} as const;

// Common enums
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  HOSPITAL_ADMIN = 'hospital_admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient',
  CAREGIVER = 'caregiver',
}

export enum DementiaStage {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event handler types
export type EventHandler<T = any> = (event: T) => void;
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

// API-related utility types
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

// Route parameter types
export interface RouteParams {
  [key: string]: string | undefined;
}

// Search and filter types
export interface SearchParams {
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: any;
}

// Date/time utility types
export type DateString = string; // ISO date string
export type TimestampString = string; // ISO timestamp string

// Navigation types
export interface NavItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<any>;
  children?: NavItem[];
  active?: boolean;
  disabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

// Export utility functions for type checking
export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

export const isValidDementiaStage = (stage: string): stage is DementiaStage => {
  return Object.values(DementiaStage).includes(stage as DementiaStage);
};

export const isValidUserStatus = (status: string): status is UserStatus => {
  return Object.values(UserStatus).includes(status as UserStatus);
};

// Default export for convenience
export default {
  ROLES,
  USER_TYPES,
  UserRole,
  DementiaStage,
  UserStatus,
  isValidUserRole,
  isValidDementiaStage,
  isValidUserStatus,
};
