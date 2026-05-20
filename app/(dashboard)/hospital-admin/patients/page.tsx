"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { StatCard } from '@/shared/components/common/StatCard';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { PatientsAssignmentTable } from '@/shared/components/hospital/PatientsAssignmentTable';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDoctors } from '@/features/hospital/hooks/useDoctorManagement';
import { useHospitalValidation } from '@/features/hospital/hooks/useHospitalData';
import { useHospitalPatients } from '@/features/hospital/hooks/usePatientAssignment';
import { PatientFilters } from '@/features/hospital/services/patient-assignment';
import { 
  Plus, 
  Search, 
  Users, 
  UserCheck,
  UserPlus,
  Stethoscope,
  RefreshCw,
  AlertCircle,
  Filter,
  Brain,
  Calendar
} from 'lucide-react';

export default function HospitalPatientsPage() {
  const { user, loading, initialized } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use hospital validation hook to handle missing hospital data
  const { 
    isHospitalDataAvailable, 
    hospitalInfo, 
    isLoading: hospitalLoading, 
    error: hospitalError 
  } = useHospitalValidation();
  
  const hospitalId = user?.hospital?.id || hospitalInfo?.id || '';
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all-stages');
  
  // Build filters object
  const filters: PatientFilters = useMemo(() => {
    const f: PatientFilters = {};
    if (searchTerm.trim()) f.search = searchTerm.trim();
    if (selectedStage && selectedStage !== 'all-stages') {
      f.dementiaStage = selectedStage as 'mild' | 'moderate' | 'severe';
    }
    return f;
  }, [searchTerm, selectedStage]);

  // Fetch data
  const patientsQuery = useHospitalPatients({
    hospitalId,
    filters,
    enabled: !!hospitalId && isHospitalDataAvailable
  });
  const { 
    data: patients = [], 
    error: patientsError, 
    refetch: refetchPatients,
    isLoading: patientsQueryLoading
  } = patientsQuery;

  const doctorsQuery = useDoctors({
    hospitalId,
    enabled: !!hospitalId && isHospitalDataAvailable
  });
  const { 
    data: doctors = [], 
    refetch: refetchDoctors,
    isLoading: doctorsQueryLoading
  } = doctorsQuery;

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!patients || patients.length === 0) {
      return {
        totalPatients: 0,
        assignedPatients: 0,
        unassignedPatients: 0,
        patientsByStage: {
          mild: 0,
          moderate: 0,
          severe: 0
        }
      };
    }

    const assigned = patients.filter(p => p.primary_doctor_id);
    const unassigned = patients.filter(p => !p.primary_doctor_id);

    return {
      totalPatients: patients.length,
      assignedPatients: assigned.length,
      unassignedPatients: unassigned.length,
      patientsByStage: {
        mild: patients.filter(p => p.dementia_stage === 'mild').length,
        moderate: patients.filter(p => p.dementia_stage === 'moderate').length,
        severe: patients.filter(p => p.dementia_stage === 'severe').length,
      }
    };
  }, [patients]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchPatients(), refetchDoctors()]);
    setTimeout(() => setIsRefreshing(false), 1000); // Add delay for better UX
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStage('all-stages');
  };

  // Combined loading flag — same pattern as super-admin portal
  const isLoading = hospitalLoading ||
    (patientsQueryLoading && patients.length === 0) ||
    (doctorsQueryLoading && doctors.length === 0) ||
    isRefreshing;
  const hasActiveFilters = searchTerm || 
    (selectedStage && selectedStage !== 'all-stages');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
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

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Patient Management"
          subtitle="Manage patient assignments to doctors in your hospital"
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

      {/* Hospital Data Error Display */}
      <AnimatePresence>
        {!isHospitalDataAvailable && !hospitalLoading && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-amber-200 bg-amber-50 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-200 group">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-amber-800">
                  <AlertCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <p className="font-medium">Hospital Information Missing</p>
                    <p className="text-sm text-amber-700">
                      Unable to load your hospital information. Please contact system administrator or try logging in again.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Error Display */}
      <AnimatePresence>
        {(patientsError || hospitalError) && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-red-200 bg-red-50 hover:border-red-300 hover:shadow-lg hover:shadow-red-100/50 transition-all duration-200 group">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <div className="flex-1">
                    <p className="font-medium">Operation Failed</p>
                    <p className="text-sm">{patientsError?.message || hospitalError?.message || 'An error occurred'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Stats — AnimatePresence skeleton on first load AND refresh */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="stats-loading"
            variants={itemVariants}
            initial="hidden" animate="visible"
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
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
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }}>
              <StatCard title="Total Patients"     value={metrics.totalPatients}     icon={Users}    />
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }}>
              <StatCard title="Assigned Patients"  value={metrics.assignedPatients}  icon={UserCheck} />
            </motion.div>
            <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }}>
              <StatCard title="Unassigned Patients" value={metrics.unassignedPatients} icon={UserPlus} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dementia Stage Distribution */}
      <motion.div variants={itemVariants}>
        <Card className="border border-gray-200 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/40 hover:bg-gradient-to-br hover:from-purple-50/20 hover:to-white transition-all duration-300 group">
          <CardHeader className="group-hover:bg-purple-50/30 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 group-hover:scale-110 transition-all">
                <Brain className="h-5 w-5 text-purple-600 group-hover:text-purple-700 transition-colors" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-purple-800 transition-colors">Patient Distribution by Dementia Stage</CardTitle>
                <CardDescription className="text-gray-600 group-hover:text-purple-700 transition-colors">Medical condition breakdown</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-3 gap-4">
              <motion.div 
                className="text-center p-4 rounded-lg hover:bg-green-50 hover:border-green-200 border border-transparent transition-all duration-200 hover:shadow-sm cursor-pointer group/item"
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="text-2xl font-bold text-green-600 group-hover/item:text-green-700 transition-colors">{metrics.patientsByStage.mild}</div>
                <div className="text-sm font-medium text-gray-600 group-hover/item:text-green-700 transition-colors mb-2">Mild Stage</div>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 group-hover/item:bg-green-200 group-hover/item:scale-110 group-hover/item:shadow-sm transition-all">
                  {metrics.totalPatients > 0 ? Math.round((metrics.patientsByStage.mild / metrics.totalPatients) * 100) : 0}%
                </span>
              </motion.div>
              <motion.div 
                className="text-center p-4 rounded-lg hover:bg-yellow-50 hover:border-yellow-200 border border-transparent transition-all duration-200 hover:shadow-sm cursor-pointer group/item"
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="text-2xl font-bold text-yellow-600 group-hover/item:text-yellow-700 transition-colors">{metrics.patientsByStage.moderate}</div>
                <div className="text-sm font-medium text-gray-600 group-hover/item:text-yellow-700 transition-colors mb-2">Moderate Stage</div>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 group-hover/item:bg-yellow-200 group-hover/item:scale-110 group-hover/item:shadow-sm transition-all">
                  {metrics.totalPatients > 0 ? Math.round((metrics.patientsByStage.moderate / metrics.totalPatients) * 100) : 0}%
                </span>
              </motion.div>
              <motion.div 
                className="text-center p-4 rounded-lg hover:bg-red-50 hover:border-red-200 border border-transparent transition-all duration-200 hover:shadow-sm cursor-pointer group/item"
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="text-2xl font-bold text-red-600 group-hover/item:text-red-700 transition-colors">{metrics.patientsByStage.severe}</div>
                <div className="text-sm font-medium text-gray-600 group-hover/item:text-red-700 transition-colors mb-2">Severe Stage</div>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 group-hover/item:bg-red-200 group-hover/item:scale-110 group-hover/item:shadow-sm transition-all">
                  {metrics.totalPatients > 0 ? Math.round((metrics.patientsByStage.severe / metrics.totalPatients) * 100) : 0}%
                </span>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={itemVariants}>
        <Card className="border border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/40 hover:bg-gradient-to-br hover:from-blue-50/20 hover:to-white transition-all duration-300 group">
          <CardHeader className="group-hover:bg-blue-50/30 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 group-hover:scale-110 transition-all">
                <Filter className="h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-800 transition-colors">Filter & Search</CardTitle>
                <CardDescription className="text-gray-600 group-hover:text-blue-700 transition-colors">Find and filter patients</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <Label htmlFor="search" className="text-sm font-medium text-gray-700">Search Patients</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                  <Input
                    id="search"
                    placeholder="Search by name or patient code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 group-hover:border-blue-300 transition-colors focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Stage Filter */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Dementia Stage</Label>
                <Select value={selectedStage} onValueChange={setSelectedStage}>
                  <SelectTrigger className="mt-1 hover:border-blue-300 transition-colors">
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-stages">All stages</SelectItem>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <AnimatePresence>
              {hasActiveFilters && (
                <motion.div 
                  className="mt-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button 
                    variant="outline" 
                    onClick={clearFilters} 
                    className="text-gray-600 hover:text-blue-700 hover:border-blue-300 hover:shadow-md hover:scale-105 transition-all duration-200"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Patients Table */}
      <motion.div variants={itemVariants}>
        <PatientsAssignmentTable
          patients={patients}
          doctors={doctors}
          isLoading={isLoading}
          error={patientsError}
        />
      </motion.div>
    </motion.div>
  );
}