import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, AuthError, AuthErrorType } from "@/features/auth/types";
import { authService } from "@/features/auth/services";

// Helper functions for cookie management
const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document !== 'undefined') {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
  }
};

const LOGOUT_CHANNEL = 'dementia-care-auth';
const LOGOUT_EVENT_KEY = 'dementia-care-logout';

const broadcastLogout = () => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(LOGOUT_EVENT_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to write logout marker to storage', error);
  }

  try {
    const channel = new BroadcastChannel(LOGOUT_CHANNEL);
    channel.postMessage({ type: 'logout', timestamp: Date.now() });
    channel.close();
  } catch (error) {
    // Swallow errors in environments without BroadcastChannel support
  }
};

const deleteCookie = (name: string) => {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
};

type AuthState = {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  authError: AuthError | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setAuthError: (error: AuthError | null) => void;
  clearAuthError: () => void;
  logout: (options?: { silent?: boolean }) => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: AuthError }>;
  initialize: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()((
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      initialized: false,
      authError: null,
      setUser: (user) => {
        set({ user, loading: false, authError: null });
        // Synchronize with cookies for middleware
        if (user) {
          setCookie('dementia-care-auth', JSON.stringify(user));
        } else {
          deleteCookie('dementia-care-auth');
        }
      },
      setLoading: (loading) => set({ loading }),
      setAuthError: (error) => set({ authError: error, loading: false }),
      clearAuthError: () => set({ authError: null }),
      
      login: async (email: string, password: string) => {
        set({ loading: true, authError: null });
        try {
          const result = await authService.signIn(email, password);
          
          if (!result.success && result.error) {
            get().setAuthError(result.error);
            return { success: false, error: result.error };
          }
          
          if (result.success && result.user) {
            get().setUser(result.user);
            return { success: true };
          }
          
          // Fallback error if no user returned but no specific error
          const fallbackError: AuthError = {
            type: AuthErrorType.UNKNOWN_ERROR,
            message: 'Login failed. Please try again.',
            field: 'general'
          };
          get().setAuthError(fallbackError);
          return { success: false, error: fallbackError };
        } catch (error: any) {
          const networkError: AuthError = {
            type: AuthErrorType.NETWORK_ERROR,
            message: 'A network error occurred. Please try again.',
            field: 'general'
          };
          get().setAuthError(networkError);
          return { success: false, error: networkError };
        }
      },
      
      logout: async (options) => {
        try {
          // Don't set loading to true during logout to prevent UI blocking
          await authService.signOut();
          set({ user: null, loading: false, authError: null });
          deleteCookie('dementia-care-auth');

          if (!options?.silent) {
            broadcastLogout();
          }
        } catch (error) {
          console.error('Logout error:', error);
          // Force logout even if there's an error
          set({ user: null, loading: false, authError: null });
          deleteCookie('dementia-care-auth');

          if (!options?.silent) {
            broadcastLogout();
          }
        }
      },
      
      initialize: async () => {
        if (get().initialized) return;
        
        set({ loading: true, authError: null });
        try {
          const user = await authService.getCurrentUser();
          set({ user, loading: false, initialized: true, authError: null });
          
          // Synchronize with cookies for middleware
          if (user) {
            setCookie('dementia-care-auth', JSON.stringify(user));
          } else {
            deleteCookie('dementia-care-auth');
          }
          
          // Set up auth state listener
          authService.onAuthStateChange((user) => {
            get().setUser(user);
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ user: null, loading: false, initialized: true, authError: null });
          deleteCookie('dementia-care-auth');
        }
      },
    }),
    {
      name: "dementia-auth-storage",
      partialize: (state) => ({ user: state.user }),
    }
  )
));
