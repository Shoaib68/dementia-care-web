/**
 * Standard API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * API Error class for consistent error handling
 */
export class ApiError extends Error {
  public status: number;
  public code?: string;
  public errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number = 500,
    code?: string,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}