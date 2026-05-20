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
import { CreateDoctorRequest, GeneratedCredentials } from '@/features/auth/types';

// Types
export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  hospital_id: string;
  specialization: string;
  license_number: string;
  phone_number: string | null;
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

export interface DoctorFormData {
  email: string;
  firstName: string;
  lastName: string;
  specialization: string;
  licenseNumber: string;
  phone?: string;
  hospitalId: string;
}

export interface CreateDoctorResponse {
  doctor: Doctor;
  credentials: GeneratedCredentials;
}

export interface DoctorFilters {
  search?: string;
  specialization?: string;
  status?: 'active' | 'inactive';
  hospitalId?: string;
}

// API functions
const doctorsApi = {
  getDoctors: async (filters?: DoctorFilters): Promise<Doctor[]> => {
    const response = await api.get<Doctor[]>('/api/hospital-admin/doctors', {
      ...(filters && {
        headers: { 'X-Filters': JSON.stringify(filters) }
      })
    });
    return transformApiResponse(response);
  },

  getDoctorsPaginated: async (
    page: number = 1, 
    limit: number = 10, 
    filters?: DoctorFilters
  ): Promise<PaginatedResponse<Doctor>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.specialization && { specialization: filters.specialization }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.hospitalId && { hospitalId: filters.hospitalId }),
    });

    const response = await api.get<PaginatedResponse<Doctor>>(
      `/api/hospital-admin/doctors?${params.toString()}`
    );
    return transformApiResponse(response);
  },

  createDoctor: async (data: DoctorFormData): Promise<CreateDoctorResponse> => {
    const response = await api.post<CreateDoctorResponse>('/api/hospital-admin/doctors', data);
    return transformApiResponse(response);
  },

  updateDoctor: async (id: string, data: Partial<DoctorFormData>): Promise<Doctor> => {
    const response = await api.put<Doctor>(`/api/hospital-admin/doctors/${id}`, data);
    return transformApiResponse(response);
  },

  deactivateDoctor: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.patch<{ success: boolean }>(`/api/hospital-admin/doctors/${id}/deactivate`);
    return transformApiResponse(response);
  },

  activateDoctor: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.patch<{ success: boolean }>(`/api/hospital-admin/doctors/${id}/activate`);
    return transformApiResponse(response);
  },

  getDoctorById: async (id: string): Promise<Doctor> => {
    const response = await api.get<Doctor>(`/api/hospital-admin/doctors/${id}`);
    return transformApiResponse(response);
  },
};

// Query hooks
export const useDoctors = (
  filters?: DoctorFilters,
  options?: UseQueryOptions<Doctor[], Error>
) => {
  return useQuery({
    queryKey: queryKeys.doctorsList(filters),
    queryFn: () => doctorsApi.getDoctors(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useDoctor = (
  id: string,
  options?: UseQueryOptions<Doctor, Error>
) => {
  return useQuery({
    queryKey: queryKeys.doctor(id),
    queryFn: () => doctorsApi.getDoctorById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
    ...options,
  });
};

// Infinite query for large doctor lists with pagination
export const useDoctorsInfinite = (
  filters?: DoctorFilters,
  limit: number = 20
) => {
  return useInfiniteQuery({
    queryKey: queryKeys.doctorsInfinite(filters),
    queryFn: ({ pageParam = 1 }) => 
      doctorsApi.getDoctorsPaginated(pageParam, limit, filters),
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
    staleTime: 5 * 60 * 1000,
  });
};

// Mutation hooks with optimistic updates
export const useCreateDoctor = (
  options?: UseMutationOptions<CreateDoctorResponse, Error, DoctorFormData>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: doctorsApi.createDoctor,
    onMutate: async (newDoctor) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.doctors });

      // Snapshot the previous value
      const previousDoctors = queryClient.getQueryData<Doctor[]>(queryKeys.doctorsList());

      // Optimistically update to the new value
      if (previousDoctors) {
        const optimisticDoctor: Doctor = {
          id: `temp-${Date.now()}`,
          first_name: newDoctor.firstName,
          last_name: newDoctor.lastName,
          hospital_id: newDoctor.hospitalId,
          specialization: newDoctor.specialization,
          license_number: newDoctor.licenseNumber,
          phone_number: newDoctor.phone || null,
          created_by: 'temp',
          updated_at: new Date().toISOString(),
          users: {
            email: newDoctor.email,
            is_active: true,
          },
        };

        queryClient.setQueryData<Doctor[]>(
          queryKeys.doctorsList(),
          [optimisticDoctor, ...previousDoctors]
        );
      }

      return { previousDoctors };
    },
    onError: (err, newDoctor, context) => {
      if (context?.previousDoctors) {
        queryClient.setQueryData<Doctor[]>(
          queryKeys.doctorsList(),
          context.previousDoctors
        );
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch doctors list
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors });
      
      // Invalidate related analytics queries
      queryClient.invalidateQueries({ queryKey: queryKeys.hospitalAnalytics(variables.hospitalId) });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors });
    },
    ...options,
  });
};

export const useUpdateDoctor = (
  options?: UseMutationOptions<Doctor, Error, { id: string; data: Partial<DoctorFormData> }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => doctorsApi.updateDoctor(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.doctors });

      const previousDoctors = queryClient.getQueryData<Doctor[]>(queryKeys.doctorsList());

      if (previousDoctors) {
        const updatedDoctors = previousDoctors.map(doctor =>
          doctor.id === id
            ? {
                ...doctor,
                specialization: data.specialization || doctor.specialization,
                license_number: data.licenseNumber || doctor.license_number,
                users: {
                  ...doctor.users,
                  email: data.email || doctor.users.email,
                }
              }
            : doctor
        );

        queryClient.setQueryData<Doctor[]>(queryKeys.doctorsList(), updatedDoctors);
      }

      return { previousDoctors };
    },
    onError: (err, { id }, context) => {
      if (context?.previousDoctors) {
        queryClient.setQueryData<Doctor[]>(
          queryKeys.doctorsList(),
          context.previousDoctors
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors });
    },
    ...options,
  });
};

export const useDeactivateDoctor = (
  options?: UseMutationOptions<{ success: boolean }, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: doctorsApi.deactivateDoctor,
    onMutate: async (doctorId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.doctors });

      const previousDoctors = queryClient.getQueryData<Doctor[]>(queryKeys.doctorsList());

      if (previousDoctors) {
        const updatedDoctors = previousDoctors.map(doctor =>
          doctor.id === doctorId
            ? { ...doctor, users: { ...doctor.users, is_active: false } }
            : doctor
        );
        queryClient.setQueryData<Doctor[]>(queryKeys.doctorsList(), updatedDoctors);
      }

      return { previousDoctors };
    },
    onError: (err, doctorId, context) => {
      if (context?.previousDoctors) {
        queryClient.setQueryData<Doctor[]>(
          queryKeys.doctorsList(),
          context.previousDoctors
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors });
    },
    ...options,
  });
};

export const useActivateDoctor = (
  options?: UseMutationOptions<{ success: boolean }, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: doctorsApi.activateDoctor,
    onMutate: async (doctorId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.doctors });

      const previousDoctors = queryClient.getQueryData<Doctor[]>(queryKeys.doctorsList());

      if (previousDoctors) {
        const updatedDoctors = previousDoctors.map(doctor =>
          doctor.id === doctorId
            ? { ...doctor, users: { ...doctor.users, is_active: true } }
            : doctor
        );
        queryClient.setQueryData<Doctor[]>(queryKeys.doctorsList(), updatedDoctors);
      }

      return { previousDoctors };
    },
    onError: (err, doctorId, context) => {
      if (context?.previousDoctors) {
        queryClient.setQueryData<Doctor[]>(
          queryKeys.doctorsList(),
          context.previousDoctors
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors });
    },
    ...options,
  });
};

// Utility hooks
export const useDoctorSearch = (searchTerm: string, debounceMs: number = 300) => {
  const [debouncedSearch, setDebouncedSearch] = React.useState(searchTerm);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  return useDoctors({ search: debouncedSearch });
};

export const useDoctorsBySpecialization = (specialization: string) => {
  return useDoctors({ specialization }, { enabled: !!specialization });
};

export const useDoctorsByHospital = (hospitalId: string) => {
  return useDoctors({ hospitalId }, { enabled: !!hospitalId });
};

// Export error handler for consistent error handling
export const useDoctorError = () => {
  return { handleError: handleApiError };
};
