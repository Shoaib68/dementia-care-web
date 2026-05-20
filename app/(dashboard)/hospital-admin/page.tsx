"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HospitalAdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/hospital-admin/dashboard');
  }, [router]);

  // Brief redirect — show pulse skeleton instead of spinner
  return (
    <div className="space-y-6 animate-pulse p-6">
      <div className="h-10 bg-gray-200 rounded-lg w-1/3" />
      <div className="grid grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-48 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}
