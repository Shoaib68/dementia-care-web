"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Mail, Lock, Wifi, AlertCircle } from 'lucide-react';
import { AuthError, AuthErrorType } from '@/features/auth/types';

interface AuthErrorMessageProps {
  error: AuthError | null;
  className?: string;
  onDismiss?: () => void;
}

/**
 * Reusable component for displaying authentication errors with appropriate icons and animations
 * Maintains consistent styling across all authentication flows
 */
export const AuthErrorMessage: React.FC<AuthErrorMessageProps> = ({
  error,
  className = '',
  onDismiss
}) => {
  if (!error) return null;

  // Get appropriate icon based on error type
  const getErrorIcon = (errorType: AuthErrorType) => {
    switch (errorType) {
      case AuthErrorType.EMAIL_NOT_FOUND:
        return <Mail className="h-4 w-4 text-red-400 flex-shrink-0" />;
      case AuthErrorType.INCORRECT_PASSWORD:
        return <Lock className="h-4 w-4 text-red-400 flex-shrink-0" />;
      case AuthErrorType.NETWORK_ERROR:
        return <Wifi className="h-4 w-4 text-red-400 flex-shrink-0" />;
      case AuthErrorType.TOO_MANY_ATTEMPTS:
        return <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0" />;
      case AuthErrorType.ACCOUNT_DISABLED:
        return <AlertCircle className="h-4 w-4 text-orange-400 flex-shrink-0" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />;
    }
  };

  // Get appropriate styling based on error severity
  const getErrorStyling = (errorType: AuthErrorType) => {
    switch (errorType) {
      case AuthErrorType.TOO_MANY_ATTEMPTS:
      case AuthErrorType.ACCOUNT_DISABLED:
        return {
          background: 'bg-orange-500/10',
          border: 'border-orange-500/20',
          text: 'text-orange-400'
        };
      default:
        return {
          background: 'bg-red-500/10',
          border: 'border-red-500/20',
          text: 'text-red-400'
        };
    }
  };

  const styling = getErrorStyling(error.type);
  const icon = getErrorIcon(error.type);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={error.message}
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`${styling.background} ${styling.border} border rounded-xl p-4 ${className}`}
      >
        <div className="flex items-start space-x-3">
          {icon}
          <div className="flex-1 min-w-0">
            <p className={`${styling.text} text-sm font-medium leading-relaxed`}>
              {error.message}
            </p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`${styling.text} hover:opacity-70 transition-opacity duration-200 ml-2 flex-shrink-0`}
              aria-label="Dismiss error"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthErrorMessage;