import { supabaseAdmin } from '@/shared/lib/supabase-admin';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyTaskData {
  weekLabel: string;
  weekNumber: number;
  weekStartDate: string;
  adherencePct: number;
  completed: number;
  scheduled: number;
  missed: number;
}

export interface TaskTypeReport {
  overallPct: number;
  weeklyData: WeeklyTaskData[];
  consistentlyCompleted: Record<string, number>;
  frequentlyMissed: Record<string, number>;
}

export interface WeeklyGameData {
  weekLabel: string;
  weekNumber: number;
  weekStartDate: string;
  avgScore: number;
  playsCount: number;
  totalDurationMinutes: number;
}

export interface GameReport {
  gameId: string;
  gameName: string;
  gameCode: string;
  cognitiveArea: string;
  description: string;
  difficultyLevel: number;
  weeklyData: WeeklyGameData[];
  hasAnyActivity: boolean;
}

export interface MedicalNoteReport {
  id: string;
  noteContent: string;
  recommendations: string;
  createdAt: string;
}

export interface PatientReportData {
  patientId: string;
  patientName: string;
  reportYear: number;
  reportMonth: number;
  currentDementiaStage: string;
  // Per-task overall percentages
  medicationAdherence: number;
  mealCompletion: number;
  activityCompletion: number;
  therapyParticipation: number;
  overallTaskAdherence: number;
  // Aggregated consistently/frequently tasks across all task types
  allConsistentlyCompleted: Record<string, number>;
  allFrequentlyMissed: Record<string, number>;
  // Per-task weekly breakdown
  taskDetails: {
    medication: TaskTypeReport;
    meal: TaskTypeReport;
    activity: TaskTypeReport;
    therapy: TaskTypeReport;
  };
  // Game performance (one entry per game in the patient's dementia stage)
  games: GameReport[];
  hasTaskData: boolean;
  hasGameData: boolean;
  // Medical notes written by doctor for this patient in the month
  medicalNotes: MedicalNoteReport[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely parse a JSONB field that may arrive as an object or as a JSON string.
 */
function parseJsonField(value: unknown): Record<string, number> {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, number>;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      // fall through
    }
  }
  return {};
}

/** Merge two Record<string, number> by summing values for the same key. */
function mergeCounts(
  a: Record<string, number>,
  b: Record<string, number>,
): Record<string, number> {
  const result = { ...a };
  for (const [key, val] of Object.entries(b)) {
    result[key] = (result[key] ?? 0) + val;
  }
  return result;
}

// ─── Main service function ─────────────────────────────────────────────────────

/**
 * Fetch all data required to render a patient's monthly report.
 *
 * Data sources:
 *  - `monthly_reports`            → overall task-adherence percentages
 *  - `task_adherence_summaries`   → weekly breakdown + consistently/frequently tasks
 *  - `games`                      → list of games for the patient's dementia stage
 *  - `game_performance_summaries` → weekly avg_score / plays_count per game
 */
export async function getPatientReport(
  patientId: string,
  year: number,
  month: number,
): Promise<{ success: boolean; data?: PatientReportData; error?: string }> {
  try {
    // ── Date range for the requested month ───────────────────────────────────
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const firstDayStr = firstDay.toISOString().split('T')[0]; // YYYY-MM-DD
    const lastDayStr = lastDay.toISOString().split('T')[0];

    // ── Round 1: run all independent queries in parallel ─────────────────────
    // (monthly_reports, task_summaries, and game_performances don't depend on
    //  each other — fire them all at once to avoid sequential round-trip latency)
    const [
      { data: patient, error: patientError },
      { data: monthlyReport },
      { data: taskSummaries },
      { data: gamePerformances },
      { data: medicalNotesData },
    ] = await Promise.all([
      // 1. Patient basic info
      supabaseAdmin
        .from('patients')
        .select('id, first_name, last_name, dementia_stage')
        .eq('id', patientId)
        .single(),

      // 2. Monthly report (for overall percentages)
      supabaseAdmin
        .from('monthly_reports')
        .select(
          'task_adherence, overall_task_adherence, task_completion_details, current_dementia_stage',
        )
        .eq('patient_id', patientId)
        .eq('report_year', year)
        .eq('report_month', month)
        .maybeSingle(),

      // 3. Task adherence summaries (weekly, all schedule types)
      supabaseAdmin
        .from('task_adherence_summaries')
        .select(
          `id, schedule_type, week_number, year, week_start_date, week_end_date,
           adherence_pct, total_completed, total_scheduled, total_missed,
           frequently_missed_tasks, consistently_completed_tasks`,
        )
        .eq('patient_id', patientId)
        .eq('year', year)
        .gte('week_start_date', firstDayStr)
        .lte('week_start_date', lastDayStr)
        .order('week_start_date', { ascending: true }),

      // 4. Game performance summaries for this patient in the month
      supabaseAdmin
        .from('game_performance_summaries')
        .select(
          `id, game_id, week_number, year, week_start_date, week_end_date,
           avg_score, plays_count, total_duration_minutes`,
        )
        .eq('patient_id', patientId)
        .eq('year', year)
        .gte('week_start_date', firstDayStr)
        .lte('week_start_date', lastDayStr)
        .order('week_start_date', { ascending: true }),

      // 5. Medical notes written for this patient in the month
      supabaseAdmin
        .from('medical_notes')
        .select('id, note_content, recommendations, created_at')
        .eq('patient_id', patientId)
        .gte('created_at', firstDay.toISOString())
        .lte('created_at', new Date(year, month, 0, 23, 59, 59, 999).toISOString())
        .order('created_at', { ascending: true }),
    ]);

    if (patientError || !patient) {
      throw new Error('Patient not found');
    }

    const taskRows = taskSummaries ?? [];
    const gamePerfRows = gamePerformances ?? [];

    // ── Round 2: games query (requires dementia_stage from patient) ───────────
    const dementiaStage = patient.dementia_stage as string;

    const { data: gamesData } = await supabaseAdmin
      .from('games')
      .select('id, game_name, game_code, cognitive_area, description, difficulty_level')
      .eq('dementia_stage', dementiaStage)
      .eq('is_active', true)
      .order('game_name', { ascending: true });

    const games = gamesData ?? [];

    // ── Compute week labels for task charts ───────────────────────────────────
    const taskWeekDates: string[] = [
      ...new Set(taskRows.map((r) => r.week_start_date)),
    ].sort();

    const taskWeekLabel = (date: string): string => {
      const idx = taskWeekDates.indexOf(date);
      return idx >= 0 ? `Week ${idx + 1}` : 'Week';
    };

    // ── Build per-task-type report ─────────────────────────────────────────────
    const buildTaskReport = (scheduleType: string): TaskTypeReport => {
      const rows = taskRows.filter((r) => r.schedule_type === scheduleType);

      const weeklyData: WeeklyTaskData[] = rows.map((r) => ({
        weekLabel: taskWeekLabel(r.week_start_date),
        weekNumber: r.week_number as number,
        weekStartDate: r.week_start_date as string,
        adherencePct: Math.round(Number(r.adherence_pct) * 10) / 10 || 0,
        completed: (r.total_completed as number) || 0,
        scheduled: (r.total_scheduled as number) || 0,
        missed: (r.total_missed as number) || 0,
      }));

      // Aggregate consistently/frequently tasks across all weeks for this type
      let consistentlyCompleted: Record<string, number> = {};
      let frequentlyMissed: Record<string, number> = {};
      for (const r of rows) {
        consistentlyCompleted = mergeCounts(
          consistentlyCompleted,
          parseJsonField(r.consistently_completed_tasks),
        );
        frequentlyMissed = mergeCounts(
          frequentlyMissed,
          parseJsonField(r.frequently_missed_tasks),
        );
      }

      // Overall percentage: prefer monthly_reports value; fall back to weighted average
      let overallPct = 0;
      if (monthlyReport?.task_adherence) {
        const ta = monthlyReport.task_adherence as Record<string, number>;
        if (scheduleType === 'medication') overallPct = Number(ta.medication_adherence) || 0;
        else if (scheduleType === 'meal') overallPct = Number(ta.meal_completion) || 0;
        else if (scheduleType === 'activity') overallPct = Number(ta.activity_completion) || 0;
        else if (scheduleType === 'therapy') overallPct = Number(ta.therapy_participation) || 0;
      }

      // If monthly report value is 0 (or absent) but we have weekly rows, recompute
      if (overallPct === 0 && weeklyData.length > 0) {
        const totalScheduled = weeklyData.reduce((s, w) => s + w.scheduled, 0);
        const totalCompleted = weeklyData.reduce((s, w) => s + w.completed, 0);
        overallPct = totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0;
      }

      return {
        overallPct: Math.round(overallPct * 10) / 10,
        weeklyData,
        consistentlyCompleted,
        frequentlyMissed,
      };
    };

    const taskDetails = {
      medication: buildTaskReport('medication'),
      meal: buildTaskReport('meal'),
      activity: buildTaskReport('activity'),
      therapy: buildTaskReport('therapy'),
    };

    // ── Overall task adherence ─────────────────────────────────────────────────
    let overallTaskAdherence = Number(monthlyReport?.overall_task_adherence) || 0;
    if (overallTaskAdherence === 0) {
      const nonZero = Object.values(taskDetails).filter((t) => t.weeklyData.length > 0);
      if (nonZero.length > 0) {
        overallTaskAdherence =
          nonZero.reduce((s, t) => s + t.overallPct, 0) / nonZero.length;
      }
    }

    // ── Aggregate consistently/frequently across ALL task types ───────────────
    let allConsistentlyCompleted: Record<string, number> = {};
    let allFrequentlyMissed: Record<string, number> = {};
    for (const t of Object.values(taskDetails)) {
      allConsistentlyCompleted = mergeCounts(allConsistentlyCompleted, t.consistentlyCompleted);
      allFrequentlyMissed = mergeCounts(allFrequentlyMissed, t.frequentlyMissed);
    }

    // ── Compute week labels for game charts ───────────────────────────────────
    // All games share the same week axis (derived from all game perf rows in the month)
    const gameWeekDates: string[] = [
      ...new Set(gamePerfRows.map((r) => r.week_start_date)),
    ].sort();

    // ── Build per-game reports ────────────────────────────────────────────────
    const gameReports: GameReport[] = games.map((game) => {
      const perfRows = gamePerfRows
        .filter((r) => r.game_id === game.id)
        .sort((a, b) => (a.week_start_date as string).localeCompare(b.week_start_date as string));

      const hasAnyActivity = perfRows.length > 0;

      // Build weekly data aligned to ALL game weeks (so missing weeks show 0)
      const weeklyData: WeeklyGameData[] = gameWeekDates.map((weekDate, idx) => {
        const row = perfRows.find((r) => r.week_start_date === weekDate);
        return {
          weekLabel: `Week ${idx + 1}`,
          weekNumber: row ? (row.week_number as number) : idx + 1,
          weekStartDate: weekDate,
          avgScore: row ? Math.round(Number(row.avg_score) * 10) / 10 : 0,
          playsCount: row ? (row.plays_count as number) : 0,
          totalDurationMinutes: row ? (row.total_duration_minutes as number) : 0,
        };
      });

      return {
        gameId: game.id as string,
        gameName: game.game_name as string,
        gameCode: game.game_code as string,
        cognitiveArea: (game.cognitive_area as string) || '',
        description: (game.description as string) || '',
        difficultyLevel: (game.difficulty_level as number) || 1,
        weeklyData,
        hasAnyActivity,
      };
    });

    // ── Assemble report ───────────────────────────────────────────────────────
    const reportData: PatientReportData = {
      patientId,
      patientName: `${patient.first_name} ${patient.last_name}`,
      reportYear: year,
      reportMonth: month,
      currentDementiaStage:
        (monthlyReport?.current_dementia_stage as string) || dementiaStage,
      medicationAdherence: taskDetails.medication.overallPct,
      mealCompletion: taskDetails.meal.overallPct,
      activityCompletion: taskDetails.activity.overallPct,
      therapyParticipation: taskDetails.therapy.overallPct,
      overallTaskAdherence: Math.round(overallTaskAdherence * 10) / 10,
      allConsistentlyCompleted,
      allFrequentlyMissed,
      taskDetails,
      games: gameReports,
      hasTaskData: taskRows.length > 0,
      hasGameData: gamePerfRows.length > 0,
      medicalNotes: (medicalNotesData ?? []).map((n) => ({
        id: n.id as string,
        noteContent: (n.note_content as string) || '',
        recommendations: (n.recommendations as string) || '',
        createdAt: n.created_at as string,
      })),
    };

    return { success: true, data: reportData };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to generate report';
    console.error('Patient report service error:', error);
    return { success: false, error: msg };
  }
}
