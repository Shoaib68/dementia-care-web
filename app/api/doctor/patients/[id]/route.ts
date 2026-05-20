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

interface CaregiverRecord {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string | null;
}

interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  dementiaStage?: 'mild' | 'moderate' | 'severe';
  medicalHistory?: Record<string, unknown>;
  // Caregiver information
  caregiverFirstName?: string;
  caregiverLastName?: string;
  caregiverPhone?: string;
  caregiverAddress?: string;
}

async function handleGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  // Verify authentication - only doctors can access
  const auth = await verifyAuth('doctor');
  const resolvedParams = await params;
  const { id: patientId } = resolvedParams;
  
  // Get patient with full details (without nested caregivers query)
  const { data: patient, error } = await supabaseAdmin
    .from('patients')
    .select(`
      id,
      patient_code,
      first_name,
      last_name,
      date_of_birth,
      dementia_stage,
      medical_history,
      hospital_id,
      primary_doctor_id,
      updated_at,
      created_by,
      users!patients_id_fkey (
        email,
        is_active,
        created_at
      ),
      hospitals (
        name
      ),
      doctors!patients_primary_doctor_id_fkey (
        id,
        specialization,
        license_number,
        users!doctors_id_fkey (
          email
        )
      )
    `)
    .eq('id', patientId)
    .eq('primary_doctor_id', auth.userId) // Ensure doctor can only see their patients
    .single();

  if (error || !patient) {
    throw new ApiError(
      'Patient not found or access denied',
      404,
      'PATIENT_NOT_FOUND'
    );
  }

  // Fetch caregiver data separately
  const { data: assignment } = await supabaseAdmin
    .from('patient_caregiver_assignments')
    .select('caregiver_id')
    .eq('patient_id', patientId)
    .maybeSingle();

  const patientWithCaregiver = {
    ...patient,
    patient_caregiver_assignments: [] as Array<{ caregivers: CaregiverRecord }>
  };

  if (assignment && assignment.caregiver_id) {
    const { data: caregiver } = await supabaseAdmin
      .from('caregivers')
      .select('id, first_name, last_name, phone_number, address')
      .eq('id', assignment.caregiver_id)
      .maybeSingle();

    if (caregiver) {
      patientWithCaregiver.patient_caregiver_assignments = [{
        caregivers: caregiver
      }];
    }
  }

  return createSuccessResponse(patientWithCaregiver, 'Patient retrieved successfully');
}

async function handlePUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  // Verify authentication - only doctors can update
  const auth = await verifyAuth('doctor');
  const resolvedParams = await params;
  const { id: patientId } = resolvedParams;
  
  // Parse and validate request body
  const body = await parseJsonBody<UpdatePatientRequest>(request);
  
  // Verify patient belongs to this doctor
  const { data: existingPatient, error: verifyError } = await supabaseAdmin
    .from('patients')
    .select('primary_doctor_id')
    .eq('id', patientId)
    .eq('primary_doctor_id', auth.userId)
    .single();

  if (verifyError || !existingPatient) {
    throw new ApiError(
      'Patient not found or access denied',
      404,
      'PATIENT_NOT_FOUND'
    );
  }


  // Build patient update object
  const updateData: Record<string, unknown> = {};
  if (body.firstName !== undefined) updateData.first_name = body.firstName;
  if (body.lastName !== undefined) updateData.last_name = body.lastName;
  if (body.dateOfBirth !== undefined) updateData.date_of_birth = body.dateOfBirth;
  if (body.dementiaStage !== undefined) updateData.dementia_stage = body.dementiaStage;
  if (body.medicalHistory !== undefined) updateData.medical_history = body.medicalHistory;
  
  let hasPatientUpdates = false;
  let hasCaregiverUpdates = false;
  
  // Check if there are patient updates
  if (Object.keys(updateData).length > 0) {
    hasPatientUpdates = true;
    updateData.updated_at = new Date().toISOString();

    // Update patient
    const { error: updateError } = await supabaseAdmin
      .from('patients')
      .update(updateData)
      .eq('id', patientId);

    if (updateError) {
      throw new ApiError(
        `Failed to update patient: ${updateError.message}`,
        500,
        'PATIENT_UPDATE_FAILED'
      );
    }
  }
  
  // Handle caregiver updates if any caregiver fields are provided
  const caregiverData: Record<string, string> = {};
  if (body.caregiverFirstName !== undefined) caregiverData.first_name = body.caregiverFirstName;
  if (body.caregiverLastName !== undefined) caregiverData.last_name = body.caregiverLastName;
  if (body.caregiverPhone !== undefined) caregiverData.phone_number = body.caregiverPhone;
  if (body.caregiverAddress !== undefined) caregiverData.address = body.caregiverAddress;
  
  if (Object.keys(caregiverData).length > 0) {
    hasCaregiverUpdates = true;
    
    // Get caregiver ID from patient-caregiver assignment
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('patient_caregiver_assignments')
      .select('caregiver_id')
      .eq('patient_id', patientId)
      .single();

    if (assignmentError) {
      // No caregiver assignment found
    } else if (assignment) {
      const caregiverId = assignment.caregiver_id as string;
      
      const { error: caregiverUpdateError } = await supabaseAdmin
        .from('caregivers')
        .update(caregiverData)
        .eq('id', caregiverId);

      if (caregiverUpdateError) {
        throw new ApiError(
          `Failed to update caregiver: ${caregiverUpdateError.message}`,
          500,
          'CAREGIVER_UPDATE_FAILED'
        );
      }
    }
  }
  
  // Check if any updates were made
  if (!hasPatientUpdates && !hasCaregiverUpdates) {
    throw new ApiError('No valid fields to update', 400, 'NO_UPDATE_DATA');
  }

  // Fetch the complete updated patient data
  const { data: updatedPatient, error: fetchError } = await supabaseAdmin
    .from('patients')
    .select(`
      id,
      patient_code,
      first_name,
      last_name,
      date_of_birth,
      dementia_stage,
      medical_history,
      hospital_id,
      primary_doctor_id,
      updated_at,
      created_by,
      users!patients_id_fkey (
        email,
        is_active,
        created_at
      )
    `)
    .eq('id', patientId)
    .single();

  if (fetchError || !updatedPatient) {
    throw new ApiError(
      'Failed to fetch updated patient data',
      500,
      'PATIENT_FETCH_FAILED'
    );
  }

  // Fetch caregiver data separately
  const { data: updatedAssignment } = await supabaseAdmin
    .from('patient_caregiver_assignments')
    .select('caregiver_id')
    .eq('patient_id', patientId)
    .maybeSingle();

  const finalPatient = {
    ...updatedPatient,
    patient_caregiver_assignments: [] as Array<{ caregivers: CaregiverRecord }>
  };

  if (updatedAssignment && updatedAssignment.caregiver_id) {
    const { data: updatedCaregiver } = await supabaseAdmin
      .from('caregivers')
      .select('id, first_name, last_name, phone_number, address')
      .eq('id', updatedAssignment.caregiver_id)
      .maybeSingle();

    if (updatedCaregiver) {
      finalPatient.patient_caregiver_assignments = [{
        caregivers: updatedCaregiver
      }];
    }
  }

  return createSuccessResponse(
    { success: true, patient: finalPatient },
    `Patient ${hasPatientUpdates && hasCaregiverUpdates ? 'and caregiver information' : hasPatientUpdates ? 'information' : 'caregiver information'} updated successfully`
  );
}

async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  // Verify authentication - only doctors can delete
  const auth = await verifyAuth('doctor');
  const resolvedParams = await params;
  const { id: patientId } = resolvedParams;
  
  // Verify patient belongs to this doctor
  const { data: existingPatient, error: verifyError } = await supabaseAdmin
    .from('patients')
    .select('id, primary_doctor_id')
    .eq('id', patientId)
    .eq('primary_doctor_id', auth.userId)
    .single();

  if (verifyError || !existingPatient) {
    throw new ApiError(
      'Patient not found or access denied',
      404,
      'PATIENT_NOT_FOUND'
    );
  }

  // Get caregiver ID separately
  const { data: assignment } = await supabaseAdmin
    .from('patient_caregiver_assignments')
    .select('caregiver_id')
    .eq('patient_id', patientId)
    .maybeSingle();

  const caregiverId = assignment?.caregiver_id as string | null | undefined;

  try {

    // Step 1: Delete all dependent records first
    
    // Delete patient-doctor assignments (historical)
    const { error: doctorAssignmentsError } = await supabaseAdmin
      .from('patient_doctor_assignments')
      .delete()
      .eq('patient_id', patientId);
    
    if (doctorAssignmentsError) {
      console.warn('Warning: Failed to delete patient-doctor assignments:', doctorAssignmentsError.message);
    }

    // Delete medical notes for this patient
    const { error: medicalNotesError } = await supabaseAdmin
      .from('medical_notes')
      .delete()
      .eq('patient_id', patientId);
    
    if (medicalNotesError) {
      console.warn('Warning: Failed to delete medical notes:', medicalNotesError.message);
    }

    // Delete MRI scans for this patient
    const { error: mriScansError } = await supabaseAdmin
      .from('mri_scans')
      .delete()
      .eq('patient_id', patientId);
    
    if (mriScansError) {
      console.warn('Warning: Failed to delete MRI scans:', mriScansError.message);
    }

    // Delete game sessions for this patient
    const { error: gameSessionsError } = await supabaseAdmin
      .from('game_sessions')
      .delete()
      .eq('patient_id', patientId);
    
    if (gameSessionsError) {
      console.warn('Warning: Failed to delete game sessions:', gameSessionsError.message);
    }

    // Delete schedules for this patient
    const { error: schedulesError } = await supabaseAdmin
      .from('schedules')
      .delete()
      .eq('patient_id', patientId);
    
    if (schedulesError) {
      console.warn('Warning: Failed to delete schedules:', schedulesError.message);
    }

    // Delete task completion logs
    const { error: taskLogsError } = await supabaseAdmin
      .from('task_completion_logs')
      .delete()
      .eq('patient_id', patientId);
    
    if (taskLogsError) {
      console.warn('Warning: Failed to delete task completion logs:', taskLogsError.message);
    }

    // Delete monthly reports
    const { error: monthlyReportsError } = await supabaseAdmin
      .from('monthly_reports')
      .delete()
      .eq('patient_id', patientId);
    
    if (monthlyReportsError) {
      console.warn('Warning: Failed to delete monthly reports:', monthlyReportsError.message);
    }

    // Delete location alerts
    const { error: locationAlertsError } = await supabaseAdmin
      .from('location_alerts')
      .delete()
      .eq('patient_id', patientId);
    
    if (locationAlertsError) {
      console.warn('Warning: Failed to delete location alerts:', locationAlertsError.message);
    }

    // Delete BLE connection logs
    const { error: bleLogsError } = await supabaseAdmin
      .from('ble_connection_logs')
      .delete()
      .eq('patient_id', patientId);
    
    if (bleLogsError) {
      console.warn('Warning: Failed to delete BLE connection logs:', bleLogsError.message);
    }

    // Step 2: Delete patient-caregiver assignment
    if (caregiverId) {
      const { error: assignmentError } = await supabaseAdmin
        .from('patient_caregiver_assignments')
        .delete()
        .eq('patient_id', patientId);
        
      if (assignmentError) {
        console.error('Failed to delete patient-caregiver assignment:', assignmentError);
        throw new ApiError(
          'Failed to delete patient-caregiver assignment',
          500,
          'ASSIGNMENT_DELETE_FAILED'
        );
      }
    }

    // Step 3: Delete caregiver record
    if (caregiverId) {
      const { error: caregiverError } = await supabaseAdmin
        .from('caregivers')
        .delete()
        .eq('id', caregiverId);
        
      if (caregiverError) {
        console.error('Failed to delete caregiver record:', caregiverError);
        throw new ApiError(
          'Failed to delete caregiver record',
          500,
          'CAREGIVER_DELETE_FAILED'
        );
      }
      console.log('Caregiver record deleted successfully');
    }

    // Step 4: Delete patient record
    const { error: patientError } = await supabaseAdmin
      .from('patients')
      .delete()
      .eq('id', patientId);
      
    if (patientError) {
      console.error('Failed to delete patient record:', patientError);
      throw new ApiError(
        'Failed to delete patient record',
        500,
        'PATIENT_DELETE_FAILED'
      );
    }
    console.log('Patient record deleted successfully');

    // Step 5: Delete user records
    const userIdsToDelete = caregiverId ? [patientId, caregiverId] : [patientId];
    const { error: usersError } = await supabaseAdmin
      .from('users')
      .delete()
      .in('id', userIdsToDelete);
      
    if (usersError) {
      console.error('Failed to delete user records:', usersError);
      throw new ApiError(
        'Failed to delete user records',
        500,
        'USERS_DELETE_FAILED'
      );
    }
    console.log('User records deleted successfully');

    // Step 6: Delete auth users
    try {
      const { error: patientAuthError } = await supabaseAdmin.auth.admin.deleteUser(patientId);
      if (patientAuthError) {
        console.error('Failed to delete patient auth user:', patientAuthError);
        throw new ApiError(
          'Failed to delete patient authentication record',
          500,
          'PATIENT_AUTH_DELETE_FAILED'
        );
      }
      console.log('Patient auth user deleted successfully');
      
      if (caregiverId) {
        const { error: caregiverAuthError } = await supabaseAdmin.auth.admin.deleteUser(caregiverId);
        if (caregiverAuthError) {
          console.error('Failed to delete caregiver auth user:', caregiverAuthError);
          throw new ApiError(
            'Failed to delete caregiver authentication record',
            500,
            'CAREGIVER_AUTH_DELETE_FAILED'
          );
        }
        console.log('Caregiver auth user deleted successfully');
      }
    } catch (authError: unknown) {
      console.error('Exception during auth user deletion:', authError);
      throw new ApiError(
        `Failed to delete authentication records: ${authError instanceof Error ? authError.message : 'Unknown auth error'}`,
        500,
        'AUTH_DELETE_FAILED'
      );
    }

    console.log('Patient deletion completed successfully');
    return createSuccessResponse(
      { 
        deleted: true, 
        patientId, 
        caregiverId: caregiverId || null,
        deletedRecords: {
          patient: true,
          caregiver: !!caregiverId,
          users: userIdsToDelete.length,
          authUsers: caregiverId ? 2 : 1
        }
      },
      'Patient and associated caregiver deleted successfully'
    );

  } catch (error: unknown) {
    console.error('Error during patient deletion:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      `Failed to delete patient: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500,
      'PATIENT_DELETE_FAILED'
    );
  }
}

export const GET = withErrorHandling(handleGET);
export const PUT = withErrorHandling(handlePUT);
export const DELETE = withErrorHandling(handleDELETE);
