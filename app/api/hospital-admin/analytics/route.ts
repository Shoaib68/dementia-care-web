import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { 
  withErrorHandling,
  verifyAuth,
  createSuccessResponse,
  ApiError
} from '@/shared/lib/api/api-server';
import { getHospitalAnalytics } from '@/features/hospital/services/hospital-analytics.service';

async function handlePOST(request: NextRequest): Promise<NextResponse> {

  
  // Verify authentication - only hospital admins can access analytics
  const auth = await verifyAuth('hospital_admin');

  
  // Get hospital admin's hospital ID from the database
  const { data: hospital, error: hospitalError } = await supabaseAdmin
    .from('hospitals')
    .select('id, name')
    .eq('admin_user_id', auth.userId)
    .single();



  if (hospitalError || !hospital) {
    throw new ApiError(
      'Hospital not found for admin',
      404,
      'HOSPITAL_NOT_FOUND'
    );
  }


  
  // Fetch hospital analytics using the hospital ID from the database
  const result = await getHospitalAnalytics(hospital.id);

  if (!result.success) {
    console.error('Analytics service error:', result.error);
    throw new ApiError(
      result.error || 'Failed to fetch hospital analytics',
      500,
      'ANALYTICS_FETCH_FAILED'
    );
  }



  return createSuccessResponse(result.data, 'Hospital analytics retrieved successfully');
}

export const POST = withErrorHandling(handlePOST);

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { success: false, message: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
