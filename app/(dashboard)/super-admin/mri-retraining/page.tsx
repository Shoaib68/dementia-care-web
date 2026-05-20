"use client";

import React, { useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button }     from '@/shared/components/ui/button';
import { Badge }      from '@/shared/components/ui/badge';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { StatCard } from '@/shared/components/common/StatCard';
import { useMRIRetrainingStats } from '@/features/super-admin/hooks';
import {
  Brain,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  FileArchive,
  Info,
  BarChart3,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

// ── Animation variants — identical to DashboardClient spring physics ───────
const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 150, damping: 20 },
  },
};

// ── Stage cards — same structure as DashboardClient metric cards ───────────
// Icons are intentionally neutral (gray) to match StatCard's uniform design.
const STAGE_CARDS = [
  { stage: 'Non Demented' as const, icon: ShieldCheck   },
  { stage: 'Mild'         as const, icon: Brain         },
  { stage: 'Moderate'     as const, icon: AlertTriangle },
  { stage: 'Severe'       as const, icon: AlertCircle   },
];

// ── Component ─────────────────────────────────────────────────────────────
export default function MRIRetrainingPage() {
  const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [downloadError,  setDownloadError]  = useState<string | null>(null);
  const [downloadedInfo, setDownloadedInfo] = useState<string | null>(null);
  const [isRefreshing,   setIsRefreshing]   = useState(false);

  const { data: stats, isLoading: statsLoading, isError: statsError, refetch } = useMRIRetrainingStats();

  // Combined loading flag — drives ALL skeleton states on the page.
  // When Refresh is clicked every section enters skeleton together,
  // matching the dashboard's "full page reload feel".
  const isLoading = statsLoading || isRefreshing;

  useEffect(() => {
    if (!stats && !statsLoading) refetch();
  }, [stats, statsLoading, refetch]);

  // Matches the handleRefresh pattern used in DashboardClient
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleDownload = useCallback(async () => {
    setDownloadState('loading');
    setDownloadError(null);
    setDownloadedInfo(null);
    try {
      const res = await fetch('/api/super-admin/mri-retraining/download', { method: 'GET' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `Server error ${res.status}`);
      }
      const blob   = await res.blob();
      const url    = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const date   = new Date().toISOString().split('T')[0];
      anchor.href     = url;
      anchor.download = `mri_retraining_dataset_${date}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      const downloaded = res.headers.get('X-Scans-Downloaded') ?? '?';
      const skipped    = res.headers.get('X-Scans-Skipped')    ?? '0';
      setDownloadedInfo(`${downloaded} images downloaded${skipped !== '0' ? `, ${skipped} skipped` : ''}`);
      setDownloadState('success');
    } catch (err: unknown) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed. Please try again.');
      setDownloadState('error');
    }
  }, []);

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={containerVariants}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title="MRI Retraining Data"
          subtitle="Download doctor-verified MRI scans organised by stage for AI model retraining"
          actions={[{
            label: isRefreshing ? 'Refreshing...' : 'Refresh',
            variant: 'outline',
            icon: RefreshCw,
            onClick: handleRefresh,
            disabled: isRefreshing,
            className: 'hover:shadow-md hover:scale-105 transition-all duration-200 hover:border-blue-300 hover:text-blue-700',
          }]}
        />
      </motion.div>

      {/* ── Stage metric cards ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            variants={itemVariants}
            initial="hidden" animate="visible"
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <Card className="border border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/30 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-24" />
                          <div className="h-8 bg-gray-300 rounded w-16" />
                        </div>
                        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-20" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : statsError ? (
          <motion.div
            key="error" variants={itemVariants}
            initial="hidden" animate="visible"
          >
            <Card className="border border-red-200 bg-red-50 hover:shadow-lg transition-all duration-300">
              <CardContent className="flex items-center gap-3 p-5">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">
                  Failed to load stats.{' '}
                  <button onClick={() => refetch()} className="underline font-medium">Retry</button>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            variants={itemVariants}
            initial="hidden" animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {STAGE_CARDS.map(({ stage, icon }) => (
              <motion.div key={stage} variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }}>
                <StatCard
                  title={stage}
                  value={stats?.byStage[stage] ?? 0}
                  icon={icon}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Two-column layout: download card + feedback breakdown ─────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Download Dataset card */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.01, y: -2 }} className="lg:col-span-2 h-full">
          <Card className="border border-gray-200 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/40 transition-all duration-300 group h-full">
            <CardHeader className="group-hover:bg-purple-50/30 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-all">
                  <FileArchive className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Download Dataset</CardTitle>
                  <CardDescription>Export all doctor-verified MRI scans as a ZIP file ready for model retraining</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-5">
              {isLoading ? (
                /* Skeleton — shown while stats load OR while refreshing */
                <div className="space-y-4 animate-pulse">
                  <div className="h-40 bg-gray-200 rounded-xl" />
                  <div className="h-16 bg-gray-200 rounded-lg" />
                  <div className="h-12 bg-gray-300 rounded-lg" />
                </div>
              ) : (
                <>
                  {/* Folder structure preview */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-sm space-y-1.5">
                    <p className="text-slate-500 text-xs mb-2 font-sans font-medium">ZIP folder structure</p>
                    <div className="flex items-center gap-2 text-slate-600">
                      <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>mri_retraining_dataset_<span className="text-purple-600">YYYY-MM-DD</span>.zip</span>
                    </div>
                    {[
                      { folder: 'Non_Demented/', color: 'text-green-600',  desc: 'Non-demented scans'      },
                      { folder: 'Mild/',         color: 'text-yellow-600', desc: 'Mild dementia scans'     },
                      { folder: 'Moderate/',     color: 'text-orange-600', desc: 'Moderate dementia scans' },
                      { folder: 'Severe/',       color: 'text-red-600',    desc: 'Severe dementia scans'   },
                    ].map(({ folder, color, desc }) => (
                      <div key={folder} className="flex items-center gap-2 pl-6 text-slate-500">
                        <FolderOpen className={`h-3.5 w-3.5 ${color} shrink-0`} />
                        <span className={color}>{folder}</span>
                        <span className="text-slate-400 text-xs">– {desc}</span>
                      </div>
                    ))}
                    <div className="pl-6 text-slate-400 text-xs ml-4">manifest.csv  –  full index of all scans</div>
                    <div className="pl-6 text-slate-400 text-xs ml-4">README.txt</div>
                  </div>

                  {/* Important note */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-blue-800">
                        Images are placed in folders based on the{' '}
                        <strong>doctor&apos;s final assessment</strong>, not the raw AI prediction.
                        Scans where the doctor corrected the AI are placed in the correct folder
                        automatically — ensuring clean training labels.
                      </p>
                    </div>
                  </div>

                  {/* Error / success banners */}
                  {downloadState === 'error' && downloadError && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-red-700">{downloadError}</p>
                    </div>
                  )}
                  {downloadState === 'success' && (
                    <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-green-700">
                        Download complete!{downloadedInfo ? ` ${downloadedInfo}.` : ''}{' '}
                        Check your downloads folder.
                      </p>
                    </div>
                  )}

                  {/* Download button */}
                  <Button
                    onClick={handleDownload}
                    disabled={downloadState === 'loading' || (stats?.total ?? 0) === 0}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white h-12 text-base disabled:opacity-50"
                  >
                    {downloadState === 'loading' ? (
                      <><RefreshCw className="h-5 w-5 mr-2 animate-spin" />Building ZIP — this may take a moment…</>
                    ) : (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        Download MRI Dataset for Retraining
                        {stats && stats.total > 0 && (
                          <Badge className="ml-2 bg-white/20 text-white border-white/30 border">{stats.total} scans</Badge>
                        )}
                      </>
                    )}
                  </Button>

                  {(stats?.total ?? 0) === 0 && (
                    <p className="text-center text-xs text-slate-500">
                      No doctor-verified MRI scans in the database yet. Doctors must submit feedback
                      via the MRI Analysis page before data is available here.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Feedback Breakdown card */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.01, y: -2 }} className="h-full">
          <Card className="border border-gray-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/40 transition-all duration-300 group h-full">
            <CardHeader className="group-hover:bg-indigo-50/30 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-all">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Feedback Breakdown</CardTitle>
                  <CardDescription>AI accuracy based on doctor reviews</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              {isLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-14 bg-gray-200 rounded-lg" />
                  <div className="h-14 bg-gray-200 rounded-lg" />
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              ) : stats ? (
                <>
                  {/* AI Correct row */}
                  <motion.div
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all cursor-default"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">AI Correct</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-700">{stats.byFeedback.correct}</p>
                      {stats.total > 0 && (
                        <p className="text-xs text-green-600">
                          {Math.round((stats.byFeedback.correct / stats.total) * 100)}%
                        </p>
                      )}
                    </div>
                  </motion.div>

                  {/* Doctor Corrected row */}
                  <motion.div
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all cursor-default"
                  >
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Doctor Corrected</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-orange-700">{stats.byFeedback.incorrect}</p>
                      {stats.total > 0 && (
                        <p className="text-xs text-orange-600">
                          {Math.round((stats.byFeedback.incorrect / stats.total) * 100)}%
                        </p>
                      )}
                    </div>
                  </motion.div>

                  {/* Accuracy progress bar */}
                  {stats.total > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>AI Accuracy</span>
                        <span className="font-semibold">
                          {Math.round((stats.byFeedback.correct / stats.total) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round((stats.byFeedback.correct / stats.total) * 100)}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 pt-1">
                    Total: <strong>{stats.total}</strong> reviewed scans
                  </p>
                </>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>

      </motion.div>
    </motion.div>
  );
}
