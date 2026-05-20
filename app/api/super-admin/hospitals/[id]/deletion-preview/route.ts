import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { 
  withErrorHandling,
  verifyAuth,
  createSuccessResponse,
  ApiError
} from '@/shared/lib/api/api-server';

interface DeletionPreviewData {
  hospitalName: string;
  doctors: number;
  patients: number;
  medicalNotes: number;
  mriScans: number;
  gameSessions: number;
  schedules: number;
  totalRecords: number;
}

async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Verify authentication and super admin role
  await verifyAuth('super_admin');
  
  const { id: hospitalId } = await params;
  if (!hospitalId) {
    throw new ApiError('Hospital ID is required', 400, 'MISSING_HOSPITAL_ID');
  }

  // First, verify hospital exists and get its name
  const { data: hospital, error: hospitalError } = await supabaseAdmin
    .from('hospitals')
    .select('name')
    .eq('id', hospitalId)
    .single();

  if (hospitalError || !hospital) {
    throw new ApiError('Hospital not found', 404, 'HOSPITAL_NOT_FOUND');
  }

  try {
    // Get count of doctors associated with this hospital
    const { count: doctorsCount, error: doctorsError } = await supabaseAdmin
      .from('doctors')
      .select('id', { count: 'exact' })
      .eq('hospital_id', hospitalId);

    if (doctorsError) {
      throw new ApiError('Failed to count doctors', 500, 'DOCTORS_COUNT_FAILED');
    }

    // Get count of patients associated with doctors in this hospital
    const { count: patientsCount, error: patientsError } = await supabaseAdmin
      .from('patients')
      .select(`
        id,
        doctors!inner (
          hospital_id
        )
      `, { count: 'exact' })
      .eq('doctors.hospital_id', hospitalId);

    if (patientsError) {
      // Continue with 0 count if there's an error
    }

    // Get count of medical notes for patients in this hospital
    const { count: medicalNotesCount, error: medicalNotesError } = await supabaseAdmin
      .from('medical_notes')
      .select(`
        id,
        patients!inner (
          doctors!inner (
            hospital_id
          )
        )
      `, { count: 'exact' })
      .eq('patients.doctors.hospital_id', hospitalId);

    if (medicalNotesError) {
      // Continue with 0 count if there's an error
    }

    // Get count of MRI scans for this hospital
    const { count: mriScansCount, error: mriScansError } = await supabaseAdmin
      .from('mri_scans')
      .select('id', { count: 'exact' })
      .eq('hospital_id', hospitalId);

    if (mriScansError) {
      // Continue with 0 count if there's an error
    }

    // Get count of game sessions for patients in this hospital
    const { count: gameSessionsCount, error: gameSessionsError } = await supabaseAdmin
      .from('game_sessions')
      .select(`
        id,
        patients!inner (
          doctors!inner (
            hospital_id
          )
        )
      `, { count: 'exact' })
      .eq('patients.doctors.hospital_id', hospitalId);

    if (gameSessionsError) {
      // Continue with 0 count if there's an error
    }

    // Get count of schedules for patients in this hospital
    const { count: schedulesCount, error: schedulesError } = await supabaseAdmin
      .from('schedules')
      .select(`
        id,
        patients!inner (
          doctors!inner (
            hospital_id
          )
        )
      `, { count: 'exact' })
      .eq('patients.doctors.hospital_id', hospitalId);

    if (schedulesError) {
      // Continue with 0 count if there's an error
    }

    // Calculate totals
    const doctors = doctorsCount || 0;
    const patients = patientsCount || 0;
    const medicalNotes = medicalNotesCount || 0;
    const mriScans = mriScansCount || 0;
    const gameSessions = gameSessionsCount || 0;
    const schedules = schedulesCount || 0;

    const totalRecords = doctors + patients + medicalNotes + mriScans + gameSessions + schedules;

    const deletionData: DeletionPreviewData = {
      hospitalName: hospital.name as string,
      doctors,
      patients,
      medicalNotes,
      mriScans,
      gameSessions,
      schedules,
      totalRecords,
    };

    return createSuccessResponse(
      deletionData,
      'Deletion preview data retrieved successfully'
    );

  } catch (error) {
    throw new ApiError(
      'Failed to get deletion preview data',
      500,
      'DELETION_PREVIEW_FAILED'
    );
  }
}

export const GET = withErrorHandling(handleGET);
