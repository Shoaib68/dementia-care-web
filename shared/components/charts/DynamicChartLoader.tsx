"use client";

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';

// Dynamic imports for all chart components to reduce initial bundle size
export const HospitalPerformanceChart = dynamic(() => import('./hospital-performance-chart'), {
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-white rounded-lg border">
      <LoadingSpinner size="lg" />
    </div>
  ),
  ssr: false
});

export const PatientDistributionChart = dynamic(() => import('./patient-distribution-chart'), {
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-white rounded-lg border">
      <LoadingSpinner size="lg" />
    </div>
  ),
  ssr: false
});

export const SystemGrowthChart = dynamic(() => import('./system-growth-chart'), {
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-white rounded-lg border">
      <LoadingSpinner size="lg" />
    </div>
  ),
  ssr: false
});

export const TopHospitalsChart = dynamic(() => import('./top-hospitals-chart'), {
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-white rounded-lg border">
      <LoadingSpinner size="lg" />
    </div>
  ),
  ssr: false
});

export const DementiaStagesChart = dynamic(() => import('./dementia-stages-chart'), {
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-white rounded-lg border">
      <LoadingSpinner size="lg" />
    </div>
  ),
  ssr: false
});

export const SystemHealthChart = dynamic(() => import('./system-health-chart'), {
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-white rounded-lg border">
      <LoadingSpinner size="lg" />
    </div>
  ),
  ssr: false
});

export const DoctorPerformanceChart = dynamic(() => import('./doctor-performance-chart'), {
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-white rounded-lg border">
      <LoadingSpinner size="lg" />
    </div>
  ),
  ssr: false
});

export const DepartmentDistributionChart = dynamic(() => import('./department-distribution-chart'), {
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-white rounded-lg border">
      <LoadingSpinner size="lg" />
    </div>
  ),
  ssr: false
});

export const HospitalActivityChart = dynamic(() => import('./hospital-activity-chart'), {
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-white rounded-lg border">
      <LoadingSpinner size="lg" />
    </div>
  ),
  ssr: false
});

export const TopDoctorsChart = dynamic(() => import('./top-doctors-chart'), {
  loading: () => (
    <div className="h-[400px] flex items-center justify-center bg-white rounded-lg border">
      <LoadingSpinner size="lg" />
    </div>
  ),
  ssr: false
});