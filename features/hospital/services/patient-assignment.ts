import { supabaseAdmin } from '@/shared/lib/supabase-admin';

export interface HospitalPatient {
  id: string;
  patient_code: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  dementia_stage: 'mild' | 'moderate' | 'severe';
  medical_history?: Record<string, any>;
  hospital_id: string;
  primary_doctor_id: string;
  updated_at: string;
  created_by: string;
  users: {
    email: string;
    is_active: boolean;
  };
  patient_caregiver_assignments: Array<{
    caregivers: {
      id: string;
      first_name: string;
      last_name: string;
      phone_number: string;
    };
  }>;
  doctors: {
    id: string;
    first_name: string;
    last_name: string;
    specialization: string;
    department?: string;
    users: {
      email: string;
    };
  } | null;
}

export interface PatientFilters {
  search?: string;
  dementiaStage?: 'mild' | 'moderate' | 'severe';
  doctorId?: string;
  status?: 'active' | 'inactive';
}

export interface AssignPatientRequest {
  patientId: string;
  doctorId: string;
}

export interface AssignPatientResult {
  success: boolean;
  data?: {
    patientId: string;
    doctorId: string;
    patientName: string;
    doctorName: string;
    assignmentDate: string;
    previousDoctorId?: string;
    noChangeNeeded?: boolean;
  };
  error?: string;
}

export interface GetHospitalPatientsResult {
  success: boolean;
  data?: HospitalPatient[];
  error?: string;
}

/**
 * Patient assignment service for hospital admins
 * Handles patient-doctor assignment operations
 */
export class PatientAssignmentService {
  /**
   * Get all patients for a specific hospital with their assigned doctors
   */
  static async getHospitalPatients(
    hospitalId: string,
    filters?: PatientFilters
  ): Promise<GetHospitalPatientsResult> {
    try {
      // Build the query
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
            is_active
          ),
          patient_caregiver_assignments (
            caregivers (
              id,
              first_name,
              last_name,
              phone_number
            )
          ),
          doctors!patients_primary_doctor_id_fkey (
            id,
            first_name,
            last_name,
            specialization,
            department,
            users!doctors_id_fkey (
              email
            )
          )
        `)
        .eq('hospital_id', hospitalId)
        .order('updated_at', { ascending: false });

      // Apply filters
      if (filters?.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,patient_code.ilike.%${filters.search}%`);
      }
      
      if (filters?.dementiaStage) {
        query = query.eq('dementia_stage', filters.dementiaStage);
      }
      
      if (filters?.doctorId !== undefined) {
        if (filters.doctorId === '') {
          // Filter for unassigned patients (null primary_doctor_id)
          query = query.is('primary_doctor_id', null);
        } else {
          // Filter for specific doctor
          query = query.eq('primary_doctor_id', filters.doctorId);
        }
      }
      
      if (filters?.status === 'active') {
        query = query.eq('users.is_active', true);
      } else if (filters?.status === 'inactive') {
        query = query.eq('users.is_active', false);
      }

      const { data: patients, error } = await query;

      if (error) {
        return {
          success: false,
          error: `Failed to fetch hospital patients: ${error.message}`
        };
      }

      return {
        success: true,
        data: patients || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch hospital patients'
      };
    }
  }

  /**
   * Assign or reassign a patient to a doctor
   */
  static async assignPatientToDoctor(
    request: AssignPatientRequest,
    hospitalId: string
  ): Promise<AssignPatientResult> {
    const { patientId, doctorId } = request;

    try {
      // Verify patient belongs to this hospital
      const { data: patient, error: patientError } = await supabaseAdmin
        .from('patients')
        .select('id, hospital_id, primary_doctor_id, first_name, last_name')
        .eq('id', patientId)
        .eq('hospital_id', hospitalId)
        .single();

      if (patientError || !patient) {
        return {
          success: false,
          error: 'Patient not found or not associated with hospital'
        };
      }

      // Verify doctor belongs to this hospital
      const { data: doctor, error: doctorError } = await supabaseAdmin
        .from('doctors')
        .select('id, hospital_id, first_name, last_name, specialization')
        .eq('id', doctorId)
        .eq('hospital_id', hospitalId)
        .single();

      if (doctorError || !doctor) {
        return {
          success: false,
          error: 'Doctor not found or not associated with hospital'
        };
      }

      // Check if patient is already assigned to this doctor
      if (patient.primary_doctor_id === doctorId) {
        return {
          success: true,
          data: {
            patientId,
            doctorId,
            patientName: `${patient.first_name} ${patient.last_name}`,
            doctorName: `${doctor.first_name} ${doctor.last_name}`,
            assignmentDate: new Date().toISOString(),
            noChangeNeeded: true
          }
        };
      }

      const currentTimestamp = new Date().toISOString();
      const previousDoctorId = patient.primary_doctor_id;

      // 1. Update the primary_doctor_id in patients table
      const { error: updatePatientError } = await supabaseAdmin
        .from('patients')
        .update({ 
          primary_doctor_id: doctorId,
          updated_at: currentTimestamp
        })
        .eq('id', patientId);

      if (updatePatientError) {
        return {
          success: false,
          error: `Failed to update patient assignment: ${updatePatientError.message}`
        };
      }

      // 2. Update the doctor_id in patient_doctor_assignments table
      const { error: assignmentError } = await supabaseAdmin
        .from('patient_doctor_assignments')
        .update({
          doctor_id: doctorId,
          assigned_date: currentTimestamp
        })
        .eq('patient_id', patientId)
        .eq('hospital_id', hospitalId);

      if (assignmentError) {
        console.error('Failed to update assignment record:', assignmentError);
      }

      return {
        success: true,
        data: {
          patientId,
          doctorId,
          patientName: `${patient.first_name} ${patient.last_name}`,
          doctorName: `${doctor.first_name} ${doctor.last_name}`,
          assignmentDate: currentTimestamp,
          previousDoctorId
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred during patient assignment'
      };
    }
  }



  /**
   * Get patient statistics by doctor for a hospital
   */
  static async getPatientStatsByDoctor(
    hospitalId: string
  ): Promise<{
    success: boolean;
    data?: Array<{
      doctorId: string;
      doctorName: string;
      specialization: string;
      totalPatients: number;
      activePatients: number;
      patientsByStage: {
        mild: number;
        moderate: number;
        severe: number;
      };
    }>;
    error?: string;
  }> {
    try {
      // Get all doctors in the hospital with their patient counts
      const { data: doctorStats, error } = await supabaseAdmin
        .from('doctors')
        .select(`
          id,
          first_name,
          last_name,
          specialization,
          patients!patients_primary_doctor_id_fkey (
            id,
            dementia_stage,
            users!patients_id_fkey (
              is_active
            )
          )
        `)
        .eq('hospital_id', hospitalId);

      if (error) {
        return {
          success: false,
          error: `Failed to fetch doctor statistics: ${error.message}`
        };
      }

      const formattedStats = doctorStats?.map(doctor => {
        const patients = doctor.patients || [];
        const activePatients = patients.filter(p => p.users?.is_active);
        
        const patientsByStage = {
          mild: activePatients.filter(p => p.dementia_stage === 'mild').length,
          moderate: activePatients.filter(p => p.dementia_stage === 'moderate').length,
          severe: activePatients.filter(p => p.dementia_stage === 'severe').length,
        };

        return {
          doctorId: doctor.id,
          doctorName: `${doctor.first_name} ${doctor.last_name}`,
          specialization: doctor.specialization,
          totalPatients: patients.length,
          activePatients: activePatients.length,
          patientsByStage
        };
      }) || [];

      return {
        success: true,
        data: formattedStats
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch doctor statistics'
      };
    }
  }
}

export default PatientAssignmentService;