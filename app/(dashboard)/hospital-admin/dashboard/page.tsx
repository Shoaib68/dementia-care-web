"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { StatCard } from '@/shared/components/common/StatCard';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useHospitalAnalyticsLive } from '@/features/hospital/hooks/useHospitalAnalytics';
import { 
  containerVariants, 
  itemVariants, 
  cardHoverVariants,
  fadeInVariants,
  listItemVariants,
  loadingSkeletonVariants
} from '@/shared/animations';
import { 
  backgroundGradients, 
  colorSchemes, 
  interactiveElements,
  statusIndicators,
  typography
} from '@/shared/styles/effects';
import { 
  Users, 
  UserCheck, 
  Clock,
  Calendar,
  Brain,
  FileText,
  Activity,
  AlertTriangle,
  RefreshCcw,
  Building2,
  TrendingUp
} from 'lucide-react';

export default function HospitalDashboardPage() {
  const { user } = useAuth();
  const hospitalId = user?.hospital?.id;
  
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { 
    data: analytics, 
    isLoading: analyticsLoading, 
    error, 
    refetch,
  } = useHospitalAnalyticsLive(hospitalId);

  // Combined loading flag — same pattern as super-admin portal.
  // NOTE: user?.hospital?.id is NOT used here because the /api/auth/profile
  // route does not join the hospitals table for hospital_admin users, so
  // hospital.id is always undefined on the user object.
  const isLoading = (analyticsLoading && !analytics) || isRefreshing;

  // Mount-time safeguard: ensure initial fetch triggers reliably
  useEffect(() => {
    if (!analytics && !analyticsLoading) {
      refetch();
    }
  }, [analytics, analyticsLoading, refetch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (error) {
    return (
      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <PageHeader
            title={`${user?.hospital?.name || 'Your Hospital'} Dashboard`}
            subtitle="Real-time insights and performance metrics"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <Card className="border border-red-200 bg-red-50 hover:shadow-lg transition-all duration-300">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 150 }}
              >
                <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h3>
              <p className="text-gray-600 mb-4 text-center max-w-md">{error.message || 'An unexpected error occurred'}</p>
              <motion.button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCcw className="h-4 w-4" />
                Retry
              </motion.button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  // Always show dashboard - analytics service will return default values if needed
  // Use default values if analytics is undefined
  const safeAnalytics = analytics || {
    totalDoctors: 0,
    totalPatients: 0,
    monthlyDiagnoses: 0,
    pendingReports: 0,
    doctorGrowth: 0,
    patientGrowth: 0,
    diagnosesGrowth: 0,
    avgResponseTime: "0 hours",
    recentActivity: [],
    topDoctors: [],
    departmentStats: []
  };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Hospital Overview */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title={`${user?.hospital?.name || 'Your Hospital'} Dashboard`}
          subtitle="Real-time insights and performance metrics"
          actions={[{
            label: isRefreshing ? 'Refreshing...' : 'Refresh',
            variant: 'outline',
            icon: RefreshCcw,
            onClick: handleRefresh,
            disabled: isRefreshing,
            className: 'hover:shadow-md hover:scale-105 transition-all duration-200 hover:border-blue-300 hover:text-blue-700'
          }]}
        />
      </motion.div>

      {/* Key Metrics — AnimatePresence skeleton on first load AND refresh */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="stats-loading"
            variants={itemVariants}
            initial="hidden" animate="visible"
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[...Array(3)].map((_, i) => (
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }}>
              <StatCard
                title="Total Doctors"
                value={safeAnalytics.totalDoctors}
                icon={Users}
                trend={safeAnalytics.doctorGrowth ? { value: safeAnalytics.doctorGrowth, isPositive: safeAnalytics.doctorGrowth >= 0 } : undefined}
              />
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }}>
              <StatCard
                title="Total Patients"
                value={safeAnalytics.totalPatients}
                icon={UserCheck}
                trend={safeAnalytics.patientGrowth ? { value: safeAnalytics.patientGrowth, isPositive: safeAnalytics.patientGrowth >= 0 } : undefined}
              />
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }}>
              <StatCard
                title="Monthly Diagnoses"
                value={safeAnalytics.monthlyDiagnoses}
                icon={Brain}
                trend={safeAnalytics.diagnosesGrowth ? {
                  value: safeAnalytics.diagnosesGrowth,
                  isPositive: safeAnalytics.diagnosesGrowth >= 0
                } : undefined}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Recent Activity */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.01, y: -2 }}
          className="h-full"
        >
          <Card className={`border border-gray-200 ${colorSchemes.blue.border} ${colorSchemes.blue.shadow} ${colorSchemes.blue.bg} transition-all duration-300 group h-full`}>
            <CardHeader className="group-hover:bg-blue-50/30 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 group-hover:scale-110 transition-all">
                  <Activity className="h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
                </div>
                <div>
                  <CardTitle className={typography.cardTitle}>Recent Hospital Activity</CardTitle>
                  <CardDescription className={typography.cardDescription}>Latest updates from your hospital</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-start space-x-3 animate-pulse">
                        <div className="w-2 h-2 bg-gray-200 rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-100 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : safeAnalytics.recentActivity.length > 0 ? (
                  <AnimatePresence>
                    {safeAnalytics.recentActivity.slice(0, 3).map((activity, index) => (
                      <motion.div
                        key={activity.id}
                        variants={listItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, x: -20 }}
                        custom={index}
                        whileHover="hover"
                        className={`p-3 rounded-lg ${interactiveElements.listItem}`}
                      >
                        <div className="flex items-start space-x-3">
                          <motion.div 
                            className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 group-hover:scale-150 group-hover:shadow-md transition-all ${
                              activity.type === 'diagnosis' ? 'bg-purple-600 group-hover:bg-purple-700' :
                              activity.type === 'patient' ? 'bg-green-600 group-hover:bg-green-700' :
                              activity.type === 'doctor' ? 'bg-blue-600 group-hover:bg-blue-700' : 'bg-gray-600'
                            }`}
                            whileHover={{ scale: 1.5 }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-900 group-hover:text-blue-800 transition-colors">{activity.message}</p>
                            <div className="flex items-center mt-1 text-xs text-gray-500 group-hover:text-blue-600 transition-colors">
                              <Calendar className="h-3 w-3 mr-1 group-hover:text-blue-600 group-hover:scale-110 transition-all" />
                              {activity.time}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 150 }}
                      className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3"
                    >
                      <Activity className="h-6 w-6 text-gray-400" />
                    </motion.div>
                    <p className="text-sm font-medium text-gray-600 mb-1">No recent activity to display</p>
                    <p className="text-xs text-gray-500">Activity will appear here as your hospital grows</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Performing Doctors */}
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.01, y: -2 }}
          className="h-full"
        >
          <Card className={`border border-gray-200 ${colorSchemes.orange.border} ${colorSchemes.orange.shadow} ${colorSchemes.orange.bg} transition-all duration-300 group h-full`}>
            <CardHeader className="group-hover:bg-orange-50/30 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 group-hover:scale-110 transition-all">
                  <TrendingUp className="h-5 w-5 text-orange-600 group-hover:text-orange-700 transition-colors" />
                </div>
                <div>
                  <CardTitle className={typography.cardTitle}>Top Performing Doctors</CardTitle>
                  <CardDescription className={typography.cardDescription}>Doctors ranked by actual patient count from database</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-gray-200 rounded" />
                          <div className="h-4 bg-gray-200 rounded w-32" />
                        </div>
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-200 rounded w-16" />
                          <div className="h-3 bg-gray-100 rounded w-12" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : safeAnalytics.topDoctors.length > 0 ? (
                  <AnimatePresence>
                    {safeAnalytics.topDoctors.slice(0, 3).map((doctor, index) => (
                      <motion.div
                        key={doctor.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        whileHover={{ scale: 1.02, x: -4 }}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all duration-200 hover:shadow-md cursor-pointer group/doctor"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <motion.div 
                              className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-700 group-hover/doctor:bg-orange-300 group-hover/doctor:text-white group-hover/doctor:scale-110 transition-all"
                              whileHover={{ scale: 1.2 }}
                            >
                              {index + 1}
                            </motion.div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 group-hover/doctor:text-orange-800 transition-colors">{doctor.name}</p>
                              <p className="text-xs text-gray-500 group-hover/doctor:text-orange-600 transition-colors">{doctor.specialization} • {doctor.department} • {doctor.patients} patients</p>
                            </div>
                          </div>
                          <motion.div whileHover={{ scale: 1.05 }}>
                            <Badge variant="secondary" className="group-hover/doctor:bg-orange-200 group-hover/doctor:text-orange-800 group-hover/doctor:scale-110 group-hover/doctor:shadow-sm transition-all">
                              {doctor.diagnoses} diagnoses
                            </Badge>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="text-center py-8">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 150 }}
                      className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3"
                    >
                      <Users className="h-6 w-6 text-gray-400" />
                    </motion.div>
                    <p className="text-sm font-medium text-gray-600 mb-1">No doctors to display</p>
                    <p className="text-xs text-gray-500">Add doctors to your hospital to see performance metrics</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Department Statistics */}
      <motion.div variants={itemVariants}>
        <Card className="border border-gray-200 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/40 hover:bg-gradient-to-br hover:from-purple-50/20 hover:to-white transition-all duration-300 group">
          <CardHeader className="group-hover:bg-purple-50/30 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 group-hover:scale-110 transition-all">
                <Users className="h-5 w-5 text-purple-600 group-hover:text-purple-700 transition-colors" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-purple-800 transition-colors">Department Performance</CardTitle>
                <CardDescription className="text-gray-600 group-hover:text-purple-700 transition-colors">Medical departments overview</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : safeAnalytics.departmentStats.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {safeAnalytics.departmentStats.map((dept, index) => (
                    <motion.div
                      key={dept.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      whileHover={{ scale: 1.03, y: -4 }}
                      className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/50 hover:bg-purple-50/20 transition-all duration-200 cursor-pointer group/dept"
                    >
                      <h4 className="font-semibold text-gray-900 mb-3 group-hover/dept:text-purple-800 transition-colors">{dept.name}</h4>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 group-hover/dept:text-purple-700 transition-colors">Patients</span>
                          <span className="font-medium text-gray-800 group-hover/dept:text-purple-800 transition-colors">{dept.patients}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 group-hover/dept:text-purple-700 transition-colors">Diagnoses</span>
                          <span className="font-medium text-gray-800 group-hover/dept:text-purple-800 transition-colors">{dept.diagnoses}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-12">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 150 }}
                  className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4"
                >
                  <Building2 className="h-8 w-8 text-gray-400" />
                </motion.div>
                <p className="text-sm font-medium text-gray-600 mb-1">No Department Data</p>
                <p className="text-xs text-gray-500">Department data will appear here once available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className={`border border-gray-200 ${colorSchemes.green.border} ${colorSchemes.green.shadow} ${colorSchemes.green.bg} transition-all duration-300 group`}>
          <CardHeader className="group-hover:bg-green-50/30 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 group-hover:scale-110 transition-all">
                <Activity className="h-5 w-5 text-green-600 group-hover:text-green-700 transition-colors" />
              </div>
              <div>
                <CardTitle className={typography.cardTitle}>Quick Actions</CardTitle>
                <CardDescription className={typography.cardDescription}>Common administrative tasks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/hospital-admin/doctors" className="block">
                <motion.div 
                  className="p-4 border border-dashed border-gray-300 rounded-lg text-center hover:bg-green-50 hover:border-green-300 cursor-pointer transition-all duration-200 group/action"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                  >
                    <Users className="h-8 w-8 text-blue-600 group-hover/action:text-green-600 mx-auto mb-2 transition-colors" />
                  </motion.div>
                  <h3 className="font-medium text-gray-900 mb-1 group-hover/action:text-green-800 transition-colors">Add New Doctor</h3>
                  <p className="text-sm text-gray-500 group-hover/action:text-green-600 transition-colors">Register a new doctor in your hospital</p>
                </motion.div>
              </Link>
              
              <Link href="/hospital-admin/analytics" className="block">
                <motion.div 
                  className="p-4 border border-dashed border-gray-300 rounded-lg text-center hover:bg-green-50 hover:border-green-300 cursor-pointer transition-all duration-200 group/action"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                  >
                    <Activity className="h-8 w-8 text-purple-600 group-hover/action:text-green-600 mx-auto mb-2 transition-colors" />
                  </motion.div>
                  <h3 className="font-medium text-gray-900 mb-1 group-hover/action:text-green-800 transition-colors">View Analytics</h3>
                  <p className="text-sm text-gray-500 group-hover/action:text-green-600 transition-colors">Access detailed performance analytics</p>
                </motion.div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
