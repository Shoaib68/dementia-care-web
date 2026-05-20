"use client";

import React from 'react';
import { cn } from '@/shared/lib/utils';

interface ShimmerLoadingProps {
  className?: string;
  variant?: 'card' | 'text' | 'avatar' | 'button' | 'table-row';
  lines?: number;
  width?: string;
  height?: string;
}

const ShimmerLoading: React.FC<ShimmerLoadingProps> = ({
  className,
  variant = 'card',
  lines = 1,
  width,
  height,
}) => {
  const baseClasses = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]";
  
  const variants = {
    card: "rounded-lg h-32 w-full",
    text: "rounded h-4 w-3/4",
    avatar: "rounded-full h-10 w-10",
    button: "rounded h-10 w-24",
    'table-row': "rounded h-12 w-full",
  };

  const shimmerAnimation = {
    animationName: 'shimmer',
    animationDuration: '2s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              variants[variant],
              i === lines - 1 && "w-1/2" // Last line is shorter
            )}
            style={{
              width: width || undefined,
              height: height || undefined,
              ...shimmerAnimation,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variants[variant],
        className
      )}
      style={{
        width: width || undefined,
        height: height || undefined,
        ...shimmerAnimation,
      }}
    />
  );
};

// Specialized shimmer components for common use cases
export const CardShimmer: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("p-6 border rounded-lg", className)}>
    <div className="flex items-center justify-between">
      <div className="flex-1 space-y-2">
        <ShimmerLoading variant="text" width="40%" />
        <ShimmerLoading variant="text" width="60%" height="2rem" />
        <ShimmerLoading variant="text" width="80%" />
      </div>
      <ShimmerLoading variant="avatar" className="ml-4" />
    </div>
  </div>
);

export const TableRowShimmer: React.FC<{ columns?: number; className?: string }> = ({ 
  columns = 4, 
  className 
}) => (
  <tr className={className}>
    {Array.from({ length: columns }, (_, i) => (
      <td key={i} className="px-6 py-4">
        <ShimmerLoading variant="text" />
      </td>
    ))}
  </tr>
);

export const DashboardMetricShimmer: React.FC<{ className?: string }> = ({ className }) => (
  <CardShimmer className={className} />
);

export const ChartShimmer: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("p-6 border rounded-lg", className)}>
    <ShimmerLoading variant="text" width="30%" className="mb-4" />
    <ShimmerLoading variant="card" height="300px" />
  </div>
);

// CSS for shimmer animation (to be added to globals.css)
export const shimmerCSS = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animate-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
}
`;

export default ShimmerLoading;
