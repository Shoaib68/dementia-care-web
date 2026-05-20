import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  verifyAuth,
  createSuccessResponse,
  ApiError,
} from '@/shared/lib/api/api-server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';

const BUCKET_NAME = 'mri-scans';

/**
 * Ensure the mri-scans storage bucket exists (public, so we can get public URLs).
 * Silently ignores "already exists" errors.
 */
async function ensureBucket(): Promise<void> {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
    fileSizeLimit: 10 * 1024 * 1024, // 10 MB
  });

  if (error && !error.message.toLowerCase().includes('already exists')) {
    // Non-duplicate errors are real problems
    throw new ApiError(
      `Storage setup failed: ${error.message}`,
      500,
      'STORAGE_SETUP_FAILED'
    );
  }
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  // 1. Verify the caller is an authenticated doctor
  const auth = await verifyAuth('doctor');

  // 2. Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw new ApiError('Invalid multipart form data', 400, 'INVALID_FORM_DATA');
  }

  const file              = formData.get('file')               as File   | null;
  const aiStageRaw        = formData.get('ai_diagnosis_stage') as string | null;
  const aiConfidenceRaw   = formData.get('ai_confidence_score')as string | null;
  const doctorVerifiedRaw = formData.get('doctor_verified')    as string | null;
  const doctorStageRaw    = formData.get('doctor_final_stage') as string | null;
  const doctorNotes       = formData.get('doctor_notes')       as string | null;
  const patientId         = formData.get('patient_id')         as string | null;

  // 3. Validate required fields
  if (!file)              throw new ApiError('MRI image file is required',     400, 'MISSING_FILE');
  if (!aiStageRaw)        throw new ApiError('AI diagnosis stage is required', 400, 'MISSING_AI_STAGE');
  if (!aiConfidenceRaw)   throw new ApiError('AI confidence score is required',400, 'MISSING_CONFIDENCE');
  if (!doctorVerifiedRaw) throw new ApiError('doctor_verified flag is required',400,'MISSING_VERIFICATION');
  if (!doctorStageRaw)    throw new ApiError('doctor_final_stage is required', 400, 'MISSING_FINAL_STAGE');

  const aiConfidenceScore = parseFloat(aiConfidenceRaw);
  if (isNaN(aiConfidenceScore)) {
    throw new ApiError('ai_confidence_score must be a number', 400, 'INVALID_CONFIDENCE');
  }

  const doctorVerified  = doctorVerifiedRaw === 'true';
  // DB CHECK constraint: feedback_status IN ('correct', 'incorrect')
  const feedbackStatus  = doctorVerified ? 'correct' : 'incorrect';

  // Map AI model stage values to the exact values allowed by the DB check constraints:
  //   valid_ai_stage / valid_doctor_stage:
  //   ('Non Demented', 'Mild', 'Moderate', 'Severe')
  const stageToDb = (stage: string): string | null => {
    switch (stage) {
      case 'Non':      return 'Non Demented';
      case 'Mild':     return 'Mild';
      case 'Moderate': return 'Moderate';
      case 'Severe':   return 'Severe';
      default:         return null;
    }
  };

  const aiStageMapped     = stageToDb(aiStageRaw);
  const doctorStageMapped = stageToDb(doctorStageRaw);

  // 4. Fetch the doctor's profile to get hospital_id
  //    In this codebase doctors.id == auth.users.id (same UUID pattern as patients)
  const { data: doctorProfile, error: doctorError } = await supabaseAdmin
    .from('doctors')
    .select('id, hospital_id')
    .eq('id', auth.userId)
    .single();

  if (doctorError || !doctorProfile) {
    throw new ApiError('Doctor profile not found', 404, 'DOCTOR_NOT_FOUND');
  }

  const doctorId   = doctorProfile.id          as string;
  const hospitalId = doctorProfile.hospital_id as string;

  // 5. Ensure storage bucket exists
  await ensureBucket();

  // 6. Upload image to Supabase Storage
  //    Path: {hospitalId}/{doctorId}/{timestamp}-{sanitised-filename}
  const safeName    = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${hospitalId}/${doctorId}/${Date.now()}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer      = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new ApiError(
      `Image upload failed: ${uploadError.message}`,
      500,
      'UPLOAD_FAILED'
    );
  }

  // 7. Get the public URL for the uploaded file
  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  const fileUrl = urlData.publicUrl;

  // 8. Build the mri_scans row payload
  const now      = new Date().toISOString();
  const scanDate = now.split('T')[0]; // YYYY-MM-DD

  const insertPayload: Record<string, unknown> = {
    doctor_id:             doctorId,
    hospital_id:           hospitalId,
    uploaded_by:           auth.userId,
    scan_date:             scanDate,
    file_url:              fileUrl,
    // Use mapped (lowercase) values to satisfy the DB check constraint
    ai_diagnosis_stage:    aiStageMapped,      // null when AI says 'Non' (non-demented)
    ai_confidence_score:   aiConfidenceScore,
    doctor_verified:       doctorVerified,
    doctor_final_stage:    doctorStageMapped,  // no constraint on this column
    feedback_status:       feedbackStatus,
    feedback_submitted_at: now,
    updated_at:            now,
  };

  // Optional fields
  if (doctorNotes?.trim())  insertPayload.doctor_notes = doctorNotes.trim();
  if (patientId?.trim())    insertPayload.patient_id   = patientId.trim();

  // 9. Insert into mri_scans table
  const { data: scanRecord, error: insertError } = await supabaseAdmin
    .from('mri_scans')
    .insert(insertPayload)
    .select('id')
    .single();

  if (insertError) {
    // Clean up the uploaded image if the DB write fails
    await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([storagePath])
      .catch(() => {/* best-effort cleanup */});

    throw new ApiError(
      `Failed to save scan record: ${insertError.message}`,
      500,
      'DB_INSERT_FAILED'
    );
  }

  return createSuccessResponse(
    {
      scanId:         scanRecord.id,
      fileUrl,
      feedbackStatus,
    },
    'MRI scan and doctor feedback saved successfully',
    201
  );
}

export const POST = withErrorHandling(handlePOST);
