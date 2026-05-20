import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { 
  withErrorHandling,
  verifyAuth,
  createSuccessResponse,
  parseJsonBody,
  ApiError
} from '@/shared/lib/api/api-server';

interface UpdateMedicalNoteRequest {
  noteContent?: string;
  recommendations?: string;
  followUpDate?: string;
}

async function handlePUT(request: NextRequest, { params }: { params: Promise<{ noteId: string }> }): Promise<NextResponse> {
  // Verify authentication - only doctors can update
  const auth = await verifyAuth('doctor');
  const resolvedParams = await params;
  const { noteId } = resolvedParams;

  // Parse request body
  const body = await parseJsonBody<UpdateMedicalNoteRequest>(request);

  // Fetch the medical note
  const { data: medicalNote, error: fetchError } = await supabaseAdmin
    .from('medical_notes')
    .select('id, patient_id, doctor_id')
    .eq('id', noteId)
    .single();

  if (fetchError || !medicalNote) {
    throw new ApiError(
      'Medical note not found',
      404,
      'NOTE_NOT_FOUND'
    );
  }

  // Verify that the doctor owns this note
  if (medicalNote.doctor_id !== auth.userId) {
    throw new ApiError(
      'You do not have permission to edit this note',
      403,
      'PERMISSION_DENIED'
    );
  }

  // Validate follow-up date is not in the past (if provided)
  if (body.followUpDate) {
    const selectedDate = new Date(body.followUpDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      throw new ApiError(
        'Follow-up date cannot be in the past',
        400,
        'INVALID_DATE'
      );
    }
  }

  // Build update object
  const updateData: Record<string, string | null> = {};
  if (body.noteContent !== undefined) updateData.note_content = body.noteContent;
  if (body.recommendations !== undefined) updateData.recommendations = body.recommendations || null;
  if (body.followUpDate !== undefined) updateData.follow_up_date = body.followUpDate || null;
  updateData.updated_at = new Date().toISOString();

  // Update medical note
  const { data: updatedNote, error: updateError } = await supabaseAdmin
    .from('medical_notes')
    .update(updateData)
    .eq('id', noteId)
    .select()
    .single();

  if (updateError || !updatedNote) {
    throw new ApiError(
      'Failed to update medical note',
      500,
      'UPDATE_NOTE_ERROR'
    );
  }

  return createSuccessResponse(updatedNote, 'Medical note updated successfully');
}

export const PUT = withErrorHandling(handlePUT);
