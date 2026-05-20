import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { 
  withErrorHandling,
  verifyAuth,
  createSuccessResponse,
  ApiError
} from '@/shared/lib/api/api-server';

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
  const dementiaStage = searchParams.get('dementiaStage') as 'mild' | 'moderate' | 'severe' | null;
  const doctorId = searchParams.get('doctorId') || undefined;
  const status = searchParams.get('status') as 'active' | 'inactive' | null;

  try {
    // Build optimized query - apply filters in optimal order for better performance
    let query = supabaseAdmin
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
          is_active
        ),
        patient_caregiver_assignments (
          caregivers (
            id,
            first_name,
            last_name,
            phone_number
          )
        ),
        doctors!patients_primary_doctor_id_fkey (
          id,
          first_name,
          last_name,
          specialization,
          department,
          users!doctors_id_fkey (
            email
          )
        )
      `)
      .eq('hospital_id', hospital.id);

    // Apply most selective filters first (better for query optimization)
    if (doctorId !== undefined) {
      if (doctorId === '') {
        // Filter for unassigned patients (null primary_doctor_id)
        query = query.is('primary_doctor_id', null);
      } else {
        // Filter for specific doctor
        query = query.eq('primary_doctor_id', doctorId);
      }
    }
    
    if (dementiaStage) {
      query = query.eq('dementia_stage', dementiaStage);
    }
    
    if (status === 'active') {
      query = query.eq('users.is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('users.is_active', false);
    }

    // Apply search filter last (least selective)
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},patient_code.ilike.${searchTerm}`);
    }

    // Order by updated_at after all filters
    query = query.order('updated_at', { ascending: false });

    const { data: patients, error } = await query;

    if (error) {
      throw new ApiError(
        `Failed to fetch patients: ${error.message}`,
        500,
        'PATIENTS_FETCH_FAILED'
      );
    }

    return createSuccessResponse(patients || [], 'Hospital patients retrieved successfully');

  } catch (error: unknown) {
    console.error('Error fetching hospital patients:', error);
    throw new ApiError(
      error instanceof Error ? error.message : 'Failed to fetch hospital patients',
      500,
      'PATIENTS_FETCH_ERROR'
    );
  }
}

export const GET = withErrorHandling(handleGET);
