import { z } from 'zod';

/**
 * Enhanced validation utilities with comprehensive validators
 * Consolidates validation logic from across the application
 * 
 * @module shared/lib/validation-enhanced
 */

// ============================================================================
// COMPREHENSIVE EMAIL VALIDATION
// ============================================================================

export interface EmailValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Comprehensive email validation with detailed error messages
 * Validates format, length, and structure requirements
 */
export function validateEmailDetailed(email: string): EmailValidationResult {
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  // More detailed validation
  const [localPart, domain] = email.split('@');
  
  // Local part validation
  if (localPart.length > 64) {
    return { isValid: false, message: 'Email address is too long' };
  }
  
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { isValid: false, message: 'Email format is invalid' };
  }
  
  if (localPart.includes('..')) {
    return { isValid: false, message: 'Email format is invalid' };
  }

  // Domain validation
  if (domain.length > 253) {
    return { isValid: false, message: 'Email domain is too long' };
  }
  
  if (!domain.includes('.')) {
    return { isValid: false, message: 'Email domain is invalid' };
  }
  
  const domainParts = domain.split('.');
  if (domainParts.some(part => part.length === 0)) {
    return { isValid: false, message: 'Email domain format is invalid' };
  }
  
  // Check for valid TLD
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return { isValid: false, message: 'Email domain extension is invalid' };
  }

  return { isValid: true, message: '' };
}

// ============================================================================
// COMPREHENSIVE PHONE NUMBER VALIDATION
// ============================================================================

export interface PhoneValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Comprehensive phone number validation
 * Supports US/Canada and international formats
 */
export function validatePhoneNumberDetailed(phone: string): PhoneValidationResult {
  if (!phone) {
    return { isValid: false, message: 'Phone number is required' };
  }

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if it has minimum digits
  if (digitsOnly.length < 10) {
    return { isValid: false, message: 'Phone number must have at least 10 digits' };
  }
  
  // Check if it has maximum digits (international format)
  if (digitsOnly.length > 15) {
    return { isValid: false, message: 'Phone number is too long (maximum 15 digits)' };
  }

  // Common phone number patterns
  const phonePatterns = [
    /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/, // US/Canada: +1 234 567 8900
    /^\+?\d{10,15}$/, // International: +1234567890
  ];

  const formattedPhone = phone.replace(/\s+/g, '').replace(/[()-\.]/g, '');
  const isValidFormat = phonePatterns.some(pattern => pattern.test(formattedPhone));
  
  if (!isValidFormat) {
    // Check if it contains valid characters
    if (!/^[\+\d\s\-\(\)\.]+$/.test(phone)) {
      return { isValid: false, message: 'Phone number contains invalid characters' };
    }
    return { isValid: false, message: 'Please enter a valid phone number format' };
  }

  return { isValid: true, message: '' };
}

/**
 * Format phone number as user types
 * Supports US/Canada and international formats
 */
export function formatPhoneNumber(input: string): string {
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');
  
  // Don't format if it starts with + (international)
  if (input.startsWith('+')) {
    return input;
  }
  
  // Format US/Canada numbers
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else {
    // For longer numbers, add country code formatting
    return `+${digits.slice(0, digits.length - 10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
  }
}

// ============================================================================
// NAME VALIDATION (with hospital/organization name support)
// ============================================================================

export interface NameValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Validate person name (first/last names)
 */
export function validatePersonName(name: string, fieldLabel: string = 'Name'): NameValidationResult {
  if (!name?.trim()) {
    return { isValid: false, message: `${fieldLabel} is required` };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, message: `${fieldLabel} must be at least 2 characters` };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, message: `${fieldLabel} must be less than 50 characters` };
  }
  
  if (!/^[a-zA-Z\s\-\.,']+$/.test(name.trim())) {
    return { isValid: false, message: `${fieldLabel} contains invalid characters` };
  }

  return { isValid: true, message: '' };
}

/**
 * Validate organization name (hospital, clinic, etc.)
 */
export function validateOrganizationName(name: string, minLength: number = 2, maxLength: number = 100): NameValidationResult {
  if (!name?.trim()) {
    return { isValid: false, message: 'Organization name is required' };
  }
  
  if (name.trim().length < minLength) {
    return { isValid: false, message: `Organization name must be at least ${minLength} characters` };
  }
  
  if (name.trim().length > maxLength) {
    return { isValid: false, message: `Organization name must be less than ${maxLength} characters` };
  }
  
  // Allow alphanumeric, spaces, and common punctuation for organization names
  if (!/^[a-zA-Z0-9\s\-\&\.,'()]+$/.test(name.trim())) {
    return { isValid: false, message: 'Organization name contains invalid characters' };
  }

  return { isValid: true, message: '' };
}

// ============================================================================
// ADDRESS VALIDATION
// ============================================================================

export interface AddressValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Validate address with configurable minimum length
 */
export function validateAddress(address: string, minLength: number = 10, maxLength: number = 250): AddressValidationResult {
  if (!address?.trim()) {
    return { isValid: false, message: 'Address is required' };
  }
  
  if (address.trim().length < minLength) {
    return { isValid: false, message: `Please provide a complete address (minimum ${minLength} characters)` };
  }
  
  if (address.trim().length > maxLength) {
    return { isValid: false, message: `Address must be less than ${maxLength} characters` };
  }

  return { isValid: true, message: '' };
}

// ============================================================================
// AGE AND DATE VALIDATION
// ============================================================================

/**
 * Validate age based on date of birth
 */
export function validateAge(dateOfBirth: string, minAge: number = 0, maxAge: number = 120): { isValid: boolean; age: number; message: string } {
  const birthDate = new Date(dateOfBirth);
  
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, age: 0, message: 'Invalid date of birth' };
  }
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age = age - 1;
  }
  
  if (age < minAge) {
    return { isValid: false, age, message: `Age must be at least ${minAge} years` };
  }
  
  if (age > maxAge) {
    return { isValid: false, age, message: `Age cannot exceed ${maxAge} years` };
  }

  return { isValid: true, age, message: '' };
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: string): boolean {
  return new Date(date) < new Date();
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: string): boolean {
  return new Date(date) > new Date();
}

// ============================================================================
// PASSWORD STRENGTH VALIDATION
// ============================================================================

export interface PasswordStrengthResult {
  score: number;
  isStrong: boolean;
  checks: {
    length: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial?: boolean;
  };
  message: string;
}

/**
 * Validate password strength with detailed feedback
 */
export function validatePasswordStrength(password: string, requireSpecial: boolean = false): PasswordStrengthResult {
  const checks = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: requireSpecial ? /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) : undefined,
  };
  
  const requiredChecks = requireSpecial ? 4 : 3;
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = passedChecks;
  const isStrong = score >= requiredChecks;
  
  let message = '';
  if (!checks.length) message = 'Password must be at least 8 characters';
  else if (!checks.hasUpper) message = 'Password must contain at least one uppercase letter';
  else if (!checks.hasLower) message = 'Password must contain at least one lowercase letter';
  else if (!checks.hasNumber) message = 'Password must contain at least one number';
  else if (requireSpecial && !checks.hasSpecial) message = 'Password must contain at least one special character';
  
  return { score, isStrong, checks, message };
}

// ============================================================================
// FORM DATA SANITIZATION
// ============================================================================

/**
 * Sanitize string by trimming and converting to lowercase (for emails)
 */
export function sanitizeEmail(email: string | undefined | null): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * Sanitize phone number by removing formatting
 */
export function sanitizePhoneNumber(phone: string | undefined | null): string {
  if (!phone) return '';
  return phone.replace(/\s+/g, ' ').trim();
}

/**
 * Sanitize name by trimming and capitalizing first letter of each word
 */
export function sanitizeName(name: string | undefined | null): string {
  if (!name) return '';
  return name
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generic form data sanitizer
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

// ============================================================================
// ZOD SCHEMA BUILDERS (for integration with existing Zod schemas)
// ============================================================================

/**
 * Create Zod email validator with detailed validation
 */
export const createEmailValidator = (fieldName: string = 'Email') => 
  z.string()
    .min(1, `${fieldName} is required`)
    .refine(
      (email) => validateEmailDetailed(email).isValid,
      (email) => ({ message: validateEmailDetailed(email).message })
    );

/**
 * Create Zod phone number validator with detailed validation
 */
export const createPhoneValidator = (fieldName: string = 'Phone number', optional: boolean = false) => {
  const validator = z.string()
    .refine(
      (phone) => validatePhoneNumberDetailed(phone).isValid,
      (phone) => ({ message: validatePhoneNumberDetailed(phone).message })
    );
  
  return optional ? validator.optional() : validator;
};

/**
 * Create Zod person name validator
 */
export const createPersonNameValidator = (fieldName: string = 'Name') =>
  z.string()
    .min(1, `${fieldName} is required`)
    .refine(
      (name) => validatePersonName(name, fieldName).isValid,
      (name) => ({ message: validatePersonName(name, fieldName).message })
    );

/**
 * Create Zod organization name validator
 */
export const createOrganizationNameValidator = (minLength: number = 2, maxLength: number = 100) =>
  z.string()
    .min(1, 'Organization name is required')
    .refine(
      (name) => validateOrganizationName(name, minLength, maxLength).isValid,
      (name) => ({ message: validateOrganizationName(name, minLength, maxLength).message })
    );

/**
 * Create Zod address validator
 */
export const createAddressValidator = (minLength: number = 10, maxLength: number = 250) =>
  z.string()
    .min(1, 'Address is required')
    .refine(
      (address) => validateAddress(address, minLength, maxLength).isValid,
      (address) => ({ message: validateAddress(address, minLength, maxLength).message })
    );

// Export all validation functions and types
export default {
  // Email
  validateEmailDetailed,
  sanitizeEmail,
  createEmailValidator,
  
  // Phone
  validatePhoneNumberDetailed,
  formatPhoneNumber,
  sanitizePhoneNumber,
  createPhoneValidator,
  
  // Names
  validatePersonName,
  validateOrganizationName,
  sanitizeName,
  createPersonNameValidator,
  createOrganizationNameValidator,
  
  // Address
  validateAddress,
  createAddressValidator,
  
  // Age and Dates
  validateAge,
  isPastDate,
  isFutureDate,
  
  // Password
  validatePasswordStrength,
  
  // Form Sanitization
  sanitizeFormData,
};
