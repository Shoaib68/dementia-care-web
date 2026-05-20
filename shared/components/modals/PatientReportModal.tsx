"use client";

/**
 * PatientReportModal
 *
 * Monthly patient report for doctors.
 * Design principles (HCI / medical professional dashboard):
 *  - Traffic-light colour coding: green ≥80 %, amber 60–79 %, red < 60 %
 *  - Consistent with the doctor-portal design token system (effects.ts)
 *  - Maximum reuse of shared components (StatCard, Card, Badge, …)
 *  - Information hierarchy: overview → trend detail → game cognition
 *  - Top-3 task lists to avoid information overload
 */

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Badge } from '@/shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { usePatientReport } from '@/features/doctor/hooks/usePatientReport';
import { Patient } from '@/features/doctor/hooks/usePatients';
import { statusIndicators } from '@/shared/styles/effects';
import {
  ChevronLeft,
  ChevronRight,
  Pill,
  UtensilsCrossed,
  Activity,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Gamepad2,
  Brain,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Target,
  ClipboardList,
  BriefcaseMedical,
} from 'lucide-react';

// ─── Design tokens ─────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const TASK_CONFIG = {
  medication: {
    label: 'Medication Adherence',
    icon: Pill,
    barColor: '#3B82F6',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    hoverBorder: 'hover:border-blue-300',
    hoverShadow: 'hover:shadow-blue-100/30',
    hoverFrom: 'hover:from-blue-50/10',
  },
  meal: {
    label: 'Meal Completion',
    icon: UtensilsCrossed,
    barColor: '#10B981',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    hoverBorder: 'hover:border-emerald-300',
    hoverShadow: 'hover:shadow-emerald-100/30',
    hoverFrom: 'hover:from-emerald-50/10',
  },
  activity: {
    label: 'Activity Completion',
    icon: Activity,
    barColor: '#F59E0B',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    hoverBorder: 'hover:border-amber-300',
    hoverShadow: 'hover:shadow-amber-100/30',
    hoverFrom: 'hover:from-amber-50/10',
  },
  therapy: {
    label: 'Therapy Participation',
    icon: Stethoscope,
    barColor: '#8B5CF6',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    hoverBorder: 'hover:border-violet-300',
    hoverShadow: 'hover:shadow-violet-100/30',
    hoverFrom: 'hover:from-violet-50/10',
  },
} as const;

const GAME_COLORS = [
  '#14B8A6','#6366F1','#F43F5E','#F97316',
  '#84CC16','#06B6D4','#EC4899','#8B5CF6',
];

const DIFFICULTY_LABELS: Record<number, string> = {
  1:'Beginner', 2:'Easy', 3:'Medium', 4:'Hard', 5:'Expert',
};

/** Traffic-light level based on adherence %. */
function adherenceLevel(pct: number) {
  if (pct >= 80) return {
    label: 'Good', color: '#10B981',
    bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',
  };
  if (pct >= 60) return {
    label: 'Fair', color: '#F59E0B',
    bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200',
  };
  return {
    label: 'Needs Attention', color: '#EF4444',
    bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200',
  };
}

// ─── Reusable sub-components ─────────────────────────────────────────────────

/** Portal-consistent section header with icon, title, description. */
function SectionHeader({
  icon: Icon, iconBg, iconColor, title, description, badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string; iconColor: string;
  title: string; description?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 ${iconBg} rounded-lg flex-shrink-0`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {badge}
        </div>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

/**
 * Task adherence stat card.
 * Follows the portal StatCard layout but adds traffic-light colour coding
 * appropriate for a medical professional context.
 */
function TaskAdherenceCard({
  taskKey, pct,
}: {
  taskKey: keyof typeof TASK_CONFIG;
  pct: number;
}) {
  const cfg = TASK_CONFIG[taskKey];
  const Icon = cfg.icon;
  const lvl = adherenceLevel(pct);

  return (
    <Card
      className={`border border-gray-200 ${cfg.hoverBorder} hover:shadow-xl ${cfg.hoverShadow} hover:bg-gradient-to-br ${cfg.hoverFrom} hover:to-white transition-all duration-300 group cursor-default`}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2.5 ${cfg.iconBg} rounded-lg group-hover:scale-110 transition-all`}>
            <Icon className={`h-5 w-5 ${cfg.iconColor}`} />
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${lvl.bg} ${lvl.text} ${lvl.border}`}>
            {lvl.label}
          </span>
        </div>
        <p className="text-xs font-medium text-gray-500 leading-tight mb-1">{cfg.label}</p>
        <p className="text-2xl font-bold text-gray-900">
          {Math.round(pct)}<span className="text-sm font-semibold text-gray-400 ml-0.5">%</span>
        </p>
        {/* Thin progress bar */}
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: lvl.color }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(pct, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

/** Custom Recharts tooltip for task bar charts. */
function TaskTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-800 mb-1.5">{label}</p>
      <p className="text-gray-600">Adherence: <span className="font-bold text-gray-900">{d.adherencePct}%</span></p>
      <p className="text-gray-500 text-xs mt-0.5">{d.completed} completed / {d.scheduled} scheduled</p>
      {d.missed > 0 && <p className="text-red-500 text-xs">{d.missed} missed</p>}
    </div>
  );
}

/** Custom Recharts tooltip for game bar charts. */
function GameTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-800 mb-1.5">{label}</p>
      <p className="text-gray-600">Avg Score: <span className="font-bold text-gray-900">{d.avgScore > 0 ? d.avgScore : '—'}</span></p>
      <p className="text-gray-600">Plays: <span className="font-semibold">{d.playsCount}</span></p>
      {d.totalDurationMinutes > 0 && <p className="text-gray-500 text-xs mt-0.5">Duration: {d.totalDurationMinutes} min</p>}
    </div>
  );
}

/** Weekly bar chart for a single task type. */
function TaskChart({
  taskKey, pct, weeklyData,
}: {
  taskKey: keyof typeof TASK_CONFIG;
  pct: number;
  weeklyData: Array<{ weekLabel: string; adherencePct: number; completed: number; scheduled: number; missed: number }>;
}) {
  const cfg = TASK_CONFIG[taskKey];
  const Icon = cfg.icon;
  const lvl = adherenceLevel(pct);
  const hasData = weeklyData.length > 0;

  return (
    <Card className={`border border-gray-200 ${cfg.hoverBorder} hover:shadow-xl ${cfg.hoverShadow} hover:bg-gradient-to-br ${cfg.hoverFrom} hover:to-white transition-all duration-300 group`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 ${cfg.iconBg} rounded-lg group-hover:scale-110 transition-all`}>
              <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
            </div>
            <CardTitle className="text-sm font-semibold text-gray-800 group-hover:text-blue-800 transition-colors">
              {cfg.label}
            </CardTitle>
          </div>
          <Badge className={`text-xs font-semibold border ${lvl.bg} ${lvl.text} ${lvl.border}`}>
            {Math.round(pct)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <Icon className="h-4 w-4 text-gray-300" />
            </div>
            <p className="text-xs text-gray-400">No data recorded this month</p>
          </div>
        ) : (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 20, right: 6, left: -22, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<TaskTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="adherencePct" fill={cfg.barColor} radius={[4, 4, 0, 0]} maxBarSize={52}>
                  <LabelList dataKey="adherencePct" position="top" formatter={(v: number) => `${Math.round(v)}%`}
                    style={{ fill: '#6B7280', fontSize: '10px', fontWeight: '600' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Game performance card: bar chart + plays-count list. */
function GameChart({
  gameName, cognitiveArea, description, difficultyLevel,
  weeklyData, hasAnyActivity, color, index,
}: {
  gameName: string; cognitiveArea: string; description: string;
  difficultyLevel: number;
  weeklyData: Array<{ weekLabel: string; avgScore: number; playsCount: number; totalDurationMinutes: number }>;
  hasAnyActivity: boolean; color: string; index: number;
}) {
  const hasWeeks = weeklyData.length > 0;
  const totalPlays = weeklyData.reduce((s, w) => s + w.playsCount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 18, delay: index * 0.04 }}
    >
      <Card className="border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 group">
        {/* Header */}
        <CardHeader className="pb-3 bg-gray-50/70 rounded-t-xl border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg flex-shrink-0" style={{ backgroundColor: `${color}1A` }}>
                <Gamepad2 className="h-5 w-5" style={{ color }} />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-gray-800">{gameName}</CardTitle>
                {description && <CardDescription className="text-xs mt-0.5 line-clamp-1">{description}</CardDescription>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              {cognitiveArea && (
                <Badge className="text-[10px] capitalize font-semibold"
                  style={{ backgroundColor: `${color}1A`, color, border: `1px solid ${color}40` }}>
                  {cognitiveArea}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] text-gray-500">
                {DIFFICULTY_LABELS[difficultyLevel] ?? `Level ${difficultyLevel}`}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {!hasWeeks ? (
            <div className="flex items-center gap-3 py-4 px-3 rounded-lg bg-gray-50 border border-dashed border-gray-200">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Gamepad2 className="h-4 w-4 text-gray-300" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">
                  {hasAnyActivity ? 'No data for this period' : 'Not played this month'}
                </p>
                <p className="text-xs text-gray-400">No sessions recorded</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Bar chart */}
              <div className="lg:col-span-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Avg. Score per Week</p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 20, right: 4, left: -26, bottom: 0 }} barCategoryGap="28%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                      <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<GameTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                      <Bar dataKey="avgScore" fill={color} radius={[4, 4, 0, 0]} maxBarSize={48}>
                        <LabelList dataKey="avgScore" position="top"
                          formatter={(v: number) => v > 0 ? Math.round(v) : '—'}
                          style={{ fill: '#6B7280', fontSize: '10px', fontWeight: '600' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Plays count list */}
              <div className="lg:col-span-1 flex flex-col">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Times Played</p>
                <div className="space-y-1.5 flex-1">
                  {weeklyData.map((w) => (
                    <div key={w.weekLabel}
                      className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <span className="text-xs text-gray-600 font-medium">{w.weekLabel}</span>
                      {w.playsCount > 0 ? (
                        <span className="text-xs font-bold" style={{ color }}>
                          {w.playsCount} {w.playsCount === 1 ? 'play' : 'plays'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">—</span>
                      )}
                    </div>
                  ))}
                </div>
                {/* Monthly total */}
                <div className="mt-2.5 py-1.5 px-2.5 rounded-lg flex items-center justify-between border"
                  style={{ borderColor: `${color}40`, backgroundColor: `${color}0D` }}>
                  <span className="text-xs font-semibold text-gray-600">Total</span>
                  <span className="text-xs font-bold" style={{ color }}>
                    {totalPlays} {totalPlays === 1 ? 'play' : 'plays'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** Format a UTC timestamp as e.g. "May 1" or "May 15" */
function formatNoteDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Single medical note card.
 * Matches the mobile design: doctor icon + "Doctor / Medical" header,
 * date top-right, note content, and recommendations.
 */
function MedicalNoteCard({ note, index }: { note: { id: string; noteContent: string; recommendations: string; createdAt: string }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 110, damping: 18, delay: index * 0.05 }}
    >
      <Card className="border border-gray-200 hover:border-teal-300 hover:shadow-md hover:shadow-teal-100/30 transition-all duration-300 group">
        <CardContent className="p-4">
          {/* Header row: icon + title + date */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              {/* Medical bag icon — teal tinted background matching screenshot */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#14B8A60F', border: '1px solid #14B8A630' }}>
                <BriefcaseMedical className="h-5 w-5" style={{ color: '#14B8A6' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">Doctor</p>
                <p className="text-xs font-medium" style={{ color: '#14B8A6' }}>Medical</p>
              </div>
            </div>
            {/* Creation date */}
            <span className="text-xs font-semibold text-gray-400 flex-shrink-0 mt-0.5">
              {formatNoteDate(note.createdAt)}
            </span>
          </div>

          {/* Note content */}
          {note.noteContent && (
            <p className="text-sm text-gray-800 font-medium mb-2 leading-relaxed">
              {note.noteContent}
            </p>
          )}

          {/* Recommendations */}
          {note.recommendations && (
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-medium text-gray-700">Recommendations:</span>{' '}
              {note.recommendations}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/** Pulse skeleton shown while data loads. */
function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}
      </div>
      <div className="h-20 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-36 bg-gray-100 rounded-xl" />
        <div className="h-36 bg-gray-100 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-xl" />)}
      </div>
      {[...Array(2)].map((_, i) => <div key={i} className="h-52 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface PatientReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

export function PatientReportModal({ isOpen, onClose, patient }: PatientReportModalProps) {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const { data: report, isLoading, error, refetch, isFetching } = usePatientReport(
    patient?.id ?? null, selectedYear, selectedMonth,
    { enabled: isOpen && !!patient?.id },
  );

  // ── Month navigation ────────────────────────────────────────────────────────
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  const goPrev = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear((y) => y - 1); }
    else setSelectedMonth((m) => m - 1);
  };
  const goNext = () => {
    if (isCurrentMonth) return;
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear((y) => y + 1); }
    else setSelectedMonth((m) => m + 1);
  };

  // ── Top-3 task lists ─────────────────────────────────────────────────────────
  const topConsistently = useMemo(() => {
    if (!report) return [];
    return Object.entries(report.allConsistentlyCompleted).sort(([, a], [, b]) => b - a).slice(0, 3);
  }, [report]);

  const topFrequentlyMissed = useMemo(() => {
    if (!report) return [];
    return Object.entries(report.allFrequentlyMissed).sort(([, a], [, b]) => b - a).slice(0, 3);
  }, [report]);

  const overallLvl = report ? adherenceLevel(report.overallTaskAdherence) : adherenceLevel(0);

  const stageBadgeClass = patient?.dementia_stage
    ? patient.dementia_stage === 'mild' ? statusIndicators.mildBadge
    : patient.dementia_stage === 'moderate' ? statusIndicators.moderateBadge
    : statusIndicators.severeBadge
    : 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">

        {/* ── Fixed header ───────────────────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            {/* Left: identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold text-gray-900">
                  Monthly Patient Report
                </DialogTitle>
                {patient && (
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-sm text-gray-500 truncate">
                      {patient.first_name} {patient.last_name}
                    </span>
                    <Badge className={`text-[10px] font-semibold capitalize border ${stageBadgeClass}`}>
                      {(report?.currentDementiaStage ?? patient.dementia_stage)} Stage
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Right: month selector */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 flex-shrink-0">
              <button onClick={goPrev}
                className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                aria-label="Previous month">
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
              <span className="text-sm font-semibold text-gray-800 min-w-[116px] text-center">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
              <button onClick={goNext} disabled={isCurrentMonth}
                className={`p-1.5 rounded-lg transition-all ${isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white hover:shadow-sm'}`}
                aria-label="Next month">
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* ── Scrollable body ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7 bg-gray-50/30">
          <AnimatePresence mode="wait">

            {/* Loading */}
            {(isLoading || isFetching) && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ReportSkeleton />
              </motion.div>
            )}

            {/* Error */}
            {!isLoading && !isFetching && error && (
              <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-7 w-7 text-red-400" />
                </div>
                <p className="font-semibold text-gray-700">Failed to load report</p>
                <p className="text-sm text-gray-500 mt-1 mb-5">
                  {error instanceof Error ? error.message : 'Something went wrong'}
                </p>
                <button onClick={() => refetch()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-sm font-medium transition-all shadow-sm">
                  <RefreshCw className="h-4 w-4" /> Retry
                </button>
              </motion.div>
            )}

            {/* Report */}
            {!isLoading && !isFetching && !error && report && (
              <motion.div key={`${selectedYear}-${selectedMonth}`}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }} className="space-y-7">

                {/* ══════════════════════════════════════════════════════════
                    S1 — Task Adherence Overview
                ══════════════════════════════════════════════════════════ */}
                <section>
                  <SectionHeader icon={Target} iconBg="bg-blue-100" iconColor="text-blue-600"
                    title="Task Adherence Overview"
                    description="Monthly completion rates across all care categories" />

                  {/* 4 adherence stat cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {(Object.keys(TASK_CONFIG) as Array<keyof typeof TASK_CONFIG>).map((key, i) => (
                      <motion.div key={key}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, type: 'spring', stiffness: 120, damping: 18 }}>
                        <TaskAdherenceCard taskKey={key} pct={
                          key === 'medication' ? report.medicationAdherence
                          : key === 'meal' ? report.mealCompletion
                          : key === 'activity' ? report.activityCompletion
                          : report.therapyParticipation
                        } />
                      </motion.div>
                    ))}
                  </div>

                  {/* Overall adherence banner */}
                  <Card className="border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between px-5 py-4"
                        style={{ background: `linear-gradient(135deg, ${overallLvl.color}0D 0%, transparent 60%)` }}>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Overall Task Adherence
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-extrabold" style={{ color: overallLvl.color }}>
                              {Math.round(report.overallTaskAdherence)}%
                            </span>
                            <Badge className={`text-xs font-semibold border ${overallLvl.bg} ${overallLvl.text} ${overallLvl.border}`}>
                              {overallLvl.label}
                            </Badge>
                          </div>
                          {!report.hasTaskData && (
                            <p className="text-xs text-gray-400 mt-1">No task data recorded this month</p>
                          )}
                        </div>
                        {/* Progress ring */}
                        <svg width={72} height={72} viewBox="0 0 72 72">
                          <circle cx={36} cy={36} r={28} fill="none" stroke="#E5E7EB" strokeWidth={6} />
                          <motion.circle cx={36} cy={36} r={28} fill="none"
                            stroke={overallLvl.color} strokeWidth={6} strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 28}
                            initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - report.overallTaskAdherence / 100) }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            transform="rotate(-90 36 36)" />
                          <text x={36} y={41} textAnchor="middle" fontSize={13} fontWeight="700" fill={overallLvl.color}>
                            {Math.round(report.overallTaskAdherence)}%
                          </text>
                        </svg>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* ══════════════════════════════════════════════════════════
                    S3 — Weekly Task Breakdown
                ══════════════════════════════════════════════════════════ */}
                <section>
                  <SectionHeader icon={BarChart3} iconBg="bg-purple-100" iconColor="text-purple-600"
                    title="Weekly Task Breakdown"
                    description="Adherence percentage for each care category by week" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.keys(TASK_CONFIG) as Array<keyof typeof TASK_CONFIG>).map((key) => (
                      <TaskChart key={key} taskKey={key}
                        pct={
                          key === 'medication' ? report.medicationAdherence
                          : key === 'meal' ? report.mealCompletion
                          : key === 'activity' ? report.activityCompletion
                          : report.therapyParticipation
                        }
                        weeklyData={report.taskDetails[key].weeklyData} />
                    ))}
                  </div>
                </section>

                {/* ══════════════════════════════════════════════════════════
                    S4 — Cognitive Game Performance
                ══════════════════════════════════════════════════════════ */}
                {report.games.length > 0 && (
                  <section>
                    <SectionHeader icon={Brain} iconBg="bg-teal-100" iconColor="text-teal-600"
                      title="Cognitive Game Performance"
                      description="Weekly scores and play frequency for assigned brain training games"
                      badge={
                        <Badge variant="outline" className="text-xs">
                          {report.games.length} {report.games.length === 1 ? 'game' : 'games'}
                        </Badge>
                      } />

                    {!report.hasGameData && (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <p className="text-xs text-amber-700">
                          No game sessions recorded for{' '}
                          <strong>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</strong>.
                          {' '}Charts display zero values.
                        </p>
                      </div>
                    )}

                    <div className="space-y-4">
                      {report.games.map((game, idx) => (
                        <GameChart key={game.gameId}
                          gameName={game.gameName} cognitiveArea={game.cognitiveArea}
                          description={game.description} difficultyLevel={game.difficultyLevel}
                          weeklyData={game.weeklyData} hasAnyActivity={game.hasAnyActivity}
                          color={GAME_COLORS[idx % GAME_COLORS.length]} index={idx} />
                      ))}
                    </div>
                  </section>
                )}

                {/* ══════════════════════════════════════════════════════════
                    S5 — Doctor's Notes
                ══════════════════════════════════════════════════════════ */}
                {report.medicalNotes.length > 0 && (
                  <section>
                    <SectionHeader
                      icon={ClipboardList}
                      iconBg="bg-teal-100"
                      iconColor="text-teal-600"
                      title="Doctor's Notes"
                      description="Medical notes written during this month"
                      badge={
                        <Badge variant="outline" className="text-xs">
                          {report.medicalNotes.length}{' '}
                          {report.medicalNotes.length === 1 ? 'note' : 'notes'}
                        </Badge>
                      }
                    />
                    <div className="space-y-3">
                      {report.medicalNotes.map((note, idx) => (
                        <MedicalNoteCard key={note.id} note={note} index={idx} />
                      ))}
                    </div>
                  </section>
                )}

                {/* No data at all */}
                {!report.hasTaskData && !report.hasGameData && report.games.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200">
                      <TrendingUp className="h-8 w-8 text-gray-300" />
                    </div>
                    <p className="font-semibold text-gray-600">No report data available</p>
                    <p className="text-sm text-gray-400 mt-1">
                      No activity was recorded for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PatientReportModal;
