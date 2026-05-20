"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { ChartSkeleton } from '@/shared/components/ui/chart-skeleton';
import {
  DoctorPerformanceChart,
  DepartmentDistributionChart,
  HospitalActivityChart
} from '@/shared/components/charts';
import { useHospitalAnalytics } from '@/features/hospital/hooks/useHospitalAnalytics';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  RefreshCw,
  UserCheck,
  Users,
  FileText,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export default function HospitalAnalyticsPage() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: analyticsData, isLoading: analyticsQueryLoading, error, refetch } = useHospitalAnalytics(user?.id);

  // Combined loading flag — same pattern as super-admin portal
  const isLoading = (analyticsQueryLoading && !analyticsData) || isRefreshing;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Container animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  // Helper function to format growth percentage
  const formatGrowth = (growth: number) => {
    const absGrowth = Math.abs(growth);
    const isPositive = growth >= 0;
    return {
      value: absGrowth.toFixed(1),
      isPositive,
      icon: isPositive ? TrendingUp : TrendingDown,
      colorClass: isPositive ? 'text-green-600' : 'text-red-600',
      bgColorClass: isPositive ? 'bg-green-50' : 'bg-red-50'
    };
  };

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Hospital Analytics"
          subtitle="Comprehensive analytics and performance insights for your hospital"
          actions={[
            { 
              label: isRefreshing ? "Refreshing..." : "Refresh", 
              variant: "outline", 
              icon: RefreshCw, 
              onClick: handleRefresh,
              disabled: isRefreshing || isLoading,
              className: "hover:shadow-md hover:scale-105 transition-all duration-200 hover:border-blue-300 hover:text-blue-700"
            }
          ]}
        />
      </motion.div>

      {/* Quick Stats Cards — AnimatePresence skeleton on first load AND refresh */}
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
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} whileHover={{ scale: 1.02, y: -2 }}>
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
            {/* Total Doctors */}
            <motion.div whileHover={{ scale: 1.02, y: -2 }} className="cursor-pointer">
              <Card className="border border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/30 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 group-hover:text-blue-700 transition-colors">Total Doctors</p>
                      <p className="text-2xl font-bold text-gray-900 group-hover:text-gray-800 mt-1">{analyticsData?.totalDoctors || 0}</p>
                      {analyticsData?.doctorGrowth !== undefined && (() => { const g = formatGrowth(analyticsData.doctorGrowth); const Icon = g.icon; return (<div className="flex items-center mt-2"><div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${g.bgColorClass}`}><Icon className={`h-3 w-3 ${g.colorClass}`} /><span className={`text-xs font-medium ${g.colorClass}`}>{g.value}%</span></div><span className="text-xs text-gray-500 ml-2">vs last month</span></div>); })()}
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors"><UserCheck className="h-6 w-6 text-blue-600" /></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            {/* Total Patients */}
            <motion.div whileHover={{ scale: 1.02, y: -2 }} className="cursor-pointer">
              <Card className="border border-gray-200 hover:border-green-300 hover:shadow-lg hover:shadow-green-100/30 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 group-hover:text-green-700 transition-colors">Total Patients</p>
                      <p className="text-2xl font-bold text-gray-900 group-hover:text-gray-800 mt-1">{(analyticsData?.totalPatients || 0).toLocaleString()}</p>
                      {analyticsData?.patientGrowth !== undefined && (() => { const g = formatGrowth(analyticsData.patientGrowth); const Icon = g.icon; return (<div className="flex items-center mt-2"><div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${g.bgColorClass}`}><Icon className={`h-3 w-3 ${g.colorClass}`} /><span className={`text-xs font-medium ${g.colorClass}`}>{g.value}%</span></div><span className="text-xs text-gray-500 ml-2">vs last month</span></div>); })()}
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors"><Users className="h-6 w-6 text-green-600" /></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            {/* Monthly Diagnoses */}
            <motion.div whileHover={{ scale: 1.02, y: -2 }} className="cursor-pointer">
              <Card className="border border-gray-200 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/30 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 group-hover:text-purple-700 transition-colors">Monthly Diagnoses</p>
                      <p className="text-2xl font-bold text-gray-900 group-hover:text-gray-800 mt-1">{analyticsData?.monthlyDiagnoses || 0}</p>
                      {analyticsData?.diagnosesGrowth !== undefined && analyticsData.diagnosesGrowth !== 0 && (() => { const g = formatGrowth(analyticsData.diagnosesGrowth); const Icon = g.icon; return (<div className="flex items-center mt-2"><div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${g.bgColorClass}`}><Icon className={`h-3 w-3 ${g.colorClass}`} /><span className={`text-xs font-medium ${g.colorClass}`}>{g.value}%</span></div><span className="text-xs text-gray-500 ml-2">vs last month</span></div>); })()}
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors"><FileText className="h-6 w-6 text-purple-600" /></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            {/* Pending Reports */}
            <motion.div whileHover={{ scale: 1.02, y: -2 }} className="cursor-pointer">
              <Card className="border border-gray-200 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100/30 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 group-hover:text-orange-700 transition-colors">Pending Reports</p>
                      <p className="text-2xl font-bold text-gray-900 group-hover:text-gray-800 mt-1">0</p>
                      <p className="text-xs text-gray-500 mt-1">Average response time</p>
                      <p className="text-sm font-medium text-orange-600">0 hours</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors"><Clock className="h-6 w-6 text-orange-600" /></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Charts */}
      <AnimatePresence mode="wait">
        <motion.div 
          variants={itemVariants}
          className="space-y-6"
        >
          {/* Doctor Performance and Department Distribution */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={itemVariants} whileHover={{ scale: 1.01, y: -2 }} className="h-full">
              {isLoading ? <ChartSkeleton type="bar" showHeader showLegend /> : <DoctorPerformanceChart />}
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ scale: 1.01, y: -2 }} className="h-full">
              {isLoading ? <ChartSkeleton type="pie" showHeader showLegend /> : <DepartmentDistributionChart />}
            </motion.div>
          </motion.div>

          {/* Hospital Activity Trends - Full Width */}
          <motion.div variants={itemVariants} whileHover={{ scale: 1.005, y: -2 }}>
            {isLoading ? <ChartSkeleton type="line" showHeader showLegend /> : <HospitalActivityChart />}
          </motion.div>

        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
