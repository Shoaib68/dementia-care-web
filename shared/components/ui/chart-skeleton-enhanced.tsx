"use client";

import React from 'react';
import { Card, CardContent, CardHeader } from './card';

interface ChartSkeletonProps {
  height?: string;
  showHeader?: boolean;
  className?: string;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  height = 'h-96',
  showHeader = true,
  className = ''
}) => {
  return (
    <Card className={`border border-gray-200 ${className}`}>
      {showHeader && (
        <CardHeader className="space-y-2">
          <div className="flex items-center space-x-3">
            {/* Icon skeleton */}
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
            {/* Title skeleton */}
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <div className={`${height} flex flex-col items-center justify-center space-y-4`}>
          {/* Animated chart placeholder */}
          <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            
            {/* Chart structure mockup */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              {/* Y-axis lines */}
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-px bg-gray-200/50 w-full" />
                ))}
              </div>
              
              {/* Chart bars/lines mockup */}
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-around space-x-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-300/50 rounded-t"
                    style={{
                      width: '12%',
                      height: `${30 + Math.random() * 40}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Loading text */}
          <p className="text-sm text-gray-500 animate-pulse">Loading chart data...</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Specific chart skeletons for different chart types
export const BarChartSkeleton = () => <ChartSkeleton height="h-80" />;
export const LineChartSkeleton = () => <ChartSkeleton height="h-96" />;
export const PieChartSkeleton = () => <ChartSkeleton height="h-80" />;

// Add shimmer animation to global styles
export const shimmerKeyframes = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;
