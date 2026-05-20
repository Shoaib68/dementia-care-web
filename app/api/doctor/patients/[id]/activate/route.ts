import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import {
  withErrorHandling,
  verifyAuth,
  createSuccessResponse,
  ApiError
} from '@/shared/lib/api/api-server';

async function handlePATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await verifyAuth('doctor');
  const { id: patientId } = await params;

  // Verify patient belongs to this doctor
  const { data: existingPatient, error: verifyError } = await supabaseAdmin
    .from('patients')
    .select('id, primary_doctor_id')
    .eq('id', patientId)
    .eq('primary_doctor_id', auth.userId)
    .single();

  if (verifyError || !existingPatient) {
    throw new ApiError('Patient not found or access denied', 404, 'PATIENT_NOT_FOUND');
  }

  // Activate the patient's user account
  const { error: patientUserError } = await supabaseAdmin
    .from('users')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', patientId);

  if (patientUserError) {
    throw new ApiError(
      `Failed to activate patient: ${patientUserError.message}`,
      500,
      'PATIENT_ACTIVATE_FAILED'
    );
  }

  // Find the assigned caregiver
  const { data: assignment } = await supabaseAdmin
    .from('patient_caregiver_assignments')
    .select('caregiver_id')
    .eq('patient_id', patientId)
    .maybeSingle();

  if (assignment?.caregiver_id) {
    const { error: caregiverUserError } = await supabaseAdmin
      .from('users')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', assignment.caregiver_id);

    if (caregiverUserError) {
      throw new ApiError(
        `Failed to activate caregiver: ${caregiverUserError.message}`,
        500,
        'CAREGIVER_ACTIVATE_FAILED'
      );
    }
  }

  return createSuccessResponse(
    { success: true, patientId, caregiverActivated: !!assignment?.caregiver_id },
    'Patient and caregiver activated successfully'
  );
}

export const PATCH = withErrorHandling(handlePATCH);
