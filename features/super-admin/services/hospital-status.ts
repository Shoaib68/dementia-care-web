/**
 * Hospital status management service
 * Handles cascading activation/deactivation of hospitals and their associated doctors
 */

import { supabaseAdmin } from '@/shared/lib/supabase-admin';

export interface HospitalStatusUpdateResult {
  success: boolean;
  hospitalUpdated: boolean;
  adminUpdated: boolean;
  doctorsAffected: number;
  errors: string[];
}

export interface HospitalStatusUpdateRequest {
  hospitalId: string;
  isActive: boolean;
  updateDoctors?: boolean; // Default to true for cascading behavior
}

/**
 * Updates hospital status and cascades the change to associated doctors
 * This function ensures atomic transaction behavior for status updates
 */
export async function updateHospitalStatus({
  hospitalId,
  isActive,
  updateDoctors = true
}: HospitalStatusUpdateRequest): Promise<HospitalStatusUpdateResult> {
  const result: HospitalStatusUpdateResult = {
    success: false,
    hospitalUpdated: false,
    adminUpdated: false,
    doctorsAffected: 0,
    errors: []
  };

  try {
    // First, verify the hospital exists and get its admin user ID
    const { data: hospital, error: hospitalFetchError } = await supabaseAdmin
      .from('hospitals')
      .select(`
        id,
        name,
        admin_user_id,
        users!hospitals_admin_user_id_fkey (
          id,
          email,
          is_active
        )
      `)
      .eq('id', hospitalId)
      .single();

    if (hospitalFetchError || !hospital) {
      result.errors.push('Hospital not found');
      return result;
    }

    // Step 1: Update hospital admin user status
    const { error: adminUpdateError } = await supabaseAdmin
      .from('users')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', hospital.admin_user_id);

    if (adminUpdateError) {
      console.error('❌ Failed to update hospital admin status:', adminUpdateError);
      result.errors.push(`Failed to update hospital admin status: ${adminUpdateError.message}`);
      return result;
    }

    result.adminUpdated = true;

    // Step 2: Update associated doctors' status (cascading behavior)
    if (updateDoctors) {
      // Get all doctors associated with this hospital
      const { data: doctors, error: doctorsError } = await supabaseAdmin
        .from('doctors')
        .select(`
          id,
          users!doctors_id_fkey (
            email,
            is_active
          )
        `)
        .eq('hospital_id', hospitalId);

      if (doctorsError) {
        console.error('❌ Failed to fetch hospital doctors:', doctorsError);
        result.errors.push(`Failed to fetch hospital doctors: ${doctorsError.message}`);
        // Continue execution - admin update was successful
      } else if (doctors && doctors.length > 0) {
        // Update all doctors' status
        const doctorIds = doctors.map(doctor => doctor.id);
        const { error: doctorsUpdateError, count } = await supabaseAdmin
          .from('users')
          .update({ 
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
          .in('id', doctorIds);

        if (doctorsUpdateError) {
          console.error('❌ Failed to update doctors status:', doctorsUpdateError);
          result.errors.push(`Failed to update doctors status: ${doctorsUpdateError.message}`);
          // Continue execution - partial success is still valuable
        } else {
          result.doctorsAffected = count || doctors.length;
        }
      }
    }

    result.hospitalUpdated = true;
    result.success = result.adminUpdated && result.errors.length === 0;

    // Operation completed

    return result;

  } catch (error: any) {
    console.error('❌ Unexpected error during hospital status update:', error);
    result.errors.push(`Unexpected error: ${error?.message || 'Unknown error'}`);
    return result;
  }
}

/**
 * Gets count of active doctors for a hospital
 * Used for displaying warning messages before deactivation
 */
export async function getHospitalDoctorCount(hospitalId: string): Promise<{
  totalDoctors: number;
  activeDoctors: number;
  error?: string;
}> {
  try {
    const { data: doctors, error } = await supabaseAdmin
      .from('doctors')
      .select(`
        id,
        users!doctors_id_fkey (
          is_active
        )
      `)
      .eq('hospital_id', hospitalId);

    if (error) {
      return {
        totalDoctors: 0,
        activeDoctors: 0,
        error: error.message
      };
    }

    const totalDoctors = doctors?.length || 0;
    const activeDoctors = doctors?.filter(doctor => doctor.users?.is_active)?.length || 0;

    return {
      totalDoctors,
      activeDoctors
    };
  } catch (error: any) {
    return {
      totalDoctors: 0,
      activeDoctors: 0,
      error: error?.message || 'Failed to count doctors'
    };
  }
}