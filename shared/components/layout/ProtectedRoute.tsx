"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { WebPortalRole } from '@/features/auth/types';
import { Logo } from '@/shared/components/ui/Logo';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: WebPortalRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();


  useEffect(() => {
    // Only proceed once auth is initialized
    if (!initialized || loading) {
      return;
    }
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (!allowedRoles.includes(user.user_type as WebPortalRole)) {
      // Redirect based on user role
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
      return;
    }
  }, [user, loading, initialized, allowedRoles, router]);

  // Show loading during initialization
  if (!initialized || (loading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <Logo width={200} height={250} className="drop-shadow-lg" priority />
        </motion.div>
      </div>
    );
  }

  // After initialization, check if user exists and has proper role
  if (!user || !allowedRoles.includes(user.user_type as WebPortalRole)) {
    return null;
  }

  return <>{children}</>;
};
