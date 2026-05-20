import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface ValidationMessageProps {
  /** Message type/variant */
  type?: 'error' | 'success' | 'warning' | 'info';
  /** Message content */
  message: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show icon */
  showIcon?: boolean;
  /** Custom icon to override default */
  icon?: React.ReactNode;
  /** Custom className */
  className?: string;
  /** Additional actions/buttons */
  actions?: React.ReactNode;
}

/**
 * Validation message component for form feedback
 * Supports different message types with appropriate styling and icons
 */
export function ValidationMessage({
  type = 'error',
  message,
  size = 'sm',
  showIcon = true,
  icon,
  className,
  actions
}: ValidationMessageProps) {
  const sizeClasses = {
    sm: {
      container: 'text-xs p-2',
      icon: 'h-3 w-3',
      text: 'text-xs'
    },
    md: {
      container: 'text-sm p-3',
      icon: 'h-4 w-4',
      text: 'text-sm'
    },
    lg: {
      container: 'text-base p-4',
      icon: 'h-5 w-5',
      text: 'text-base'
    }
  };

  const typeClasses = {
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: 'text-red-500',
      text: 'text-red-700'
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: 'text-green-500',
      text: 'text-green-700'
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: 'text-amber-500',
      text: 'text-amber-700'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: 'text-blue-500',
      text: 'text-blue-700'
    }
  };

  const getDefaultIcon = () => {
    const iconSize = sizeClasses[size].icon;
    const iconColor = typeClasses[type].icon;
    
    switch (type) {
      case 'error':
        return <AlertCircle className={cn(iconSize, iconColor)} />;
      case 'success':
        return <CheckCircle className={cn(iconSize, iconColor)} />;
      case 'warning':
        return <AlertTriangle className={cn(iconSize, iconColor)} />;
      case 'info':
        return <Info className={cn(iconSize, iconColor)} />;
      default:
        return <AlertCircle className={cn(iconSize, iconColor)} />;
    }
  };

  const renderIcon = () => {
    if (!showIcon) return null;
    return icon || getDefaultIcon();
  };

  return (
    <div
      className={cn(
        'border rounded-md flex items-start gap-2',
        sizeClasses[size].container,
        typeClasses[type].container,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {renderIcon()}
      <div className="flex-1 min-w-0">
        <p className={cn(sizeClasses[size].text, typeClasses[type].text)}>
          {message}
        </p>
        {actions && (
          <div className="mt-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Inline validation message for form fields (minimal styling)
 */
export interface InlineValidationMessageProps {
  /** Message content */
  message: string;
  /** Message type */
  type?: 'error' | 'success' | 'warning' | 'info';
  /** Show icon */
  showIcon?: boolean;
  /** Custom className */
  className?: string;
}

export function InlineValidationMessage({
  message,
  type = 'error',
  showIcon = true,
  className
}: InlineValidationMessageProps) {
  const typeClasses = {
    error: 'text-red-600',
    success: 'text-green-600',
    warning: 'text-amber-600',
    info: 'text-blue-600'
  };

  const getIcon = () => {
    if (!showIcon) return null;
    
    const iconClasses = 'h-3 w-3 flex-shrink-0';
    
    switch (type) {
      case 'error':
        return <AlertCircle className={cn(iconClasses, 'text-red-500')} />;
      case 'success':
        return <CheckCircle className={cn(iconClasses, 'text-green-500')} />;
      case 'warning':
        return <AlertTriangle className={cn(iconClasses, 'text-amber-500')} />;
      case 'info':
        return <Info className={cn(iconClasses, 'text-blue-500')} />;
      default:
        return <AlertCircle className={cn(iconClasses, 'text-red-500')} />;
    }
  };

  return (
    <div
      className={cn('flex items-start gap-1 mt-1', className)}
      role="alert"
      aria-live="polite"
    >
      {getIcon()}
      <span className={cn('text-xs', typeClasses[type])}>
        {message}
      </span>
    </div>
  );
}

export default ValidationMessage;