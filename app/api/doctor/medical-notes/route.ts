import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { 
  withErrorHandling,
  verifyAuth,
  createSuccessResponse,
  parseJsonBody,
  ApiError
} from '@/shared/lib/api/api-server';

interface CreateMedicalNoteRequest {
  patientId: string;
  noteContent: string;
  recommendations?: string;
  followUpDate?: string;
}

interface MedicalNote {
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

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  // Verify authentication - only doctors can create notes
  const auth = await verifyAuth('doctor');
  
  // Parse request body
  const body = await parseJsonBody<CreateMedicalNoteRequest>(request);
  
  // Validate required fields
  if (!body.patientId || !body.noteContent) {
    throw new ApiError(
      'Patient ID and note content are required',
      400,
      'VALIDATION_ERROR'
    );
  }

  // Verify that the patient belongs to this doctor
  const { data: patient, error: patientError } = await supabaseAdmin
    .from('patients')
    .select('id, primary_doctor_id, hospital_id')
    .eq('id', body.patientId)
    .eq('primary_doctor_id', auth.userId)
    .single();

  if (patientError || !patient) {
    throw new ApiError(
      'Patient not found or access denied',
      404,
      'PATIENT_NOT_FOUND'
    );
  }

  // Get doctor's user info to create the note
  const { data: doctorUser, error: doctorError } = await supabaseAdmin
    .from('doctors')
    .select('id')
    .eq('id', auth.userId)
    .single();

  if (doctorError || !doctorUser) {
    throw new ApiError(
      'Doctor profile not found',
      404,
      'DOCTOR_NOT_FOUND'
    );
  }

  // Validate follow-up date is not in the past
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

  // Create medical note
  const noteData = {
    patient_id: body.patientId,
    doctor_id: auth.userId,
    note_content: body.noteContent,
    recommendations: body.recommendations || null,
    follow_up_date: body.followUpDate || null,
    hospital_id: patient.hospital_id,
    created_by: auth.userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: medicalNote, error: createError } = await supabaseAdmin
    .from('medical_notes')
    .insert([noteData])
    .select()
    .single();

  if (createError || !medicalNote) {
    throw new ApiError(
      'Failed to create medical note',
      500,
      'CREATE_NOTE_ERROR'
    );
  }

  return createSuccessResponse(medicalNote, 'Medical note created successfully');
}

export const POST = withErrorHandling(handlePOST);
