"use client";

import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface PageHeaderAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline' | 'ghost';
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: PageHeaderAction[];
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions = [],
  className,
}) => {
  return (
    <div className={cn("flex justify-between items-start py-6", className)}>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-neutral-900">{title}</h2>
        {subtitle && (
          <p className="text-neutral-600 mt-2 leading-relaxed">{subtitle}</p>
        )}
      </div>
      
      {actions.length > 0 && (
        <div className="flex items-center space-x-3">
          {actions.map((action, index) => {
            const ButtonComponent = action.href ? 'a' : 'button';
            const Icon = action.icon;
            
            return (
              <Button
                key={`action-${index}-${action.label}`}
                variant={action.variant || 'default'}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                {...(action.href && { href: action.href })}
                className={cn(
                  // HCI-compliant button styles
                  action.variant === 'default' && "bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-all duration-200",
                  action.variant === 'outline' && "border-neutral-300 text-neutral-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800",
                  action.variant === 'ghost' && "text-neutral-600 hover:bg-teal-50 hover:text-teal-700",
                  "font-medium px-4 py-2.5 rounded-xl",
                  action.className
                )}
              >
                {action.loading ? (
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : Icon ? (
                  <Icon className="h-4 w-4 mr-2" />
                ) : null}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
