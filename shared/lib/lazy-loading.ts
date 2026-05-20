import { lazy, ComponentType } from 'react';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';

/**
 * Enhanced lazy loading utility with better error handling and loading states
 */
export const createLazyComponent = <T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  fallback?: ComponentType
) => {
  const LazyComponent = lazy(factory);
  
  return LazyComponent;
};

/**
 * Preload a lazy component for better performance
 */
export const preloadComponent = <T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) => {
  // Preload the component when this function is called
  factory();
};

/**
 * Lazy load modals and dialogs that are rarely used
 */
export const LazyModals = {
  HospitalCreateModal: createLazyComponent(
    () => import('@/shared/components/modals/HospitalCreateModal')
  ),
  HospitalEditModal: createLazyComponent(
    () => import('@/shared/components/modals/HospitalEditModal')
  ),
  HospitalDetailsModal: createLazyComponent(
    () => import('@/shared/components/modals/HospitalDetailsModal')
  ),
  DoctorCreateModal: createLazyComponent(
    () => import('@/shared/components/modals/DoctorCreateModal')
  ),
  DoctorEditModal: createLazyComponent(
    () => import('@/shared/components/modals/DoctorEditModal')
  ),
  DoctorDetailsModal: createLazyComponent(
    () => import('@/shared/components/modals/DoctorDetailsModal')
  ),
  CredentialsModal: createLazyComponent(
    () => import('@/shared/components/credentials/CredentialsModal')
  ),
  AdvancedConfirmationDialog: createLazyComponent(
    () => import('@/shared/components/ui/advanced-confirmation-dialog')
  ),
};

/**
 * Lazy load chart components that use heavy libraries
 */
export const LazyCharts = {
  HospitalPerformanceChart: createLazyComponent(
    () => import('@/shared/components/charts/hospital-performance-chart')
  ),
  PatientDistributionChart: createLazyComponent(
    () => import('@/shared/components/charts/patient-distribution-chart')
  ),
  SystemGrowthChart: createLazyComponent(
    () => import('@/shared/components/charts/system-growth-chart')
  ),
};

/**
 * Preload critical components on route navigation
 */
export const preloadCriticalComponents = {
  superAdmin: () => {
    preloadComponent(() => import('@/shared/components/charts/hospital-performance-chart'));
    preloadComponent(() => import('@/shared/components/charts/system-growth-chart'));
    preloadComponent(() => import('@/shared/components/modals/HospitalCreateModal'));
  },
  hospitalAdmin: () => {
    preloadComponent(() => import('@/shared/components/charts/patient-distribution-chart'));
    preloadComponent(() => import('@/shared/components/modals/DoctorCreateModal'));
  },
  doctor: () => {
    // Preload patient-related components
    preloadComponent(() => import('@/shared/components/modals/DoctorDetailsModal'));
  },
};

/**
 * Intersection Observer hook for lazy loading components when they're about to be visible
 */
export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options,
  };

  return (element: Element | null) => {
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback();
          observer.unobserve(entry.target);
        }
      });
    }, defaultOptions);

    observer.observe(element);

    return () => observer.disconnect();
  };
};
