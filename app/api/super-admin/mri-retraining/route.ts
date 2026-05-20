import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  verifyAuth,
  createSuccessResponse,
  ApiError,
} from '@/shared/lib/api/api-server';
import { getMRIRetrainingStats } from '@/features/super-admin/services/mri-retraining.service';

async function handleGET(_request: NextRequest): Promise<NextResponse> {
  await verifyAuth('super_admin');

  const result = await getMRIRetrainingStats();

  if (!result.success) {
    throw new ApiError(
      result.error || 'Failed to fetch MRI retraining stats',
      500,
      'MRI_STATS_FETCH_FAILED'
    );
  }

  return createSuccessResponse(result.data, 'MRI retraining stats retrieved successfully');
}

export const GET = withErrorHandling(handleGET);
