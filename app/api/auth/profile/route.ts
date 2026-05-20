import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { 
  withErrorHandling,
  verifyAuth,
  createSuccessResponse,
  ApiError
} from '@/shared/lib/api/api-server';

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Use the existing verifyAuth function that properly handles server-side auth
    const auth = await verifyAuth();
    const authUserId = auth.userId;

    // Get user profile from users table using admin client to bypass RLS
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .single();

    if (userError || !userProfile) {
      // Distinguish a genuine missing record from a transient network/DB error.
      // Returning 404 for a connectivity issue misleads the auth service into
      // treating the user as non-existent (causing silent logouts).
      if (userError) {
        const msg = userError.message ?? '';
        const isConnectivityError =
          msg.includes('fetch failed') ||
          msg.includes('timeout') ||
          msg.includes('aborted') ||
          msg.includes('ECONNRESET') ||
          msg.includes('Connect Timeout');

        if (isConnectivityError) {
          throw new ApiError(
            'Database temporarily unavailable. Please retry.',
            503,
            'SERVICE_UNAVAILABLE'
          );
        }
      }
      throw new ApiError('User profile not found', 404, 'USER_NOT_FOUND');
    }

    // Check if user type is allowed for web portal
    const webPortalRoles = ['super_admin', 'hospital_admin', 'doctor'];
    if (!webPortalRoles.includes(userProfile.user_type)) {
      throw new ApiError('Access denied for this user type', 403, 'ACCESS_DENIED');
    }

    const extendedUser: Record<string, unknown> = { ...userProfile };

    // Fetch doctor profile data for doctors using admin client
    if (userProfile.user_type === 'doctor') {
      const { data: doctorProfile, error: doctorError } = await supabaseAdmin
        .from('doctors')
        .select(`
          hospital_id,
          specialization,
          license_number,
          hospitals!inner(
            name
          )
        `)
        .eq('id', authUserId)
        .maybeSingle();

      if (!doctorError && doctorProfile) {
        extendedUser.doctor_profile = {
          hospital_id: doctorProfile.hospital_id,
          hospital_name: (doctorProfile.hospitals as { name: string }).name,
          specialization: doctorProfile.specialization,
          license_number: doctorProfile.license_number,
        };
      }
    }

    return createSuccessResponse(extendedUser, 'Profile retrieved successfully');

  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      'Failed to retrieve user profile',
      500,
      'PROFILE_FETCH_FAILED'
    );
  }
}

export const GET = withErrorHandling(handleGET);
