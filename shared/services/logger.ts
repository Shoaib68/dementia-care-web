/**
 * Structured logging service
 * Provides consistent logging across the application with different levels and contexts
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  stack?: string;
}

// Logger configuration
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  bufferSize: number;
  flushInterval: number;
}

class LoggerService {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;
  private context?: string;

  constructor(context?: string, config?: Partial<LoggerConfig>) {
    this.context = context;
    this.config = {
      level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
      enableConsole: true,
      enableRemote: process.env.NODE_ENV === 'production',
      bufferSize: 100,
      flushInterval: 30000, // 30 seconds
      ...config,
    };

    // Start flush timer for remote logging
    if (this.config.enableRemote) {
      this.startFlushTimer();
    }
  }

  /**
   * Create a child logger with additional context
   */
  public child(context: string): LoggerService {
    const childContext = this.context ? `${this.context}:${context}` : context;
    return new LoggerService(childContext, this.config);
  }

  /**
   * Log debug message
   */
  public debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log info message
   */
  public info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log warning message
   */
  public warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log error message
   */
  public error(message: string, error?: Error | any): void {
    let logData = error;
    let stack: string | undefined;

    if (error instanceof Error) {
      logData = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
      stack = error.stack;
    }

    this.log(LogLevel.ERROR, message, logData, stack);
  }

  /**
   * Log fatal error message
   */
  public fatal(message: string, error?: Error | any): void {
    let logData = error;
    let stack: string | undefined;

    if (error instanceof Error) {
      logData = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
      stack = error.stack;
    }

    this.log(LogLevel.FATAL, message, logData, stack);
  }

  /**
   * Set user context for all subsequent logs
   */
  public setUserContext(userId: string, sessionId?: string): void {
    // Store user context for future logs
    if (typeof window !== 'undefined') {
      (window as any).__loggerUserContext = { userId, sessionId };
    }
  }

  /**
   * Clear user context
   */
  public clearUserContext(): void {
    if (typeof window !== 'undefined') {
      delete (window as any).__loggerUserContext;
    }
  }

  /**
   * Manually flush logs to remote endpoint
   */
  public async flush(): Promise<void> {
    if (!this.config.enableRemote || this.buffer.length === 0) {
      return;
    }

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      await this.sendLogsRemotely(logsToSend);
    } catch (error) {
      // If remote logging fails, restore logs to buffer and log to console
      this.buffer.unshift(...logsToSend);
      console.error('Failed to send logs remotely:', error);
    }
  }

  /**
   * Update logger configuration
   */
  public configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart flush timer if needed
    if (this.config.enableRemote && !this.flushTimer) {
      this.startFlushTimer();
    } else if (!this.config.enableRemote && this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Get current buffer contents (for debugging)
   */
  public getBuffer(): LogEntry[] {
    return [...this.buffer];
  }

  // Private methods
  private log(
    level: LogLevel, 
    message: string, 
    data?: any, 
    stack?: string
  ): void {
    // Check if log level is enabled
    if (level < this.config.level) {
      return;
    }

    // Get user context if available
    const userContext = typeof window !== 'undefined' 
      ? (window as any).__loggerUserContext 
      : undefined;

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      data,
      stack,
      userId: userContext?.userId,
      sessionId: userContext?.sessionId,
      requestId: this.generateRequestId(),
    };

    // Log to console if enabled
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Add to buffer for remote logging
    if (this.config.enableRemote) {
      this.buffer.push(logEntry);

      // Flush if buffer is full
      if (this.buffer.length >= this.config.bufferSize) {
        this.flush();
      }
    }
  }

  private logToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? `[${entry.context}]` : '';
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    
    const logMessage = `${timestamp} ${levelName} ${contextStr} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, entry.data);
        break;
      case LogLevel.INFO:
        console.info(logMessage, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, entry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage, entry.data);
        if (entry.stack) {
          console.error('Stack trace:', entry.stack);
        }
        break;
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private async sendLogsRemotely(logs: LogEntry[]): Promise<void> {
    if (!this.config.remoteEndpoint) {
      throw new Error('Remote endpoint not configured');
    }

    const response = await fetch(this.config.remoteEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logs }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send logs: ${response.status} ${response.statusText}`);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export Logger class for creating instances
export { LoggerService as Logger };

// Create default logger instance
export const logger = new LoggerService('App');

// Convenience functions using default logger
export const debug = (message: string, data?: any) => logger.debug(message, data);
export const info = (message: string, data?: any) => logger.info(message, data);
export const warn = (message: string, data?: any) => logger.warn(message, data);
export const error = (message: string, error?: Error | any) => logger.error(message, error);
export const fatal = (message: string, error?: Error | any) => logger.fatal(message, error);
