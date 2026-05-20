"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { StatCard } from '@/shared/components/common/StatCard';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { useDoctorPatients } from '@/features/doctor/hooks';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { interactiveElements, typography, backgroundGradients } from '@/shared/styles/effects';
import { 
  Users, 
  Activity,
  Clock,
  UserPlus,
  Eye,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

// Smooth animation variants with spring physics for visual appeal
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.08,
      delayChildren: 0.1
    } 
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    } 
  }
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: { type: "spring" as const, stiffness: 400, damping: 25 }
  },
  tap: { scale: 0.98 }
};

const iconHoverVariants = {
  rest: { rotate: 0, scale: 1 },
  hover: { 
    rotate: 5, 
    scale: 1.1,
    transition: { type: "spring" as const, stiffness: 400, damping: 10 }
  }
};

const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  })
};

export default function DoctorDashboard() {
  const { user, initialized } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: patients, isLoading: patientsLoading, error: patientsError, refetch } = useDoctorPatients(
    user?.id || '', 
    { enabled: !!user?.id }
  );

  // Combined loading flag — same pattern as super-admin portal
  const isLoading = !initialized || (patientsLoading && !patients) || isRefreshing;

  // Mount-time safeguard: ensure initial fetch triggers reliably
  useEffect(() => {
    if (user?.id && !patients && !patientsLoading) {
      refetch();
    }
  }, [user?.id, patients, patientsLoading, refetch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Calculate metrics from actual data
  const metrics = React.useMemo(() => {
    if (!patients || patients.length === 0) {
      return { totalPatients: 0 };
    }
    return { totalPatients: patients.length };
  }, [patients]);

  // Get recent patients (last 5, sorted by creation date)
  const recentPatients = React.useMemo(() => {
    if (!patients || patients.length === 0) return [];
    
    return patients
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(patient => ({
        id: patient.id,
        name: `${patient.first_name} ${patient.last_name}`,
        severity: patient.dementia_stage,
        status: patient.users.is_active ? 'active' : 'inactive'
      }));
  }, [patients]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'mild': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'severe': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Only surface critical errors (not timeouts / network blips common on first load)
  const isCriticalError = patientsError &&
    !(patientsError.message?.toLowerCase().includes('timeout')) &&
    !(patientsError.message?.toLowerCase().includes('network'));

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
          title="Doctor Dashboard"
          subtitle="Welcome back! Here's an overview of your patients and activities."
          actions={[
            {
              label: isRefreshing ? 'Refreshing...' : 'Refresh',
              variant: 'outline',
              icon: RefreshCw,
              onClick: handleRefresh,
              disabled: isRefreshing,
              className: interactiveElements.primaryButton
            }
          ]}
        />
      </motion.div>

      {/* Critical error banner */}
      <AnimatePresence>
        {isCriticalError && (
          <motion.div variants={itemVariants} initial="hidden" animate="visible" exit={{ opacity: 0, y: -20 }}>
            <Card className="border border-red-200 bg-red-50 hover:shadow-lg transition-all duration-300">
              <CardContent className="flex items-center gap-3 p-5">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700 flex-1">
                  There was an error loading your patient data. Please check your connection.
                </p>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-300 rounded text-red-700 bg-white hover:bg-red-50 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Retrying…' : 'Retry'}
                </button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key Metrics Cards — skeleton on first load AND on refresh */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="stats-loading"
            variants={itemVariants}
            initial="hidden" animate="visible"
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 gap-6"
          >
            {[...Array(1)].map((_, i) => (
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
            className="grid grid-cols-1 gap-6"
          >
            <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover" whileTap="tap">
              <StatCard title="Total Patients" value={metrics.totalPatients} icon={Users} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Patients Section */}
      <motion.div variants={itemVariants}>
        <motion.div whileHover={{ scale: 1.005 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
          <Card className={`border border-gray-200 hover:border-green-300 hover:shadow-lg ${backgroundGradients.greenCardBg} transition-all duration-300 group`}>
            <CardHeader className="group-hover:bg-green-50/20 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-all">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className={typography.cardTitle}>Recent Patients</CardTitle>
                  <CardDescription className={typography.cardDescription}>
                    Your recently added patients and their current status
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {isLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                        <div className="h-4 bg-gray-200 rounded w-32" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded w-16" />
                        <div className="h-6 bg-gray-200 rounded w-14" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
              <AnimatePresence mode="wait">
                {recentPatients.length === 0 ? (
                  <motion.div 
                    className="text-center py-8"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <motion.div 
                      className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                      <Users className="h-6 w-6 text-gray-400" />
                    </motion.div>
                    <p className="text-sm font-medium text-gray-600 mb-1">No recent patients yet</p>
                    <p className="text-xs text-gray-500">Patient activities will appear here once you start managing patients</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="space-y-3"
                    initial="hidden"
                    animate="visible"
                  >
                    {recentPatients.map((patient, index) => (
                      <motion.div
                        key={patient.id}
                        custom={index}
                        variants={listItemVariants}
                        whileHover={{ 
                          scale: 1.01, 
                          backgroundColor: "rgb(240 253 244)",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
                        }}
                        className="p-3 rounded-lg bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <motion.div 
                              className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center"
                              whileHover={{ scale: 1.1 }}
                            >
                              <Users className="h-5 w-5 text-green-600" />
                            </motion.div>
                            <p className="font-medium text-gray-900">{patient.name}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <motion.div whileHover={{ scale: 1.05 }}>
                              <Badge className={getSeverityColor(patient.severity)}>
                                {patient.severity}
                              </Badge>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }}>
                              <Badge className={getStatusColor(patient.status)}>
                                {patient.status}
                              </Badge>
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <motion.div
          whileHover={{ scale: 1.005 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <Card className={`border border-gray-200 hover:border-blue-300 hover:shadow-lg ${backgroundGradients.blueCardBg} transition-all duration-300`}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <motion.div 
                  className="p-2 bg-blue-100 rounded-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Activity className="h-5 w-5 text-blue-600" />
                </motion.div>
                <div>
                  <CardTitle className={typography.cardTitle}>Quick Actions</CardTitle>
                  <CardDescription className={typography.cardDescription}>
                    Common tasks and workflows for patient management
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/doctor/add-patient">
                  <motion.div
                    variants={cardHoverVariants}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                    className="group"
                  >
                    <Card className="border-2 border-dashed border-gray-200 group-hover:border-blue-400 group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:to-indigo-50 transition-all duration-300 cursor-pointer h-full">
                      <CardContent className="p-6 text-center">
                        <motion.div 
                          className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors"
                          variants={iconHoverVariants}
                        >
                          <UserPlus className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors" />
                        </motion.div>
                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-800 transition-colors">Add New Patient</h3>
                        <p className="text-sm text-gray-600 group-hover:text-blue-700 transition-colors">Register a new patient and create their caregiver account</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>

                <Link href="/doctor/patients">
                  <motion.div
                    variants={cardHoverVariants}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                    className="group"
                  >
                    <Card className="border-2 border-dashed border-gray-200 group-hover:border-purple-400 group-hover:bg-gradient-to-br group-hover:from-purple-50 group-hover:to-violet-50 transition-all duration-300 cursor-pointer h-full">
                      <CardContent className="p-6 text-center">
                        <motion.div 
                          className="w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:from-purple-200 group-hover:to-violet-200 transition-colors"
                          variants={iconHoverVariants}
                        >
                          <Eye className="h-8 w-8 text-purple-600 group-hover:text-purple-700 transition-colors" />
                        </motion.div>
                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-800 transition-colors">View Patients</h3>
                        <p className="text-sm text-gray-600 group-hover:text-purple-700 transition-colors">Manage and monitor your patient list and records</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
