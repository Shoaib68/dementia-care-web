import React from 'react';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface EmailValidationIndicatorProps {
  /** Current validation state */
  state: 'idle' | 'validating' | 'valid' | 'invalid' | 'error';
  /** Optional validation message */
  message?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show only icon without message */
  iconOnly?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Email validation indicator component
 * Shows validation status with appropriate icons and colors
 */
export function EmailValidationIndicator({
  state,
  message,
  size = 'md',
  iconOnly = false,
  className
}: EmailValidationIndicatorProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const renderIcon = () => {
    const iconSize = sizeClasses[size];
    
    switch (state) {
      case 'validating':
        return <Loader2 className={cn(iconSize, 'animate-spin text-blue-500')} />;
      
      case 'valid':
        return <CheckCircle className={cn(iconSize, 'text-green-500')} />;
      
      case 'invalid':
        return <XCircle className={cn(iconSize, 'text-red-500')} />;
      
      case 'error':
        return <AlertCircle className={cn(iconSize, 'text-amber-500')} />;
      
      case 'idle':
      default:
        return null;
    }
  };

  const getStateColor = () => {
    switch (state) {
      case 'validating':
        return 'text-blue-600';
      case 'valid':
        return 'text-green-600';
      case 'invalid':
        return 'text-red-600';
      case 'error':
        return 'text-amber-600';
      default:
        return 'text-gray-500';
    }
  };

  const getStateMessage = () => {
    if (message) return message;
    
    switch (state) {
      case 'validating':
        return 'Checking availability...';
      case 'valid':
        return 'Email is available';
      case 'invalid':
        return 'Email is not available';
      case 'error':
        return 'Validation failed';
      default:
        return '';
    }
  };

  if (state === 'idle') {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {renderIcon()}
      {!iconOnly && (
        <span className={cn(textSizeClasses[size], getStateColor())}>
          {getStateMessage()}
        </span>
      )}
    </div>
  );
}

/**
 * Inline email validation component for form fields
 */
export interface InlineEmailValidationProps extends EmailValidationIndicatorProps {
  /** Show suggestions for alternative emails */
  suggestions?: string[];
  /** Callback when a suggestion is clicked */
  onSuggestionClick?: (suggestion: string) => void;
}

export function InlineEmailValidation({
  state,
  message,
  suggestions,
  onSuggestionClick,
  size = 'md',
  className,
  ...props
}: InlineEmailValidationProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <EmailValidationIndicator
        state={state}
        message={message}
        size={size}
        {...props}
      />
      
      {suggestions && suggestions.length > 0 && state === 'invalid' && (
        <div className="space-y-1">
          <p className="text-xs text-gray-600">
            Try these alternatives:
          </p>
          <div className="flex flex-wrap gap-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSuggestionClick?.(suggestion)}
                className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EmailValidationIndicator;