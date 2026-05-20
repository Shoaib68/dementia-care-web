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

interface PatientAssignment {
  patientId: string;
  selectedDoctorId: string;
}

interface BulkAssignPatientsRequest {
  assignments: PatientAssignment[];
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  // Verify authentication - only hospital admins can bulk assign patients
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
  const body = await parseJsonBody<BulkAssignPatientsRequest>(request);
  const validatedData = validateRequestBody(
    body, 
    ['assignments']
  );
  
  const { assignments } = validatedData;

  if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
    throw new ApiError(
      'Assignments array is required and must not be empty',
      400,
      'INVALID_ASSIGNMENTS'
    );
  }

  try {
    const currentTimestamp = new Date().toISOString();
    const results = [];
    const errors = [];

    // Process each assignment
    for (const assignment of assignments) {
      const { patientId, selectedDoctorId } = assignment;

      try {
        // Verify patient belongs to this hospital
        const { data: patient, error: patientError } = await supabaseAdmin
          .from('patients')
          .select('id, hospital_id, primary_doctor_id, first_name, last_name')
          .eq('id', patientId)
          .eq('hospital_id', hospital.id)
          .single();

        if (patientError || !patient) {
          errors.push({
            patientId,
            error: 'Patient not found or not associated with hospital'
          });
          continue;
        }

        // Verify new doctor belongs to this hospital
        const { data: doctor, error: doctorError } = await supabaseAdmin
          .from('doctors')
          .select('id, hospital_id, first_name, last_name, specialization')
          .eq('id', selectedDoctorId)
          .eq('hospital_id', hospital.id)
          .single();

        if (doctorError || !doctor) {
          errors.push({
            patientId,
            error: 'Doctor not found or not associated with hospital'
          });
          continue;
        }

        // Skip if patient is already assigned to this doctor
        if (patient.primary_doctor_id === selectedDoctorId) {
          results.push({
            patientId,
            doctorId: selectedDoctorId,
            patientName: `${patient.first_name} ${patient.last_name}`,
            doctorName: `${doctor.first_name} ${doctor.last_name}`,
            status: 'no_change',
            message: 'Patient is already assigned to this doctor'
          });
          continue;
        }

        // Update the primary_doctor_id in patients table
        const { error: updatePatientError } = await supabaseAdmin
          .from('patients')
          .update({ 
            primary_doctor_id: selectedDoctorId,
            updated_at: currentTimestamp
          })
          .eq('id', patientId);

        if (updatePatientError) {
          errors.push({
            patientId,
            error: `Failed to update patient: ${updatePatientError.message}`
          });
          continue;
        }

        // Update the doctor_id in patient_doctor_assignments table
        const { error: assignmentError } = await supabaseAdmin
          .from('patient_doctor_assignments')
          .update({
            doctor_id: selectedDoctorId,
            assigned_date: currentTimestamp
          })
          .eq('patient_id', patientId)
          .eq('hospital_id', hospital.id);

        if (assignmentError) {
          console.error('Failed to update assignment record:', assignmentError);
        }

        results.push({
          patientId,
          doctorId: selectedDoctorId,
          patientName: `${patient.first_name} ${patient.last_name}`,
          doctorName: `${doctor.first_name} ${doctor.last_name}`,
          status: 'success',
          previousDoctorId: patient.primary_doctor_id,
          assignmentDate: currentTimestamp
        });

      } catch (dbError: unknown) {
        console.error('Database error during patient assignment:', dbError);
        errors.push({
          patientId,
          error: `Failed to assign patient: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const noChangeCount = results.filter(r => r.status === 'no_change').length;
    const errorCount = errors.length;

    return createSuccessResponse(
      {
        success: true,
        totalAssignments: assignments.length,
        successCount,
        noChangeCount,
        errorCount,
        results,
        errors,
        summary: {
          successful: successCount,
          noChangeNeeded: noChangeCount,
          failed: errorCount,
          message: `${successCount} patients successfully reassigned, ${noChangeCount} already assigned correctly, ${errorCount} failed`
        }
      },
      `Bulk patient assignment completed: ${successCount} successful, ${errorCount} failed`
    );

  } catch (error: unknown) {
    console.error('Error in bulk patient assignment:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred during bulk patient assignment',
      500,
      'BULK_ASSIGNMENT_ERROR'
    );
  }
}

export const POST = withErrorHandling(handlePOST);
