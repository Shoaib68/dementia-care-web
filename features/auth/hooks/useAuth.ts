import { useAuthStore } from "@/shared/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthError, AuthErrorType } from "@/features/auth/types";

export const useAuth = () => {
  const { 
    user, 
    loading, 
    initialized,
    authError,
    login, 
    logout, 
    initialize,
    clearAuthError
  } = useAuthStore();
  const router = useRouter();

  // Initialize auth on mount
  useEffect(() => {
    if (!initialized) {
      initialize();
    }
  }, [initialized, initialize]);

  const handleLogin = async (email: string, password: string): Promise<{ success: boolean; error?: AuthError }> => {
    // Clear any previous auth errors before attempting login
    clearAuthError();
    const result = await login(email, password);
    return result;
  };

  /**
   * Get user-friendly error message based on error type
   */
  const getErrorMessage = (error: AuthError | null): string => {
    if (!error) return '';
    
    switch (error.type) {
      case AuthErrorType.EMAIL_NOT_FOUND:
        return 'Email address not found in our system';
      case AuthErrorType.INCORRECT_PASSWORD:
        return 'Incorrect password. Please try again.';
      case AuthErrorType.VALIDATION_ERROR:
        return error.message || 'Please check your input and try again';
      case AuthErrorType.ACCOUNT_DISABLED:
        return 'Your account is not active. Please contact support.';
      case AuthErrorType.TOO_MANY_ATTEMPTS:
        return 'Too many login attempts. Please try again later.';
      case AuthErrorType.NETWORK_ERROR:
        return 'Network error. Please check your connection and try again.';
      case AuthErrorType.INVALID_CREDENTIALS:
      case AuthErrorType.UNKNOWN_ERROR:
      default:
        return 'Invalid email or password';
    }
  };

  /**
   * Check if error is field-specific
   */
  const isFieldError = (field: 'email' | 'password'): boolean => {
    return authError?.field === field;
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error in useAuth:', error);
      // Force redirect to login even if logout fails
      router.push('/login');
    }
  };

  const redirectToDashboard = () => {
    if (!user) return;
    
    switch (user.user_type) {
      case 'super_admin':
        router.push('/super-admin');
        break;
      case 'hospital_admin':
        router.push('/hospital-admin');
        break;
      case 'doctor':
        router.push('/doctor');
        break;
      default:
        router.push('/login');
    }
  };

  return {
    user,
    loading,
    initialized,
    authError,
    login: handleLogin,
    logout: handleLogout,
    redirectToDashboard,
    clearAuthError,
    getErrorMessage,
    isFieldError,
  };
};
