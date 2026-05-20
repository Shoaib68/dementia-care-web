import React from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  useInfiniteQuery,
  UseQueryOptions,
  UseMutationOptions,
  InfiniteData 
} from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { api, transformApiResponse, handleApiError, PaginatedResponse } from '@/shared/lib/api';
import { GeneratedCredentials } from '@/features/auth/types';

// HospitalFormData type
export interface HospitalFormData {
  hospitalName: string;
  address: string;
  phone: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
}

// Types
export interface Hospital {
  id: string;
  name: string;
  address?: string;
  phone_number?: string;
  location?: string;
  email?: string;
  phone?: string;
  is_approved: boolean;
  created_at: string;
  users: {
    email: string;
    is_active: boolean;
    updated_at: string;
  };
}


export interface CreateHospitalResponse {
  hospitalId: string;
  adminCredentials: GeneratedCredentials;
}

export interface HospitalFilters {
  search?: string;
  status?: 'active' | 'inactive' | 'pending';
}

// Types for deletion preview
export interface DeletionPreviewData {
  hospitalName: string;
  doctors: number;
  patients: number;
  medicalNotes: number;
  mriScans: number;
  gameSessions: number;
  schedules: number;
  totalRecords: number;
}

export interface DeletionCounts {
  doctors: number;
  patients: number;
  medicalNotes: number;
  mriScans: number;
  gameSessions: number;
  schedules: number;
  iotDevices: number;
  bleConnections: number;
  locationAlerts: number;
  monthlyReports: number;
}

export interface DeletionResult {
  success: boolean;
  deletionCounts: DeletionCounts;
  totalRecordsDeleted: number;
}

// API functions
const hospitalsApi = {
  getHospitals: async (filters?: HospitalFilters): Promise<Hospital[]> => {
    const response = await api.get<Hospital[]>('/api/super-admin/hospitals', {
      timeout: 15000, // 15 seconds for hospitals data
      ...(filters && {
        headers: { 'X-Filters': JSON.stringify(filters) }
      })
    });
    return transformApiResponse(response);
  },

  getHospitalsPaginated: async (
    page: number = 1, 
    limit: number = 10, 
    filters?: HospitalFilters
  ): Promise<PaginatedResponse<Hospital>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.status && { status: filters.status }),
    });

    const response = await api.get<PaginatedResponse<Hospital>>(
      `/api/super-admin/hospitals?${params.toString()}`
    );
    return transformApiResponse(response);
  },

  createHospital: async (data: HospitalFormData): Promise<CreateHospitalResponse> => {
    const response = await api.post<CreateHospitalResponse>('/api/super-admin/hospitals', data);
    return transformApiResponse(response);
  },

  updateHospital: async (id: string, data: Partial<HospitalFormData>): Promise<Hospital> => {
    const response = await api.put<Hospital>(`/api/super-admin/hospitals/${id}`, data);
    return transformApiResponse(response);
  },

  deleteHospital: async (id: string): Promise<DeletionResult> => {
    const response = await api.delete<DeletionResult>(`/api/super-admin/hospitals/${id}`);
    return transformApiResponse(response);
  },

  getDeletionPreview: async (id: string): Promise<DeletionPreviewData> => {
    const response = await api.get<DeletionPreviewData>(`/api/super-admin/hospitals/${id}/deletion-preview`);
    return transformApiResponse(response);
  },

  toggleHospitalStatus: async (id: string, active: boolean): Promise<Hospital> => {
    const response = await api.patch<Hospital>(`/api/super-admin/hospitals/${id}/status`, { active });
    return transformApiResponse(response);
  },
};

// Query hooks
export const useHospitals = (
  filters?: HospitalFilters,
  options?: UseQueryOptions<Hospital[], Error>
) => {
  return useQuery({
    queryKey: queryKeys.hospitalsList(filters),
    queryFn: () => hospitalsApi.getHospitals(filters),
    // Optimized settings for reliable data loading
    enabled: true,
    staleTime: 3 * 60 * 1000, // 3 minutes - reasonable cache
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    refetchOnMount: true, // Fetch on mount if data is stale or absent
    refetchOnWindowFocus: false, // Don't spam on tab switch
    refetchOnReconnect: true, // Fetch when connection returns
    networkMode: 'online' as const,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 2; // Up to 2 retries
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    ...options,
  });
};

// Infinite query for large hospital lists with pagination
export const useHospitalsInfinite = (
  filters?: HospitalFilters,
  limit: number = 20
) => {
  return useInfiniteQuery({
    queryKey: queryKeys.hospitalsInfinite(filters),
    queryFn: ({ pageParam = 1 }) => 
      hospitalsApi.getHospitalsPaginated(pageParam, limit, filters),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.hasNext) {
        return (lastPage.pagination.page || 0) + 1;
      }
      return undefined;
    },
    getPreviousPageParam: (firstPage) => {
      if (firstPage.pagination?.hasPrev) {
        return (firstPage.pagination.page || 1) - 1;
      }
      return undefined;
    },
    staleTime: process.env.NODE_ENV === 'development' ? 0 : 5 * 60 * 1000, // No cache in dev, 5 minutes in prod
    refetchOnMount: true, // Fetch on mount if data is stale or absent
  });
};

// Mutation hooks with optimistic updates
export const useCreateHospital = (
  options?: UseMutationOptions<CreateHospitalResponse, Error, HospitalFormData, { previousHospitals: Hospital[] | undefined }>
) => {
  const queryClient = useQueryClient();

  return useMutation<CreateHospitalResponse, Error, HospitalFormData, { previousHospitals: Hospital[] | undefined }>({
    mutationFn: (data: HospitalFormData) => {
      return hospitalsApi.createHospital(data);
    },
    onMutate: async (newHospital) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.hospitals });

      // Snapshot the previous value
      const previousHospitals = queryClient.getQueryData<Hospital[]>(queryKeys.hospitalsList());

      // Optimistically update to the new value
      if (previousHospitals) {
        const optimisticHospital: Hospital = {
          id: `temp-${Date.now()}`,
          name: newHospital.hospitalName,
          address: newHospital.address,
          phone_number: newHospital.phone,
          is_approved: true,
          created_at: new Date().toISOString(),
          users: {
            email: newHospital.adminEmail,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
        };

        queryClient.setQueryData<Hospital[]>(
          queryKeys.hospitalsList(),
          [optimisticHospital, ...previousHospitals]
        );
      }

      // Return a context object with the snapshotted value
      return { previousHospitals };
    },
    onError: (err, newHospital, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousHospitals) {
        queryClient.setQueryData<Hospital[]>(
          queryKeys.hospitalsList(),
          context.previousHospitals
        );
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch hospitals list
      queryClient.invalidateQueries({ queryKey: queryKeys.hospitals });
      
      // Invalidate related analytics queries
      queryClient.invalidateQueries({ queryKey: queryKeys.systemAnalytics() });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.hospitals });
    },
    ...options,
  });
};

export const useUpdateHospital = (
  options?: UseMutationOptions<Hospital, Error, { id: string; data: Partial<HospitalFormData> }, { previousHospitals: Hospital[] | undefined }>
) => {
  const queryClient = useQueryClient();

  return useMutation<Hospital, Error, { id: string; data: Partial<HospitalFormData> }, { previousHospitals: Hospital[] | undefined }>({
    mutationFn: ({ id, data }) => hospitalsApi.updateHospital(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.hospitals });

      const previousHospitals = queryClient.getQueryData<Hospital[]>(queryKeys.hospitalsList());

      if (previousHospitals) {
        const updatedHospitals = previousHospitals.map(hospital =>
          hospital.id === id
            ? {
                ...hospital,
                name: data.hospitalName || hospital.name,
                address: data.address || hospital.address,
                phone_number: data.phone || hospital.phone_number,
              }
            : hospital
        );

        queryClient.setQueryData<Hospital[]>(queryKeys.hospitalsList(), updatedHospitals);
      }

      return { previousHospitals };
    },
    onError: (err, { id }, context) => {
      if (context?.previousHospitals) {
        queryClient.setQueryData<Hospital[]>(
          queryKeys.hospitalsList(),
          context.previousHospitals
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hospitals });
    },
    ...options,
  });
};

// Deletion preview hook
export const useHospitalDeletionPreview = (
  hospitalId: string,
  options?: UseQueryOptions<DeletionPreviewData, Error>
) => {
  return useQuery({
    queryKey: [...queryKeys.hospital.detail(hospitalId), 'deletion-preview'],
    queryFn: () => hospitalsApi.getDeletionPreview(hospitalId),
    enabled: !!hospitalId,
    staleTime: process.env.NODE_ENV === 'development' ? 0 : 1 * 60 * 1000, // No cache in dev, 1 minute in prod
    refetchOnMount: true, // Fetch on mount if data is stale or absent
    ...options,
  });
};

export const useDeleteHospital = (
  options?: UseMutationOptions<DeletionResult, Error, string, { previousHospitals: Hospital[] | undefined; hospitalToDelete: Hospital | undefined }>
) => {
  const queryClient = useQueryClient();

  return useMutation<DeletionResult, Error, string, { previousHospitals: Hospital[] | undefined; hospitalToDelete: Hospital | undefined }>({
    mutationFn: hospitalsApi.deleteHospital,
    onMutate: async (hospitalId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.hospitals });

      // Snapshot the previous hospitals list
      const previousHospitals = queryClient.getQueryData<Hospital[]>(queryKeys.hospitalsList());
      
      // Find the hospital being deleted for context
      const hospitalToDelete = previousHospitals?.find(h => h.id === hospitalId);

      // Optimistically update the list (remove the hospital)
      if (previousHospitals) {
        const filteredHospitals = previousHospitals.filter(h => h.id !== hospitalId);
        queryClient.setQueryData<Hospital[]>(queryKeys.hospitalsList(), filteredHospitals);
      }

      return { 
        previousHospitals,
        hospitalToDelete 
      };
    },
    onError: (error, hospitalId, context) => {
      // Rollback the optimistic update
      if (context?.previousHospitals) {
        queryClient.setQueryData<Hospital[]>(
          queryKeys.hospitalsList(),
          context.previousHospitals
        );
      }
      
      // Enhanced error logging
      console.error(`Failed to delete hospital ${hospitalId}:`, {
        error: error.message,
        hospitalName: context?.hospitalToDelete?.name,
        timestamp: new Date().toISOString()
      });
      
      // Call the error handler if provided
      if (options?.onError) {
        options.onError(error, hospitalId, context);
      }
    },
    onSuccess: (data, hospitalId, context) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.hospitals });
      queryClient.invalidateQueries({ queryKey: queryKeys.systemAnalytics() });
      
      // Remove the deletion preview cache for this hospital
      queryClient.removeQueries({ 
        queryKey: [...queryKeys.hospital.detail(hospitalId), 'deletion-preview'] 
      });
      
      // Call the success handler if provided
      if (options?.onSuccess) {
        options.onSuccess(data, hospitalId, context);
      }
    },
    onSettled: (data, error, hospitalId, context) => {
      // Always refetch hospitals list to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.hospitals });
      
      // Call the settled handler if provided
      if (options?.onSettled) {
        options.onSettled(data, error, hospitalId, context);
      }
    },
    // Enhanced retry logic for network errors
    retry: (failureCount, error) => {
      // Don't retry for client errors (400-499)
      if (error instanceof Error && error.message.includes('4')) {
        return false;
      }
      // Retry up to 2 times for server errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
};

export const useToggleHospitalStatus = (
  options?: UseMutationOptions<Hospital, Error, { id: string; active: boolean }, { previousHospitals: Hospital[] | undefined }>
) => {
  const queryClient = useQueryClient();

  return useMutation<Hospital, Error, { id: string; active: boolean }, { previousHospitals: Hospital[] | undefined }>({
    mutationFn: ({ id, active }) => hospitalsApi.toggleHospitalStatus(id, active),
    onMutate: async ({ id, active }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.hospitals });

      const previousHospitals = queryClient.getQueryData<Hospital[]>(queryKeys.hospitalsList());

      if (previousHospitals) {
        const updatedHospitals = previousHospitals.map(hospital =>
          hospital.id === id
            ? { ...hospital, users: { ...hospital.users, is_active: active } }
            : hospital
        );

        queryClient.setQueryData<Hospital[]>(queryKeys.hospitalsList(), updatedHospitals);
      }

      return { previousHospitals };
    },
    onError: (err, { id }, context) => {
      if (context?.previousHospitals) {
        queryClient.setQueryData<Hospital[]>(
          queryKeys.hospitalsList(),
          context.previousHospitals
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hospitals });
    },
    ...options,
  });
};

// Utility hooks
export const useHospitalSearch = (searchTerm: string, debounceMs: number = 300) => {
  const [debouncedSearch, setDebouncedSearch] = React.useState(searchTerm);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  return useHospitals({ search: debouncedSearch });
};

// Export error handler for consistent error handling
export const useHospitalError = () => {
  return { handleError: handleApiError };
};
