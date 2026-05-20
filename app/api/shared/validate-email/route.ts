import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  verifyAuth,
  parseJsonBody,
  createSuccessResponse,
  ApiError
} from '@/shared/lib/api/api-server';
import {
  validateEmailAvailability,
  EmailValidationContext,
  EmailValidationResult
} from '@/shared/services/email-validation.service';

interface EmailValidationRequest {
  email: string;
  context?: EmailValidationContext;
}

/**
 * Shared Email Validation Endpoint
 * 
 * POST /api/shared/validate-email
 * 
 * Validates email availability across all user types with context-aware messaging.
 * Accessible by all authenticated users (doctor, hospital_admin, etc.)
 * 
 * Request body:
 * - email: string (required) - Email address to validate
 * - context: EmailValidationContext (optional) - 'doctor' | 'patient' | 'caregiver' | 'hospital_admin' | 'generic'
 * 
 * Response:
 * - available: boolean - Whether the email is available
 * - message: string - Contextual message about availability
 * - suggestions?: string[] - Alternative email suggestions if unavailable
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  // Verify authentication - all authenticated users can validate emails
  await verifyAuth();
  
  // Parse and validate request body
  const body = await parseJsonBody<EmailValidationRequest>(request);
  
  if (!body.email || typeof body.email !== 'string') {
    throw new ApiError('Email is required', 400, 'INVALID_EMAIL');
  }
  
  const { email, context = 'generic' } = body;
  
  try {
    // Use shared validation service
    const result: EmailValidationResult = await validateEmailAvailability(email, context);
    
    return createSuccessResponse<EmailValidationResult>(result, 'Email validation completed');
    
  } catch (error) {
    console.error('Email validation error:', error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      'Failed to validate email availability',
      500,
      'EMAIL_VALIDATION_ERROR'
    );
  }
}

export const POST = withErrorHandling(handlePOST);
