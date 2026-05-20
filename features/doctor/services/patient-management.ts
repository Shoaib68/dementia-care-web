import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { CredentialManager } from '@/features/credential-management/services/credential-manager';
import { GeneratedCredentials } from '@/features/auth/types';

export interface PatientData {
  id: string;
  patient_code: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  dementia_stage: 'mild' | 'moderate' | 'severe';
  medical_history: Record<string, any>;
  hospital_id: string;
  primary_doctor_id: string;
  updated_at: string;
  created_by: string;
  users: {
    email: string;
    is_active: boolean;
    created_at: string;
  };
  patient_caregiver_assignments: {
    caregivers: {
      id: string;
      first_name: string;
      last_name: string;
      phone_number: string;
      address?: string;
    };
  }[];
}

export interface CreatePatientRequest {
  patientDetails: {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
    dementiaStage: 'mild' | 'moderate' | 'severe';
    medicalHistory?: Record<string, any>;
  };
  caregiverDetails: {
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber: string;
    emergencyContact?: string;
    address?: string;
  };
  doctorId: string;
  hospitalId: string;
}

export interface CreatePatientResult {
  success: boolean;
  patientId?: string;
  caregiverId?: string;
  patientCredentials?: GeneratedCredentials;
  caregiverCredentials?: GeneratedCredentials;
  error?: string;
}

export interface GetPatientsResult {
  success: boolean;
  data?: PatientData[];
  error?: string;
}

export interface GetPatientsFilters {
  search?: string;
  dementiaStage?: 'mild' | 'moderate' | 'severe';
  status?: 'active' | 'inactive';
}

/**
 * Patient management service
 * Handles all patient-related operations for doctors
 */
export class PatientManagementService {
  /**
   * Get all patients for a specific doctor
   */
  static async getPatientsByDoctor(
    doctorId: string,
    filters?: GetPatientsFilters
  ): Promise<GetPatientsResult> {
    try {
      // Simple retry logic for database operations
      let lastError: Error | null = null;
      let result: any = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Build query
          // First, get all patients for this doctor
          let query = supabaseAdmin
            .from('patients')
            .select(`
              id,
              patient_code,
              first_name,
              last_name,
              date_of_birth,
              dementia_stage,
              medical_history,
              hospital_id,
              primary_doctor_id,
              updated_at,
              created_by,
              users!patients_id_fkey (
                email,
                is_active,
                created_at
              )
            `)
            .eq('primary_doctor_id', doctorId)
            .order('updated_at', { ascending: false });

          // Apply filters
          if (filters?.search) {
            query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
          }
          
          if (filters?.dementiaStage) {
            query = query.eq('dementia_stage', filters.dementiaStage);
          }
          
          if (filters?.status === 'active') {
            query = query.eq('users.is_active', true);
          } else if (filters?.status === 'inactive') {
            query = query.eq('users.is_active', false);
          }

          const { data: patients, error } = await query;

          if (error) {
            // Log the specific error details
            console.error('❌ Supabase query error:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
              attempt
            });
            
            // Throw error to trigger retry logic
            throw new Error(`Database query failed: ${error.message}`);
          }

          // Log the actual response data for debugging
          if (patients && patients.length > 0) {
            
            // Fetch caregiver data for each patient separately
            const patientsWithCaregivers = await Promise.all(
              patients.map(async (patient) => {
                try {
                  // Get caregiver assignment
                  const { data: assignment } = await supabaseAdmin
                    .from('patient_caregiver_assignments')
                    .select('caregiver_id')
                    .eq('patient_id', patient.id)
                    .maybeSingle();

                  if (!assignment || !assignment.caregiver_id) {
                    return {
                      ...patient,
                      patient_caregiver_assignments: []
                    };
                  }

                  // Get caregiver data
                  const { data: caregiver } = await supabaseAdmin
                    .from('caregivers')
                    .select('id, first_name, last_name, phone_number, address')
                    .eq('id', assignment.caregiver_id)
                    .maybeSingle();

                  return {
                    ...patient,
                    patient_caregiver_assignments: caregiver ? [{
                      caregivers: caregiver
                    }] : []
                  };
                } catch (err) {
                  console.error(`❌ Error fetching caregiver for patient ${patient.id}:`, err);
                  return {
                    ...patient,
                    patient_caregiver_assignments: []
                  };
                }
              })
            );

            result = patientsWithCaregivers;
          } else {
            result = patients || [];
          }
          break; // Success, exit retry loop
          
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          
          // If this is the last attempt, don't wait
          if (attempt < 3) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // If we still don't have a result, throw the last error
      if (result === null && lastError) {
        throw lastError;
      }

      return {
        success: true,
        data: result
      };
      
    } catch (error) {
      console.error('❌ Failed to fetch patients after retries:', error);
      
      // Enhanced error messages based on error type
      let errorMessage = 'Failed to fetch patients';
      
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('timeout') || message.includes('connect timeout')) {
          errorMessage = 'Database connection timeout. This might be a temporary network issue. Please try again in a few moments.';
        } else if (message.includes('network') || message.includes('fetch')) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.';
        } else if (message.includes('connection')) {
          errorMessage = 'Unable to connect to the database. Please try again or contact support if the issue persists.';
        } else {
          errorMessage = `Database error: ${error.message}`;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Validate email availability before patient creation
   */
  static async validateEmailAvailability(email: string): Promise<{ available: boolean; error?: string }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if email already exists in the users table
      const { data: existingUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, user_type')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (userError) {
        console.error('Error checking email availability:', userError);
        return {
          available: false,
          error: 'Failed to validate email availability'
        };
      }

      if (existingUser) {
        let message = '';
        switch (existingUser.user_type) {
          case 'patient':
            message = 'This email is already registered to a patient account';
            break;
          case 'caregiver':
            message = 'This email is already registered to a caregiver account';
            break;
          default:
            message = 'This email is already registered in the system';
        }
        
        return {
          available: false,
          error: message
        };
      }

      return { available: true };
    } catch (error) {
      console.error('Email validation error:', error);
      return {
        available: false,
        error: 'Failed to validate email availability'
      };
    }
  }

  /**
   * Create patient and caregiver accounts together
   */
  static async createPatientWithCaregiver(
    request: CreatePatientRequest,
    createdBy: string
  ): Promise<CreatePatientResult> {
    let patientAuthId: string | null = null;
    let caregiverAuthId: string | null = null;
    
    try {
      const { patientDetails, caregiverDetails, doctorId, hospitalId } = request;
      
      // Validate nested objects exist
      if (!patientDetails || typeof patientDetails !== 'object') {
        return {
          success: false,
          error: 'patientDetails is required and must be an object'
        };
      }
      
      if (!caregiverDetails || typeof caregiverDetails !== 'object') {
        return {
          success: false,
          error: 'caregiverDetails is required and must be an object'
        };
      }
      
      // Validate required nested fields
      if (!patientDetails.firstName || !patientDetails.lastName || !patientDetails.email || !patientDetails.dateOfBirth || !patientDetails.dementiaStage) {
        return {
          success: false,
          error: 'Missing required patient details including email'
        };
      }
      
      if (!caregiverDetails.firstName || !caregiverDetails.lastName || !caregiverDetails.phoneNumber) {
        return {
          success: false,
          error: 'Missing required caregiver details'
        };
      }

      // Pre-validate patient email availability
      const emailValidation = await this.validateEmailAvailability(patientDetails.email);
      if (!emailValidation.available) {
        return {
          success: false,
          error: emailValidation.error || 'Email is not available'
        };
      }

      // Verify doctor belongs to the hospital
      const { data: doctorCheck, error: doctorError } = await supabaseAdmin
        .from('doctors')
        .select('hospital_id')
        .eq('id', doctorId)
        .eq('hospital_id', hospitalId)
        .single();

      if (doctorError || !doctorCheck) {
        return {
          success: false,
          error: 'Doctor not found or not associated with hospital'
        };
      }

      // For caregiver, use provided email or generate one
      const caregiverEmail = caregiverDetails.email || this.generateCaregiverEmail(caregiverDetails.firstName, caregiverDetails.lastName, hospitalId);

      // Invite patient and caregiver via email
      const inviteResults = await CredentialManager.invitePatientAndCaregiver(
        patientDetails.email,
        caregiverEmail,
        {
          created_by: createdBy,
          hospital_id: hospitalId,
          first_name: patientDetails.firstName,
          last_name: patientDetails.lastName,
        },
        {
          created_by: createdBy,
          hospital_id: hospitalId,
          first_name: caregiverDetails.firstName,
          last_name: caregiverDetails.lastName,
        }
      );

      if (!inviteResults.patient.success || !inviteResults.patient.userId) {
        return {
          success: false,
          error: inviteResults.patient.error || 'Failed to invite patient'
        };
      }

      if (!inviteResults.caregiver.success || !inviteResults.caregiver.userId) {
        return {
          success: false,
          error: inviteResults.caregiver.error || 'Failed to invite caregiver'
        };
      }

      patientAuthId = inviteResults.patient.userId;
      caregiverAuthId = inviteResults.caregiver.userId;

      const patientId = patientAuthId;
      const caregiverId = caregiverAuthId;
      const patientEmail = patientDetails.email;

      try {
        // 3. Create user profiles
        const { error: usersError } = await supabaseAdmin
          .from('users')
          .insert([
            {
              id: patientId,
              email: patientEmail,
              user_type: 'patient',
              is_active: true
            },
            {
              id: caregiverId,
              email: caregiverEmail,
              user_type: 'caregiver',
              is_active: true
            }
          ]);

        if (usersError) {
          throw usersError;
        }

        // 4. Create patient record with unique patient_code
        const patientCode = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        
        const { data: patient, error: patientError } = await supabaseAdmin
          .from('patients')
          .insert({
            id: patientId,
            patient_code: patientCode,
            first_name: patientDetails.firstName,
            last_name: patientDetails.lastName,
            date_of_birth: patientDetails.dateOfBirth,
            dementia_stage: patientDetails.dementiaStage,
            medical_history: patientDetails.medicalHistory || {},
            hospital_id: hospitalId,
            primary_doctor_id: doctorId,
            created_by: createdBy
          })
          .select()
          .single();

        if (patientError) {
          throw patientError;
        }

        // 5. Create caregiver record
        const { data: caregiver, error: caregiverError } = await supabaseAdmin
          .from('caregivers')
          .insert({
            id: caregiverId,
            first_name: caregiverDetails.firstName,
            last_name: caregiverDetails.lastName,
            phone_number: caregiverDetails.phoneNumber,
            emergency_contact: caregiverDetails.emergencyContact,
            address: caregiverDetails.address
          })
          .select()
          .single();

        if (caregiverError) {
          throw caregiverError;
        }

        // 6. Create patient-caregiver assignment
        const { error: assignmentError } = await supabaseAdmin
          .from('patient_caregiver_assignments')
          .insert({
            patient_id: patientId,
            caregiver_id: caregiverId,
            is_primary: true,  // Always primary for doctor-created one-to-one relationships
            assigned_date: new Date().toISOString()
          });

        if (assignmentError) {
          throw assignmentError;
        }

        // 7. Create patient-doctor assignment
        const { error: doctorAssignmentError } = await supabaseAdmin
          .from('patient_doctor_assignments')
          .insert({
            patient_id: patientId,
            doctor_id: doctorId,
            hospital_id: hospitalId,
            assigned_date: new Date().toISOString(),
            is_active: true
          });

        if (doctorAssignmentError) {
          throw doctorAssignmentError;
        }

        return {
          success: true,
          patientId,
          caregiverId,
          patientCredentials: {
            email: patientEmail,
            userId: patientId
          },
          caregiverCredentials: {
            email: caregiverEmail,
            userId: caregiverId
          }
        };

      } catch (dbError: any) {
        console.error('Database error during patient creation:', dbError);
        
        // Comprehensive cleanup of auth users
        const cleanupPromises = [];
        
        if (patientAuthId) {
          cleanupPromises.push(
            supabaseAdmin.auth.admin.deleteUser(patientAuthId).catch(err => 
              console.error('Failed to cleanup patient auth user:', err)
            )
          );
        }
        
        if (caregiverAuthId) {
          cleanupPromises.push(
            supabaseAdmin.auth.admin.deleteUser(caregiverAuthId).catch(err => 
              console.error('Failed to cleanup caregiver auth user:', err)
            )
          );
        }
        
        // Wait for all cleanup operations
        await Promise.all(cleanupPromises);
        
        // Enhanced error messages for common database errors
        let errorMessage = dbError.message || 'Unknown database error';
        if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
          errorMessage = 'A record with this information already exists';
        } else if (errorMessage.includes('foreign key')) {
          errorMessage = 'Invalid reference data provided';
        } else if (errorMessage.includes('check constraint')) {
          errorMessage = 'Invalid data format provided';
        }
        
        return {
          success: false,
          error: `Failed to create patient records: ${errorMessage}`
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred during patient creation'
      };
    }
  }

  /**
   * Update patient information
   */
  static async updatePatient(
    patientId: string,
    doctorId: string,
    updates: {
      dementiaStage?: 'mild' | 'moderate' | 'severe';
      medicalHistory?: Record<string, any>;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify patient belongs to doctor
      const { data: patientCheck, error: verifyError } = await supabaseAdmin
        .from('patients')
        .select('id')
        .eq('id', patientId)
        .eq('primary_doctor_id', doctorId)
        .single();

      if (verifyError || !patientCheck) {
        return {
          success: false,
          error: 'Patient not found or not associated with doctor'
        };
      }

      // Update patient record
      const patientUpdates: any = {};
      if (updates.dementiaStage) patientUpdates.dementia_stage = updates.dementiaStage;
      if (updates.medicalHistory) patientUpdates.medical_history = updates.medicalHistory;
      patientUpdates.updated_at = new Date().toISOString();

      if (Object.keys(patientUpdates).length > 1) { // More than just updated_at
        const { error: updateError } = await supabaseAdmin
          .from('patients')
          .update(patientUpdates)
          .eq('id', patientId);

        if (updateError) {
          return {
            success: false,
            error: `Failed to update patient: ${updateError.message}`
          };
        }
      }

      // Update user status if needed
      if (updates.isActive !== undefined) {
        const { error: userUpdateError } = await supabaseAdmin
          .from('users')
          .update({ is_active: updates.isActive })
          .eq('id', patientId);

        if (userUpdateError) {
          return {
            success: false,
            error: `Failed to update patient status: ${userUpdateError.message}`
          };
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update patient'
      };
    }
  }

  /**
   * Get patient by ID
   */
  static async getPatientById(
    patientId: string,
    doctorId?: string
  ): Promise<{ success: boolean; patient?: PatientData; error?: string }> {
    try {
      let query = supabaseAdmin
        .from('patients')
        .select(`
          id,
          patient_code,
          first_name,
          last_name,
          date_of_birth,
          dementia_stage,
          medical_history,
          hospital_id,
          primary_doctor_id,
          updated_at,
          created_by,
          users!patients_id_fkey (
            email,
            is_active,
            created_at
          ),
          patient_caregiver_assignments (
            caregivers (
              id,
              first_name,
              last_name,
              phone_number
            )
          )
        `)
        .eq('id', patientId);

      if (doctorId) {
        query = query.eq('primary_doctor_id', doctorId);
      }

      const { data: patient, error } = await query.single();

      if (error) {
        return {
          success: false,
          error: `Failed to fetch patient: ${error.message}`
        };
      }

      return {
        success: true,
        patient
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch patient'
      };
    }
  }

  /**
   * Generate patient email address
   */
  private static generatePatientEmail(firstName: string, lastName: string, hospitalId: string): string {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.patient@${hospitalId}.local`;
  }

  /**
   * Generate caregiver email address
   */
  private static generateCaregiverEmail(firstName: string, lastName: string, hospitalId: string): string {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.caregiver@${hospitalId}.local`;
  }
}

export default PatientManagementService;
