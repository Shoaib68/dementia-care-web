import { useMutation } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { api } from '@/shared/lib/api';

export interface EmailValidationResult {
  available: boolean;
  message: string;
  suggestions?: string[];
}

export interface EmailValidationState {
  isValidating: boolean;
  isValid: boolean | null;
  error: string | null;
  result: EmailValidationResult | null;
}

interface EmailValidationRequest {
  email: string;
}

/**
 * Custom hook for real-time email validation with debouncing
 * Validates patient email addresses against existing users in the system
 */
export function useEmailValidation() {
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
      const response = await api.post('/api/doctor/validate-patient-email', request);
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
   */
  const validateEmail = useCallback((email: string, debounceMs: number = 500) => {
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

    // Basic format validation
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
      validationMutation.mutate({ email: email.toLowerCase().trim() });
    }, debounceMs);

    setDebounceTimer(timer);
  }, [debounceTimer, validationMutation]);

  /**
   * Validate email immediately without debouncing
   */
  const validateEmailImmediate = useCallback((email: string) => {
    validateEmail(email, 0);
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
 * Hook for validating multiple emails (e.g., patient + caregiver)
 */
export function useMultiEmailValidation() {
  const patientValidation = useEmailValidation();
  const caregiverValidation = useEmailValidation();

  const validatePatientEmail = useCallback((email: string) => {
    patientValidation.validateEmail(email);
  }, [patientValidation]);

  const validateCaregiverEmail = useCallback((email: string) => {
    caregiverValidation.validateEmail(email);
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