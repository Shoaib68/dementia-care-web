import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/shared/lib/supabase-server';
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
import { DoctorManagementService, CreateDoctorRequest } from '@/features/hospital/services/doctor-management';

// Interface for doctor creation request
interface DoctorCreationRequest {
  email: string;
  firstName: string;
  lastName: string;
  specialization: string;
  department?: string;
  licenseNumber: string;
  phone?: string;
  createdAt: string;
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  // Verify authentication - only hospital admins can access
  const auth = await verifyAuth('hospital_admin');
  
  // Get hospital admin's hospital ID
  const { data: hospital, error: hospitalError } = await supabaseAdmin
    .from('hospitals')
    .select('id')
    .eq('admin_user_id', auth.userId)
    .single();

  if (hospitalError || !hospital) {
    throw new ApiError(
      'Hospital not found for admin',
      404,
      'HOSPITAL_NOT_FOUND'
    );
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  const status = searchParams.get('status') as 'active' | 'inactive' | null;
  
  // Use DoctorManagementService to fetch doctors
  const hospitalId: string = hospital.id as string;
  const result = await DoctorManagementService.getDoctorsByHospital(
    hospitalId,
    {
      search,
      status: status || undefined
    }
  );

  if (!result.success) {
    throw new ApiError(
      result.error || 'Failed to fetch doctors',
      500,
      'DOCTORS_FETCH_FAILED'
    );
  }

  return createSuccessResponse(result.data, 'Doctors retrieved successfully');
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication - only hospital admins can delete doctors
    const auth = await verifyAuth('hospital_admin');
    
    // Get hospital admin's hospital ID
    const { data: hospital, error: hospitalError } = await supabaseAdmin
      .from('hospitals')
      .select('id')
      .eq('admin_user_id', auth.userId)
      .single();

    if (hospitalError || !hospital) {
      throw new ApiError(
        'Hospital not found for admin',
        404,
        'HOSPITAL_NOT_FOUND'
      );
    }
    
    // Extract doctor ID from the request body
    const body = await parseJsonBody<{ doctorId: string }>(request);
    const validatedData = await validateRequestBody(body, ['doctorId']);
    const doctorId: string = validatedData.doctorId as string;
    
    // Use DoctorManagementService to delete doctor
    const hospitalId: string = hospital.id as string;
    const result = await DoctorManagementService.deleteDoctor(
      doctorId,
      hospitalId
    );

    if (!result.success) {
      if (result.error?.includes('not found')) {
        throw new ApiError(
          result.error || 'Doctor not found',
          404,
          'DOCTOR_NOT_FOUND'
        );
      } else if (result.hasPatients) {
        // Return patient information instead of throwing error
        return createSuccessResponse(
          {
            success: false,
            hasPatients: result.hasPatients,
            patientCount: result.patientCount,
            assignedPatients: result.assignedPatients,
            message: result.error
          },
          result.error || 'Doctor has assigned patients',
          409 // Conflict status code
        );
      } else {
        throw new ApiError(
          result.error || 'Failed to delete doctor',
          500,
          'DOCTOR_DELETION_FAILED'
        );
      }
    }

    return createSuccessResponse(
      null,
      'Doctor deleted successfully',
      200
    );
  } catch (error) {
    // Don't log expected errors (they're handled gracefully by the client)
    if (!(error instanceof ApiError)) {
      console.error('Unexpected error in handleDELETE:', error);
    }
    throw error; // Re-throw to let withErrorHandling handle it
  }
}
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication - only hospital admins can create doctors
    const auth = await verifyAuth('hospital_admin');
    // Get hospital admin's hospital ID
    const { data: hospital, error: hospitalError } = await supabaseAdmin
      .from('hospitals')
      .select('id')
      .eq('admin_user_id', auth.userId)
      .single();
    if (hospitalError || !hospital) {
      throw new ApiError(
        'Hospital not found for admin',
        404,
        'HOSPITAL_NOT_FOUND'
      );
    }
    
    // Parse and validate request body
    const body = await parseJsonBody<{
      email: string;
      firstName: string;
      lastName: string;
      specialization: string;
      department?: string;
      licenseNumber: string;
      phone?: string;
    }>(request);
    // The client sends hospitalId and createdBy which we don't need to validate as required
    // since we get them from auth verification
    const validatedData = await validateRequestBody(
      body, 
      ['email', 'firstName', 'lastName', 'specialization', 'licenseNumber']
    );
    
    const email: string = validatedData.email as string;
    const firstName: string = validatedData.firstName as string;
    const lastName: string = validatedData.lastName as string;
    const specialization: string = validatedData.specialization as string;
    const department: string | undefined = (body.department as string | undefined);
    const licenseNumber: string = validatedData.licenseNumber as string;
    const phone: string | undefined = (body.phone as string | undefined);
    // Validate email format
    await validateEmail(email);

    // Use DoctorManagementService to create doctor
    const hospitalId: string = hospital.id as string;
    const result = await DoctorManagementService.createDoctor(
      {
        email,
        firstName,
        lastName,
        specialization,
        department,
        licenseNumber,
        phone
      },
      hospitalId,
      auth.userId
    );
    if (!result.success) {
      // Check for specific error types to return appropriate status codes
      if (result.error?.includes('license number already exists')) {
        throw new ApiError(
          result.error,
          409, // Conflict - resource already exists
          'DUPLICATE_LICENSE_NUMBER'
        );
      } else if (result.error?.includes('email')) {
        throw new ApiError(
          result.error,
          400, // Bad request - invalid email
          'INVALID_EMAIL'
        );
      } else {
        throw new ApiError(
          result.error || 'Failed to create doctor',
          500,
          'DOCTOR_CREATION_FAILED'
        );
      }
    }
    return createSuccessResponse(
      {
        doctor: result.doctor,
        message: result.message
      },
      result.message || 'Doctor created successfully',
      200
    );
  } catch (error) {
    // Don't log expected validation errors (they're handled gracefully by the client)
    if (!(error instanceof ApiError)) {
      console.error('Unexpected error in handlePOST:', error);
    }
    throw error; // Re-throw to let withErrorHandling handle it
  }
}

async function handlePUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication - only hospital admins can update doctors
    const auth = await verifyAuth('hospital_admin');
    // Get hospital admin's hospital ID
    const { data: hospital, error: hospitalError } = await supabaseAdmin
      .from('hospitals')
      .select('id')
      .eq('admin_user_id', auth.userId)
      .single();
    if (hospitalError || !hospital) {
      throw new ApiError(
        'Hospital not found for admin',
        404,
        'HOSPITAL_NOT_FOUND'
      );
    }
    
    // Parse and validate request body
    const body = await parseJsonBody<{
      doctorId: string;
      firstName?: string;
      lastName?: string;
      specialization?: string;
      department?: string;
      licenseNumber?: string;
      phone?: string;
      isActive?: boolean;
    }>(request);
    // Validate that doctorId is present
    await validateRequestBody(body, ['doctorId']);
    const doctorId: string = body.doctorId as string;
    
    // Extract update fields (all optional - only include if provided)
    const updates: {
      firstName?: string;
      lastName?: string;
      specialization?: string;
      department?: string;
      licenseNumber?: string;
      phone?: string;
      isActive?: boolean;
    } = {};
    
    if (body.firstName !== undefined) updates.firstName = body.firstName;
    if (body.lastName !== undefined) updates.lastName = body.lastName;
    if (body.specialization !== undefined) updates.specialization = body.specialization;
    if (body.department !== undefined) updates.department = body.department;
    if (body.licenseNumber !== undefined) updates.licenseNumber = body.licenseNumber;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    // Use DoctorManagementService to update doctor
    const hospitalId: string = hospital.id as string;
    const result = await DoctorManagementService.updateDoctor(
      doctorId,
      hospitalId,
      updates
    );
    if (!result.success) {
      if (result.error?.includes('not found')) {
        throw new ApiError(
          result.error || 'Doctor not found',
          404,
          'DOCTOR_NOT_FOUND'
        );
      } else {
        throw new ApiError(
          result.error || 'Failed to update doctor',
          500,
          'DOCTOR_UPDATE_FAILED'
        );
      }
    }
    return createSuccessResponse(
      null,
      'Doctor updated successfully',
      200
    );
  } catch (error) {
    // Don't log expected validation errors (they're handled gracefully by the client)
    if (!(error instanceof ApiError)) {
      console.error('Unexpected error in handlePUT:', error);
    }
    throw error; // Re-throw to let withErrorHandling handle it
  }
}

export const GET = withErrorHandling(handleGET);
export const POST = withErrorHandling(handlePOST);
export const PUT = withErrorHandling(handlePUT);
export const DELETE = withErrorHandling(handleDELETE);
