import React from 'react';
import { cn } from '@/shared/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base skeleton component for loading states
 * Used as a building block for more specific skeleton components
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted/50 dark:bg-muted/20',
        className
      )}
      {...props}
    />
  );
};

/**
 * Skeleton variants for common UI elements
 */
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className 
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i}
        className={cn(
          'h-4',
          i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
        )} 
      />
    ))}
  </div>
);

export const SkeletonCircle: React.FC<{ size?: number; className?: string }> = ({ 
  size = 40, 
  className 
}) => (
  <Skeleton 
    className={cn('rounded-full', className)} 
    style={{ width: size, height: size }} 
  />
);

export const SkeletonButton: React.FC<{ className?: string }> = ({ className }) => (
  <Skeleton className={cn('h-10 w-20 rounded-md', className)} />
);

export const SkeletonAvatar: React.FC<{ className?: string }> = ({ className }) => (
  <SkeletonCircle size={40} className={className} />
);
