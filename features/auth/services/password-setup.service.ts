import { supabase } from '@/shared/lib/supabase';

export interface PasswordSetupRequest {
  token: string;
  password: string;
}

export interface PasswordSetupResponse {
  success: boolean;
  message: string;
}

/**
 * Password Setup Service
 * Handles password setup for invited users via email tokens
 */
export class PasswordSetupService {
  /**
   * Setup password for user with invitation token
   */
  static async setupPassword(request: PasswordSetupRequest): Promise<PasswordSetupResponse> {
    try {
      const { password } = request;

      // Validate input
      if (!password) {
        throw new Error('Password is required');
      }

      // Validate password strength
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Check if user is authenticated (they should be auto-logged in from email link)
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session) {
        throw new Error('No active session found. Please click the invitation link from your email again.');
      }

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        throw new Error('Failed to set password. Please try again or request a new invitation link.');
      }

      // Sign out after password is set so user can login with new credentials
      await supabase.auth.signOut();

      return {
        success: true,
        message: 'Password set successfully! You can now login with your credentials.'
      };
    } catch (error) {
      console.error('Password setup error:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to setup password'
      };
    }
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default PasswordSetupService;
