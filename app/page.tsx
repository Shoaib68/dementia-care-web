"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Logo } from '@/shared/components/ui/Logo';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth state to finish loading before making redirect decisions
    if (loading) return;
    
    if (user) {
      // Redirect to appropriate dashboard based on role
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
    } else {
      router.push('/login');
    }
  }, [user, loading, router]);

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
