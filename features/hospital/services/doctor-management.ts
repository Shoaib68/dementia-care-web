import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { CredentialManager } from '@/features/credential-management/services/credential-manager';
import { GeneratedCredentials } from '@/features/auth/types';

export interface DoctorData {
  id: string;
  hospital_id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  department?: string;
  license_number: string;
  phone_number?: string;
  created_by: string;
  updated_at: string;
  users: {
    email: string;
    is_active: boolean;
  };
  hospitals?: {
    name: string;
  };
}

export interface CreateDoctorRequest {
  email: string;
  firstName: string;
  lastName: string;
  specialization: string;
  department?: string;
  licenseNumber: string;
  phone?: string;
}

export interface CreateDoctorResult {
  success: boolean;
  doctor?: DoctorData;
  credentials?: GeneratedCredentials;
  error?: string;
}

export interface GetDoctorsResult {
  success: boolean;
  data?: DoctorData[];
  error?: string;
}

export interface GetDoctorsFilters {
  search?: string;
  status?: 'active' | 'inactive';
}

/**
 * Hospital doctor management service
 * Handles all doctor-related operations for hospital admins
 */
export class DoctorManagementService {
  /**
   * Get all doctors for a specific hospital
   */
  static async getDoctorsByHospital(
    hospitalId: string, 
    filters?: GetDoctorsFilters
  ): Promise<GetDoctorsResult> {
    try {
      // Build optimized query - removed unnecessary hospitals join
      let query = supabaseAdmin
        .from('doctors')
        .select(`
          id,
          hospital_id,
          first_name,
          last_name,
          specialization,
          department,
          license_number,
          phone_number,
          created_by,
          updated_at,
          users!doctors_id_fkey (
            email,
            is_active
          )
        `)
        .eq('hospital_id', hospitalId)
        .order('updated_at', { ascending: false });

      // Apply status filter first (more selective, can use index better)
      if (filters?.status === 'active') {
        query = query.eq('users.is_active', true);
      } else if (filters?.status === 'inactive') {
        query = query.eq('users.is_active', false);
      }

      // Apply search filter - optimized to include name fields
      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(
          `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},specialization.ilike.${searchTerm},department.ilike.${searchTerm},license_number.ilike.${searchTerm}`
        );
      }

      const { data: doctors, error } = await query;

      if (error) {
        return {
          success: false,
          error: `Failed to fetch doctors: ${error.message}`
        };
      }

      return {
        success: true,
        data: (doctors || []) as unknown as DoctorData[]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch doctors'
      };
    }
  }

  /**
   * Create a new doctor with credentials
   */
  static async createDoctor(
    request: CreateDoctorRequest,
    hospitalId: string,
    createdBy: string
  ): Promise<CreateDoctorResult> {
    try {
      const { email, firstName, lastName, specialization, department, licenseNumber, phone } = request;

      // Validate email format
      const sanitizedEmail = CredentialManager.sanitizeEmail(email);
      if (!this.isValidEmail(sanitizedEmail)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Check if doctor with this license already exists
      const { data: existingDoctor, error: checkError } = await supabaseAdmin
        .from('doctors')
        .select('id')
        .eq('license_number', licenseNumber)
        .maybeSingle();

      if (checkError) {
        return {
          success: false,
          error: `Failed to check existing doctor: ${checkError.message}`
        };
      }

      if (existingDoctor) {
        return {
          success: false,
          error: 'A doctor with this license number already exists'
        };
      }

      // Invite doctor via email
      const inviteResult = await CredentialManager.inviteDoctor(
        sanitizedEmail,
        {
          created_by: createdBy,
          hospital_id: hospitalId,
          first_name: firstName,
          last_name: lastName,
        }
      );

      if (!inviteResult.success || !inviteResult.userId) {
        return {
          success: false,
          error: inviteResult.error || 'Failed to invite doctor'
        };
      }

      const userId = inviteResult.userId;

      try {
        // 2. Create user profile in users table
        const { error: userProfileError } = await supabaseAdmin
          .from('users')
          .insert({
            id: userId,
            email: sanitizedEmail,
            user_type: 'doctor',
            is_active: true
          });

        if (userProfileError) {
          throw userProfileError;
        }

        // 3. Create doctor record
        const { data: doctor, error: doctorError } = await supabaseAdmin
          .from('doctors')
          .insert({
            id: userId,
            hospital_id: hospitalId,
            first_name: firstName,
            last_name: lastName,
            specialization,
            department: department || null,
            license_number: licenseNumber,
            phone_number: phone || null,
            created_by: createdBy
          })
          .select(`
            id,
            hospital_id,
            first_name,
            last_name,
            specialization,
            department,
            license_number,
            phone_number,
            created_by,
            updated_at,
            users!doctors_id_fkey (
              email,
              is_active
            ),
            hospitals (
              name
            )
          `)
          .single();

        if (doctorError) {
          throw doctorError;
        }

        return {
          success: true,
          doctor: doctor as unknown as DoctorData,
          credentials: {
            email: sanitizedEmail,
            userId
          }
        };

      } catch (dbError: any) {
        // Cleanup auth user on database error
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return {
          success: false,
          error: `Failed to create doctor record: ${dbError.message || 'Unknown database error'}`
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred during doctor creation'
      };
    }
  }

  /**
   * Update doctor information
   */
  static async updateDoctor(
    doctorId: string,
    hospitalId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      specialization?: string;
      department?: string;
      licenseNumber?: string;
      phone?: string;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify doctor belongs to hospital
      const { data: doctorCheck, error: verifyError } = await supabaseAdmin
        .from('doctors')
        .select('id')
        .eq('id', doctorId)
        .eq('hospital_id', hospitalId)
        .single();

      if (verifyError || !doctorCheck) {
        return {
          success: false,
          error: 'Doctor not found or not associated with hospital'
        };
      }

      // Update doctor record
      const doctorUpdates: any = {};
      if (updates.firstName) doctorUpdates.first_name = updates.firstName;
      if (updates.lastName) doctorUpdates.last_name = updates.lastName;
      if (updates.specialization) doctorUpdates.specialization = updates.specialization;
      if (updates.department !== undefined) doctorUpdates.department = updates.department;
      if (updates.licenseNumber) doctorUpdates.license_number = updates.licenseNumber;
      if (updates.phone !== undefined) doctorUpdates.phone_number = updates.phone;
      doctorUpdates.updated_at = new Date().toISOString();

      if (Object.keys(doctorUpdates).length > 1) { // More than just updated_at
        const { error: updateError } = await supabaseAdmin
          .from('doctors')
          .update(doctorUpdates)
          .eq('id', doctorId);

        if (updateError) {
          return {
            success: false,
            error: `Failed to update doctor: ${updateError.message}`
          };
        }
      }

      // Update user status if needed
      if (updates.isActive !== undefined) {
        const { error: userUpdateError } = await supabaseAdmin
          .from('users')
          .update({ is_active: updates.isActive })
          .eq('id', doctorId);

        if (userUpdateError) {
          return {
            success: false,
            error: `Failed to update doctor status: ${userUpdateError.message}`
          };
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update doctor'
      };
    }
  }

  /**
   * Delete/deactivate doctor
   */
  static async deactivateDoctor(
    doctorId: string,
    hospitalId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.updateDoctor(doctorId, hospitalId, { isActive: false });
  }

  /**
   * Get doctor by ID
   */
  static async getDoctorById(
    doctorId: string,
    hospitalId?: string
  ): Promise<{ success: boolean; doctor?: DoctorData; error?: string }> {
    try {
      let query = supabaseAdmin
        .from('doctors')
        .select(`
          id,
          hospital_id,
          first_name,
          last_name,
          specialization,
          department,
          license_number,
          phone_number,
          created_by,
          updated_at,
          users!doctors_id_fkey (
            email,
            is_active
          ),
          hospitals (
            name
          )
        `)
        .eq('id', doctorId);

      if (hospitalId) {
        query = query.eq('hospital_id', hospitalId);
      }

      const { data: doctor, error } = await query.single();

      if (error) {
        return {
          success: false,
          error: `Failed to fetch doctor: ${error.message}`
        };
      }

      return {
        success: true,
        doctor: doctor as unknown as DoctorData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch doctor'
      };
    }
  }

  /**
   * Delete/permanently remove doctor
   */
  static async deleteDoctor(
    doctorId: string,
    hospitalId: string
  ): Promise<{ 
    success: boolean; 
    error?: string; 
    hasPatients?: boolean; 
    patientCount?: number;
    assignedPatients?: Array<{
      id: string;
      first_name: string;
      last_name: string;
      dementia_stage: string;
      patient_code: string;
    }>;
  }> {
    try {
      // Verify doctor exists and belongs to hospital
      const { data: doctorCheck, error: verifyError } = await supabaseAdmin
        .from('doctors')
        .select('id, first_name, last_name, hospital_id')
        .eq('id', doctorId)
        .eq('hospital_id', hospitalId)
        .single();

      if (verifyError || !doctorCheck) {
        return {
          success: false,
          error: 'Doctor not found or not associated with hospital'
        };
      }

      // Check for assigned patients before deletion
      const { data: assignedPatients, error: patientsError } = await supabaseAdmin
        .from('patients')
        .select('id, patient_code, first_name, last_name, dementia_stage')
        .eq('primary_doctor_id', doctorId);

      if (patientsError) {
        return {
          success: false,
          error: `Failed to check assigned patients: ${patientsError.message}`
        };
      }

      if (assignedPatients && assignedPatients.length > 0) {
        return {
          success: false,
          error: `Cannot delete doctor. There are ${assignedPatients.length} patient(s) currently assigned to this doctor. Please reassign these patients to other doctors first.`,
          hasPatients: true,
          patientCount: assignedPatients.length,
          assignedPatients: assignedPatients.map((patient: any) => ({
            id: String(patient.id || ''),
            first_name: String(patient.first_name || ''),
            last_name: String(patient.last_name || ''),
            dementia_stage: String(patient.dementia_stage || 'mild'),
            patient_code: String(patient.patient_code || patient.id || '')
          }))
        };
      }

      // Step 1: Update any patients created by this doctor to null the created_by field
      const { error: updatePatientsError } = await supabaseAdmin
        .from('patients')
        .update({ created_by: null })
        .eq('created_by', doctorId);

      if (updatePatientsError) {
        console.error('Failed to update patients created_by field:', updatePatientsError);
        return {
          success: false,
          error: `Failed to update patient records: ${updatePatientsError.message}`
        };
      }

      // Step 2: Delete any patient_doctor_assignments (historical assignments)
      const { error: assignmentsError } = await supabaseAdmin
        .from('patient_doctor_assignments')
        .delete()
        .eq('doctor_id', doctorId);

      if (assignmentsError) {
        console.warn('Warning: Failed to delete doctor assignments:', assignmentsError.message);
      }

      // Step 3: Update medical_notes to null the created_by field instead of deleting
      const { error: medicalNotesError } = await supabaseAdmin
        .from('medical_notes')
        .update({ created_by: null })
        .eq('created_by', doctorId);

      if (medicalNotesError) {
        console.warn('Warning: Failed to update medical notes created_by:', medicalNotesError.message);
      }

      // Step 4: Update MRI scans to null the uploaded_by field instead of deleting
      const { error: mriScansError } = await supabaseAdmin
        .from('mri_scans')
        .update({ uploaded_by: null })
        .eq('uploaded_by', doctorId);

      if (mriScansError) {
        console.warn('Warning: Failed to update MRI scans uploaded_by:', mriScansError.message);
      }

      // Step 5: Delete the doctor record from doctors table
      const { error: deleteDoctorError } = await supabaseAdmin
        .from('doctors')
        .delete()
        .eq('id', doctorId);

      if (deleteDoctorError) {
        console.error('Failed to delete doctor record:', deleteDoctorError);
        return {
          success: false,
          error: `Failed to delete doctor record: ${deleteDoctorError.message}`
        };
      }

      // Step 6: Delete the user record from users table
      const { error: deleteUserError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', doctorId);

      if (deleteUserError) {
        console.error('Failed to delete user record:', deleteUserError);
        return {
          success: false,
          error: `Failed to delete user record: ${deleteUserError.message}`
        };
      }

      // Step 7: Delete the auth user (from Supabase Auth)
      try {
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(doctorId);
        if (authDeleteError) {
          console.error('Failed to delete auth user:', authDeleteError);
          return {
            success: false,
            error: `Failed to delete authentication record: ${authDeleteError.message}`
          };
        }
      } catch (authError: any) {
        console.error('Exception during auth user deletion:', authError);
        return {
          success: false,
          error: `Failed to delete authentication record: ${authError.message || 'Unknown auth error'}`
        };
      }

      return { success: true };
      
    } catch (error: any) {
      console.error('Unexpected error during doctor deletion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred during doctor deletion'
      };
    }
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }
}

export default DoctorManagementService;
