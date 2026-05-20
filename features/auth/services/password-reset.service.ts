import { supabase } from '@/shared/lib/supabase';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Password Reset Service
 * Handles forgot password and reset password operations using Supabase Auth
 */
export class PasswordResetService {
  /**
   * Send password reset email to user
   * This triggers Supabase to send an email with a reset link
   */
  static async sendPasswordResetEmail(
    request: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse> {
    try {
      const { email } = request;

      // Validate email format
      if (!email || !email.includes('@')) {
        return {
          success: false,
          message: 'Please enter a valid email address',
        };
      }

      // Send password reset email using Supabase
      // With custom email templates, we construct the link using {{ .TokenHash }} in the template.
      // Therefore, redirectTo is not required here.
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());

      if (error) {
        console.error('Password reset email error:', error);
        
        // Don't reveal whether the email exists or not for security
        // Always return success message
        return {
          success: true,
          message: 'If an account exists with this email, you will receive password reset instructions.',
        };
      }

      return {
        success: true,
        message: 'Password reset email sent! Please check your inbox and spam folder.',
      };
    } catch (error) {
      console.error('Unexpected error in sendPasswordResetEmail:', error);
      
      // Don't reveal internal errors to users
      return {
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions.',
      };
    }
  }

  /**
   * Update user password after clicking reset link
   * Uses the recovery session established from the email link
   */
  static async updatePassword(
    request: ResetPasswordRequest
  ): Promise<ResetPasswordResponse> {
    try {
      const { password } = request;

      // Validate password
      if (!password || password.length < 8) {
        return {
          success: false,
          message: 'Password must be at least 8 characters long',
        };
      }

      // Check if user has valid session from reset link
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        return {
          success: false,
          message: 'Invalid or expired reset link. Please request a new password reset email.',
        };
      }

      // Update password using Supabase - this works in recovery session
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes('same')) {
          return {
            success: false,
            message: 'New password must be different from your current password',
          };
        }
        
        if (error.message.includes('reauthentication')) {
          return {
            success: false,
            message: 'Session expired. Please click the reset link in your email again.',
          };
        }
        
        return {
          success: false,
          message: `Failed to update password: ${error.message}`,
        };
      }

      // Sign out after password reset for security
      // This ensures user must login with new password
      await supabase.auth.signOut();

      return {
        success: true,
        message: 'Password updated successfully! You can now log in with your new password.',
      };
    } catch (error) {
      console.error('Unexpected error in updatePassword:', error);
      return {
        success: false,
        message: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Verify if user has valid reset session
   */
  static async verifyResetSession(): Promise<{ valid: boolean; email?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return { valid: false };
      }

      return {
        valid: true,
        email: session.user?.email || undefined,
      };
    } catch (error) {
      console.error('Error verifying reset session:', error);
      return { valid: false };
    }
  }
}
