import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { 
  withErrorHandling,
  verifyAuth,
  createSuccessResponse,
  ApiError
} from '@/shared/lib/api/api-server';

export interface MedicalNote {
  id: string;
  patient_id: string;
  doctor_id: string;
  note_content: string;
  recommendations?: string;
  follow_up_date?: string;
  created_at: string;
  hospital_id: string;
  created_by: string;
  updated_at: string;
}

async function handleGET(request: NextRequest, { params }: { params: Promise<{ patientId: string }> }): Promise<NextResponse> {
  try {
    // Verify authentication - only doctors can access
    const auth = await verifyAuth('doctor');
    const resolvedParams = await params;
    const { patientId } = resolvedParams;

    // Fetch the last medical note for this patient
    const { data: lastNote, error: noteError } = await supabaseAdmin
      .from('medical_notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (noteError) {
      throw new ApiError(
        `Failed to fetch medical note: ${noteError.message}`,
        500,
        'FETCH_NOTE_ERROR'
      );
    }

    // If a note exists, verify the doctor is authorized to access it
    if (lastNote) {
      // Check if the current doctor created this note OR if the patient belongs to this doctor
      const { data: patient, error: patientError } = await supabaseAdmin
        .from('patients')
        .select('id, primary_doctor_id')
        .eq('id', patientId)
        .maybeSingle();

      if (patientError) {
        throw new ApiError(
          'Failed to verify patient access',
          500,
          'PATIENT_FETCH_ERROR'
        );
      }

      // Allow access if:
      // 1. The current doctor created this note, OR
      // 2. The patient belongs to the current doctor
      if (lastNote.doctor_id !== auth.userId && patient?.primary_doctor_id !== auth.userId) {
        throw new ApiError(
          'You do not have permission to access this medical note',
          403,
          'ACCESS_DENIED'
        );
      }
    }

    // Return null if no note exists (this is not an error, just no data yet)
    return createSuccessResponse(lastNote || null, lastNote ? 'Medical note retrieved successfully' : 'No medical notes found for this patient');
  } catch (error) {
    throw error;
  }
}

export const GET = withErrorHandling(handleGET);
