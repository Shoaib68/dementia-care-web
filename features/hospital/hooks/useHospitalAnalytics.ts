import { useQuery } from '@tanstack/react-query';
import { HospitalAnalytics, HospitalAnalyticsResult } from '../services/hospital-analytics.service';

interface UseHospitalAnalyticsOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook to fetch hospital analytics data
 */
export function useHospitalAnalytics(
  hospitalId: string | undefined, 
  options: UseHospitalAnalyticsOptions = {}
) {
  const { enabled = true, refetchInterval = 5 * 60 * 1000 } = options; // Default 5 minutes

  return useQuery({
    queryKey: ['hospital', 'analytics', hospitalId],
    queryFn: async (): Promise<HospitalAnalytics> => {
      try {
        // The API will get the hospital ID from the authenticated user, so we don't need to pass it
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch('/api/hospital-admin/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}), // Empty body - API gets hospital ID from auth
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // If parsing error response fails, use default message
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch hospital analytics');
        }
        
        // Validate the response structure
        const data = result.data;
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid analytics data received from server');
        }

        // Ensure all required fields have default values
        return {
          totalDoctors: data.totalDoctors || 0,
          totalPatients: data.totalPatients || 0,
          monthlyDiagnoses: data.monthlyDiagnoses || 0,
          pendingReports: data.pendingReports || 0,
          doctorGrowth: data.doctorGrowth || 0,
          patientGrowth: data.patientGrowth || 0,
          diagnosesGrowth: data.diagnosesGrowth || 0,
          avgResponseTime: data.avgResponseTime || '0 hours',
          recentActivity: Array.isArray(data.recentActivity) ? data.recentActivity : [],
          topDoctors: Array.isArray(data.topDoctors) ? data.topDoctors : [],
          departmentStats: Array.isArray(data.departmentStats) ? data.departmentStats : [],
          activityTrends: Array.isArray(data.activityTrends) ? data.activityTrends : [],
        };
      } catch (error: any) {
        // Enhanced error logging for debugging
        console.error('Hospital Analytics Error:', {
          message: error.message,
          name: error.name,
          hospitalId,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    },
    enabled: enabled, // Remove hospitalId dependency since API gets it from auth
    staleTime: 5 * 60 * 1000, // 5 minutes - increased to match super-admin
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true, // Fetch on mount if data is stale or absent
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    refetchInterval: false, // Disable auto-refresh by default, use manual refresh button
    refetchIntervalInBackground: false,
    retry: (failureCount, error: any) => {
      console.log(`Analytics query retry attempt ${failureCount + 1}:`, error.message);
      
      // Don't retry if it's a client error (400-499) or auth error
      if (error.message?.includes('HTTP 4') || error.message?.includes('Unauthorized')) {
        console.log('Not retrying due to client error or auth issue');
        return false;
      }
      
      // Don't retry if it's an abort error (timeout)
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.log('Not retrying due to request timeout');
        return false;
      }
      
      // Retry up to 3 times for server errors and network errors
      const shouldRetry = failureCount < 3;
      console.log(`Will retry: ${shouldRetry}`);
      return shouldRetry;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}

/**
 * Hook to fetch hospital analytics with auto-refresh every 5 minutes
 */
export function useHospitalAnalyticsLive(hospitalId: string | undefined) {
  return useHospitalAnalytics(hospitalId, {
    enabled: true,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch hospital analytics without auto-refresh
 */
export function useHospitalAnalyticsStatic(hospitalId: string | undefined) {
  return useHospitalAnalytics(hospitalId, {
    enabled: true,
    refetchInterval: undefined, // No auto-refresh
  });
}
