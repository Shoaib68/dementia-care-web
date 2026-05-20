"use client";

import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useComponentPerformance } from '@/shared/hooks/usePerformance';

export interface DashboardMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'gray';
  description?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  className?: string;
}

// HCI-compliant, eye-friendly icon colors with better contrast
const iconColorClasses = {
  blue: 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/20',
  green: 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md shadow-green-500/20',
  orange: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20',
  purple: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md shadow-purple-500/20',
  red: 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shadow-red-500/20',
  gray: 'bg-gradient-to-br from-neutral-500 to-neutral-600 text-white shadow-md shadow-neutral-500/20',
};

const DashboardMetricCardComponent: React.FC<DashboardMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = 'blue',
  description,
  trend,
  onClick,
  className,
}) => {
  useComponentPerformance('DashboardMetricCard');

  return (
    <Card 
      className={cn(
        "group relative bg-white/90 backdrop-blur-sm border border-neutral-200/60 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden",
        onClick && "cursor-pointer hover:scale-[1.01] hover:-translate-y-0.5",
        "transform transition-all duration-300 ease-out",
        className
      )}
      onClick={onClick}
    >
      {/* Subtle, professional gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/10 via-transparent to-purple-50/10 group-hover:from-teal-50/15 group-hover:to-purple-50/15" />
      
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 space-y-3">
            <p className="text-sm font-semibold text-neutral-600 tracking-wide">{title}</p>
            <p className="text-3xl font-bold text-neutral-900 transition-all duration-200">
              {value}
            </p>
            {description && (
              <p className="text-xs font-medium text-neutral-500 mt-2 leading-relaxed">{description}</p>
            )}
            {trend && (
              <div className="flex items-center mt-4 space-x-3">
                <span
                  className={cn(
                    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
                    trend.isPositive 
                      ? 'bg-green-50/80 text-green-700 border border-green-200/60 shadow-sm' 
                      : 'bg-red-50/80 text-red-700 border border-red-200/60 shadow-sm'
                  )}
                >
                  {trend.isPositive ? '↗' : '↘'} {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs font-medium text-neutral-500">{trend.label}</span>
              </div>
            )}
          </div>
          
          <div className="relative">
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3',
              iconColorClasses[iconColor]
            )}>
              <Icon className="h-7 w-7 drop-shadow-sm" />
            </div>
            
            {/* Subtle glow effect */}
            <div className={cn(
              'absolute inset-0 rounded-2xl blur-md opacity-20 transition-opacity duration-300 group-hover:opacity-40',
              iconColorClasses[iconColor]
            )} />
          </div>
        </div>
        
        {/* Subtle bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-200/40 to-transparent group-hover:via-teal-300/60 transition-all duration-300" />
      </CardContent>
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const DashboardMetricCard = React.memo(DashboardMetricCardComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.iconColor === nextProps.iconColor &&
    prevProps.description === nextProps.description &&
    JSON.stringify(prevProps.trend) === JSON.stringify(nextProps.trend) &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.className === nextProps.className
  );
});

export default DashboardMetricCard;
