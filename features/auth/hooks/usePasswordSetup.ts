import { useMutation } from '@tanstack/react-query';
import { PasswordSetupService, PasswordSetupRequest } from '../services/password-setup.service';

/**
 * React Query hook for password setup
 * Used on the /setup-password page for invited users
 */
export function usePasswordSetup() {
  return useMutation({
    mutationFn: async (request: PasswordSetupRequest) => {
      const response = await PasswordSetupService.setupPassword(request);
      
      if (!response.success) {
        throw new Error(response.message);
      }
      
      return response;
    },
    onError: (error) => {
      console.error('Password setup mutation error:', error);
    },
    onSuccess: (data) => {
      console.log('Password setup successful:', data.message);
    }
  });
}
