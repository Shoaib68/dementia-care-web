import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { 
  withErrorHandling,
  verifyAuth,
  createSuccessResponse,
  ApiError
} from '@/shared/lib/api/api-server';

export interface RecentActivity {
  id: string;
  type: 'patient_registration' | 'mri_upload' | 'medical_note';
  patientName: string;
  patientId: string;
  description: string;
  timestamp: string;
  metadata?: {
    dementiaStage?: string;
    scanType?: string;
    noteType?: string;
  };
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  // Verify authentication - only doctors can access
  const auth = await verifyAuth('doctor');
  
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const doctorId = auth.userId;
  
  try {
    const activities: RecentActivity[] = [];
    
    // Get recent patient registrations (last 30 days)
    const { data: recentPatients, error: patientsError } = await supabaseAdmin
      .from('patients')
      .select(`
        id,
        first_name,
        last_name,
        dementia_stage,
        created_at
      `)
      .eq('primary_doctor_id', doctorId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 20)); // Limit to prevent excessive data

    if (!patientsError && recentPatients) {
      recentPatients.forEach((patient) => {
        activities.push({
          id: `patient_${patient.id}`,
          type: 'patient_registration',
          patientName: `${patient.first_name} ${patient.last_name}`,
          patientId: patient.id,
          description: `New patient registered with ${patient.dementia_stage} dementia stage`,
          timestamp: patient.created_at,
          metadata: {
            dementiaStage: patient.dementia_stage
          }
        });
      });
    }

    // Get recent MRI scans (last 30 days)
    const { data: recentMRIScans, error: mriError } = await supabaseAdmin
      .from('mri_scans')
      .select(`
        id,
        patient_id,
        scan_type,
        created_at,
        patients!inner (
          id,
          first_name,
          last_name,
          primary_doctor_id
        )
      `)
      .eq('patients.primary_doctor_id', doctorId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 20));

    if (!mriError && recentMRIScans) {
      recentMRIScans.forEach((scan) => {
        activities.push({
          id: `mri_${scan.id}`,
          type: 'mri_upload',
          patientName: `${scan.patients.first_name} ${scan.patients.last_name}`,
          patientId: scan.patient_id,
          description: `MRI scan uploaded (${scan.scan_type || 'Standard'})`,
          timestamp: scan.created_at,
          metadata: {
            scanType: scan.scan_type
          }
        });
      });
    }

    // Get recent medical notes (last 30 days)
    const { data: recentNotes, error: notesError } = await supabaseAdmin
      .from('medical_notes')
      .select(`
        id,
        patient_id,
        note_type,
        created_at,
        patients!inner (
          id,
          first_name,
          last_name,
          primary_doctor_id
        )
      `)
      .eq('patients.primary_doctor_id', doctorId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 20));

    if (!notesError && recentNotes) {
      recentNotes.forEach((note) => {
        activities.push({
          id: `note_${note.id}`,
          type: 'medical_note',
          patientName: `${note.patients.first_name} ${note.patients.last_name}`,
          patientId: note.patient_id,
          description: `Medical note added${note.note_type ? ` (${note.note_type})` : ''}`,
          timestamp: note.created_at,
          metadata: {
            noteType: note.note_type
          }
        });
      });
    }

    // Sort all activities by timestamp (most recent first) and limit results
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return createSuccessResponse(sortedActivities, 'Recent activities retrieved successfully');

  } catch (error: unknown) {
    console.error('Error fetching recent activity:', error);
    throw new ApiError(
      'Failed to fetch recent activity',
      500,
      'RECENT_ACTIVITY_FETCH_FAILED'
    );
  }
}

export const GET = withErrorHandling(handleGET);
