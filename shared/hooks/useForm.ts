"use client";

import { useForm as useReactHookForm, UseFormProps, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { sanitizeFormData, validateSchema, ValidationResult } from '@/shared/lib/validation';

export interface UseFormConfig<T = any> extends UseFormProps<T> {
  schema?: z.ZodSchema<T>;
  sanitize?: boolean;
  onSubmit?: (data: T) => void | Promise<void>;
  onError?: (errors: Record<string, any>) => void;
}

export interface FormState<T = any> {
  isValid: boolean;
  isSubmitting: boolean;
  errors: Record<string, any>;
  values: T;
  isDirty: boolean;
  isSubmitted: boolean;
}

/**
 * Enhanced useForm hook that wraps react-hook-form with:
 * - Zod schema validation
 * - Automatic form sanitization
 * - Consistent error handling
 * - TypeScript support
 */
export function useForm<T = any>(config: UseFormConfig<T> = {}): UseFormReturn<T> & {
  submitForm: (onSubmit: (data: T) => void | Promise<void>) => void;
  validateField: (fieldName: string, value: any) => string | undefined;
  setFieldError: (fieldName: string, message: string) => void;
  clearErrors: () => void;
  getFormState: () => FormState<T>;
} {
  const {
    schema,
    sanitize = true,
    onSubmit,
    onError,
    defaultValues,
    mode = 'onChange',
    ...formOptions
  } = config;

  // Setup react-hook-form with Zod resolver if schema provided
  const form = useReactHookForm<T>({
    ...formOptions,
    defaultValues,
    mode,
    resolver: schema ? zodResolver(schema) : undefined,
  });

  const {
    handleSubmit,
    setError,
    clearErrors: clearFormErrors,
    formState: { errors, isSubmitting, isValid, isDirty, isSubmitted },
    getValues,
    trigger,
  } = form;

  /**
   * Submit form with error handling
   */
  const submitForm = (submitHandler: (data: T) => void | Promise<void>) => {
    return handleSubmit(
      async (data: T) => {
        try {
          // Sanitize data if enabled
          const processedData = sanitize ? sanitizeFormData(data) : data;
          
          // Additional schema validation if provided
          if (schema) {
            const validation = validateSchema(schema, processedData);
            if (!validation.success) {
              // Set form errors from validation
              Object.entries(validation.errors || {}).forEach(([field, message]) => {
                setError(field as any, { message });
              });
              onError?.(validation.errors || {});
              return;
            }
          }

          await submitHandler(processedData);
        } catch (error: any) {
          // Handle submission errors
          const errorMessage = error.message || 'An error occurred during submission';
          setError('root' as any, { message: errorMessage });
          onError?.({ root: errorMessage });
        }
      },
      (errors) => {
        // Handle validation errors
        onError?.(errors);
      }
    );
  };

  /**
   * Validate individual field
   */
  const validateField = (fieldName: string, value: any): string | undefined => {
    if (!schema) return undefined;

    try {
      // Create a partial validation for the field
      const fieldSchema = schema.shape?.[fieldName as keyof typeof schema.shape];
      if (fieldSchema) {
        fieldSchema.parse(value);
      }
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message;
      }
      return 'Invalid value';
    }
  };

  /**
   * Set error for specific field
   */
  const setFieldError = (fieldName: string, message: string) => {
    setError(fieldName as any, { message });
  };

  /**
   * Clear all form errors
   */
  const clearErrors = () => {
    clearFormErrors();
  };

  /**
   * Get current form state
   */
  const getFormState = (): FormState<T> => ({
    isValid,
    isSubmitting,
    errors,
    values: getValues(),
    isDirty,
    isSubmitted,
  });

  return {
    ...form,
    submitForm,
    validateField,
    setFieldError,
    clearErrors,
    getFormState,
  };
}

/**
 * Hook for handling async form submissions with loading states
 */
export function useAsyncForm<T = any>(
  config: UseFormConfig<T> & {
    onSubmit: (data: T) => Promise<void>;
  }
) {
  const form = useForm(config);
  const { submitForm } = form;

  const handleAsyncSubmit = () => {
    return submitForm(config.onSubmit);
  };

  return {
    ...form,
    handleAsyncSubmit,
  };
}

/**
 * Hook for multi-step forms
 */
export function useMultiStepForm<T = any>(
  steps: Array<{
    name: string;
    schema?: z.ZodSchema<any>;
    component: React.ComponentType<any>;
  }>,
  config: UseFormConfig<T> = {}
) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const form = useForm({
    ...config,
    mode: 'onChange',
  });

  const { trigger, getValues } = form;

  const nextStep = async () => {
    const currentStepConfig = steps[currentStep];
    
    // Validate current step if schema provided
    if (currentStepConfig.schema) {
      const isStepValid = await trigger();
      if (!isStepValid) {
        return false;
      }
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      return true;
    }
    
    return false;
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepConfig = steps[currentStep];

  return {
    ...form,
    currentStep,
    currentStepConfig,
    isFirstStep,
    isLastStep,
    nextStep,
    previousStep,
    goToStep,
    totalSteps: steps.length,
    progress: ((currentStep + 1) / steps.length) * 100,
  };
}

export default useForm;
