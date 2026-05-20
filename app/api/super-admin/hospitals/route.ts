import { NextRequest, NextResponse } from 'next/server';
import { createHospitalWithAdmin, getAllHospitals } from '@/features/super-admin/services/hospital-server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { CreateHospitalAdminRequest } from '@/features/auth/types';
import { 
  withErrorHandling,
  verifyAuth,
  validateRequestBody,
  validateEmail,
  createSuccessResponse,
  parseJsonBody,
  ApiError
} from '@/shared/lib/api/api-server';

// Interface for the hospital creation request
interface HospitalCreationRequest {
  hospitalName: string;
  address: string;
  phone: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication and super admin role
    const auth = await verifyAuth('super_admin');
    
    // Parse and validate request body
    const body = await parseJsonBody<HospitalCreationRequest>(request);
    const validatedData = validateRequestBody<HospitalCreationRequest>(
      body, 
      ['hospitalName', 'address', 'phone', 'adminFirstName', 'adminLastName', 'adminEmail']
    );
    
    const { hospitalName, address, phone, adminFirstName, adminLastName, adminEmail } = validatedData;
  
  // Validate email format
  validateEmail(adminEmail, 'adminEmail');

  // Check if email already exists in the system (double check to prevent race conditions)
  const { data: existingUser, error: emailCheckError } = await supabaseAdmin
    .from('users')
    .select('id, email, user_type')
    .eq('email', adminEmail.toLowerCase().trim())
    .maybeSingle();

  if (emailCheckError) {
    throw new ApiError(
      'Failed to verify email availability',
      500,
      'EMAIL_CHECK_FAILED'
    );
  }

  if (existingUser) {
    throw new ApiError(
      `Email address '${adminEmail}' is already registered in the system. Please use a different email address.`,
      409,
      'EMAIL_ALREADY_EXISTS'
    );
  }

  // Use the provided first and last names directly
  const firstName = (adminFirstName || '').trim();
  const lastName = (adminLastName || '').trim();

  // Normalize email for consistency
  const normalizedEmail = (adminEmail || '').toLowerCase().trim();
  
  // Create hospital admin request
  const hospitalRequest: CreateHospitalAdminRequest = {
    email: normalizedEmail,
    hospitalName,
    adminDetails: {
      firstName,
      lastName,
      phone
    }
  };

  // Create hospital and admin using the existing service
  const result = await createHospitalWithAdmin(hospitalRequest, auth.userId);

  if (!result.success) {
    throw new ApiError(
      result.error || 'Failed to create hospital',
      500,
      'HOSPITAL_CREATION_FAILED'
    );
  }

  // Store additional hospital details that aren't handled by the service
  if (result.hospitalId) {
    await supabaseAdmin
      .from('hospitals')
      .update({
        address,
        phone_number: phone
      })
      .eq('id', result.hospitalId);
  }

  return createSuccessResponse(
    {
      hospitalId: result.hospitalId,
      message: result.message,
      adminEmail: normalizedEmail
    },
    result.message || 'Hospital created successfully',
    201
  );
  } catch (error) {
    throw error;
  }
}

export const POST = withErrorHandling(handlePOST);

async function handleGET(_request: NextRequest): Promise<NextResponse> {
  // Verify authentication and super admin role
  await verifyAuth('super_admin');
  
  // Fetch all hospitals using the existing service
  const result = await getAllHospitals();

  if (!result.success) {
    throw new ApiError(
      result.error || 'Failed to fetch hospitals',
      500,
      'HOSPITAL_FETCH_FAILED'
    );
  }

  return createSuccessResponse(result.data, 'Hospitals retrieved successfully');
}

export const GET = withErrorHandling(handleGET);
