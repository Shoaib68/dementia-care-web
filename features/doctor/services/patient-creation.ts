import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { CreatePatientRequest } from '@/features/auth/types';
import { CredentialManager } from '@/features/credential-management/services/credential-manager';

export interface CreatePatientResult {
  success: boolean;
  patientId?: string;
  caregiverId?: string;
  message?: string;
  error?: string;
}

/**
 * Creates patient and caregiver accounts simultaneously
 * Only Doctors can perform this operation for their hospital
 */
export async function createPatientAndCaregiver(
  request: CreatePatientRequest,
  createdBy: string, // Doctor ID
  hospitalId: string // Doctor's hospital ID
): Promise<CreatePatientResult> {
  const { patientDetails, caregiverDetails, doctorId } = request;

  // Validate doctor ID matches the current user
  if (doctorId !== createdBy) {
    return {
      success: false,
      error: 'Invalid doctor ID'
    };
  }

  // Validate hospital ID matches the request
  if (request.hospitalId !== hospitalId) {
    return {
      success: false,
      error: 'You can only create patients for your own hospital'
    };
  }

  try {
    // Use actual emails from the request
    const patientEmail = patientDetails.email;
    const caregiverEmail = caregiverDetails.email;

    if (!patientEmail || !caregiverEmail) {
      return {
        success: false,
        error: 'Patient and caregiver email addresses are required'
      };
    }

    let patientUserId: string;
    let caregiverUserId: string;

    try {
      // 1. Send patient invitation email
      const patientInviteResult = await CredentialManager.invitePatient(
        patientEmail,
        {
          created_by: createdBy,
          hospital_id: hospitalId,
          first_name: patientDetails.firstName,
          last_name: patientDetails.lastName,
          dementia_stage: patientDetails.dementiaStage
        }
      );

      if (!patientInviteResult.success || !patientInviteResult.userId) {
        throw new Error(patientInviteResult.error || 'Failed to send patient invitation email');
      }
      patientUserId = patientInviteResult.userId;

      // 2. Send caregiver invitation email
      const caregiverInviteResult = await CredentialManager.inviteCaregiver(
        caregiverEmail,
        {
          created_by: createdBy,
          hospital_id: hospitalId,
          first_name: caregiverDetails.firstName,
          last_name: caregiverDetails.lastName,
          phone: caregiverDetails.phoneNumber
        }
      );

      if (!caregiverInviteResult.success || !caregiverInviteResult.userId) {
        // Rollback patient user
        await supabaseAdmin.auth.admin.deleteUser(patientUserId);
        throw new Error(caregiverInviteResult.error || 'Failed to send caregiver invitation email');
      }
      caregiverUserId = caregiverInviteResult.userId;

      // 3. Create user profiles in users table
      const { error: userProfilesError } = await supabaseAdmin
        .from('users')
        .insert([
          {
            id: patientUserId,
            email: patientEmail,
            user_type: 'patient',
            is_active: true
          },
          {
            id: caregiverUserId,
            email: caregiverEmail,
            user_type: 'caregiver',
            is_active: true
          }
        ]);

      if (userProfilesError) {
        // Rollback auth users
        await supabaseAdmin.auth.admin.deleteUser(patientUserId);
        await supabaseAdmin.auth.admin.deleteUser(caregiverUserId);
        throw userProfilesError;
      }

      // 4. Create patient profile
      const { error: patientProfileError } = await supabaseAdmin
        .from('patients')
        .insert({
          id: patientUserId,
          first_name: patientDetails.firstName,
          last_name: patientDetails.lastName,
          date_of_birth: patientDetails.dateOfBirth,
          dementia_stage: patientDetails.dementiaStage,
          medical_history: patientDetails.medicalHistory || {},
          hospital_id: hospitalId,
          primary_doctor_id: doctorId,
          created_by: createdBy
        });

      if (patientProfileError) {
        // Rollback all created records
        await supabaseAdmin.from('users').delete().in('id', [patientUserId, caregiverUserId]);
        await supabaseAdmin.auth.admin.deleteUser(patientUserId);
        await supabaseAdmin.auth.admin.deleteUser(caregiverUserId);
        throw patientProfileError;
      }

      // 5. Create caregiver profile
      const { error: caregiverProfileError } = await supabaseAdmin
        .from('caregivers')
        .insert({
          id: caregiverUserId,
          first_name: caregiverDetails.firstName,
          last_name: caregiverDetails.lastName,
          phone_number: caregiverDetails.phoneNumber,
          emergency_contact: caregiverDetails.emergencyContact,
          address: caregiverDetails.address
        });

      if (caregiverProfileError) {
        // Rollback all created records
        await supabaseAdmin.from('patients').delete().eq('id', patientUserId);
        await supabaseAdmin.from('users').delete().in('id', [patientUserId, caregiverUserId]);
        await supabaseAdmin.auth.admin.deleteUser(patientUserId);
        await supabaseAdmin.auth.admin.deleteUser(caregiverUserId);
        throw caregiverProfileError;
      }

      // 6. Create patient-caregiver assignment (1:1 relationship)
      const { error: assignmentError } = await supabaseAdmin
        .from('patient_caregiver_assignments')
        .insert({
          patient_id: patientUserId,
          caregiver_id: caregiverUserId,
          is_primary: true,  // Always primary for doctor-created one-to-one relationships
          assigned_date: new Date().toISOString()
        });

      if (assignmentError) {
        // Rollback all created records
        await supabaseAdmin.from('caregivers').delete().eq('id', caregiverUserId);
        await supabaseAdmin.from('patients').delete().eq('id', patientUserId);
        await supabaseAdmin.from('users').delete().in('id', [patientUserId, caregiverUserId]);
        await supabaseAdmin.auth.admin.deleteUser(patientUserId);
        await supabaseAdmin.auth.admin.deleteUser(caregiverUserId);
        throw assignmentError;
      }

      // 7. Create patient-doctor assignment
      const { error: doctorAssignmentError } = await supabaseAdmin
        .from('patient_doctor_assignments')
        .insert({
          patient_id: patientUserId,
          doctor_id: doctorId,
          hospital_id: hospitalId,
          assignment_date: new Date().toISOString(),
          is_active: true
        });

      if (doctorAssignmentError) {
        // Rollback all created records
        await supabaseAdmin.from('patient_caregiver_assignments').delete().eq('patient_id', patientUserId);
        await supabaseAdmin.from('caregivers').delete().eq('id', caregiverUserId);
        await supabaseAdmin.from('patients').delete().eq('id', patientUserId);
        await supabaseAdmin.from('users').delete().in('id', [patientUserId, caregiverUserId]);
        await supabaseAdmin.auth.admin.deleteUser(patientUserId);
        await supabaseAdmin.auth.admin.deleteUser(caregiverUserId);
        throw doctorAssignmentError;
      }

      return {
        success: true,
        patientId: patientUserId,
        caregiverId: caregiverUserId,
        message: `Patient and caregiver accounts created successfully. Invitation emails have been sent to ${patientEmail} and ${caregiverEmail} with instructions to set up their accounts.`
      };

    } catch (dbError: any) {
      console.error('Database error during patient/caregiver creation:', dbError);
      return {
        success: false,
        error: dbError.message || 'Failed to create patient and caregiver accounts'
      };
    }

  } catch (error: any) {
    console.error('Error in createPatientAndCaregiver:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Get all patients for a specific doctor
 */
export async function getDoctorPatients(doctorId: string) {
  try {
    const { data: patients, error } = await supabaseAdmin
      .from('patients')
      .select(`
        id,
        first_name,
        last_name,
        date_of_birth,
        dementia_stage,
        created_at,
        users!inner (
          email,
          is_active
        ),
        patient_caregiver_assignments!inner (
          caregivers (
            id,
            first_name,
            last_name,
            phone_number
          )
        )
      `)
      .eq('primary_doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching doctor patients:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: patients };
  } catch (error: any) {
    console.error('Error in getDoctorPatients:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update patient's dementia stage
 */
export async function updatePatientDementiaStage(
  patientId: string, 
  newStage: 'mild' | 'moderate' | 'severe',
  doctorId: string
) {
  try {
    // Verify the doctor has access to this patient
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('primary_doctor_id')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return { success: false, error: 'Patient not found' };
    }

    if (patient.primary_doctor_id !== doctorId) {
      return { success: false, error: 'You can only update patients assigned to you' };
    }

    // Update dementia stage
    const { error: updateError } = await supabaseAdmin
      .from('patients')
      .update({ 
        dementia_stage: newStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in updatePatientDementiaStage:', error);
    return { success: false, error: error.message };
  }
}
