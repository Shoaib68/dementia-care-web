import { useMutation } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { api } from '@/shared/lib/api';
import { EmailValidationResult, EmailValidationContext } from '@/shared/services/email-validation.service';

export interface EmailValidationState {
  isValidating: boolean;
  isValid: boolean | null;
  error: string | null;
  result: EmailValidationResult | null;
}

interface EmailValidationRequest {
  email: string;
  context?: EmailValidationContext;
}

/**
 * Shared hook for real-time email validation with debouncing
 * 
 * Works across all portals and user types with context-aware messaging:
 * - Hospital Admin: validating doctor emails
 * - Doctor: validating patient/caregiver emails
 * - Any authenticated user: generic validation
 * 
 * @param defaultContext - Default validation context ('doctor' | 'patient' | 'caregiver' | 'hospital_admin' | 'generic')
 * 
 * @example
 * ```tsx
 * // Hospital admin validating doctor email
 * const { validateEmail, isValid, isValidating } = useEmailValidation('doctor');
 * 
 * // Doctor validating patient email
 * const { validateEmail, isValid } = useEmailValidation('patient');
 * ```
 */
export function useEmailValidation(defaultContext: EmailValidationContext = 'generic') {
  const [validationState, setValidationState] = useState<EmailValidationState>({
    isValidating: false,
    isValid: null,
    error: null,
    result: null,
  });

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Mutation for email validation API call
  const validationMutation = useMutation({
    mutationFn: async (request: EmailValidationRequest): Promise<EmailValidationResult> => {
      const response = await api.post('/api/shared/validate-email', request);
      return response.data;
    },
    onMutate: () => {
      setValidationState({
        isValidating: true,
        isValid: null,
        error: null,
        result: null,
      });
    },
    onSuccess: (data: EmailValidationResult) => {
      setValidationState({
        isValidating: false,
        isValid: data.available,
        error: null,
        result: data,
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to validate email';
      setValidationState({
        isValidating: false,
        isValid: null,
        error: errorMessage,
        result: null,
      });
    },
  });

  /**
   * Validate email with debouncing to avoid excessive API calls
   * 
   * @param email - Email address to validate
   * @param debounceMs - Debounce delay in milliseconds (default: 500)
   * @param context - Validation context (defaults to hook's defaultContext)
   */
  const validateEmail = useCallback((
    email: string,
    debounceMs: number = 500,
    context?: EmailValidationContext
  ) => {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Reset state if email is empty
    if (!email || !email.trim()) {
      setValidationState({
        isValidating: false,
        isValid: null,
        error: null,
        result: null,
      });
      return;
    }

    // Basic format validation (client-side check before API call)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setValidationState({
        isValidating: false,
        isValid: false,
        error: 'Please enter a valid email address',
        result: {
          available: false,
          message: 'Please enter a valid email address',
        },
      });
      return;
    }

    // Set up debounced validation
    const timer = setTimeout(() => {
      validationMutation.mutate({
        email: email.toLowerCase().trim(),
        context: context || defaultContext,
      });
    }, debounceMs);

    setDebounceTimer(timer);
  }, [debounceTimer, validationMutation, defaultContext]);

  /**
   * Validate email immediately without debouncing
   * 
   * @param email - Email address to validate
   * @param context - Validation context (defaults to hook's defaultContext)
   */
  const validateEmailImmediate = useCallback((
    email: string,
    context?: EmailValidationContext
  ) => {
    validateEmail(email, 0, context);
  }, [validateEmail]);

  /**
   * Clear validation state
   */
  const clearValidation = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
    setValidationState({
      isValidating: false,
      isValid: null,
      error: null,
      result: null,
    });
  }, [debounceTimer]);

  /**
   * Check if email is ready for submission (valid and not validating)
   */
  const isEmailReady = useCallback(() => {
    return validationState.isValid === true && !validationState.isValidating;
  }, [validationState.isValid, validationState.isValidating]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    // State
    ...validationState,
    
    // Actions
    validateEmail,
    validateEmailImmediate,
    clearValidation,
    
    // Utilities
    isEmailReady,
    
    // Raw mutation for advanced use cases
    validationMutation,
  };
}

/**
 * Hook for validating multiple emails with different contexts (e.g., patient + caregiver)
 * 
 * @example
 * ```tsx
 * const {
 *   patient,
 *   caregiver,
 *   validatePatientEmail,
 *   validateCaregiverEmail,
 *   areAllEmailsReady
 * } = useMultiEmailValidation();
 * ```
 */
export function useMultiEmailValidation() {
  const patientValidation = useEmailValidation('patient');
  const caregiverValidation = useEmailValidation('caregiver');

  const validatePatientEmail = useCallback((email: string, debounceMs?: number) => {
    patientValidation.validateEmail(email, debounceMs);
  }, [patientValidation]);

  const validateCaregiverEmail = useCallback((email: string, debounceMs?: number) => {
    caregiverValidation.validateEmail(email, debounceMs);
  }, [caregiverValidation]);

  const clearAllValidations = useCallback(() => {
    patientValidation.clearValidation();
    caregiverValidation.clearValidation();
  }, [patientValidation, caregiverValidation]);

  const areAllEmailsReady = useCallback(() => {
    // Patient email is required, caregiver email is optional
    const patientReady = patientValidation.isEmailReady();
    const caregiverReady = !caregiverValidation.result || caregiverValidation.isEmailReady();
    
    return patientReady && caregiverReady;
  }, [patientValidation, caregiverValidation]);

  const hasAnyErrors = useCallback(() => {
    return !!(patientValidation.error || caregiverValidation.error);
  }, [patientValidation.error, caregiverValidation.error]);

  const isAnyValidating = useCallback(() => {
    return patientValidation.isValidating || caregiverValidation.isValidating;
  }, [patientValidation.isValidating, caregiverValidation.isValidating]);

  return {
    // Individual validations
    patient: patientValidation,
    caregiver: caregiverValidation,
    
    // Actions
    validatePatientEmail,
    validateCaregiverEmail,
    clearAllValidations,
    
    // Aggregate utilities
    areAllEmailsReady,
    hasAnyErrors,
    isAnyValidating,
  };
}

/**
 * Get validation status display text and color for UI
 * 
 * @param state - Email validation state
 * @returns Display information for the validation status
 */
export function getEmailValidationStatus(state: EmailValidationState) {
  if (state.isValidating) {
    return {
      text: 'Checking availability...',
      color: 'blue',
      icon: 'loading' as const,
    };
  }

  if (state.error) {
    return {
      text: state.error,
      color: 'red',
      icon: 'error' as const,
    };
  }

  if (state.result) {
    if (state.result.available) {
      return {
        text: state.result.message,
        color: 'green',
        icon: 'success' as const,
      };
    } else {
      return {
        text: state.result.message,
        color: 'red',
        icon: 'error' as const,
      };
    }
  }

  return null;
}
