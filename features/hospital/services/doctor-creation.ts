import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { CreateDoctorRequest } from '@/features/auth/types';
import { CredentialManager } from '@/features/credential-management/services/credential-manager';

export interface CreateDoctorResult {
  success: boolean;
  doctorId?: string;
  message?: string;
  error?: string;
}

/**
 * Creates a new doctor account using email invitation
 * Only Hospital Admin can perform this operation for their hospital
 */
export async function createDoctor(
  request: CreateDoctorRequest,
  createdBy: string,
  hospitalId: string // Hospital admin's hospital ID
): Promise<CreateDoctorResult> {
  const { email, specialization, licenseNumber, doctorDetails } = request;

  // Validate hospital ID matches the request
  if (request.hospitalId !== hospitalId) {
    return {
      success: false,
      error: 'You can only create doctors for your own hospital'
    };
  }

  try {
    // Send invitation email using Credential Manager
    const inviteResult = await CredentialManager.inviteDoctor(
      email,
      {
        created_by: createdBy,
        hospital_id: hospitalId,
        first_name: doctorDetails?.firstName,
        last_name: doctorDetails?.lastName,
        phone: doctorDetails?.phone,
        specialization,
        license_number: licenseNumber
      }
    );

    if (!inviteResult.success || !inviteResult.userId) {
      console.error('Error sending doctor invitation:', inviteResult.error);
      return {
        success: false,
        error: inviteResult.error || 'Failed to send invitation email'
      };
    }

    const userId = inviteResult.userId;

    try {
      // Create user profile in users table
      const { error: userProfileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email,
          user_type: 'doctor',
          is_active: true
        });

      if (userProfileError) {
        // Rollback auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(userId);
        throw userProfileError;
      }

      // Create doctor profile record
      const { error: doctorProfileError } = await supabaseAdmin
        .from('doctors')
        .insert({
          id: userId,
          hospital_id: hospitalId,
          specialization,
          license_number: licenseNumber,
          created_by: createdBy
        });

      if (doctorProfileError) {
        // Rollback user profile and auth user
        await supabaseAdmin.from('users').delete().eq('id', userId);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        throw doctorProfileError;
      }

      return {
        success: true,
        doctorId: userId,
        message: `Doctor account created successfully. An invitation email has been sent to ${email} with instructions to set up their account.`
      };

    } catch (dbError: any) {
      console.error('Database error during doctor creation:', dbError);
      // Cleanup auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return {
        success: false,
        error: dbError.message || 'Failed to create doctor profile'
      };
    }

  } catch (error: any) {
    console.error('Error in createDoctor:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Get all doctors for a specific hospital
 */
export async function getHospitalDoctors(hospitalId: string) {
  try {
    const { data: doctors, error } = await supabaseAdmin
      .from('doctors')
      .select(`
        id,
        specialization,
        license_number,
        created_at,
        users!inner (
          email,
          is_active
        )
      `)
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching hospital doctors:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: doctors };
  } catch (error: any) {
    console.error('Error in getHospitalDoctors:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Deactivate a doctor (can only deactivate doctors from the same hospital)
 */
export async function deactivateDoctor(doctorId: string, hospitalId: string) {
  try {
    // Verify doctor belongs to the hospital
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .select('hospital_id')
      .eq('id', doctorId)
      .single();

    if (doctorError || !doctor) {
      return { success: false, error: 'Doctor not found' };
    }

    if (doctor.hospital_id !== hospitalId) {
      return { success: false, error: 'You can only manage doctors from your hospital' };
    }

    // Deactivate doctor user
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ is_active: false })
      .eq('id', doctorId);

    if (userError) {
      return { success: false, error: userError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in deactivateDoctor:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get hospital information for verification
 */
export async function getHospitalInfo(hospitalId: string) {
  try {
    const { data: hospital, error } = await supabaseAdmin
      .from('hospitals')
      .select('id, name, is_approved')
      .eq('id', hospitalId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: hospital };
  } catch (error: any) {
    console.error('Error in getHospitalInfo:', error);
    return { success: false, error: error.message };
  }
}
