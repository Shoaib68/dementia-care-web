import { z } from 'zod';
import {
  createEmailValidator,
  createPhoneValidator,
  createPersonNameValidator,
  createOrganizationNameValidator,
  createAddressValidator,
  validatePasswordStrength,
  sanitizeFormData as sanitizeFormDataEnhanced,
  validateAge,
  isPastDate,
  isFutureDate,
} from './validation-enhanced';

/**
 * Common validation utilities and schemas for forms
 * Provides consistent validation across client and server
 * 
 * Uses Zod schemas with enhanced validators from validation-enhanced.ts
 */

// Basic field validators
export const validators = {
  email: z.string().email('Please enter a valid email address'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
    
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Please enter a valid phone number'),
    
  name: z.string()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
    
  required: (message = 'This field is required') => z.string().min(1, message),
  
  optional: z.string().optional(),
  
  date: z.string().refine(
    (date) => !isNaN(Date.parse(date)), 
    'Please enter a valid date'
  ),
  
  url: z.string().url('Please enter a valid URL'),
  
  licenseNumber: z.string()
    .min(5, 'License number must be at least 5 characters')
    .max(20, 'License number must be less than 20 characters')
    .regex(/^[A-Z0-9\-]+$/, 'License number can only contain uppercase letters, numbers, and hyphens'),
};

// Enhanced auth-specific validators
export const authValidators = {
  email: z.string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address')
    .max(255, 'Email address is too long')
    .refine(
      (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email),
      'Please enter a valid email address'
    ),
    
  loginPassword: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
    
  emailField: (fieldName = 'Email') => z.string()
    .min(1, `${fieldName} is required`)
    .email(`Please enter a valid ${fieldName.toLowerCase()}`)
    .max(255, `${fieldName} is too long`),
};

// Form schemas
export const schemas = {
  // Enhanced login schema with specific validation
  login: z.object({
    email: authValidators.email,
    password: authValidators.loginPassword,
  }),
  
  // Hospital creation schema
  hospital: z.object({
    hospitalName: validators.required('Hospital name is required')
      .min(2, 'Hospital name must be at least 2 characters')
      .max(100, 'Hospital name must be less than 100 characters'),
    address: validators.required('Address is required')
      .min(10, 'Please provide a complete address'),
    phone: validators.phone,
    adminFirstName: validators.name,
    adminLastName: validators.name,
    adminEmail: validators.email,
  }),

  // Doctor creation schema
  doctor: z.object({
    email: validators.email,
    firstName: validators.name,
    lastName: validators.name,
    specialization: validators.required('Specialization is required')
      .min(2, 'Specialization must be at least 2 characters'),
    licenseNumber: validators.licenseNumber,
    phone: validators.phone.optional(),
  }),

  // Patient creation schema
  patient: z.object({
    patientDetails: z.object({
      firstName: validators.name,
      lastName: validators.name,
      dateOfBirth: validators.date,
      dementiaStage: z.enum(['mild', 'moderate', 'severe'], {
        errorMap: () => ({ message: 'Please select a valid dementia stage' })
      }),
      medicalHistory: z.record(z.any()).optional(),
    }),
    caregiverDetails: z.object({
      firstName: validators.name,
      lastName: validators.name,
      phoneNumber: validators.phone,
      emergencyContact: validators.phone.optional(),
      address: z.string().min(10, 'Please provide a complete address').optional(),
    }),
    doctorId: validators.required('Doctor selection is required'),
    hospitalId: validators.required('Hospital selection is required'),
  }),


  // Profile update schema
  profile: z.object({
    firstName: validators.name,
    lastName: validators.name,
    email: validators.email,
    phone: validators.phone.optional(),
  }),
};

// Validation result type
export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Validates data against a Zod schema and returns formatted errors
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      const fieldErrors: Record<string, string[]> = {};

      error.errors.forEach((err) => {
        const path = err.path.join('.');
        const message = err.message;
        
        // First error for this field becomes the main error
        if (!errors[path]) {
          errors[path] = message;
        }
        
        // Add to field errors array
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(message);
      });

      return {
        success: false,
        errors,
        fieldErrors,
      };
    }

    return {
      success: false,
      errors: { _general: 'Validation failed' },
    };
  }
}

/**
 * Helper to get specific field error from validation result
 */
export function getFieldError(
  validationResult: ValidationResult,
  fieldName: string
): string | undefined {
  return validationResult.errors?.[fieldName];
}

/**
 * Helper to check if field has error
 */
export function hasFieldError(
  validationResult: ValidationResult,
  fieldName: string
): boolean {
  return Boolean(validationResult.errors?.[fieldName]);
}

/**
 * Helper to get all errors for a field
 */
export function getFieldErrors(
  validationResult: ValidationResult,
  fieldName: string
): string[] {
  return validationResult.fieldErrors?.[fieldName] || [];
}

/**
 * Sanitize form data by trimming strings and removing empty values
 */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach((key) => {
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      sanitized[key] = value.trim() || undefined;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeFormData(value);
    }
  });
  
  return sanitized;
}

/**
 * Convert validation errors to a format suitable for react-hook-form
 */
export function toFormErrors(validationResult: ValidationResult) {
  if (validationResult.success || !validationResult.errors) {
    return {};
  }

  const formErrors: Record<string, { message: string }> = {};
  
  Object.entries(validationResult.errors).forEach(([field, message]) => {
    // Handle nested field paths (e.g., "patientDetails.firstName")
    const fieldPath = field.split('.');
    let current = formErrors;
    
    for (let i = 0; i < fieldPath.length - 1; i++) {
      const segment = fieldPath[i];
      if (!current[segment]) {
        current[segment] = {};
      }
      current = current[segment];
    }
    
    current[fieldPath[fieldPath.length - 1]] = { message };
  });
  
  return formErrors;
}

/**
 * Common validation patterns
 */
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]{10,}$/,
  name: /^[a-zA-Z\s'-]+$/,
  licenseNumber: /^[A-Z0-9\-]+$/,
  password: {
    minLength: /.{8,}/,
    hasUpperCase: /[A-Z]/,
    hasLowerCase: /[a-z]/,
    hasNumber: /[0-9]/,
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
  },
};

/**
 * Custom validation functions for complex business logic
 */
export const customValidators = {
  /**
   * Validate age based on date of birth
   */
  validateAge: (dateOfBirth: string, minAge: number = 0, maxAge: number = 120) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    
    return age >= minAge && age <= maxAge;
  },

  /**
   * Validate future date
   */
  isFutureDate: (date: string) => {
    return new Date(date) > new Date();
  },

  /**
   * Validate past date
   */
  isPastDate: (date: string) => {
    return new Date(date) < new Date();
  },

  /**
   * Validate password strength
   */
  passwordStrength: (password: string) => {
    const checks = {
      length: password.length >= 8,
      hasUpper: patterns.password.hasUpperCase.test(password),
      hasLower: patterns.password.hasLowerCase.test(password),
      hasNumber: patterns.password.hasNumber.test(password),
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    return {
      score,
      isStrong: score >= 3,
      checks,
    };
  },
};

export default {
  validators,
  authValidators,
  schemas,
  validateSchema,
  getFieldError,
  hasFieldError,
  getFieldErrors,
  sanitizeFormData,
  toFormErrors,
  patterns,
  customValidators,
};
