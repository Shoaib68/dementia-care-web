"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { StatCard } from '@/shared/components/common/StatCard';
import { Card, CardContent } from '@/shared/components/ui/card';
import { ChartSkeleton } from '@/shared/components/ui/chart-skeleton';
import { 
  HospitalPerformanceChart, 
  PatientDistributionChart, 
  SystemGrowthChart
} from '@/shared/components/charts';
import { 
  useAnalyticsRefresh,
  useAnalyticsSummary
} from '@/features/super-admin/hooks/useAnalytics';
import { 
  RefreshCw,
  Building2,
  Users,
  UserCheck,
  Activity
} from 'lucide-react';

export function AnalyticsClient() {
  const { refresh } = useAnalyticsRefresh();
  const { data: summaryData, isLoading: summaryLoading } = useAnalyticsSummary();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Combined flag — drives ALL skeleton states on the page (same pattern as DashboardClient)
  const isLoading = (summaryLoading && !summaryData) || isRefreshing;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0 } },
  };

  const itemVariants = {
    hidden:  { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { type: 'spring' as const, stiffness: 150, damping: 20 },
    },
  };

  return (
    <motion.div className="space-y-6" initial="hidden" animate="visible" variants={containerVariants}>

      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title="System Analytics"
          subtitle="Advanced analytics and performance insights across all hospitals"
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

      {/* ── Stat cards — AnimatePresence skeleton (same as DashboardClient) ── */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="stats-loading"
            variants={itemVariants}
            initial="hidden" animate="visible"
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
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
        ) : (
          <motion.div
            key="stats-content"
            variants={itemVariants}
            initial="hidden" animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }}>
              <StatCard
                title="Total Hospitals"
                value={summaryData?.totalHospitals || 0}
                icon={Building2}
                trend={summaryData?.hospitalGrowth ? {
                  value: summaryData.hospitalGrowth,
                  isPositive: summaryData.hospitalGrowth >= 0
                } : undefined}
              />
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }}>
              <StatCard
                title="Total Doctors"
                value={summaryData?.totalDoctors || 0}
                icon={Users}
                trend={summaryData?.doctorGrowth ? {
                  value: summaryData.doctorGrowth,
                  isPositive: summaryData.doctorGrowth >= 0
                } : undefined}
              />
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }}>
              <StatCard
                title="Total Patients"
                value={(summaryData?.totalPatients || 0).toLocaleString()}
                icon={UserCheck}
                trend={summaryData?.patientGrowth ? {
                  value: summaryData.patientGrowth,
                  isPositive: summaryData.patientGrowth >= 0
                } : undefined}
              />
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }}>
              <StatCard
                title="Monthly Diagnoses"
                value={summaryData?.monthlyDiagnoses || 0}
                icon={Activity}
                trend={summaryData?.diagnosesGrowth ? {
                  value: summaryData.diagnosesGrowth,
                  isPositive: summaryData.diagnosesGrowth >= 0
                } : undefined}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Charts ────────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="space-y-6">

        {/* Hospital Performance + Patient Distribution (side-by-side) */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={itemVariants} whileHover={{ scale: 1.01, y: -2 }} className="h-full">
            {isLoading
              ? <ChartSkeleton type="bar"  showHeader showLegend />
              : <HospitalPerformanceChart />}
          </motion.div>
          <motion.div variants={itemVariants} whileHover={{ scale: 1.01, y: -2 }} className="h-full">
            {isLoading
              ? <ChartSkeleton type="pie"  showHeader showLegend />
              : <PatientDistributionChart />}
          </motion.div>
        </motion.div>

        {/* System Growth Trends — full width */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.005, y: -2 }}>
          {isLoading
            ? <ChartSkeleton type="line" showHeader showLegend />
            : <SystemGrowthChart />}
        </motion.div>

      </motion.div>
    </motion.div>
  );
}
