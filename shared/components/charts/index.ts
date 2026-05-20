import dynamic from 'next/dynamic';
import React from 'react';
import { ChartSkeleton } from '@/shared/components/ui/chart-skeleton-enhanced';

// Super Admin Charts - Dynamically imported for better performance
export const HospitalPerformanceChart = dynamic(
  () => import('./hospital-performance-chart').then(mod => ({ default: mod.HospitalPerformanceChart })),
  { 
    loading: () => React.createElement(ChartSkeleton, { height: 'h-80' }),
    ssr: false // Charts don't need SSR
  }
);

export const PatientDistributionChart = dynamic(
  () => import('./patient-distribution-chart').then(mod => ({ default: mod.PatientDistributionChart })),
  { 
    loading: () => React.createElement(ChartSkeleton, { height: 'h-80' }),
    ssr: false
  }
);

export const SystemGrowthChart = dynamic(
  () => import('./system-growth-chart').then(mod => ({ default: mod.SystemGrowthChart })),
  { 
    loading: () => React.createElement(ChartSkeleton, { height: 'h-96' }),
    ssr: false
  }
);

export const TopHospitalsChart = dynamic(
  () => import('./top-hospitals-chart').then(mod => ({ default: mod.TopHospitalsChart })),
  { 
    loading: () => React.createElement(ChartSkeleton, { height: 'h-80' }),
    ssr: false
  }
);

export const DementiaStagesChart = dynamic(
  () => import('./dementia-stages-chart').then(mod => ({ default: mod.DementiaStagesChart })),
  { 
    loading: () => React.createElement(ChartSkeleton, { height: 'h-80' }),
    ssr: false
  }
);

export const SystemHealthChart = dynamic(
  () => import('./system-health-chart').then(mod => ({ default: mod.SystemHealthChart })),
  { 
    loading: () => React.createElement(ChartSkeleton, { height: 'h-80' }),
    ssr: false
  }
);

// Hospital Admin Analytics Charts - Dynamically imported
export const DoctorPerformanceChart = dynamic(
  () => import('./doctor-performance-chart').then(mod => ({ default: mod.DoctorPerformanceChart })),
  { 
    loading: () => React.createElement(ChartSkeleton, { height: 'h-80' }),
    ssr: false
  }
);

export const DepartmentDistributionChart = dynamic(
  () => import('./department-distribution-chart').then(mod => ({ default: mod.DepartmentDistributionChart })),
  { 
    loading: () => React.createElement(ChartSkeleton, { height: 'h-80' }),
    ssr: false
  }
);

export const HospitalActivityChart = dynamic(
  () => import('./hospital-activity-chart').then(mod => ({ default: mod.HospitalActivityChart })),
  { 
    loading: () => React.createElement(ChartSkeleton, { height: 'h-96' }),
    ssr: false
  }
);

export const TopDoctorsChart = dynamic(
  () => import('./top-doctors-chart').then(mod => ({ default: mod.TopDoctorsChart })),
  { 
    loading: () => React.createElement(ChartSkeleton, { height: 'h-80' }),
    ssr: false
  }
);
