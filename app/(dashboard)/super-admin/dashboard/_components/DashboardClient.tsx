"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { StatCard } from '@/shared/components/common/StatCard';
import { 
  useAnalyticsSummary, 
  useRecentActivity,
  useAnalyticsRefresh,
  useDepartmentPerformance,
  useTopHospitals
} from '@/features/super-admin/hooks/useAnalytics';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { 
  Building2, 
  Users, 
  UserCheck, 
  Activity,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';

export function DashboardClient() {
  const { user, initialized } = useAuth();
  const isEnabled = initialized && !!user && user.user_type === 'super_admin';
  const [loadSecondaryData, setLoadSecondaryData] = useState(false);
  const { data: summaryData, isLoading: summaryLoading, error: summaryError, refetch } = useAnalyticsSummary(undefined, { enabled: isEnabled });
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity({ enabled: loadSecondaryData && isEnabled });
  const { data: departmentData, isLoading: departmentLoading } = useDepartmentPerformance({ enabled: loadSecondaryData && isEnabled });
  const { data: topHospitals, isLoading: hospitalsLoading } = useTopHospitals({ enabled: loadSecondaryData && isEnabled });
  const { refresh } = useAnalyticsRefresh();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Defer non-critical data loading for faster initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadSecondaryData(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Mount-time safeguard: ensure initial fetch triggers reliably
  useEffect(() => {
    if (isEnabled && !summaryData && !summaryLoading) {
      refetch();
    }
  }, [isEnabled, summaryData, summaryLoading, refetch]);

  // Show skeleton:
  //  1. Before auth has initialised (query is still disabled, summaryLoading=false)
  //  2. While the query is fetching for the first time (no cached data yet)
  //  3. While the user has manually triggered a refresh
  const isLoading = !initialized || (summaryLoading && !summaryData && !summaryError) || isRefreshing;
  const hasError = !!summaryError;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0,
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
        stiffness: 150,
        damping: 20,
      },
    },
  };

  if (hasError) {
    return (
      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <PageHeader
            title="Dashboard"
            subtitle="System overview and key metrics"
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
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h3>
              <p className="text-sm text-gray-500 mb-4 text-center max-w-md">
                There was an error loading the dashboard data. Please check your connection and try again.
              </p>
              <motion.button
                onClick={() => refetch()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </motion.button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

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
          title="Dashboard"
          subtitle="System overview and key metrics"
          actions={[
            { 
              label: isRefreshing ? "Refreshing..." : "Refresh", 
              variant: "outline", 
              icon: RefreshCw, 
              onClick: handleRefresh,
              disabled: isRefreshing,
              className: "hover:shadow-md hover:scale-105 transition-all duration-200 hover:border-blue-300 hover:text-blue-700"
            }
          ]}
        />
      </motion.div>

      {/* Metrics Section */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loading"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <Card className="border border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/30 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-8 bg-gray-300 rounded w-16"></div>
                        </div>
                        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
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

      {/* Two Column Layout */}
      <motion.div variants={itemVariants} className="grid lg:grid-cols-2 gap-6">
        {/* Recent System Activity */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.01, y: -2 }} className="h-full">
          <Card className="border border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/40 transition-all duration-300 group h-full">
            <CardHeader className="group-hover:bg-blue-50/30 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-all">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                  <CardDescription>Latest system updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 pt-0">
              {activityLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3 animate-pulse">
                      <div className="w-2 h-2 bg-gray-200 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.slice(0, 3).map((activity, index) => (
                    <motion.div
                      key={activity.id || `activity-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all cursor-pointer group"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-150 transition-all" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{activity.message}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Activity className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">No Recent Activity</p>
                  <p className="text-xs text-gray-500">Activity will appear here as it happens</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Hospitals */}
        <motion.div variants={itemVariants} whileHover={{ scale: 1.01, y: -2 }} className="h-full">
          <Card className="border border-gray-200 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-100/40 transition-all duration-300 group h-full">
            <CardHeader className="group-hover:bg-orange-50/30 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-all">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">Top Hospitals</CardTitle>
                  <CardDescription>By patient volume and diagnoses</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 pt-0">
              {hospitalsLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-100 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : topHospitals && topHospitals.length > 0 ? (
                <div className="space-y-4">
                  {topHospitals.slice(0, 3).map((hospital, index) => (
                    <motion.div
                      key={hospital.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      whileHover={{ scale: 1.02, x: -4 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center text-orange-600 font-semibold text-sm group-hover:bg-orange-300 group-hover:text-white transition-all">
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-800">{hospital.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-800">{hospital.patients} patients</div>
                        <div className="text-xs text-gray-500">{hospital.diagnoses} diagnoses</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">No Hospital Data</p>
                  <p className="text-xs text-gray-500">Hospital data will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Department Performance */}
      <motion.div variants={itemVariants}>
        <Card className="border border-gray-200 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/40 transition-all duration-300 group">
          <CardHeader className="group-hover:bg-purple-50/30 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-all">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Department Performance</CardTitle>
                <CardDescription>Medical departments overview</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 pt-0">
            {departmentLoading ? (
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
            ) : departmentData && departmentData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departmentData.map((dept, index) => (
                  <motion.div
                    key={dept.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    whileHover={{ scale: 1.03, y: -4 }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/50 transition-all cursor-pointer group"
                  >
                    <h4 className="font-semibold text-gray-900 mb-3">{dept.name}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Patients</span>
                        <span className="font-medium text-gray-800">{dept.patients}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Diagnoses</span>
                        <span className="font-medium text-gray-800">{dept.diagnoses}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">No Department Data</p>
                <p className="text-xs text-gray-500">Department data will appear here once available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card className="border border-gray-200 hover:border-green-300 hover:shadow-xl hover:shadow-green-100/40 transition-all duration-300 group">
          <CardHeader className="group-hover:bg-green-50/30 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-all">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks and navigation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/super-admin/hospitals" className="block">
                <motion.div 
                  className="p-6 border border-dashed border-gray-300 rounded-lg text-center hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200 group/action"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div whileHover={{ rotate: 5, scale: 1.1 }}>
                    <Building2 className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                  </motion.div>
                  <h3 className="font-semibold text-gray-900 mb-2">Hospital Management</h3>
                  <p className="text-sm text-gray-500">Manage hospitals and their administrators</p>
                </motion.div>
              </Link>
              
              <Link href="/super-admin/analytics" className="block">
                <motion.div 
                  className="p-6 border border-dashed border-gray-300 rounded-lg text-center hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition-all duration-200 group/action"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div whileHover={{ rotate: -5, scale: 1.1 }}>
                    <TrendingUp className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                  </motion.div>
                  <h3 className="font-semibold text-gray-900 mb-2">View Analytics</h3>
                  <p className="text-sm text-gray-500">Access detailed system analytics and insights</p>
                </motion.div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
