import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Hospital data interface
export interface HospitalData {
  id: string;
  name: string;
  address?: string;
  phone_number?: string;
  is_approved: boolean;
  created_at: string;
}

/**
 * Hook to fetch hospital data for the current hospital admin user
 * This is a fallback for cases where hospital data is not attached to the user object
 */
export const useHospitalData = (enabled: boolean = true) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['hospital', 'admin-data', user?.id],
    queryFn: async (): Promise<HospitalData | null> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      if (user.user_type !== 'hospital_admin') {
        throw new Error('User is not a hospital admin');
      }

      // If hospital data is already in the user object, return it
      if (user.hospital) {
        // We still need to fetch full hospital data as user object only has id and name
        const { data, error } = await supabase
          .from('hospitals')
          .select('id, name, address, phone_number, is_approved, created_at')
          .eq('id', user.hospital.id)
          .eq('is_approved', true)
          .maybeSingle();

        if (error) {
          throw new Error(`Failed to fetch hospital details: ${error.message}`);
        }

        return data;
      }

      // Fallback: use API endpoint that uses admin client to bypass RLS issues
      try {
        const response = await fetch('/api/hospital-admin/data', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }

        const result = await response.json();
        return result.data?.hospital || null;
      } catch (fetchError: any) {
        console.error('API fetch failed, trying direct query:', fetchError);
        
        // Final fallback: direct query (might fail due to RLS)
        const { data, error } = await supabase
          .from('hospitals')
          .select('id, name, address, phone_number, is_approved, created_at')
          .eq('admin_user_id', user.id)
          .maybeSingle();

        if (error) {
          throw new Error(`Failed to fetch hospital data: ${error.message}. API also failed: ${fetchError.message}`);
        }

        return data;
      }
    },
    enabled: enabled && !!user && user.user_type === 'hospital_admin',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
    refetchOnMount: true, // Fetch on mount if data is stale or absent
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    retry: (failureCount, error: any) => {
      // Don't retry if it's an authentication error
      if (error.message?.includes('not authenticated') || error.message?.includes('not a hospital admin')) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });
};

/**
 * Hook to get hospital basic info (id and name) for the current user
 * This works for both hospital_admin (from hospital data) and doctor (from doctor_profile)
 */
export const useHospitalInfo = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['hospital', 'basic-info', user?.id],
    queryFn: async (): Promise<{ id: string; name: string } | null> => {
      if (!user) {
        return null;
      }

      // For hospital admin
      if (user.user_type === 'hospital_admin') {
        if (user.hospital) {
          return user.hospital;
        }

        // Fallback query
        const { data, error } = await supabase
          .from('hospitals')
          .select('id, name')
          .eq('admin_user_id', user.id)
          .eq('is_approved', true)
          .maybeSingle();

        if (error) {
          throw new Error(`Failed to fetch hospital info: ${error.message}`);
        }

        return data;
      }

      // For doctor
      if (user.user_type === 'doctor' && user.doctor_profile) {
        return {
          id: user.doctor_profile.hospital_id,
          name: user.doctor_profile.hospital_name
        };
      }

      return null;
    },
    enabled: !!user && (user.user_type === 'hospital_admin' || user.user_type === 'doctor'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true, // Fetch on mount if data is stale or absent
    refetchOnWindowFocus: false, // Don't refetch on tab switch
  });
};

/**
 * Hook to check if hospital data is available
 */
export const useHospitalValidation = () => {
  const { user } = useAuth();
  const { data: hospitalData, isLoading, error } = useHospitalData(
    user?.user_type === 'hospital_admin' && !user?.hospital
  );

  const isHospitalDataAvailable = user?.user_type === 'hospital_admin' 
    ? !!(user?.hospital || hospitalData)
    : user?.user_type === 'doctor' 
      ? !!user?.doctor_profile?.hospital_id
      : false;

  const hospitalInfo = user?.user_type === 'hospital_admin'
    ? (user?.hospital || (hospitalData ? { id: hospitalData.id, name: hospitalData.name } : null))
    : user?.user_type === 'doctor' && user?.doctor_profile
      ? { id: user.doctor_profile.hospital_id, name: user.doctor_profile.hospital_name }
      : null;

  return {
    isHospitalDataAvailable,
    hospitalInfo,
    isLoading,
    error,
    hospitalData
  };
};
