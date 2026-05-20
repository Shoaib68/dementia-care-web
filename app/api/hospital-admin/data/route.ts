import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/shared/lib/supabase-server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { 
  withErrorHandling,
  createSuccessResponse,
  ApiError
} from '@/shared/lib/api/api-server';

async function handleGET(_request: NextRequest): Promise<NextResponse> {
  try {
    // Create server client that can read cookies
    const supabase = await createClient();
    
    // Get current user from auth (with cookies)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new ApiError('Authentication required', 401, 'UNAUTHORIZED');
    }

    // Verify user type from database
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('user_type, is_active')
      .eq('id', user.id)
      .maybeSingle();

    if (userError || !userProfile || userProfile.user_type !== 'hospital_admin') {
      throw new ApiError('Hospital admin access required', 403, 'FORBIDDEN');
    }

    if (!userProfile.is_active) {
      throw new ApiError('Account is not active', 403, 'ACCOUNT_INACTIVE');
    }

    // Use admin client to fetch hospital data (bypassing RLS)
    const { data: hospital, error: hospitalError } = await supabaseAdmin
      .from('hospitals')
      .select('id, name, address, phone_number, is_approved, created_at, admin_user_id')
      .eq('admin_user_id', user.id)
      .maybeSingle();

    if (hospitalError) {
      console.error('Hospital query error:', hospitalError);
      throw new ApiError('Failed to fetch hospital data', 500, 'HOSPITAL_FETCH_ERROR');
    }

    if (!hospital) {
      // Check if there's any hospital for this admin (debug info)
      const { data: debugHospitals, error: debugError } = await supabaseAdmin
        .from('hospitals')
        .select('*')
        .eq('admin_user_id', user.id);

      throw new ApiError('No hospital found for this admin', 404, 'HOSPITAL_NOT_FOUND');
    }

    return createSuccessResponse({
      hospital: {
        id: hospital.id,
        name: hospital.name,
        address: hospital.address,
        phone_number: hospital.phone_number,
        is_approved: hospital.is_approved,
        created_at: hospital.created_at
      }
    }, 'Hospital data retrieved successfully');

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Unexpected error in hospital data API:', error);
    throw new ApiError('Internal server error', 500, 'INTERNAL_ERROR');
  }
}

export const GET = withErrorHandling(handleGET);
