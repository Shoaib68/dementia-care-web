"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '@/shared/store/authStore';
import { AuthContextType } from '@/features/auth/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, login, logout, setLoading } = useAuthStore();
  
  useEffect(() => {
    // Sync cookie with store state immediately - no artificial delay needed
    // Zustand persist with localStorage rehydrates synchronously
    if (user) {
      // Ensure cookie is set if we have a user in store but no cookie
      const cookieExists = document.cookie
        .split(';')
        .some(cookie => cookie.trim().startsWith('dementia-care-auth='));

      if (!cookieExists) {
        const expires = new Date(Date.now() + 7 * 864e5).toUTCString();
        document.cookie = `dementia-care-auth=${encodeURIComponent(JSON.stringify(user))}; expires=${expires}; path=/; SameSite=Strict`;
      }
    }
    setLoading(false);
  }, [user, setLoading]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRemoteLogout = () => {
      logout({ silent: true });
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'dementia-care-logout') {
        handleRemoteLogout();
      }

      if (event.key === 'dementia-auth-storage' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (!parsed?.state?.user) {
            handleRemoteLogout();
          }
        } catch (error) {
          console.error('Failed to parse auth storage update', error);
        }
      }
    };

    let channel: BroadcastChannel | null = null;

    try {
      channel = new BroadcastChannel('dementia-care-auth');
      const handleChannelMessage = (event: MessageEvent) => {
        if (event.data?.type === 'logout') {
          handleRemoteLogout();
        }
      };

      channel.addEventListener('message', handleChannelMessage);

      window.addEventListener('storage', handleStorage);

      return () => {
        window.removeEventListener('storage', handleStorage);
        channel?.removeEventListener('message', handleChannelMessage);
        channel?.close();
      };
    } catch (error) {
      window.addEventListener('storage', handleStorage);
      return () => {
        window.removeEventListener('storage', handleStorage);
      };
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    loading,
    login: async (email: string, password: string) => {
      const result = await login(email, password);
      return result.success;
    },
    logout: logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
