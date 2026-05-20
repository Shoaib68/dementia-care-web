import { NextRequest, NextResponse } from 'next/server';
import { 
  withErrorHandling,
  verifyAuth,
  parseJsonBody,
  createSuccessResponse,
  ApiError
} from '@/shared/lib/api/api-server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';

interface EmailValidationRequest {
  email: string;
}

interface EmailValidationResponse {
  available: boolean;
  message: string;
  suggestions?: string[];
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  // Verify authentication - only doctors can validate patient emails
  const auth = await verifyAuth('doctor');
  
  // Parse and validate request body
  const body = await parseJsonBody<EmailValidationRequest>(request);
  
  if (!body.email || typeof body.email !== 'string') {
    throw new ApiError('Email is required', 400, 'INVALID_EMAIL');
  }

  const email = body.email.toLowerCase().trim();
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return createSuccessResponse<EmailValidationResponse>({
      available: false,
      message: 'Please enter a valid email address'
    });
  }

  try {
    // Check if email already exists in the users table
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, user_type')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      console.error('Error checking email availability:', userError);
      throw new ApiError(
        'Failed to validate email availability', 
        500, 
        'EMAIL_VALIDATION_FAILED'
      );
    }

    if (existingUser) {
      let message = '';
      switch (existingUser.user_type) {
        case 'patient':
          message = 'This email is already registered to a patient account';
          break;
        case 'caregiver':
          message = 'This email is already registered to a caregiver account';
          break;
        case 'doctor':
          message = 'This email is already registered to a doctor account';
          break;
        case 'hospital_admin':
          message = 'This email is already registered to a hospital admin account';
          break;
        case 'super_admin':
          message = 'This email is already registered to a system administrator account';
          break;
        default:
          message = 'This email is already registered in the system';
      }

      return createSuccessResponse<EmailValidationResponse>({
        available: false,
        message,
        suggestions: generateEmailSuggestions(email)
      });
    }

    // Check Supabase Auth for any pending or deleted users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error checking auth users:', authError);
      // Don't fail the request for auth check failures, continue with database validation
    } else {
      const authUser = authUsers.users.find(user => user.email === email);
      if (authUser) {
        return createSuccessResponse<EmailValidationResponse>({
          available: false,
          message: 'This email is already associated with an account',
          suggestions: generateEmailSuggestions(email)
        });
      }
    }

    // Email is available
    return createSuccessResponse<EmailValidationResponse>({
      available: true,
      message: 'Email address is available'
    });

  } catch (error) {
    console.error('Email validation error:', error);
    throw new ApiError(
      'Failed to validate email availability',
      500,
      'EMAIL_VALIDATION_ERROR'
    );
  }
}

/**
 * Generate email suggestions when the requested email is taken
 */
function generateEmailSuggestions(email: string): string[] {
  const [localPart, domain] = email.split('@');
  const suggestions: string[] = [];
  
  // Generate numbered suggestions
  for (let i = 1; i <= 3; i++) {
    suggestions.push(`${localPart}${i}@${domain}`);
  }
  
  // Generate variations with common suffixes
  const suffixes = ['care', 'patient', 'user'];
  suffixes.forEach(suffix => {
    suggestions.push(`${localPart}.${suffix}@${domain}`);
  });
  
  return suggestions.slice(0, 3); // Return only first 3 suggestions
}

export const POST = withErrorHandling(handlePOST);
