import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  verifyAuth,
  createSuccessResponse,
  ApiError,
} from '@/shared/lib/api/api-server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { getPatientReport } from '@/features/doctor/services/patient-report.service';

async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  // Only doctors can access patient reports
  const auth = await verifyAuth('doctor');
  const { id: patientId } = await params;

  if (!patientId) {
    throw new ApiError('Patient ID is required', 400, 'MISSING_PATIENT_ID');
  }

  // Parse year / month from query string; default to current month
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()), 10);
  const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1), 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12 || year < 2000) {
    throw new ApiError('Invalid year or month parameter', 400, 'INVALID_DATE_PARAM');
  }

  // Verify the patient belongs to the requesting doctor
  const { data: patientCheck } = await supabaseAdmin
    .from('patients')
    .select('id')
    .eq('id', patientId)
    .eq('primary_doctor_id', auth.userId)
    .maybeSingle();

  if (!patientCheck) {
    throw new ApiError('Patient not found or access denied', 404, 'PATIENT_NOT_FOUND');
  }

  const result = await getPatientReport(patientId, year, month);

  if (!result.success) {
    throw new ApiError(
      result.error ?? 'Failed to generate report',
      500,
      'REPORT_GENERATION_FAILED',
    );
  }

  return createSuccessResponse(result.data, 'Report generated successfully');
}

export const GET = withErrorHandling(handleGET);
