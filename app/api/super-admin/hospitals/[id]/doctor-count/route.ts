import { NextRequest, NextResponse } from 'next/server';
import { 
  withErrorHandling,
  verifyAuth,
  createSuccessResponse,
  ApiError
} from '@/shared/lib/api/api-server';
import { getHospitalDoctorCount } from '@/features/super-admin/services/hospital-status';

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

  const result = await getHospitalDoctorCount(hospitalId);
  
  if (result.error) {
    throw new ApiError(
      `Failed to get doctor count: ${result.error}`,
      500,
      'DOCTOR_COUNT_FAILED'
    );
  }

  return createSuccessResponse(
    {
      hospitalId,
      totalDoctors: result.totalDoctors,
      activeDoctors: result.activeDoctors,
      inactiveDoctors: result.totalDoctors - result.activeDoctors
    },
    'Doctor count retrieved successfully'
  );
}

export const GET = withErrorHandling(handleGET);