import { useMutation } from '@tanstack/react-query';
import { 
  PasswordResetService, 
  ForgotPasswordRequest, 
  ResetPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordResponse 
} from '../services/password-reset.service';

/**
 * Hook for sending password reset email
 * Used on /forgot-password page
 */
export function useForgotPassword() {
  return useMutation<ForgotPasswordResponse, Error, ForgotPasswordRequest>({
    mutationFn: async (request: ForgotPasswordRequest) => {
      return await PasswordResetService.sendPasswordResetEmail(request);
    },
    onSuccess: (data) => {
      if (!data.success) {
        console.error('Failed to send password reset email:', data.message);
      }
    },
    onError: (error) => {
      console.error('Error sending password reset email:', error);
    },
  });
}

/**
 * Hook for updating password after clicking reset link
 * Used on /reset-password page
 */
export function useResetPassword() {
  return useMutation<ResetPasswordResponse, Error, ResetPasswordRequest>({
    mutationFn: async (request: ResetPasswordRequest) => {
      return await PasswordResetService.updatePassword(request);
    },
    onSuccess: (data) => {
      if (!data.success) {
        console.error('Failed to update password:', data.message);
      }
    },
    onError: (error) => {
      console.error('Error updating password:', error);
    },
  });
}

/**
 * Hook to verify if user has valid reset session
 * Used on /reset-password page to check link validity
 */
export async function verifyResetSession() {
  return await PasswordResetService.verifyResetSession();
}
