import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { SystemAnalytics } from '@/shared/types/api';

export interface AnalyticsResult {
  success: boolean;
  data?: SystemAnalytics;
  error?: string;
}

/**
 * Calculates growth percentage between current and previous values
 */
function calculateGrowthPercentage(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Gets the start and end dates for the current and previous months
 */
function getMonthDateRanges() {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    currentMonthStart: currentMonthStart.toISOString(),
    currentMonthEnd: currentMonthEnd.toISOString(),
    previousMonthStart: previousMonthStart.toISOString(),
    previousMonthEnd: previousMonthEnd.toISOString(),
  };
}

/**
 * Fetches system-wide analytics data
 */
export async function getSystemAnalytics(): Promise<AnalyticsResult> {
  try {
    const dateRanges = getMonthDateRanges();

    // Fetch total hospitals (joining with users table to get admin creation date as proxy for hospital creation)
    const { data: hospitalsData, error: hospitalsError } = await supabaseAdmin
      .from('hospitals')
      .select(`
        id,
        is_approved,
        name,
        users!hospitals_admin_user_id_fkey (
          created_at
        )
      `)
      .eq('is_approved', true);

    if (hospitalsError) {
      throw new Error(`Failed to fetch hospitals: ${hospitalsError.message}`);
    }

    const totalHospitals = hospitalsData?.length || 0;

    // Count hospitals by status
    const hospitalsByStatus = {
      active: hospitalsData?.filter(h => h.is_approved).length || 0,
      pending: 0, // We only fetch approved hospitals, so pending would need separate query
      inactive: 0 // Similarly for inactive
    };

    // Fetch total doctors (joining with users table to get created_at)
    const { data: doctorsData, error: doctorsError } = await supabaseAdmin
      .from('doctors')
      .select(`
        id,
        hospital_id,
        specialization,
        users!doctors_id_fkey (
          created_at
        )
      `)
      .not('hospital_id', 'is', null);

    if (doctorsError) {
      throw new Error(`Failed to fetch doctors: ${doctorsError.message}`);
    }

    const totalDoctors = doctorsData?.length || 0;

    // Fetch total patients with dementia stage breakdown (joining with users table to get created_at)
    const { data: patientsData, error: patientsError } = await supabaseAdmin
      .from('patients')
      .select(`
        id,
        dementia_stage,
        hospital_id,
        users!patients_id_fkey (
          created_at
        )
      `)
      .not('hospital_id', 'is', null);

    if (patientsError) {
      throw new Error(`Failed to fetch patients: ${patientsError.message}`);
    }

    const totalPatients = patientsData?.length || 0;

    // Calculate patients by dementia stage
    const patientsByStage = {
      mild: patientsData?.filter(p => p.dementia_stage === 'mild').length || 0,
      moderate: patientsData?.filter(p => p.dementia_stage === 'moderate').length || 0,
      severe: patientsData?.filter(p => p.dementia_stage === 'severe').length || 0,
    };

    // Calculate growth metrics by comparing this month vs last month
    // Use users.created_at from the joined data
    const currentMonthHospitals = hospitalsData?.filter(
      h => h.users?.created_at && new Date(h.users.created_at) >= new Date(dateRanges.currentMonthStart)
    ).length || 0;

    const previousMonthHospitals = hospitalsData?.filter(
      h => h.users?.created_at && 
           new Date(h.users.created_at) >= new Date(dateRanges.previousMonthStart) &&
           new Date(h.users.created_at) <= new Date(dateRanges.previousMonthEnd)
    ).length || 0;

    const currentMonthDoctors = doctorsData?.filter(
      d => d.users?.created_at && new Date(d.users.created_at) >= new Date(dateRanges.currentMonthStart)
    ).length || 0;

    const previousMonthDoctors = doctorsData?.filter(
      d => d.users?.created_at && 
           new Date(d.users.created_at) >= new Date(dateRanges.previousMonthStart) &&
           new Date(d.users.created_at) <= new Date(dateRanges.previousMonthEnd)
    ).length || 0;

    const currentMonthPatients = patientsData?.filter(
      p => p.users?.created_at && new Date(p.users.created_at) >= new Date(dateRanges.currentMonthStart)
    ).length || 0;

    const previousMonthPatients = patientsData?.filter(
      p => p.users?.created_at && 
           new Date(p.users.created_at) >= new Date(dateRanges.previousMonthStart) &&
           new Date(p.users.created_at) <= new Date(dateRanges.previousMonthEnd)
    ).length || 0;

    // Generate monthly growth data for the last 12 months (annual view).
    // Each entry holds the CUMULATIVE total at the END of that month so the
    // chart always terminates at the live system total and older records are
    // not silently excluded by the window.
    const monthlyGrowth = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      // End of the month at 23:59:59.999 so same-day records are included
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

      // Count every record created UP TO AND INCLUDING this month-end
      const monthHospitals = hospitalsData?.filter(
        h => h.users?.created_at && new Date(h.users.created_at) <= monthEnd
      ).length || 0;

      const monthDoctors = doctorsData?.filter(
        d => d.users?.created_at && new Date(d.users.created_at) <= monthEnd
      ).length || 0;

      const monthPatients = patientsData?.filter(
        p => p.users?.created_at && new Date(p.users.created_at) <= monthEnd
      ).length || 0;

      monthlyGrowth.push({
        month: monthNames[monthDate.getMonth()],
        hospitals: monthHospitals,
        doctors: monthDoctors,
        patients: monthPatients,
      });
    }

    const analytics: SystemAnalytics = {
      totalHospitals,
      totalDoctors,
      totalPatients,
      hospitalsByStatus,
      patientsByStage,
      monthlyGrowth,
    };

    return {
      success: true,
      data: analytics,
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while fetching analytics',
    };
  }
}

/**
 * Gets recent system activity from various tables
 */
export async function getRecentSystemActivity(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    type: 'hospital_added' | 'doctor_registered' | 'patient_added' | 'diagnosis_completed';
    message: string;
    timestamp: string;
    time: string;
  }>;
  error?: string;
}> {
  try {
    const activities = [];

    // Recent hospitals (using admin user creation date as proxy)
    const { data: recentHospitals, error: hospitalsError } = await supabaseAdmin
      .from('hospitals')
      .select(`
        id,
        name,
        users!hospitals_admin_user_id_fkey (
          created_at,
          email
        )
      `)
      .eq('is_approved', true)
      .order('users(created_at)', { ascending: false })
      .limit(3);

    if (!hospitalsError && recentHospitals) {
      for (const hospital of recentHospitals) {
        if (hospital.users?.created_at) {
          activities.push({
            id: `hospital-${hospital.id}`,
            type: 'hospital_added' as const,
            message: `New hospital "${hospital.name}" added to system`,
            timestamp: hospital.users.created_at,
            time: formatRelativeTime(hospital.users.created_at),
          });
        }
      }
    }

    // Recent doctors (using user creation date)
    const { data: recentDoctors, error: doctorsError } = await supabaseAdmin
      .from('doctors')
      .select(`
        id,
        first_name,
        last_name,
        specialization,
        users!doctors_id_fkey (
          created_at,
          email
        ),
        hospitals (name)
      `)
      .order('users(created_at)', { ascending: false })
      .limit(3);

    if (!doctorsError && recentDoctors) {
      for (const doctor of recentDoctors) {
        if (doctor.users?.created_at) {
          const hospitalName = doctor.hospitals?.name || 'Unknown Hospital';
          const doctorName = `${doctor.first_name} ${doctor.last_name}` || 'Unknown Doctor';
          activities.push({
            id: `doctor-${doctor.id}`,
            type: 'doctor_registered' as const,
            message: `New ${doctorName} registered at ${hospitalName}`,
            timestamp: doctor.users.created_at,
            time: formatRelativeTime(doctor.users.created_at),
          });
        }
      }
    }

    // Recent patients (using user creation date)
    const { data: recentPatients, error: patientsError } = await supabaseAdmin
      .from('patients')
      .select(`
        id,
        first_name,
        last_name,
        users!patients_id_fkey (
          created_at
        ),
        hospitals (name)
      `)
      .order('users(created_at)', { ascending: false })
      .limit(2);

    if (!patientsError && recentPatients) {
      for (const patient of recentPatients) {
        if (patient.users?.created_at) {
          const hospitalName = patient.hospitals?.name || 'Unknown Hospital';
          activities.push({
            id: `patient-${patient.id}`,
            type: 'patient_added' as const,
            message: `New patient ${patient.first_name} ${patient.last_name} registered at ${hospitalName}`,
            timestamp: patient.users.created_at,
            time: formatRelativeTime(patient.users.created_at),
          });
        }
      }
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      success: true,
      data: activities.slice(0, 5), // Return top 5 most recent
    };

  } catch (error: any) {
    return {
      success: true,
      data: [],
      error: error.message || 'Failed to fetch recent activity',
    };
  }
}

/**
 * Gets top performing hospitals by various metrics
 */
export async function getTopHospitals(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    doctors: number;
    patients: number;
    diagnoses: number;
  }>;
  error?: string;
}> {
  try {
    // Fetch hospitals with doctor and patient counts
    const { data: hospitals, error } = await supabaseAdmin
      .from('hospitals')
      .select(`
        id,
        name,
        doctors (id),
        patients (id),
        mri_scans (id)
      `)
      .eq('is_approved', true);

    if (error) {
      throw new Error(`Failed to fetch hospital performance data: ${error.message}`);
    }

    const topHospitals = hospitals?.map(hospital => ({
      id: hospital.id,
      name: hospital.name,
      doctors: hospital.doctors?.length || 0,
      patients: hospital.patients?.length || 0,
      diagnoses: hospital.mri_scans?.length || 0,
    })) || [];

    // Sort by total activity (diagnoses + patients)
    topHospitals.sort((a, b) => {
      const scoreA = a.diagnoses * 2 + a.patients; // Weight diagnoses higher
      const scoreB = b.diagnoses * 2 + b.patients;
      return scoreB - scoreA;
    });

    return {
      success: true,
      data: topHospitals.slice(0, 4), // Return top 4
    };

  } catch (error: any) {
    return {
      success: true,
      data: [],
      error: error.message || 'Failed to fetch top hospitals',
    };
  }
}

/**
 * Gets department performance metrics from the database
 */
export async function getDepartmentPerformance(): Promise<{
  success: boolean;
  data?: Array<{
    name: string;
    patients: number;
    diagnoses: number;
    efficiency: number;
  }>;
  error?: string;
}> {
  try {
    // Fetch doctors grouped by department with patient and diagnosis counts
    const { data: doctors, error: doctorsError } = await supabaseAdmin
      .from('doctors')
      .select(`
        id,
        department,
        specialization,
        patients (id),
        mri_scans (id)
      `)
      .not('department', 'is', null);

    if (doctorsError) {
      throw new Error(`Failed to fetch department data: ${doctorsError.message}`);
    }

    if (!doctors || doctors.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // Group doctors by department and calculate metrics
    const departmentMetrics: { [key: string]: { patients: number; diagnoses: number; doctorCount: number } } = {};

    doctors.forEach(doctor => {
      const dept = doctor.department;
      if (!dept) return;

      if (!departmentMetrics[dept]) {
        departmentMetrics[dept] = { patients: 0, diagnoses: 0, doctorCount: 0 };
      }

      departmentMetrics[dept].patients += doctor.patients?.length || 0;
      departmentMetrics[dept].diagnoses += doctor.mri_scans?.length || 0;
      departmentMetrics[dept].doctorCount += 1;
    });

    // Convert to array and calculate efficiency
    const departmentPerformance = Object.entries(departmentMetrics).map(([name, metrics]) => {
      // Calculate efficiency as a percentage of diagnoses vs patients
      const efficiency = metrics.patients > 0 
        ? Math.min(100, Math.round((metrics.diagnoses / metrics.patients) * 100))
        : metrics.diagnoses > 0 ? 100 : 0;

      return {
        name,
        patients: metrics.patients,
        diagnoses: metrics.diagnoses,
        efficiency,
      };
    });

    // Sort by total activity (patients + diagnoses)
    departmentPerformance.sort((a, b) => {
      const scoreA = a.patients + a.diagnoses;
      const scoreB = b.patients + b.diagnoses;
      return scoreB - scoreA;
    });

    return {
      success: true,
      data: departmentPerformance,
    };

  } catch (error: any) {
    return {
      success: true,
      data: [],
      error: error.message || 'Failed to fetch department performance',
    };
  }
}

/**
 * Formats a timestamp to relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  } else if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  } else if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  } else {
    return 'Just now';
  }
}
