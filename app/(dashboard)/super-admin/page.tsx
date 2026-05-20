"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';

export default function SuperAdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/super-admin/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  );
}
