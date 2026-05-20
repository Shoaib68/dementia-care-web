import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { 
  withErrorHandling,
  verifyAuth,
  validateRequestBody,
  validateEmail,
  createSuccessResponse,
  parseJsonBody,
  ApiError
} from '@/shared/lib/api/api-server';
import CascadeDeletionService from '@/shared/services/cascade-deletion.service';
import { updateHospitalStatus, getHospitalDoctorCount } from '@/features/super-admin/services/hospital-status';

type HospitalAdmin = {
  id: string;
  email: string;
  is_active: boolean;
};

type HospitalRecord = {
  id: string;
  admin_user_id: string;
  users?: HospitalAdmin | null;
};

// Interface for hospital update request
interface HospitalUpdateRequest {
  hospitalName?: string;
  address?: string;
  phone?: string;
  adminEmail?: string;
  isApproved?: boolean;
  isActive?: boolean;
}

async function handlePUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Verify authentication and super admin role
  await verifyAuth('super_admin');
  
  const { id: hospitalId } = await params;
  if (!hospitalId) {
    throw new ApiError('Hospital ID is required', 400, 'MISSING_HOSPITAL_ID');
  }

  // Parse and validate request body
  const body = await parseJsonBody<HospitalUpdateRequest>(request);
  
  // Validate email format if provided
  if (body.adminEmail) {
    validateEmail(body.adminEmail, 'adminEmail');
  }

  // Start a transaction by getting the hospital first
  const { data: hospital, error: fetchError } = await supabaseAdmin
    .from('hospitals')
    .select(`
      *,
      users!hospitals_admin_user_id_fkey (
        id,
        email,
        is_active
      )
    `)
    .eq('id', hospitalId)
    .single();

  if (fetchError || !hospital) {
    throw new ApiError('Hospital not found', 404, 'HOSPITAL_NOT_FOUND');
  }

  const hospitalRecord = hospital as unknown as HospitalRecord;
  const hospitalAdmin = hospitalRecord.users;

  // Update hospital information
  const hospitalUpdates: Record<string, string | boolean> = {};
  if (body.hospitalName) hospitalUpdates.name = body.hospitalName;
  if (body.address) hospitalUpdates.address = body.address;
  if (body.phone) hospitalUpdates.phone_number = body.phone;
  if (typeof body.isApproved === 'boolean') hospitalUpdates.is_approved = body.isApproved;

  if (Object.keys(hospitalUpdates).length > 0) {
    const { error: hospitalUpdateError } = await supabaseAdmin
      .from('hospitals')
      .update(hospitalUpdates)
      .eq('id', hospitalId);

    if (hospitalUpdateError) {
      throw new ApiError(
        'Failed to update hospital information',
        500,
        'HOSPITAL_UPDATE_FAILED'
      );
    }
    
    // Update the users table timestamp when hospital info is modified
    await supabaseAdmin
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', hospitalAdmin?.id || hospitalRecord.admin_user_id);
  }

  // Update user information (admin email)
  const userUpdates: Record<string, string> = {};
  if (body.adminEmail && body.adminEmail !== hospitalAdmin?.email) {
    userUpdates.email = body.adminEmail;
    
    // Add updated_at timestamp to track when hospital admin info was updated
    userUpdates.updated_at = new Date().toISOString();
    
    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update(userUpdates)
      .eq('id', hospitalAdmin?.id || hospitalRecord.admin_user_id);

    if (userUpdateError) {
      throw new ApiError(
        'Failed to update admin information',
        500,
        'ADMIN_UPDATE_FAILED'
      );
    }
  }
  
  // Handle status updates with cascading behavior
  if (typeof body.isActive === 'boolean') {
    // Use the dedicated hospital status service for cascading updates
    const statusResult = await updateHospitalStatus({
      hospitalId,
      isActive: body.isActive,
      updateDoctors: true // Enable cascading updates to doctors
    });
    
    if (!statusResult.success) {
      const errorMessage = statusResult.errors.join(', ');
      console.error(`❌ Hospital status update failed:`, errorMessage);
      throw new ApiError(
        `Failed to update hospital status: ${errorMessage}`,
        500,
        'STATUS_UPDATE_FAILED'
      );
    }
  }

  // Fetch updated hospital data
  const { data: updatedHospital, error: refetchError } = await supabaseAdmin
    .from('hospitals')
    .select(`
      *,
      users!hospitals_admin_user_id_fkey (
        id,
        email,
        is_active,
        updated_at
      )
    `)
    .eq('id', hospitalId)
    .single();

  if (refetchError || !updatedHospital) {
    throw new ApiError('Failed to retrieve updated hospital', 500, 'REFETCH_FAILED');
  }

  // Get doctor counts for the response
  const doctorCounts = await getHospitalDoctorCount(hospitalId);
  
  return createSuccessResponse(
    {
      ...updatedHospital,
      doctorStats: {
        totalDoctors: doctorCounts.totalDoctors || 0,
        activeDoctors: doctorCounts.activeDoctors || 0
      }
    },
    'Hospital updated successfully'
  );
}

interface DeletionCounts {
  doctors: number;
  patients: number;
  medicalNotes: number;
  mriScans: number;
  gameSessions: number;
  schedules: number;
  iotDevices: number;
  bleConnections: number;
  locationAlerts: number;
  monthlyReports: number;
}

async function handleDELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // Verify authentication and super admin role
  await verifyAuth('super_admin');
  
  const { id: hospitalId } = await params;
  if (!hospitalId) {
    throw new ApiError('Hospital ID is required', 400, 'MISSING_HOSPITAL_ID');
  }


  // First, get the hospital and its admin user info
  const { data: hospital, error: fetchError } = await supabaseAdmin
    .from('hospitals')
    .select(`
      *,
      admin_user_id
    `)
    .eq('id', hospitalId)
    .single();

  if (fetchError || !hospital) {
    throw new ApiError('Hospital not found', 404, 'HOSPITAL_NOT_FOUND');
  }

  const hospitalRecord = hospital as unknown as HospitalRecord;

  const deletionCounts: DeletionCounts = {
    doctors: 0,
    patients: 0,
    medicalNotes: 0,
    mriScans: 0,
    gameSessions: 0,
    schedules: 0,
    iotDevices: 0,
    bleConnections: 0,
    locationAlerts: 0,
    monthlyReports: 0,
  };

  // Track all user IDs for auth cleanup
  const allUserIdsToDelete: string[] = [];

  try {
    // **PHASE 1: Gather all related entity IDs for cascade deletion**
    
    // Get all doctors in this hospital
    const { data: doctors, error: doctorsError } = await supabaseAdmin
      .from('doctors')
      .select('id')
      .eq('hospital_id', hospitalId);

    if (doctorsError) {
      console.error('Error fetching doctors for deletion:', doctorsError);
      throw new ApiError('Failed to fetch doctors for deletion', 500, 'DOCTORS_FETCH_FAILED');
    }

    const doctorIds = (doctors ?? []).map(d => (d as { id: string }).id);
    // Doctor IDs ARE the user IDs (doctors.id is FK to users.id)
    allUserIdsToDelete.push(...doctorIds);

    // Get all patients assigned to these doctors
    let patientIds: string[] = [];
    if (doctorIds.length > 0) {
      const { data: patients, error: patientsError } = await supabaseAdmin
        .from('patients')
        .select('id')
        .in('primary_doctor_id', doctorIds);

      if (patientsError) {
        console.error('Error fetching patients for deletion:', patientsError);
        throw new ApiError('Failed to fetch patients for deletion', 500, 'PATIENTS_FETCH_FAILED');
      }

      // Assign patient data to arrays
      patientIds = (patients ?? []).map(p => (p as { id: string }).id);
      // Patient IDs ARE the user IDs (patients.id is FK to users.id)
      allUserIdsToDelete.push(...patientIds);
    }

    // Get all caregivers linked to these patients
    let caregiverIds: string[] = [];
    if (patientIds.length > 0) {
      const { data: caregivers, error: caregiversError } = await supabaseAdmin
        .from('patient_caregiver_assignments')
        .select(`
          caregivers!inner(
            id
          )
        `)
        .in('patient_id', patientIds);

      if (caregiversError) {
        console.error('Error fetching caregivers for deletion:', caregiversError);
        throw new ApiError('Failed to fetch caregivers for deletion', 500, 'CAREGIVERS_FETCH_FAILED');
      }

      // Assign caregiver data to arrays
      caregiverIds = (caregivers ?? []).map(
        c => (c as unknown as { caregivers: { id: string } }).caregivers.id
      );
      // Caregiver IDs ARE the user IDs (caregivers.id is FK to users.id)
      allUserIdsToDelete.push(...caregiverIds);
    }

    // Add hospital admin to users to delete
    allUserIdsToDelete.push(hospitalRecord.admin_user_id as string);

    // **PHASE 2: Execute cascade deletion using the service**
    const deletionConfig = CascadeDeletionService.createHospitalDeletionConfig(
      hospitalId,
      {
        doctorIds,
        patientIds,
        caregiverIds,
        allUserIds: allUserIdsToDelete
      }
    );

    // Validate configuration
    const validation = CascadeDeletionService.validateDeletionConfig(deletionConfig);
    if (!validation.isValid) {
      throw new ApiError(
        `Invalid deletion configuration: ${validation.errors.join(', ')}`,
        500,
        'INVALID_DELETION_CONFIG'
      );
    }

    // Execute the cascade deletion
    const result = await CascadeDeletionService.executeCascadeDeletion(deletionConfig);

    // Map service result to legacy format for compatibility
    const legacyDeletionCounts: DeletionCounts = {
      doctors: result.counts.doctors || 0,
      patients: result.counts.patients || 0,
      medicalNotes: result.counts.medicalNotes || 0,
      mriScans: result.counts.mriScans || 0,
      gameSessions: result.counts.gameSessions || 0,
      schedules: result.counts.schedules || 0,
      iotDevices: result.counts.iotDevices || 0,
      bleConnections: result.counts.bleConnections || 0,
      locationAlerts: result.counts.locationAlerts || 0,
      monthlyReports: result.counts.monthlyReports || 0,
    };

    return createSuccessResponse(
      { 
        success: true, 
        deletionCounts: legacyDeletionCounts,
        totalRecordsDeleted: result.totalRecordsDeleted,
        usersDeleted: allUserIdsToDelete.length,
        authUsersDeleted: result.authUsersDeleted,
        authUsersFailed: result.authUsersFailed
      },
      `Hospital "${hospital.name}" and all associated data deleted successfully. Total records: ${result.totalRecordsDeleted}, Users: ${allUserIdsToDelete.length}, Auth: ${result.authUsersDeleted}/${allUserIdsToDelete.length}`
    );

  } catch (error: unknown) {
    console.error('❌ Error during hospital cascade deletion:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error details:', {
      hospitalId,
      hospitalName: hospital?.name,
      errorMessage: errMsg,
    });
    
    throw new ApiError(
      `Failed to delete hospital and associated data: ${errMsg}`,
      500,
      'CASCADE_DELETE_FAILED'
    );
  }
}

export const PUT = withErrorHandling(handlePUT);
export const DELETE = withErrorHandling(handleDELETE);
