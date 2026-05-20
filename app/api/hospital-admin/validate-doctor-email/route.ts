import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { 
  withErrorHandling,
  verifyAuth,
  validateRequestBody,
  validateEmail,
  createSuccessResponse,
  parseJsonBody,
  ApiError
} from '@/shared/lib/api/api-server';

interface EmailValidationRequest {
  email: string;
}

interface EmailValidationResult {
  available: boolean;
  message: string;
  suggestions?: string[];
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  // Verify authentication - only hospital admins can validate doctor emails
  const auth = await verifyAuth('hospital_admin');
  
  // Parse and validate request body
  const body = await parseJsonBody(request);
  const validatedData = validateRequestBody(body, ['email']);
  const { email } = validatedData;
  
  // Validate email format
  validateEmail(email);
  
  const sanitizedEmail = email.toLowerCase().trim();
  
  try {
    // Check if email already exists in the users table
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, user_type, email')
      .eq('email', sanitizedEmail)
      .maybeSingle();
    
    if (userError) {
      throw new ApiError(
        'Failed to check email availability',
        500,
        'EMAIL_CHECK_FAILED'
      );
    }
    
    if (existingUser) {
      let message = 'This email address is already registered';
      
      if (existingUser.user_type === 'doctor') {
        message = 'This email is already registered to another doctor';
      } else if (existingUser.user_type === 'hospital_admin') {
        message = 'This email is already registered to a hospital administrator';
      } else if (existingUser.user_type === 'patient') {
        message = 'This email is already registered to a patient';
      } else if (existingUser.user_type === 'caregiver') {
        message = 'This email is already registered to a caregiver';
      }
      
      const result: EmailValidationResult = {
        available: false,
        message,
        suggestions: generateEmailSuggestions(sanitizedEmail)
      };
      
      return createSuccessResponse(result, 'Email validation completed');
    }
    
    // Email is available
    const result: EmailValidationResult = {
      available: true,
      message: 'Email address is available'
    };
    
    return createSuccessResponse(result, 'Email validation completed');
    
  } catch (error) {
    console.error('Error in email validation:', error);
    throw error;
  }
}

/**
 * Generate email suggestions when the requested email is not available
 */
function generateEmailSuggestions(email: string): string[] {
  const suggestions: string[] = [];
  const [localPart, domain] = email.split('@');
  
  if (!localPart || !domain) {
    return suggestions;
  }
  
  // Generate numeric variations
  for (let i = 1; i <= 3; i++) {
    suggestions.push(`${localPart}${i}@${domain}`);
  }
  
  // Generate variations with common suffixes
  const suffixes = ['dr', 'doc', 'md'];
  suffixes.forEach(suffix => {
    suggestions.push(`${localPart}.${suffix}@${domain}`);
    suggestions.push(`${suffix}.${localPart}@${domain}`);
  });
  
  // If domain is not gmail.com, suggest gmail alternatives
  if (domain !== 'gmail.com') {
    suggestions.push(`${localPart}@gmail.com`);
    suggestions.push(`dr.${localPart}@gmail.com`);
  }
  
  return suggestions.slice(0, 5); // Return max 5 suggestions
}

export const POST = withErrorHandling(handlePOST);
