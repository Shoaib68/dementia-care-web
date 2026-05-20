import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { 
  withErrorHandling,
  verifyAuth,
  createSuccessResponse,
  ApiError
} from '@/shared/lib/api/api-server';

async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Verify authentication - only hospital admins can access doctor patient data
  const auth = await verifyAuth('hospital_admin');
  
  const { id: doctorId } = await params;
  
  if (!doctorId) {
    throw new ApiError('Doctor ID is required', 400, 'DOCTOR_ID_REQUIRED');
  }
  
  try {
    // Single optimized query: verify doctor belongs to admin's hospital
    // This replaces 2 separate queries with 1 JOIN query
    const { data: doctorData, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .select(`
        id,
        hospital_id,
        hospitals!inner (
          id,
          admin_user_id
        )
      `)
      .eq('id', doctorId)
      .eq('hospitals.admin_user_id', auth.userId)
      .single();

    if (doctorError || !doctorData) {
      throw new ApiError(
        doctorError?.code === 'PGRST116' 
          ? 'Doctor not found or not associated with your hospital'
          : 'Failed to verify doctor access',
        doctorError?.code === 'PGRST116' ? 404 : 500,
        'DOCTOR_ACCESS_DENIED'
      );
    }
    
    // Fetch patients assigned to this doctor
    const { data: patientsData, error: patientsError } = await supabaseAdmin
      .from('patients')
      .select(`
        id,
        patient_code,
        first_name,
        last_name,
        dementia_stage,
        users!patients_id_fkey (
          created_at
        )
      `)
      .eq('primary_doctor_id', doctorId)
      .order('first_name', { ascending: true })
      .limit(100);

    if (patientsError) {
      console.error('Error fetching patients:', patientsError);
      throw new ApiError(
        `Failed to fetch assigned patients: ${patientsError.message}`,
        500,
        'PATIENTS_FETCH_FAILED'
      );
    }

    // Count MRI scans submitted by this doctor in the current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    const { count: diagnosesThisMonth } = await supabaseAdmin
      .from('mri_scans')
      .select('id', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd);

    return NextResponse.json(
      {
        success: true,
        data: {
          patients: patientsData || [],
          diagnosesThisMonth: diagnosesThisMonth ?? 0,
        },
        message: 'Doctor patients retrieved successfully'
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=120, stale-while-revalidate=60'
        }
      }
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Unexpected error in handleGET:', error);
    throw new ApiError(
      'Failed to fetch doctor patients',
      500,
      'UNEXPECTED_ERROR'
    );
  }
}

export const GET = withErrorHandling(handleGET);