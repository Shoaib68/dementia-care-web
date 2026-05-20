import { supabaseAdmin } from '@/shared/lib/supabase-admin';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MRIRetrainingStats {
  total: number;
  byStage: {
    'Non Demented': number;
    Mild: number;
    Moderate: number;
    Severe: number;
  };
  byFeedback: {
    correct: number;
    incorrect: number;
  };
}

export interface MRIScanForRetraining {
  id: string;
  file_url: string;
  doctor_final_stage: string;
  ai_diagnosis_stage: string | null;
  scan_date: string | null;
  feedback_status: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Returns a breakdown of doctor-verified MRI scans per dementia stage
 * and per feedback type (correct / incorrect).
 * Only includes rows that have an uploaded image and a doctor final stage.
 */
export async function getMRIRetrainingStats(): Promise<ServiceResult<MRIRetrainingStats>> {
  try {
    const { data: scans, error } = await supabaseAdmin
      .from('mri_scans')
      .select('doctor_final_stage, feedback_status')
      .not('file_url', 'is', null)
      .not('doctor_final_stage', 'is', null)
      .not('feedback_status', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch MRI stats: ${error.message}`);
    }

    const stats: MRIRetrainingStats = {
      total: scans?.length ?? 0,
      byStage: {
        'Non Demented': 0,
        Mild: 0,
        Moderate: 0,
        Severe: 0,
      },
      byFeedback: {
        correct: 0,
        incorrect: 0,
      },
    };

    for (const scan of scans ?? []) {
      const stage = scan.doctor_final_stage as keyof typeof stats.byStage;
      if (stage in stats.byStage) stats.byStage[stage]++;

      const fb = scan.feedback_status as keyof typeof stats.byFeedback;
      if (fb in stats.byFeedback) stats.byFeedback[fb]++;
    }

    return { success: true, data: stats };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch MRI retraining stats',
    };
  }
}

/**
 * Returns all MRI scan records needed to build the retraining dataset.
 * Only rows with a file URL + doctor final stage + feedback status are returned.
 */
export async function getMRIScansForRetraining(): Promise<
  ServiceResult<MRIScanForRetraining[]>
> {
  try {
    const { data: scans, error } = await supabaseAdmin
      .from('mri_scans')
      .select(
        'id, file_url, doctor_final_stage, ai_diagnosis_stage, scan_date, feedback_status'
      )
      .not('file_url', 'is', null)
      .not('doctor_final_stage', 'is', null)
      .not('feedback_status', 'is', null)
      .order('scan_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch MRI scans: ${error.message}`);
    }

    return { success: true, data: (scans as MRIScanForRetraining[]) ?? [] };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to fetch MRI scans for retraining',
    };
  }
}
