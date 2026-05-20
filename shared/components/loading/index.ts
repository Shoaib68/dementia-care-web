/**
 * Loading Components - Barrel Export
 * 
 * Provides unified access to all loading state components in the application.
 * Components are organized into two categories:
 * 
 * 1. Basic Skeletons (No Framer Motion) - Better performance, simple loading states
 * 2. Animated Skeletons (With Framer Motion) - Enhanced UX, complex interactions
 * 
 * @example Basic Usage
 * ```tsx
 * import { LoadingSpinner, TableSkeleton } from '@/shared/components/loading';
 * 
 * // Simple spinner
 * <LoadingSpinner size="lg" text="Loading data..." />
 * 
 * // Table skeleton
 * <TableSkeleton rows={5} columns={4} />
 * ```
 * 
 * @example Animated Usage
 * ```tsx
 * import { AnimatedMetricCardSkeleton, AnimatedDashboardLoadingState } from '@/shared/components/loading';
 * 
 * // Animated metric cards with Framer Motion
 * <AnimatedMetricCardSkeleton count={4} />
 * 
 * // Complete animated dashboard
 * <AnimatedDashboardLoadingState title="Dashboard" subtitle="Loading your data..." />
 * ```
 */

// Simple loading spinner (no Framer Motion)
export { LoadingSpinner } from './LoadingSpinner';

// Basic skeleton components (no Framer Motion - better performance)
export {
  // Base components
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonButton,
  
  // Card skeletons
  DashboardMetricCardSkeleton,
  HospitalCardSkeleton,
  
  // List item skeletons
  PatientListItemSkeleton,
  DoctorListItemSkeleton,
  TableRowSkeleton,
  
  // Complex skeletons
  TableSkeleton,
  FormSkeleton,
  PageHeaderSkeleton,
  
  // Page-level skeletons
  DashboardPageSkeleton,
  ListPageSkeleton,
  MRIAnalysisLoadingSkeleton,
} from './LoadingStates';

// Animated skeleton components (with Framer Motion - enhanced UX)
export {
  AnimatedMetricCardSkeleton,
  AnimatedCardSkeleton,
  ShimmerSkeleton,
  AnimatedDashboardLoadingState,
} from './LoadingStates';
