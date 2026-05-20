"use client";

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';

// Portal-specific loading components
const PortalLoadingFallback = ({ portalName }: { portalName: string }) => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="text-center">
      <LoadingSpinner size="xl" />
      <p className="mt-4 text-gray-600">Loading {portalName} Portal...</p>
    </div>
  </div>
);

// Lazy-loaded portal layouts with portal-specific bundles
export const PortalLayouts = {
  SuperAdmin: dynamic(() => import('../../app/(dashboard)/super-admin/layout').then(mod => ({ default: mod.default })), {
    loading: () => <PortalLoadingFallback portalName="Super Admin" />,
    ssr: false
  }),
  
  HospitalAdmin: dynamic(() => import('../../app/(dashboard)/hospital-admin/layout').then(mod => ({ default: mod.default })), {
    loading: () => <PortalLoadingFallback portalName="Hospital Admin" />,
    ssr: false
  }),
  
  Doctor: dynamic(() => import('../../app/(dashboard)/doctor/layout').then(mod => ({ default: mod.default })), {
    loading: () => <PortalLoadingFallback portalName="Doctor" />,
    ssr: false
  })
};

// Lazy-loaded portal pages
export const PortalPages = {
  SuperAdmin: {
    Dashboard: dynamic(() => import('../../app/(dashboard)/super-admin/dashboard/page'), {
      loading: () => <PortalLoadingFallback portalName="Super Admin Dashboard" />,
      ssr: false
    }),
    Hospitals: dynamic(() => import('../../app/(dashboard)/super-admin/hospitals/page'), {
      loading: () => <PortalLoadingFallback portalName="Hospital Management" />,
      ssr: false
    }),
    Analytics: dynamic(() => import('../../app/(dashboard)/super-admin/analytics/page'), {
      loading: () => <PortalLoadingFallback portalName="System Analytics" />,
      ssr: false
    })
  },
  
  HospitalAdmin: {
    Dashboard: dynamic(() => import('../../app/(dashboard)/hospital-admin/dashboard/page'), {
      loading: () => <PortalLoadingFallback portalName="Hospital Dashboard" />,
      ssr: false
    }),
    Analytics: dynamic(() => import('../../app/(dashboard)/hospital-admin/analytics/page'), {
      loading: () => <PortalLoadingFallback portalName="Hospital Analytics" />,
      ssr: false
    }),
    Doctors: dynamic(() => import('../../app/(dashboard)/hospital-admin/doctors/page'), {
      loading: () => <PortalLoadingFallback portalName="Doctor Management" />,
      ssr: false
    }),
    Patients: dynamic(() => import('../../app/(dashboard)/hospital-admin/patients/page'), {
      loading: () => <PortalLoadingFallback portalName="Patient Management" />,
      ssr: false
    })
  },
  
  Doctor: {
    Dashboard: dynamic(() => import('../../app/(dashboard)/doctor/page'), {
      loading: () => <PortalLoadingFallback portalName="Doctor Dashboard" />,
      ssr: false
    }),
    Patients: dynamic(() => import('../../app/(dashboard)/doctor/patients/page'), {
      loading: () => <PortalLoadingFallback portalName="Patient List" />,
      ssr: false
    }),
    AddPatient: dynamic(() => import('../../app/(dashboard)/doctor/add-patient/page'), {
      loading: () => <PortalLoadingFallback portalName="Add Patient" />,
      ssr: false
    })
  }
};

// Route preloading utilities
export const preloadPortalRoutes = {
  superAdmin: () => {
    // Preload Super Admin routes
    const routes = [
      import('../../app/(dashboard)/super-admin/dashboard/page'),
      import('../../app/(dashboard)/super-admin/hospitals/page'),
      import('../../app/(dashboard)/super-admin/analytics/page')
    ];
    Promise.all(routes).catch(() => {}); // Silent fail
  },
  
  hospitalAdmin: () => {
    // Preload Hospital Admin routes
    const routes = [
      import('../../app/(dashboard)/hospital-admin/dashboard/page'),
      import('../../app/(dashboard)/hospital-admin/analytics/page'),
      import('../../app/(dashboard)/hospital-admin/doctors/page'),
      import('../../app/(dashboard)/hospital-admin/patients/page')
    ];
    Promise.all(routes).catch(() => {}); // Silent fail
  },
  
  doctor: () => {
    // Preload Doctor routes
    const routes = [
      import('../../app/(dashboard)/doctor/page'),
      import('../../app/(dashboard)/doctor/patients/page'),
      import('../../app/(dashboard)/doctor/add-patient/page')
    ];
    Promise.all(routes).catch(() => {}); // Silent fail
  }
};

// Progressive enhancement component
export const ProgressivePortalLoader = ({ 
  children, 
  portalType 
}: { 
  children: React.ReactNode; 
  portalType: 'superAdmin' | 'hospitalAdmin' | 'doctor';
}) => {
  React.useEffect(() => {
    // Preload routes for the current portal after component mounts
    const timer = setTimeout(() => {
      preloadPortalRoutes[portalType]();
    }, 1000); // Delay to not interfere with initial render

    return () => clearTimeout(timer);
  }, [portalType]);

  return (
    <Suspense fallback={<PortalLoadingFallback portalName="Portal" />}>
      {children}
    </Suspense>
  );
};