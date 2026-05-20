import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/lib/query-keys';
import { PatientReportData } from '../services/patient-report.service';

/**
 * Fetches the monthly report for a given patient, year, and month.
 * Disabled automatically when patientId is null/empty.
 */
export function usePatientReport(
  patientId: string | null,
  year: number,
  month: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.patientReport(patientId ?? '', year, month),
    queryFn: async (): Promise<PatientReportData> => {
      const res = await fetch(
        `/api/doctor/patients/${patientId}/report?year=${year}&month=${month}`,
      );

      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          message = body?.message ?? message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const body = await res.json();
      if (!body.success) {
        throw new Error(body.message ?? 'Failed to load report');
      }
      return body.data as PatientReportData;
    },
    enabled: !!(patientId && (options?.enabled ?? true)),
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 10 * 60 * 1000,     // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: unknown) => {
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('404') || msg.includes('403') || msg.includes('401')) return false;
      return failureCount < 2;
    },
  });
}
