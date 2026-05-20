import { useMutation } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { api } from '@/shared/lib/api';

export interface DoctorEmailValidationResult {
  available: boolean;
  message: string;
  suggestions?: string[];
}

export interface DoctorEmailValidationState {
  isValidating: boolean;
  isValid: boolean | null;
  error: string | null;
  result: DoctorEmailValidationResult | null;
}

interface DoctorEmailValidationRequest {
  email: string;
}

/**
 * Custom hook for real-time doctor email validation with debouncing
 * Validates doctor email addresses against existing users in the system
 */
export function useDoctorEmailValidation() {
  const [validationState, setValidationState] = useState<DoctorEmailValidationState>({
    isValidating: false,
    isValid: null,
    error: null,
    result: null,
  });

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Mutation for email validation API call
  const validationMutation = useMutation({
    mutationFn: async (request: DoctorEmailValidationRequest): Promise<DoctorEmailValidationResult> => {
      const response = await api.post('/api/hospital-admin/validate-doctor-email', request);
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
    onSuccess: (data: DoctorEmailValidationResult) => {
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
 * Get validation status display text and color
 */
export function getEmailValidationStatus(state: DoctorEmailValidationState) {
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