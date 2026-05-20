"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton, SkeletonText, SkeletonCircle, SkeletonButton } from '@/shared/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';
import { 
  containerVariants, 
  itemVariants, 
  loadingSkeletonVariants 
} from '@/shared/animations';
import { interactiveElements } from '@/shared/styles/effects';

/**
 * Comprehensive loading state components for different UI patterns
 * Combines both basic skeleton patterns and enhanced animated versions
 * 
 * Usage:
 * - Use basic skeletons (without 'Animated' suffix) for simple loading states
 * - Use animated skeletons (with 'Animated' suffix) for enhanced UX with Framer Motion
 */

// ============================================================================
// BASIC SKELETON COMPONENTS (No Framer Motion - Better Performance)
// ============================================================================

/**
 * Dashboard metric card loading state - basic version
 */
export const DashboardMetricCardSkeleton: React.FC<{ className?: string }> = ({ 
  className 
}) => (
  <Card className={className}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <SkeletonText lines={1} className="w-24" />
      <SkeletonCircle size={16} />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-8 w-16" /> {/* Value */}
        <SkeletonText lines={1} className="w-32" /> {/* Description */}
      </div>
    </CardContent>
  </Card>
);

/**
 * Table row loading state
 */
export const TableRowSkeleton: React.FC<{ 
  columns: number; 
  className?: string;
}> = ({ columns, className }) => (
  <tr className={cn('border-b', className)}>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-2">
        <SkeletonText lines={1} />
      </td>
    ))}
  </tr>
);

/**
 * Complete table loading state
 */
export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => (
  <div className={cn('overflow-hidden rounded-lg border', className)}>
    {/* Table header */}
    <div className="border-b bg-gray-50 px-4 py-3">
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
    </div>
    
    {/* Table body */}
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 px-4 py-3">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

/**
 * Patient list item loading state
 */
export const PatientListItemSkeleton: React.FC<{ className?: string }> = ({ 
  className 
}) => (
  <div className={cn('flex items-center space-x-4 p-4 border-b', className)}>
    <SkeletonCircle size={48} /> {/* Avatar */}
    <div className="flex-1 space-y-2">
      <Skeleton className="h-5 w-32" /> {/* Name */}
      <Skeleton className="h-4 w-48" /> {/* Details */}
      <div className="flex space-x-2">
        <Skeleton className="h-3 w-16" /> {/* Stage */}
        <Skeleton className="h-3 w-20" /> {/* Date */}
      </div>
    </div>
    <div className="space-y-2">
      <SkeletonButton className="h-8 w-16" />
      <SkeletonButton className="h-8 w-20" />
    </div>
  </div>
);

/**
 * Doctor list item loading state
 */
export const DoctorListItemSkeleton: React.FC<{ className?: string }> = ({ 
  className 
}) => (
  <div className={cn('flex items-center space-x-4 p-4 border-b', className)}>
    <SkeletonCircle size={40} /> {/* Avatar */}
    <div className="flex-1 space-y-2">
      <Skeleton className="h-5 w-36" /> {/* Name */}
      <Skeleton className="h-4 w-28" /> {/* Specialization */}
      <Skeleton className="h-3 w-40" /> {/* Email */}
    </div>
    <div className="text-right space-y-2">
      <Skeleton className="h-4 w-16" /> {/* Status */}
      <Skeleton className="h-3 w-20" /> {/* License */}
    </div>
  </div>
);

/**
 * Hospital card loading state
 */
export const HospitalCardSkeleton: React.FC<{ className?: string }> = ({ 
  className 
}) => (
  <Card className={className}>
    <CardHeader>
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" /> {/* Hospital name */}
        <SkeletonText lines={2} className="w-full" /> {/* Address */}
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" /> {/* Label */}
          <Skeleton className="h-4 w-16" /> {/* Value */}
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" /> {/* Label */}
          <Skeleton className="h-4 w-20" /> {/* Value */}
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" /> {/* Label */}
          <Skeleton className="h-4 w-14" /> {/* Value */}
        </div>
        <div className="pt-2 flex space-x-2">
          <SkeletonButton className="h-8 w-16" />
          <SkeletonButton className="h-8 w-20" />
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Form loading state
 */
export const FormSkeleton: React.FC<{ 
  fields?: number; 
  hasSubmitButton?: boolean;
  className?: string;
}> = ({ fields = 4, hasSubmitButton = true, className }) => (
  <div className={cn('space-y-6', className)}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" /> {/* Label */}
        <Skeleton className="h-10 w-full" /> {/* Input */}
      </div>
    ))}
    {hasSubmitButton && (
      <div className="flex justify-end space-x-2">
        <SkeletonButton className="h-10 w-20" />
        <SkeletonButton className="h-10 w-16" />
      </div>
    )}
  </div>
);

/**
 * Page header loading state
 */
export const PageHeaderSkeleton: React.FC<{ 
  hasActions?: boolean;
  className?: string;
}> = ({ hasActions = true, className }) => (
  <div className={cn('flex justify-between items-start mb-6', className)}>
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" /> {/* Title */}
      <Skeleton className="h-4 w-64" /> {/* Subtitle */}
    </div>
    {hasActions && (
      <div className="flex space-x-2">
        <SkeletonButton className="h-10 w-20" />
        <SkeletonButton className="h-10 w-24" />
      </div>
    )}
  </div>
);

/**
 * Dashboard page loading state
 */
export const DashboardPageSkeleton: React.FC<{ className?: string }> = ({ 
  className 
}) => (
  <div className={cn('space-y-6', className)}>
    <PageHeaderSkeleton />
    
    {/* Metrics row */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <DashboardMetricCardSkeleton key={i} />
      ))}
    </div>
    
    {/* Main content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <TableSkeleton rows={6} columns={5} />
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <SkeletonCircle size={32} />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

/**
 * List page loading state
 */
export const ListPageSkeleton: React.FC<{ 
  itemType?: 'patient' | 'doctor' | 'hospital';
  itemCount?: number;
  className?: string;
}> = ({ itemType = 'patient', itemCount = 5, className }) => {
  const ItemSkeleton = {
    patient: PatientListItemSkeleton,
    doctor: DoctorListItemSkeleton,
    hospital: HospitalCardSkeleton,
  }[itemType];

  if (itemType === 'hospital') {
    return (
      <div className={cn('space-y-6', className)}>
        <PageHeaderSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: itemCount }).map((_, i) => (
            <ItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <PageHeaderSkeleton />
      <Card>
        <div className="divide-y">
          {Array.from({ length: itemCount }).map((_, i) => (
            <ItemSkeleton key={i} />
          ))}
        </div>
      </Card>
    </div>
  );
};

/**
 * MRI analysis loading state
 */
export const MRIAnalysisLoadingSkeleton: React.FC<{ className?: string }> = ({ 
  className 
}) => (
  <div className={cn('space-y-6', className)}>
    <div className="flex items-center space-x-4">
      <Skeleton className="h-8 w-8 rounded-full animate-spin" /> {/* Spinner */}
      <div>
        <Skeleton className="h-5 w-40 mb-2" /> {/* Status */}
        <Skeleton className="h-4 w-60" /> {/* Description */}
      </div>
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Image preview */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" /> {/* Title */}
        <Skeleton className="aspect-square w-full rounded-lg" /> {/* Image */}
      </div>
      
      {/* Analysis results */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" /> {/* Title */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" /> {/* Label */}
              <Skeleton className="h-8 w-32" /> {/* Result */}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" /> {/* Label */}
              <Skeleton className="h-6 w-20" /> {/* Confidence */}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" /> {/* Label */}
              <Skeleton className="h-4 w-full" /> {/* Timestamp */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

// ============================================================================
// ANIMATED SKELETON COMPONENTS (With Framer Motion - Enhanced UX)
// ============================================================================

/**
 * Animated metric card skeleton with Framer Motion
 * Use this for dashboard pages where enhanced animations improve UX
 */
export const AnimatedMetricCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <motion.div 
      variants={itemVariants}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <Card className={interactiveElements.metricCard}>
            <CardContent className="p-6">
              <motion.div 
                className="animate-pulse"
                variants={loadingSkeletonVariants}
                animate="pulse"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 group-hover:bg-blue-200 rounded w-24 transition-colors"></div>
                    <div className="h-8 bg-gray-300 group-hover:bg-blue-300 rounded w-16 transition-colors"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 group-hover:bg-blue-200 rounded-lg group-hover:scale-110 transition-all"></div>
                </div>
                <div className="h-3 bg-gray-200 group-hover:bg-blue-200 rounded w-20 transition-colors"></div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

/**
 * Animated card skeleton with Framer Motion
 */
export const AnimatedCardSkeleton: React.FC<{ count?: number }> = ({ count = 2 }) => {
  return (
    <motion.div 
      variants={itemVariants}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="border border-gray-200 hover:border-blue-300 transition-all duration-300">
          <CardHeader>
            <div className="animate-pulse space-y-2">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-100 rounded w-48"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
};

/**
 * Shimmer skeleton effect component
 * Use for elements that need shimmer loading animation
 */
export const ShimmerSkeleton: React.FC<{ className?: string; children?: React.ReactNode }> = ({ 
  className = "", 
  children 
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="bg-gray-200 rounded animate-pulse">
        {children}
      </div>
    </div>
  );
};

/**
 * Complete animated dashboard loading state with Framer Motion
 * Use this for main dashboard pages where animations enhance user experience
 */
export const AnimatedDashboardLoadingState: React.FC<{ 
  title: string; 
  subtitle: string;
}> = ({ title, subtitle }) => {
  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          <ShimmerSkeleton className="h-10 w-20" />
        </div>
      </motion.div>
      
      <AnimatedMetricCardSkeleton />
      <AnimatedCardSkeleton />
    </motion.div>
  );
};

// Re-export base skeleton components for convenience
export {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonButton,
} from '@/shared/components/ui/skeleton';
