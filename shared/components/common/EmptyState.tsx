"use client";

import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { LucideIcon, FileX, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: 'default' | 'outline' | 'ghost';
  };
  className?: string;
}

export interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: string | Error;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Reusable empty state component for when no data is available
 * Provides consistent messaging and optional actions
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FileX,
  title,
  description,
  action,
  className,
}) => {
  const ActionIcon = action?.icon;

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-600 mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
          className="inline-flex items-center"
        >
          {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
          {action.label}
        </Button>
      )}
    </div>
  );
};

/**
 * Reusable error state component for handling errors
 * Provides consistent error messaging and retry functionality
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  description = "We encountered an error while loading your data.",
  error,
  onRetry,
  retryLabel = "Try Again",
  className,
}) => {
  const errorMessage = error
    ? typeof error === 'string' 
      ? error 
      : error.message || 'Unknown error occurred'
    : description;

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md">
        {errorMessage}
      </p>
      
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="inline-flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
};

// Specialized empty states for common scenarios
export const NoDataState: React.FC<{
  entityName: string;
  onAdd?: () => void;
  addLabel?: string;
}> = ({ entityName, onAdd, addLabel }) => (
  <EmptyState
    title={`No ${entityName} found`}
    description={`You haven't created any ${entityName.toLowerCase()} yet. Get started by adding your first one.`}
    action={onAdd ? {
      label: addLabel || `Add ${entityName}`,
      onClick: onAdd,
      variant: 'default',
    } : undefined}
  />
);

export const SearchEmptyState: React.FC<{
  searchTerm: string;
  onClearSearch?: () => void;
}> = ({ searchTerm, onClearSearch }) => (
  <EmptyState
    title="No results found"
    description={`We couldn't find any results for "${searchTerm}". Try adjusting your search terms.`}
    action={onClearSearch ? {
      label: "Clear Search",
      onClick: onClearSearch,
      variant: 'outline',
    } : undefined}
  />
);

export const LoadingErrorState: React.FC<{
  onRetry: () => void;
  entityName?: string;
}> = ({ onRetry, entityName = 'data' }) => (
  <ErrorState
    title={`Failed to load ${entityName}`}
    description={`We couldn't load your ${entityName}. This might be due to a network issue or server problem.`}
    onRetry={onRetry}
  />
);

export default EmptyState;
