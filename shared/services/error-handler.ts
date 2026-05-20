/**
 * Global error handler service
 * Centralized error processing, reporting, and user notification
 */

import { ApiError } from '@/shared/lib/api';
import { Logger } from './logger';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories for better classification
export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  SERVER = 'server',
  CLIENT = 'client',
  BUSINESS_LOGIC = 'business_logic',
  UNKNOWN = 'unknown',
}

// Enhanced error interface
export interface ProcessedError {
  id: string;
  message: string;
  userMessage: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  url?: string;
  userAgent?: string;
}

// Error notification interface
export interface ErrorNotification {
  type: 'toast' | 'modal' | 'banner';
  title: string;
  message: string;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  autoClose?: boolean;
  duration?: number;
}

class ErrorHandlerService {
  private logger: Logger;
  private errorQueue: ProcessedError[] = [];
  private listeners: Array<(error: ProcessedError, notification?: ErrorNotification) => void> = [];
  private initialized = false;

  constructor() {
    this.logger = new Logger('ErrorHandler');
  }

  /**
   * Initialize the error handler with external services
   */
  public initialize(config?: {
    sentryDsn?: string;
    logRocketAppId?: string;
    enableConsoleLogging?: boolean;
  }) {
    if (this.initialized) return;

    // Initialize external error tracking (when needed)
    if (config?.sentryDsn) {
      this.initializeSentry(config.sentryDsn);
    }

    if (config?.logRocketAppId) {
      this.initializeLogRocket(config.logRocketAppId);
    }

    // Set up global error handlers
    this.setupGlobalHandlers();
    
    this.initialized = true;
    this.logger.info('Error handler initialized');
  }

  /**
   * Process and handle any error
   */
  public handleError(
    error: unknown,
    context?: Record<string, any>,
    notify: boolean = true
  ): ProcessedError {
    const processedError = this.processError(error, context);
    
    // Log the error
    this.logError(processedError);
    
    // Add to error queue for batch processing
    this.errorQueue.push(processedError);
    
    // Create notification if needed
    let notification: ErrorNotification | undefined;
    if (notify) {
      notification = this.createNotification(processedError);
    }
    
    // Notify listeners
    this.notifyListeners(processedError, notification);
    
    return processedError;
  }

  /**
   * Handle API errors specifically
   */
  public handleApiError(
    error: ApiError,
    context?: Record<string, any>,
    notify: boolean = true
  ): ProcessedError {
    const processedError: ProcessedError = {
      id: this.generateErrorId(),
      message: error.message,
      userMessage: this.getUserFriendlyMessage(error),
      category: this.categorizeApiError(error),
      severity: this.getSeverityForApiError(error),
      timestamp: error.timestamp || new Date().toISOString(),
      stack: error.stack,
      context: {
        ...context,
        status: error.status,
        code: error.code,
        errors: error.errors,
        requestId: error.requestId,
      },
      requestId: error.requestId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    return this.handleError(processedError, context, notify);
  }

  /**
   * Subscribe to error events
   */
  public subscribe(
    listener: (error: ProcessedError, notification?: ErrorNotification) => void
  ): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get error queue for batch processing
   */
  public getErrorQueue(): ProcessedError[] {
    return [...this.errorQueue];
  }

  /**
   * Clear error queue
   */
  public clearErrorQueue(): void {
    this.errorQueue = [];
  }

  // Private methods
  private processError(error: unknown, context?: Record<string, any>): ProcessedError {
    let processedError: ProcessedError;

    if (error instanceof ApiError) {
      processedError = {
        id: this.generateErrorId(),
        message: error.message,
        userMessage: this.getUserFriendlyMessage(error),
        category: this.categorizeApiError(error),
        severity: this.getSeverityForApiError(error),
        timestamp: error.timestamp || new Date().toISOString(),
        stack: error.stack,
        context: {
          ...context,
          status: error.status,
          code: error.code,
          errors: error.errors,
          requestId: error.requestId,
        },
        requestId: error.requestId,
      };
    } else if (error instanceof Error) {
      processedError = {
        id: this.generateErrorId(),
        message: error.message,
        userMessage: 'An unexpected error occurred',
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        timestamp: new Date().toISOString(),
        stack: error.stack,
        context,
      };
    } else {
      processedError = {
        id: this.generateErrorId(),
        message: String(error),
        userMessage: 'An unexpected error occurred',
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.LOW,
        timestamp: new Date().toISOString(),
        context,
      };
    }

    // Add common context
    processedError.url = typeof window !== 'undefined' ? window.location.href : undefined;
    processedError.userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;

    return processedError;
  }

  private categorizeApiError(error: ApiError): ErrorCategory {
    switch (error.status) {
      case 400:
        return error.code === 'VALIDATION_ERROR' ? ErrorCategory.VALIDATION : ErrorCategory.CLIENT;
      case 401:
        return ErrorCategory.AUTHENTICATION;
      case 403:
        return ErrorCategory.AUTHORIZATION;
      case 0:
        return ErrorCategory.NETWORK;
      case 500:
      case 502:
      case 503:
      case 504:
        return ErrorCategory.SERVER;
      default:
        return ErrorCategory.UNKNOWN;
    }
  }

  private getSeverityForApiError(error: ApiError): ErrorSeverity {
    switch (error.status) {
      case 500:
      case 502:
      case 503:
      case 504:
        return ErrorSeverity.HIGH;
      case 401:
      case 403:
        return ErrorSeverity.MEDIUM;
      case 400:
      case 404:
        return ErrorSeverity.LOW;
      case 0: // Network error
        return ErrorSeverity.MEDIUM;
      default:
        return ErrorSeverity.LOW;
    }
  }

  private getUserFriendlyMessage(error: ApiError): string {
    // Import error messages from constants
    const errorMessages = {
      VALIDATION_ERROR: 'Please check your input and try again.',
      AUTHENTICATION_ERROR: 'Please log in to continue.',
      AUTHORIZATION_ERROR: 'You don\'t have permission to perform this action.',
      NOT_FOUND_ERROR: 'The requested resource was not found.',
      CONFLICT_ERROR: 'This item already exists.',
      RATE_LIMIT_ERROR: 'Too many requests. Please wait and try again.',
      SERVER_ERROR: 'Server error. Please try again later.',
      NETWORK_ERROR: 'Please check your internet connection.',
    };

    return errorMessages[error.code as keyof typeof errorMessages] || error.message;
  }

  private createNotification(error: ProcessedError): ErrorNotification {
    const baseNotification: ErrorNotification = {
      type: 'toast',
      title: this.getNotificationTitle(error),
      message: error.userMessage,
      autoClose: true,
      duration: 5000,
    };

    // Customize notification based on category and severity
    switch (error.category) {
      case ErrorCategory.AUTHENTICATION:
        return {
          ...baseNotification,
          type: 'modal',
          title: 'Authentication Required',
          autoClose: false,
          actions: [
            {
              label: 'Log In',
              action: () => window.location.href = '/login',
              variant: 'primary',
            },
          ],
        };
      
      case ErrorCategory.NETWORK:
        return {
          ...baseNotification,
          title: 'Connection Problem',
          actions: [
            {
              label: 'Retry',
              action: () => window.location.reload(),
              variant: 'primary',
            },
          ],
        };
      
      case ErrorCategory.SERVER:
        if (error.severity === ErrorSeverity.CRITICAL) {
          return {
            ...baseNotification,
            type: 'banner',
            title: 'System Maintenance',
            message: 'The system is temporarily unavailable. Please try again later.',
            autoClose: false,
          };
        }
        break;
    }

    return baseNotification;
  }

  private getNotificationTitle(error: ProcessedError): string {
    switch (error.category) {
      case ErrorCategory.VALIDATION:
        return 'Validation Error';
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication Required';
      case ErrorCategory.AUTHORIZATION:
        return 'Access Denied';
      case ErrorCategory.NETWORK:
        return 'Connection Problem';
      case ErrorCategory.SERVER:
        return 'Server Error';
      default:
        return 'Error';
    }
  }

  private logError(error: ProcessedError): void {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        this.logger.error('Critical error occurred', error);
        break;
      case ErrorSeverity.HIGH:
        this.logger.error('High severity error', error);
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn('Medium severity error', error);
        break;
      case ErrorSeverity.LOW:
        this.logger.info('Low severity error', error);
        break;
    }
  }

  private notifyListeners(
    error: ProcessedError, 
    notification?: ErrorNotification
  ): void {
    this.listeners.forEach(listener => {
      try {
        listener(error, notification);
      } catch (err) {
        this.logger.error('Error in error handler listener', err);
      }
    });
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalHandlers(): void {
    if (typeof window !== 'undefined') {
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(event.reason, { type: 'unhandledrejection' });
      });

      // Handle JavaScript errors
      window.addEventListener('error', (event) => {
        this.handleError(event.error, { 
          type: 'javascript_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });
    }
  }

  private initializeSentry(dsn: string): void {
    // Placeholder for Sentry initialization
    this.logger.info('Sentry would be initialized here with DSN:', dsn);
  }

  private initializeLogRocket(appId: string): void {
    // Placeholder for LogRocket initialization
    this.logger.info('LogRocket would be initialized here with App ID:', appId);
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandlerService();

// Export types
export type {
  ProcessedError,
  ErrorNotification,
};
