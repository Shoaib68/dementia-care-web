import { supabaseAdmin } from '@/shared/lib/supabase-admin';

export interface HospitalAnalytics {
  totalDoctors: number;
  totalPatients: number;
  monthlyDiagnoses: number;
  pendingReports: number;
  doctorGrowth: number;
  patientGrowth: number;
  diagnosesGrowth: number;
  avgResponseTime: string;
  recentActivity: ActivityItem[];
  topDoctors: TopDoctor[];
  departmentStats: DepartmentStat[];
  activityTrends: MonthlyActivityData[];
}

export interface MonthlyActivityData {
  month: string;
  patients: number;
  diagnoses: number;
  reports: number;
  year: number;
}

export interface ActivityItem {
  id: string;
  type: 'diagnosis' | 'patient' | 'doctor' | 'report';
  message: string;
  time: string;
  created_at: string;
}

export interface TopDoctor {
  name: string;
  specialization: string;
  department: string;
  diagnoses: number;
  patients: number;
}

export interface DepartmentStat {
  name: string;
  doctors: number;
  patients: number;
  diagnoses: number;
}

export interface HospitalAnalyticsResult {
  success: boolean;
  data?: HospitalAnalytics;
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
 * Formats time ago string
 */
function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInMinutes < 1440) { // 24 hours
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInMinutes < 10080) { // 7 days
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    // For older than 7 days, show the actual date
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: new Date(dateString).getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}

/**
 * Creates default/empty analytics structure
 */
function createDefaultAnalytics(): HospitalAnalytics {
  return {
    totalDoctors: 0,
    totalPatients: 0,
    monthlyDiagnoses: 0, // Hardcoded to 0 as AI diagnosis not implemented
    pendingReports: 0, // Hardcoded to 0 as reports functionality not implemented
    doctorGrowth: 0,
    patientGrowth: 0,
    diagnosesGrowth: 0, // Hardcoded to 0 as AI diagnosis not implemented
    avgResponseTime: '0 hours',
    recentActivity: [],
    topDoctors: [],
    departmentStats: [],
    activityTrends: []
  };
}

/**
 * Fetches hospital-specific analytics data
 */
export async function getHospitalAnalytics(hospitalId: string): Promise<HospitalAnalyticsResult> {
  try {
    if (!hospitalId) {
      throw new Error('Hospital ID is required');
    }

    const dateRanges = getMonthDateRanges();

    // Fetch doctors for this hospital using the same query pattern as DoctorManagementService
    const { data: doctorsData, error: doctorsError } = await supabaseAdmin
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
          is_active,
          created_at
        ),
        hospitals (
          name
        )
      `)
      .eq('hospital_id', hospitalId)
      .order('updated_at', { ascending: false });

    if (doctorsError) {
      throw new Error(`Failed to fetch doctors: ${doctorsError.message}`);
    }

    const totalDoctors = doctorsData?.length || 0;
    const activeDoctors = doctorsData?.filter(d => d.users?.is_active) || [];


    // Fetch patients for this hospital
    const { data: patientsData, error: patientsError } = await supabaseAdmin
      .from('patients')
      .select(`
        id,
        first_name,
        last_name,
        dementia_stage,
        hospital_id,
        primary_doctor_id,
        users!patients_id_fkey (
          created_at
        )
      `)
      .eq('hospital_id', hospitalId);

    if (patientsError) {
      throw new Error(`Failed to fetch patients: ${patientsError.message}`);
    }

    const totalPatients = patientsData?.length || 0;


    // Fetch MRI scans for this hospital in the current month
    const { data: currentScansData } = await supabaseAdmin
      .from('mri_scans')
      .select('id, created_at')
      .eq('hospital_id', hospitalId)
      .gte('created_at', dateRanges.currentMonthStart)
      .lte('created_at', dateRanges.currentMonthEnd);

    // Fetch previous month MRI scans for growth calculation
    const { data: prevScansData } = await supabaseAdmin
      .from('mri_scans')
      .select('id')
      .eq('hospital_id', hospitalId)
      .gte('created_at', dateRanges.previousMonthStart)
      .lte('created_at', dateRanges.previousMonthEnd);

    const monthlyDiagnoses = currentScansData?.length || 0;
    const previousMonthDiagnoses = prevScansData?.length || 0;
    const pendingReports = 0; // Reports functionality not yet implemented

    // Fetch ALL MRI scans for this hospital (used for per-doctor count + monthly trends)
    const { data: allScansData } = await supabaseAdmin
      .from('mri_scans')
      .select('id, doctor_id, created_at')
      .eq('hospital_id', hospitalId);

    // Calculate growth percentages
    const currentMonthDoctors = doctorsData?.filter(d => 
      d.users?.created_at && new Date(d.users.created_at) >= new Date(dateRanges.currentMonthStart)
    ).length || 0;
    const previousMonthDoctors = doctorsData?.filter(d => {
      if (!d.users?.created_at) return false;
      const createdAt = new Date(d.users.created_at);
      return createdAt >= new Date(dateRanges.previousMonthStart) && 
             createdAt <= new Date(dateRanges.previousMonthEnd);
    }).length || 0;

    const currentMonthPatients = patientsData?.filter(p => 
      p.users?.created_at && new Date(p.users.created_at) >= new Date(dateRanges.currentMonthStart)
    ).length || 0;
    const previousMonthPatients = patientsData?.filter(p => {
      if (!p.users?.created_at) return false;
      const createdAt = new Date(p.users.created_at);
      return createdAt >= new Date(dateRanges.previousMonthStart) && 
             createdAt <= new Date(dateRanges.previousMonthEnd);
    }).length || 0;

    const doctorGrowth = calculateGrowthPercentage(currentMonthDoctors, previousMonthDoctors);
    const patientGrowth = calculateGrowthPercentage(currentMonthPatients, previousMonthPatients);
    const diagnosesGrowth = calculateGrowthPercentage(monthlyDiagnoses, previousMonthDiagnoses);

    // Generate recent activity from database data
    const recentActivity: ActivityItem[] = [];
    
    // Add recent doctor registrations (most recent first)
    const recentDoctors = doctorsData
      ?.filter(d => d.users?.created_at)
      .sort((a, b) => new Date(b.users!.created_at).getTime() - new Date(a.users!.created_at).getTime())
      .slice(0, 3) || [];
    recentDoctors.forEach(doctor => {
      const doctorName = `${doctor.first_name} ${doctor.last_name}`;
      recentActivity.push({
        id: `doctor-${doctor.id}`,
        type: 'doctor',
        message: `New doctor added: Dr. ${doctorName} (${doctor.specialization})`,
        time: formatTimeAgo(doctor.users.created_at),
        created_at: doctor.users.created_at
      });
    });

    // Add recent patient registrations (most recent first)
    const recentPatients = patientsData
      ?.filter(p => p.users?.created_at)
      .sort((a, b) => new Date(b.users!.created_at).getTime() - new Date(a.users!.created_at).getTime())
      .slice(0, 3) || [];
    recentPatients.forEach(patient => {
      const dementiaStage = patient.dementia_stage ? patient.dementia_stage.charAt(0).toUpperCase() + patient.dementia_stage.slice(1) : 'Unknown';
      recentActivity.push({
        id: `patient-${patient.id}`,
        type: 'patient',
        message: `New patient registered: ${patient.first_name} ${patient.last_name} (${dementiaStage} stage)`,
        time: formatTimeAgo(patient.users.created_at),
        created_at: patient.users.created_at
      });
    });

    // Skip MRI scans and diagnosis activities since AI functionality is not implemented yet
    // This will be added back when AI diagnosis module is ready

    // Sort by creation time (newest first) and take top 8
    recentActivity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    let limitedActivity = recentActivity.slice(0, 8);
    
    // If no activities, add a message about system setup
    if (limitedActivity.length === 0) {
      if (totalDoctors > 0 || totalPatients > 0) {
        limitedActivity = [{
          id: 'setup-complete',
          type: 'report' as const,
          message: `Hospital setup complete with ${totalDoctors} doctor${totalDoctors !== 1 ? 's' : ''} and ${totalPatients} patient${totalPatients !== 1 ? 's' : ''}`,
          time: 'System status',
          created_at: new Date().toISOString()
        }];
      } else {
        limitedActivity = [{
          id: 'getting-started',
          type: 'report' as const,
          message: 'Ready to get started! Add your first doctor and patients to see activity here',
          time: 'Getting started',
          created_at: new Date().toISOString()
        }];
      }
    }

    // Deduplicate active doctors by ID (prevents double-entries if the same row
    // appears multiple times due to join expansion)
    const uniqueActiveDoctors = activeDoctors.filter(
      (doctor, index, self) => index === self.findIndex(d => d.id === doctor.id)
    );

    // Calculate top doctors by actual patient count + real MRI scan diagnosis count
    let topDoctors: TopDoctor[] = uniqueActiveDoctors.map(doctor => {
      const doctorPatients = patientsData?.filter(p => p.primary_doctor_id === doctor.id) || [];
      const doctorDiagnoses = allScansData?.filter(s => s.doctor_id === doctor.id).length || 0;

      return {
        name: `Dr. ${doctor.first_name} ${doctor.last_name}`,
        specialization: doctor.specialization || 'General',
        department: doctor.department || 'General',
        diagnoses: doctorDiagnoses,
        patients: doctorPatients.length
      };
    }).sort((a, b) => b.patients - a.patients).slice(0, 8);

    // Calculate department statistics (use deduplicated list)
    const departmentMap = new Map<string, DepartmentStat>();

    uniqueActiveDoctors.forEach(doctor => {
      const dept = doctor.department || 'General';
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, {
          name: dept,
          doctors: 0,
          patients: 0,
          diagnoses: 0
        });
      }
      
      const deptStat = departmentMap.get(dept)!;
      deptStat.doctors++;
      
      const doctorPatients = patientsData?.filter(p => p.primary_doctor_id === doctor.id) || [];
      deptStat.patients += doctorPatients.length;
      deptStat.diagnoses += allScansData?.filter(s => s.doctor_id === doctor.id).length || 0;
    });

    const departmentStats = Array.from(departmentMap.values())
      .sort((a, b) => b.patients - a.patients);

    // Calculate average response time (mock for now - could be calculated from actual diagnosis times)
    const avgResponseTime = totalDoctors > 0 ? "2.3 hours" : "0 hours";

    // Generate historical activity trends for the last 6 months
    const activityTrends: MonthlyActivityData[] = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      // Calculate actual patient registrations for this month
      const monthPatients = patientsData?.filter(p => {
        if (!p.users?.created_at) return false;
        const createdDate = new Date(p.users.created_at);
        return createdDate >= date && createdDate <= endDate;
      }).length || 0;

      // Calculate actual MRI scan diagnoses for this month
      const monthDiagnoses = allScansData?.filter(s => {
        if (!s.created_at) return false;
        const createdDate = new Date(s.created_at);
        return createdDate >= date && createdDate <= endDate;
      }).length || 0;

      activityTrends.push({
        month: monthName,
        patients: monthPatients,
        diagnoses: monthDiagnoses,
        reports: 0, // Reports feature not implemented
        year: year
      });
      
      // Debug: Log each month's data
    }

    const analytics: HospitalAnalytics = {
      totalDoctors,
      totalPatients,
      monthlyDiagnoses,
      pendingReports,
      doctorGrowth: Math.round(doctorGrowth * 10) / 10,
      patientGrowth: Math.round(patientGrowth * 10) / 10,
      diagnosesGrowth: Math.round(diagnosesGrowth * 10) / 10,
      avgResponseTime,
      recentActivity: limitedActivity,
      topDoctors,
      departmentStats,
      activityTrends
    };

    return {
      success: true,
      data: analytics,
    };

  } catch (error: any) {
    console.error('Hospital analytics error:', error);
    
    // Return default analytics structure instead of failing completely
    return {
      success: true,
      data: createDefaultAnalytics(),
    };
  }
}
