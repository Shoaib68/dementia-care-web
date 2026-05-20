import React from 'react';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card';

interface ChartSkeletonProps {
  className?: string;
  type?: 'bar' | 'line' | 'pie' | 'area';
  showHeader?: boolean;
  showLegend?: boolean;
}

export function ChartSkeleton({ 
  className = "", 
  type = 'bar', 
  showHeader = true,
  showLegend = true 
}: ChartSkeletonProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-60" />
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <div className="h-80 flex items-center justify-center">
          {type === 'bar' && (
            <div className="w-full h-full flex items-end justify-center space-x-2">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 rounded-t animate-pulse"
                  style={{
                    width: '40px',
                    height: `${60 + Math.random() * 120}px`,
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              ))}
            </div>
          )}
          {type === 'line' && (
            <div className="w-full h-full relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent animate-pulse" />
              </div>
              <div className="absolute inset-0 flex items-end justify-between">
                {Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          {type === 'pie' && (
            <div className="w-32 h-32 relative">
              <div className="absolute inset-0 border-8 border-gray-200 rounded-full animate-spin" />
              <div className="absolute inset-2 border-4 border-gray-300 rounded-full animate-pulse" />
              <div className="absolute inset-4 border-2 border-gray-400 rounded-full animate-pulse" />
            </div>
          )}
          {type === 'area' && (
            <div className="w-full h-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-gray-200 via-gray-100 to-transparent opacity-50 animate-pulse" />
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-gray-200 to-transparent animate-pulse" />
              <div className="absolute inset-0 flex items-end justify-between">
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-gray-300 rounded-t animate-pulse"
                    style={{ 
                      height: `${30 + Math.random() * 70}%`,
                      animationDelay: `${i * 200}ms` 
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        {showLegend && (
          <div className="flex justify-center gap-6 mt-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="w-3 h-3 rounded" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}