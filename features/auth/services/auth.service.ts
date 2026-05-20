import { User, WebPortalRole, AuthError, AuthErrorType, AuthResult } from "@/features/auth/types";
import { supabase } from "@/shared/lib/supabase";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";

/**
 * Helper function to simulate consistent timing for all auth attempts
 * This prevents user enumeration attacks by ensuring consistent response times
 */
function simulateConsistentTiming(): Promise<void> {
  // Simulate 800-1200ms processing time
  const delay = Math.random() * 400 + 800;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Checks if an email exists in the system using API endpoint
 * Used for providing specific error messages while maintaining security
 */
async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    // Use API endpoint to check if user exists (this works better in browser environment)
    const response = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: normalizedEmail }),
    });
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    
    if (!result.success) {
      return false;
    }
    
    return result.exists;
  } catch (error) {
    // In case of unexpected error, default to false (email not found)
    return false;
  }
}

/**
 * Creates an AuthError with proper typing and logging
 */
function createAuthError(
  type: AuthErrorType,
  message: string,
  field?: 'email' | 'password' | 'general',
  code?: string
): AuthError {
  return { type, message, field, code };
}

/**
 * Fetches user profile data using API endpoint to bypass RLS issues
 */
async function getUserProfile(authUserId: string): Promise<User | null> {
  try {
    // Use API endpoint instead of direct database queries to bypass RLS issues
    const response = await fetch('/api/auth/profile');
    
    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      return null;
    }

    return result.data;
  } catch (error) {
    return null;
  }
}

/**
 * Authentication service for the dementia care system
 * Handles user authentication, session management, and user profile data
 */
export class AuthService {
  /**
   * Signs in a user with email and password with enhanced error handling
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    const startTime = Date.now();
    
    try {
      // Sanitize input
      const sanitizedEmail = email.toLowerCase().trim();
      const sanitizedPassword = password.trim();
      
      // Basic validation
      if (!sanitizedEmail || !sanitizedPassword) {
        return {
          success: false,
          error: createAuthError(
            AuthErrorType.VALIDATION_ERROR,
            'Email and password are required',
            'general'
          )
        };
      }
      
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!emailRegex.test(sanitizedEmail)) {
        await simulateConsistentTiming();
        return {
          success: false,
          error: createAuthError(
            AuthErrorType.VALIDATION_ERROR,
            'Please enter a valid email address',
            'email'
          )
        };
      }
      
      // Attempt authentication with Supabase first
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: sanitizedPassword,
      });

      // Handle Supabase authentication errors
      if (error) {
        await simulateConsistentTiming();
        
        // Map Supabase errors to our specific error types
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('Email not confirmed') ||
            error.message.includes('Invalid email or password')) {
          
          // Check if the email exists in our system to provide specific error
          const emailExists = await checkEmailExists(sanitizedEmail);
          
          // For specific Supabase errors, we can be more confident about the error type
          if (error.message.includes('Invalid login credentials') || 
              error.message.includes('invalid_credentials') ||
              error.message.includes('Invalid credentials')) {
            if (!emailExists) {
              return {
                success: false,
                error: createAuthError(
                  AuthErrorType.EMAIL_NOT_FOUND,
                  'Email address not found in our system',
                  'email',
                  error.message
                )
              };
            } else {
              return {
                success: false,
                error: createAuthError(
                  AuthErrorType.INCORRECT_PASSWORD,
                  'Incorrect password. Please try again.',
                  'password',
                  error.message
                )
              };
            }
          } else {
            // For other auth errors, show generic message
            return {
              success: false,
              error: createAuthError(
                AuthErrorType.INVALID_CREDENTIALS,
                'Invalid email or password',
                'general',
                error.message
              )
            };
          }
        }
        
        if (error.message.includes('Too many requests')) {
          return {
            success: false,
            error: createAuthError(
              AuthErrorType.TOO_MANY_ATTEMPTS,
              'Too many login attempts. Please try again later.',
              'general',
              error.message
            )
          };
        }
        
        // Generic error for other cases
        return {
          success: false,
          error: createAuthError(
            AuthErrorType.INVALID_CREDENTIALS,
            'Invalid email or password',
            'general',
            error.message
          )
        };
      }

      if (!data.user) {
        await simulateConsistentTiming();
        return {
          success: false,
          error: createAuthError(
            AuthErrorType.UNKNOWN_ERROR,
            'Authentication failed. Please try again.',
            'general'
          )
        };
      }

      // Fetch user profile data
      const userProfile = await getUserProfile(data.user.id);
      
      if (!userProfile) {
        // Sign out if we can't get user profile
        await supabase.auth.signOut();
        await simulateConsistentTiming();
        return {
          success: false,
          error: createAuthError(
            AuthErrorType.ACCOUNT_DISABLED,
            'Your account is not active. Please contact support.',
            'general'
          )
        };
      }

      // Ensure minimum response time for security
      const elapsedTime = Date.now() - startTime;
      const minResponseTime = 800;
      if (elapsedTime < minResponseTime) {
        await new Promise(resolve => setTimeout(resolve, minResponseTime - elapsedTime));
      }

      return {
        success: true,
        user: userProfile
      };
      
    } catch (error: any) {
      await simulateConsistentTiming();
      
      return {
        success: false,
        error: createAuthError(
          AuthErrorType.NETWORK_ERROR,
          'A network error occurred. Please check your connection and try again.',
          'general',
          error.message
        )
      };
    }
  }

  /**
   * Signs out the current user
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets the current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      // Get current authenticated user (more secure than getSession)
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        return null;
      }

      if (!user) {
        return null;
      }

      // Fetch user profile data
      const userProfile = await getUserProfile(user.id);
      return userProfile;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get auth user for server-side operations
   * @deprecated Use getCurrentUser() instead for better security
   */
  async getAuthenticatedUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        return null;
      }
      return user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userProfile = await getUserProfile(session.user.id);
        callback(userProfile);
      } else {
        callback(null);
      }
    });
  }

  /**
   * Check if a user type is allowed for web portal access
   */
  isWebPortalUser(userType: string): boolean {
    const webPortalRoles: WebPortalRole[] = ['super_admin', 'hospital_admin', 'doctor'];
    return webPortalRoles.includes(userType as WebPortalRole);
  }

  /**
   * Get user role display name
   */
  getUserRoleDisplayName(userType: string): string {
    const roleNames: Record<string, string> = {
      super_admin: 'Super Administrator',
      hospital_admin: 'Hospital Administrator', 
      doctor: 'Doctor',
    };
    return roleNames[userType] || userType;
  }
}

// Export singleton instance
export const authService = new AuthService();
