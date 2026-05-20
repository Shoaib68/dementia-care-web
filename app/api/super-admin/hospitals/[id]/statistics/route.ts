import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { 
  withErrorHandling,
  verifyAuth,
  createSuccessResponse,
  ApiError
} from '@/shared/lib/api/api-server';

interface HospitalStatistics {
  totalDoctors: number;
  totalPatients: number;
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

  try {
    // Run both count queries in parallel for maximum performance
    const [doctorsCount, patientsCount] = await Promise.all([
      // Get total doctors count
      supabaseAdmin
        .from('doctors')
        .select('id', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId),
      
      // Get total patients count
      supabaseAdmin
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .eq('hospital_id', hospitalId)
    ]);

    // Handle errors from parallel queries
    if (doctorsCount.error) {
      console.error('Error fetching doctors count:', doctorsCount.error);
      throw new ApiError('Failed to fetch doctors count', 500, 'DOCTORS_FETCH_ERROR');
    }

    if (patientsCount.error) {
      console.error('Error fetching patients count:', patientsCount.error);
      throw new ApiError('Failed to fetch patients count', 500, 'PATIENTS_FETCH_ERROR');
    }

    const statistics: HospitalStatistics = {
      totalDoctors: doctorsCount.count || 0,
      totalPatients: patientsCount.count || 0,
    };

    // Create response with cache headers for faster subsequent requests (2 minutes cache)
    return NextResponse.json(
      {
        success: true,
        data: statistics,
        message: 'Hospital statistics retrieved successfully'
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'private, max-age=120, stale-while-revalidate=60'
        }
      }
    );

  } catch (error) {
    console.error('Error fetching hospital statistics:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch hospital statistics', 500, 'STATISTICS_FETCH_ERROR');
  }
}

export const GET = withErrorHandling(handleGET);