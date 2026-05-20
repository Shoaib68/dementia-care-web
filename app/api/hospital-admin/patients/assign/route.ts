import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { 
  withErrorHandling,
  verifyAuth,
  validateRequestBody,
  createSuccessResponse,
  parseJsonBody,
  ApiError
} from '@/shared/lib/api/api-server';

interface AssignPatientRequest {
  patientId: string;
  doctorId: string;
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  // Verify authentication - only hospital admins can assign patients
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
  const body = await parseJsonBody<AssignPatientRequest>(request);
  const validatedData = validateRequestBody(
    body, 
    ['patientId', 'doctorId']
  );
  
  const { patientId, doctorId } = validatedData;

  try {
    // Verify patient belongs to this hospital
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id, hospital_id, primary_doctor_id, first_name, last_name')
      .eq('id', patientId)
      .eq('hospital_id', hospital.id)
      .single();

    if (patientError || !patient) {
      throw new ApiError(
        'Patient not found or not associated with hospital',
        404,
        'PATIENT_NOT_FOUND'
      );
    }

    // Verify doctor belongs to this hospital
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .select('id, hospital_id, first_name, last_name, specialization')
      .eq('id', doctorId)
      .eq('hospital_id', hospital.id)
      .single();

    if (doctorError || !doctor) {
      throw new ApiError(
        'Doctor not found or not associated with hospital',
        404,
        'DOCTOR_NOT_FOUND'
      );
    }

    // Check if patient is already assigned to this doctor
    if (patient.primary_doctor_id === doctorId) {
      return createSuccessResponse(
        {
          message: 'Patient is already assigned to this doctor',
          patientId,
          doctorId,
          noChangeNeeded: true
        },
        'No assignment change needed'
      );
    }

    const currentTimestamp = new Date().toISOString();

    // Start transaction-like operations
    try {
      // 1. Update the primary_doctor_id in patients table
      const { error: updatePatientError } = await supabaseAdmin
        .from('patients')
        .update({ 
          primary_doctor_id: doctorId,
          updated_at: currentTimestamp
        })
        .eq('id', patientId);

      if (updatePatientError) {
        throw updatePatientError;
      }

      // 2. Update the doctor_id in patient_doctor_assignments table
      const { error: assignmentError } = await supabaseAdmin
        .from('patient_doctor_assignments')
        .update({
          doctor_id: doctorId,
          assigned_date: currentTimestamp
        })
        .eq('patient_id', patientId)
        .eq('hospital_id', hospital.id);

      if (assignmentError) {
        console.error('Failed to update assignment record:', assignmentError);
      }

      return createSuccessResponse(
        {
          success: true,
          patientId,
          doctorId,
          patientName: `${patient.first_name} ${patient.last_name}`,
          doctorName: `${doctor.first_name} ${doctor.last_name}`,
          assignmentDate: currentTimestamp,
          previousDoctorId: patient.primary_doctor_id
        },
        'Patient assigned to doctor successfully'
      );

    } catch (dbError: unknown) {
      console.error('Database error during patient assignment:', dbError);
      throw new ApiError(
        `Failed to assign patient: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
        500,
        'ASSIGNMENT_FAILED'
      );
    }

  } catch (error: unknown) {
    console.error('Error in patient assignment:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred during patient assignment',
      500,
      'ASSIGNMENT_ERROR'
    );
  }
}

export const POST = withErrorHandling(handlePOST);
