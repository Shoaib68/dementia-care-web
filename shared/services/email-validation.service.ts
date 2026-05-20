/**
 * Email Validation Service
 * 
 * @module email-validation.service
 * @description Unified email validation logic for all user types across the application
 * 
 * Features:
 * - Email format validation
 * - Database uniqueness checking
 * - Supabase Auth checking
 * - Context-aware error messages
 * - Smart email suggestions generation
 */

import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ApiError } from '@/shared/lib/api/api-server';

/**
 * Email validation result interface
 */
export interface EmailValidationResult {
  available: boolean;
  message: string;
  suggestions?: string[];
}

/**
 * Email validation context types
 */
export type EmailValidationContext = 'doctor' | 'patient' | 'caregiver' | 'hospital_admin' | 'generic';

/**
 * Email regex for format validation
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 * 
 * @param email - Email address to validate
 * @returns True if format is valid
 */
export function isValidEmailFormat(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Normalize email address (lowercase and trim)
 * 
 * @param email - Email address to normalize
 * @returns Normalized email address
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Check if email exists in the database
 * 
 * @param email - Normalized email address
 * @param context - Validation context for appropriate messaging
 * @returns Email validation result
 */
export async function validateEmailAvailability(
  email: string,
  context: EmailValidationContext = 'generic'
): Promise<EmailValidationResult> {
  const normalizedEmail = normalizeEmail(email);
  
  // Validate format first
  if (!isValidEmailFormat(normalizedEmail)) {
    return {
      available: false,
      message: 'Please enter a valid email address',
    };
  }
  
  try {
    // Check database for existing user
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, user_type')
      .eq('email', normalizedEmail)
      .maybeSingle();
    
    if (userError) {
      throw new ApiError(
        'Failed to check email availability',
        500,
        'EMAIL_CHECK_FAILED'
      );
    }
    
    if (existingUser) {
      const message = getContextualErrorMessage(existingUser.user_type, context);
      return {
        available: false,
        message,
        suggestions: generateEmailSuggestions(normalizedEmail, context),
      };
    }
    
    // Optional: Check Supabase Auth for pending/deleted users
    // This is more thorough but slower - only enable if needed
    if (context === 'patient' || context === 'caregiver') {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (!authError && authUsers) {
        const authUser = authUsers.users.find(user => user.email === normalizedEmail);
        if (authUser) {
          return {
            available: false,
            message: 'This email is already associated with an account',
            suggestions: generateEmailSuggestions(normalizedEmail, context),
          };
        }
      }
    }
    
    // Email is available
    return {
      available: true,
      message: 'Email address is available',
    };
    
  } catch (error) {
    console.error('Error validating email:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      'Failed to validate email availability',
      500,
      'EMAIL_VALIDATION_ERROR'
    );
  }
}

/**
 * Generate contextual error message based on existing user type
 * 
 * @param existingUserType - User type of existing user
 * @param context - Validation context
 * @returns Appropriate error message
 */
function getContextualErrorMessage(existingUserType: string, context: EmailValidationContext): string {
  // Context-specific messages
  if (context === 'doctor' && existingUserType === 'doctor') {
    return 'This email is already registered to another doctor';
  }
  
  if (context === 'patient' && existingUserType === 'patient') {
    return 'This email is already registered to a patient account';
  }
  
  if (context === 'caregiver' && existingUserType === 'caregiver') {
    return 'This email is already registered to a caregiver account';
  }
  
  // Generic messages by user type
  switch (existingUserType) {
    case 'doctor':
      return 'This email is already registered to a doctor account';
    case 'patient':
      return 'This email is already registered to a patient account';
    case 'caregiver':
      return 'This email is already registered to a caregiver account';
    case 'hospital_admin':
      return 'This email is already registered to a hospital administrator';
    case 'super_admin':
      return 'This email is already registered to a system administrator';
    default:
      return 'This email address is already registered in the system';
  }
}

/**
 * Generate email suggestions when the requested email is unavailable
 * 
 * @param email - Normalized email address
 * @param context - Validation context for contextual suggestions
 * @returns Array of suggested alternative emails
 */
function generateEmailSuggestions(email: string, context: EmailValidationContext): string[] {
  const suggestions: string[] = [];
  const [localPart, domain] = email.split('@');
  
  if (!localPart || !domain) {
    return suggestions;
  }
  
  // Generate numeric variations (1-3)
  for (let i = 1; i <= 3; i++) {
    suggestions.push(`${localPart}${i}@${domain}`);
  }
  
  // Context-specific suffixes
  let suffixes: string[] = [];
  
  switch (context) {
    case 'doctor':
      suffixes = ['dr', 'doc', 'md'];
      break;
    case 'patient':
      suffixes = ['care', 'patient', 'user'];
      break;
    case 'caregiver':
      suffixes = ['care', 'caregiver', 'family'];
      break;
    case 'hospital_admin':
      suffixes = ['admin', 'manager', 'staff'];
      break;
    default:
      suffixes = ['user', 'account', 'new'];
  }
  
  // Generate variations with context-specific suffixes
  suffixes.forEach(suffix => {
    suggestions.push(`${localPart}.${suffix}@${domain}`);
    if (context === 'doctor') {
      suggestions.push(`${suffix}.${localPart}@${domain}`);
    }
  });
  
  // If domain is not gmail.com, suggest gmail alternatives
  if (domain !== 'gmail.com') {
    suggestions.push(`${localPart}@gmail.com`);
    if (context === 'doctor') {
      suggestions.push(`dr.${localPart}@gmail.com`);
    }
  }
  
  // Return max 5 suggestions, ensuring uniqueness
  return [...new Set(suggestions)].slice(0, 5);
}

/**
 * Bulk email validation for multiple emails
 * 
 * @param emails - Array of email addresses with their contexts
 * @returns Array of validation results
 */
export async function validateMultipleEmails(
  emails: Array<{ email: string; context: EmailValidationContext }>
): Promise<EmailValidationResult[]> {
  const validationPromises = emails.map(({ email, context }) =>
    validateEmailAvailability(email, context)
  );
  
  return Promise.all(validationPromises);
}
