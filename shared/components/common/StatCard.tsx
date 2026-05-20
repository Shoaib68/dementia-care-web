import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: { 
    value: number; 
    isPositive: boolean;
    label?: string;
  };
  className?: string;
}

/**
 * Reusable stat card component for displaying metrics with optional trend indicators
 * Features:
 * - Clean, minimal design with proper typography hierarchy
 * - Optional trend indicator with green/red color coding
 * - Responsive layout with icon placement
 * - Consistent styling across the application
 */
export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  className = ""
}: StatCardProps) {
  return (
    <Card className={`border border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/30 hover:bg-gradient-to-br hover:from-blue-50/30 hover:to-white transition-all duration-300 hover:scale-[1.03] cursor-pointer group ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 group-hover:text-blue-700 transition-colors">{title}</p>
            <p className="text-2xl font-bold text-gray-900 group-hover:text-gray-800 mt-1 transition-colors">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                {trend.isPositive ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1 group-hover:scale-125 group-hover:text-green-600 transition-all" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1 group-hover:scale-125 group-hover:text-red-600 transition-all" />
                )}
                <span className={`text-sm font-medium transition-colors ${
                  trend.isPositive ? 'text-green-600 group-hover:text-green-700' : 'text-red-600 group-hover:text-red-700'
                }`}>
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-sm text-gray-500 group-hover:text-gray-600 ml-1 transition-colors">
                  {trend.label || 'vs last month'}
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-blue-100 group-hover:scale-110 transition-all">
            <Icon className="h-6 w-6 text-gray-700 group-hover:text-blue-700 transition-colors" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StatCard;