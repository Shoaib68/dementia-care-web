/**
 * Server-Side API Utilities for Next.js Route Handlers
 * 
 * @module api-server
 * @description Utilities for consistent API request/response handling in Next.js API routes
 * 
 * Features:
 * - Standardized API response format
 * - Authentication and authorization helpers
 * - Request validation utilities
 * - Error handling and response creation
 * - JSON parsing with error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/shared/lib/supabase-server';
import { cookies } from 'next/headers';

/**
 * Standard API response interface and error class
 */
import { ApiResponse, ApiError } from './api-types';

// Re-export for convenience
export { ApiError };
export type { ApiResponse };

/**
 * Auth verification result
 */
export interface AuthResult {
  userId: string;
  userType: string;
  isActive: boolean;
}

/**
 * Standardized API error handler
 */
export async function handleApiError(error: unknown): Promise<NextResponse<ApiResponse>> {
  // Only log server errors (5xx) and unexpected errors, not client errors (4xx)
  if (error instanceof ApiError) {
    // Suppress most client error logging for cleaner terminal output
    // Only log severe server errors
    if (error.status >= 500 && !error.message.includes('timeout') && !error.message.includes('fetch failed')) {
      console.error(`API Error [${error.status}]: ${error.message}`);
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        errors: error.errors,
      },
      { status: error.status }
    );
  }
  
  // Suppress unexpected error logging for cleaner terminal output

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred',
    },
    { status: 500 }
  );
}

/**
 * Returns true for transient network/connectivity errors that should yield a 503.
 */
function isConnectivityError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code: string = (error as any)?.code ?? (error as any)?.cause?.code ?? '';
  const msg = error.message ?? '';
  return (
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'UND_ERR_CONNECT_TIMEOUT' ||
    msg.includes('fetch failed') ||
    msg.includes('ECONNRESET') ||
    msg.includes('Connect Timeout')
  );
}

/**
 * Verify user authentication and role
 */
export async function verifyAuth(
  requiredRole?: string | string[]
): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();

    // Try to get authenticated user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (user && !authError) {
      // Get user profile to verify role
      const { data: profile, error: userError } = await supabase
        .from('users')
        .select('user_type, is_active')
        .eq('id', user.id)
        .single();

      if (userError || !profile) {
        throw new ApiError('User profile not found', 404, 'USER_NOT_FOUND');
      }

      if (!profile.is_active) {
        throw new ApiError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
      }

      // Check role if specified
      if (requiredRole) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!allowedRoles.includes(profile.user_type)) {
          throw new ApiError(
            `Access denied. Required role: ${allowedRoles.join(' or ')}`,
            403,
            'INSUFFICIENT_PERMISSIONS'
          );
        }
      }

      return {
        userId: user.id,
        userType: profile.user_type,
        isActive: profile.is_active,
      };
    } else {
      // Fallback: try to get user from custom cookie
      const authCookie = cookieStore.get('dementia-care-auth');
      if (!authCookie) {
        throw new ApiError('Authentication required', 401, 'AUTHENTICATION_REQUIRED');
      }
      
      try {
        const userData = JSON.parse(authCookie.value);
        if (!userData.id || !userData.user_type || !userData.is_active) {
          throw new ApiError('Invalid authentication data', 401, 'INVALID_AUTH_DATA');
        }

        // Check role if specified
        if (requiredRole) {
          const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
          if (!allowedRoles.includes(userData.user_type)) {
            throw new ApiError(
              `Access denied. Required role: ${allowedRoles.join(' or')}`,
              403,
              'INSUFFICIENT_PERMISSIONS'
            );
          }
        }

        return {
          userId: userData.id,
          userType: userData.user_type,
          isActive: userData.is_active,
        };
      } catch (parseError) {
        throw new ApiError('Invalid authentication data', 401, 'INVALID_AUTH_DATA');
      }
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (isConnectivityError(error)) {
      throw new ApiError(
        'Authentication service temporarily unavailable. Please retry.',
        503,
        'SERVICE_UNAVAILABLE'
      );
    }
    throw new ApiError('Authentication verification failed', 500, 'AUTH_VERIFICATION_FAILED');
  }
}

/**
 * Validate request body against schema
 */
export function validateRequestBody<T>(body: any, requiredFields: (keyof T)[]): T {
  if (!body || typeof body !== 'object') {
    throw new ApiError('Request body is required', 400, 'INVALID_REQUEST_BODY');
  }

  const errors: Record<string, string[]> = {};

  for (const field of requiredFields) {
    if (!body[field as string] || (typeof body[field as string] === 'string' && body[field as string].trim() === '')) {
      errors[field as string] = [`${String(field)} is required`];
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors);
  }

  return body as T;
}

/**
 * Validate email format
 */
export function validateEmail(email: string, fieldName: string = 'email'): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const errors = { [fieldName]: ['Invalid email format'] };
    throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors);
  }
}

/**
 * Create success response
 */
export async function createSuccessResponse<T>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * API Route wrapper for consistent error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Parse JSON body with error handling
 */
export async function parseJsonBody<T = any>(request: NextRequest): Promise<T> {
  try {
    const body = await request.json();
    return body;
  } catch (error) {
    throw new ApiError('Invalid JSON in request body', 400, 'INVALID_JSON');
  }
}
