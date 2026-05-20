import React from 'react';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';
import { Skeleton, SkeletonText, SkeletonCircle, SkeletonAvatar } from '@/shared/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';

export interface CardSkeletonProps {
  className?: string;
  showHeader?: boolean;
  headerHeight?: 'sm' | 'md' | 'lg';
  contentLines?: number;
}

/**
 * Base card skeleton component for loading states
 */
export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  className,
  showHeader = true,
  headerHeight = 'md',
  contentLines = 3,
}) => {
  const getHeaderHeight = () => {
    switch (headerHeight) {
      case 'sm': return 'h-4';
      case 'lg': return 'h-8';
      default: return 'h-6';
    }
  };

  return (
    <Card className={cn(className)}>
      {showHeader && (
        <CardHeader>
          <Skeleton className={cn('w-2/3', getHeaderHeight())} />
        </CardHeader>
      )}
      <CardContent>
        <SkeletonText lines={contentLines} />
      </CardContent>
    </Card>
  );
};

/**
 * Stat card skeleton for dashboard metrics
 */
export const StatCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn(className)}>
    <CardContent className="p-6">
      <div className="flex items-center space-x-4">
        <SkeletonCircle size={48} />
        <div className="flex-1">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Profile card skeleton with avatar and details
 */
export const ProfileCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn(className)}>
    <CardContent className="p-6">
      <div className="flex items-center space-x-4">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Chart card skeleton for analytics displays
 */
export const ChartCardSkeleton: React.FC<{ 
  className?: string;
  height?: number;
}> = ({ 
  className, 
  height = 300 
}) => (
  <Card className={cn(className)}>
    <CardHeader>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="w-full rounded-md" style={{ height }} />
    </CardContent>
  </Card>
);

/**
 * Activity card skeleton for recent actions/logs
 */
export const ActivityCardSkeleton: React.FC<{ 
  className?: string;
  items?: number;
}> = ({ 
  className, 
  items = 4 
}) => (
  <Card className={cn(className)}>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <SkeletonCircle size={32} />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

/**
 * Hospital-specific card skeleton
 */
export const HospitalCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn(className)}>
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
        <div className="flex justify-between pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Doctor-specific card skeleton
 */
export const DoctorCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn(className)}>
    <CardContent className="p-6">
      <div className="flex items-start space-x-4">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <div className="flex items-center space-x-2 pt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Patient-specific card skeleton
 */
export const PatientCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn(className)}>
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <SkeletonAvatar />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-4 w-24" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Grid of card skeletons for dashboard layouts
 */
export const CardGridSkeleton: React.FC<{ 
  count?: number;
  columns?: number;
  className?: string;
  cardType?: 'default' | 'stat' | 'profile' | 'hospital' | 'doctor' | 'patient';
}> = ({ 
  count = 6, 
  columns = 3, 
  className,
  cardType = 'default'
}) => {
  const getCardComponent = () => {
    switch (cardType) {
      case 'stat': return StatCardSkeleton;
      case 'profile': return ProfileCardSkeleton;
      case 'hospital': return HospitalCardSkeleton;
      case 'doctor': return DoctorCardSkeleton;
      case 'patient': return PatientCardSkeleton;
      default: return CardSkeleton;
    }
  };

  const CardComponent = getCardComponent();

  return (
    <div className={cn(
      'grid gap-4',
      columns === 2 && 'grid-cols-2',
      columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <CardComponent key={i} />
      ))}
    </div>
  );
};
