"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { StatCard } from '@/shared/components/common/StatCard';
import { PatientTableSkeleton } from '@/shared/components/ui/table-skeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePatients, Patient } from '@/features/doctor/hooks/usePatients';
import { useUpdatePatient } from '@/features/doctor/hooks/useUpdatePatient';
import type { PatientUpdateData } from '@/features/doctor/hooks/useUpdatePatient';
import { useUpdateMedicalNote, useFetchLastMedicalNote } from '@/features/doctor/hooks/useMedicalNote';
import { queryKeys } from '@/shared/lib/query-keys';
import { formatDatabaseDateOnly, calculateAgeFromDatabase } from '@/shared/lib/utils';
import PatientDetailsModal from '@/shared/components/modals/PatientDetailsModal';
import PatientEditModal from '@/shared/components/modals/PatientEditModal';
import AddMedicalNoteModal from '@/shared/components/modals/AddMedicalNoteModal';
import PatientReportModal from '@/shared/components/modals/PatientReportModal';
import { colorSchemes, interactiveElements, statusIndicators, typography } from '@/shared/styles/effects';
import { 
  Search, 
  User, 
  Calendar, 
  Brain,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Phone,
  Mail,
  RefreshCw,
  Edit2,
  FileText,
  MessageSquare
} from 'lucide-react';

// Beautiful animation variants with spring physics
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.06,
      delayChildren: 0.1
    } 
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
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

const tableRowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }),
  hover: {
    backgroundColor: "rgba(59, 130, 246, 0.05)",
    transition: { duration: 0.2 }
  }
};

const cardHoverVariants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { type: "spring" as const, stiffness: 400, damping: 25 }
  },
  tap: { scale: 0.98 }
};

interface PatientSaveFormData {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  dementiaStage: 'mild' | 'moderate' | 'severe';
  medicalHistory?: {
    conditions?: string[];
    medications?: string;
    history?: string;
    familyHistory?: string;
    primaryConcerns?: string;
  };
  caregiverFirstName?: string;
  caregiverLastName?: string;
  caregiverPhone?: string;
  caregiverAddress?: string;
  medicalNoteContent?: string | null;
  medicalNoteRecommendations?: string | null;
  medicalNoteFollowUpDate?: string | null;
}

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Use TanStack Query to fetch patient data
  const { data: patients = [], error, isLoading: patientsLoading, refetch } = usePatients({
    doctorId: user?.id
  });

  // Combined loading flag — same pattern as super-admin portal
  const isLoading = (patientsLoading && patients.length === 0) || isRefreshing;

  // Mount-time safeguard: ensure initial fetch triggers reliably
  useEffect(() => {
    if (user?.id && !patientsLoading && patients.length === 0 && !error) {
      refetch();
    }
  }, [user?.id, patientsLoading, patients.length, error, refetch]);

  // Patient update mutation
  const updatePatientMutation = useUpdatePatient({
    onSuccess: (data) => {
      // No success message needed - modal will close automatically
    },
    onError: (error) => {
      // Error will be displayed in the modal, so no additional handling needed here
    }
  });

  // Medical note update mutation
  const updateMedicalNoteMutation = useUpdateMedicalNote();

  // Filter patients based on search term
  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    
    if (!searchTerm) return patients;
    
    const term = searchTerm.toLowerCase();
    return patients.filter(patient =>
      `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(term) ||
      patient.id.toLowerCase().includes(term) ||
      patient.dementia_stage.toLowerCase().includes(term)
    );
  }, [patients, searchTerm]);

  // Calculate statistics from real data
  const stats = useMemo(() => {
    if (!patients) return { totalPatients: 0, pendingDiagnoses: 0, completedThisMonth: 0 };
    
    return {
      totalPatients: patients.length,
      pendingDiagnoses: patients.filter(p => p.users?.is_active === false).length,
      completedThisMonth: patients.filter(p => p.users?.is_active === true).length,
    };
  }, [patients]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refetch]);

  // Status badge — green pill for active, red pill for inactive (no icons, matching design)
  const getStatusBadge = useCallback((isActive: boolean) => {
    if (isActive) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 rounded-full px-3 hover:bg-green-200 transition-colors">
          Active
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200 rounded-full px-3 hover:bg-red-200 transition-colors">
        Inactive
      </Badge>
    );
  }, []);

  const getDementiaStageDisplay = useCallback((stage: 'mild' | 'moderate' | 'severe') => {
    const stageConfig = {
      mild: { label: 'Mild', className: statusIndicators.mildBadge },
      moderate: { label: 'Moderate', className: statusIndicators.moderateBadge },
      severe: { label: 'Severe', className: statusIndicators.severeBadge }
    };
    
    const config = stageConfig[stage] || { label: 'Unknown', className: 'bg-gray-100 text-gray-800 border-gray-200' };
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  }, []);


  // Modal handlers
  const handleViewPatientDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDetailsModalOpen(true);
  };

  const handleEditPatientDetails = (patient: Patient) => {
    // Invalidate and refetch patients to ensure caregiver data is up-to-date
    queryClient.invalidateQueries({ queryKey: queryKeys.patientsList() });
    setSelectedPatient(patient);
    setIsEditModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedPatient(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedPatient(null);
  };

  const handleAddMedicalNote = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsAddNoteModalOpen(true);
  };

  const handleCloseAddNoteModal = () => {
    setIsAddNoteModalOpen(false);
    setSelectedPatient(null);
  };

  const handleOpenReport = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setSelectedPatient(null);
  };

  const handleSavePatient = async (data: PatientSaveFormData) => {
    if (!selectedPatient) return;

    // Transform form data to match API expectations
    const transformedData = {
      // Patient basic information
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      dementiaStage: data.dementiaStage,
      medicalHistory: data.medicalHistory,
      
      // Caregiver information
      caregiverFirstName: data.caregiverFirstName,
      caregiverLastName: data.caregiverLastName,
      caregiverPhone: data.caregiverPhone,
      caregiverAddress: data.caregiverAddress
    };

    // Update patient information
    await updatePatientMutation.mutateAsync({
      patientId: selectedPatient.id,
      data: transformedData as PatientUpdateData
    });

    // Check if medical note was updated and save it
    // If medical note fields have data, try to update the medical note
    if (data.medicalNoteContent) {
      try {
        // Get the last medical note from cache
        const cachedNote = queryClient.getQueryData(['medical-note', selectedPatient.id]);
        
        if (cachedNote && typeof cachedNote === 'object' && 'id' in cachedNote) {
          const note = cachedNote as { id: string; note_content: string; recommendations?: string; follow_up_date?: string };
          const hasChanges = 
            data.medicalNoteContent !== note.note_content ||
            data.medicalNoteRecommendations !== (note.recommendations || '') ||
            data.medicalNoteFollowUpDate !== (note.follow_up_date || '');

          if (hasChanges) {
            await updateMedicalNoteMutation.mutateAsync({
              noteId: note.id,
              data: {
                noteContent: data.medicalNoteContent ?? undefined,
                recommendations: data.medicalNoteRecommendations ?? undefined,
                followUpDate: data.medicalNoteFollowUpDate ?? undefined
              }
            });
          }
        }
      } catch (error) {
        // Don't throw - patient update was successful
      }
    }
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
          title={`Welcome, Dr. ${user?.email?.split('@')[0] || 'Doctor'}`}
          subtitle="Manage your patient diagnostics and care"
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

      {/* Error Display */}
      <AnimatePresence>
        {error && (
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
                    <p className="font-medium">Error Loading Patients</p>
                    <p className="text-sm">{error.message || 'An error occurred while loading patients'}</p>
                  </div>
                  <Button
                    onClick={() => refetch()}
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-red-600 hover:text-red-700 hover:scale-105 transition-all"
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Key Metrics Cards */}
      <AnimatePresence mode="wait">
      <motion.div
        key={isLoading ? 'stats-loading' : 'stats-content'}
        variants={itemVariants}
        initial="hidden" animate="visible"
        exit={{ opacity: 0, y: -20 }}
        className="grid grid-cols-1 gap-6"
      >
        {isLoading ? (
          <>
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
          </>
        ) : (
          <>
            <motion.div variants={cardHoverVariants} initial="rest" whileHover="hover" whileTap="tap">
              <StatCard title="Total Patients" value={stats.totalPatients} icon={User} />
            </motion.div>
          </>
        )}
      </motion.div>
      </AnimatePresence>

      {/* Search */}
      <motion.div variants={itemVariants}>
        <Card className={`border border-gray-200 ${colorSchemes.blue.border} ${colorSchemes.blue.shadow} ${colorSchemes.blue.bg} transition-all duration-300 group`}>
          <CardHeader className="group-hover:bg-blue-50/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${colorSchemes.blue.iconBg} rounded-lg ${interactiveElements.hoverIcon}`}>
                  <Search className={`h-5 w-5 ${colorSchemes.blue.icon} transition-colors`} />
                </div>
                <div>
                  <CardTitle className={typography.cardTitle}>Search Patients</CardTitle>
                  <CardDescription className={typography.cardDescription}>Find patients by name, ID, or dementia stage</CardDescription>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                <Input
                  placeholder="Search patients by name, ID, or dementia stage..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 group-hover:border-blue-300 transition-colors focus:border-blue-500"
                />
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Patients Table */}
      <motion.div variants={itemVariants}>
        <Card className={`border border-gray-200 ${colorSchemes.purple.border} ${colorSchemes.purple.shadow} ${colorSchemes.purple.bg} transition-all duration-300 group`}>
          <CardHeader className="group-hover:bg-purple-50/20 transition-colors">
            <div className="flex items-center space-x-3">
              <div className={`p-2 ${colorSchemes.purple.iconBg} rounded-lg ${interactiveElements.hoverIcon}`}>
                <User className={`h-5 w-5 ${colorSchemes.purple.icon} transition-colors`} />
              </div>
              <div>
                <CardTitle className={typography.cardTitle}>Your Patients ({filteredPatients.length})</CardTitle>
                <CardDescription className={typography.cardDescription}>Complete list of patients under your care</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <PatientTableSkeleton rows={8} />
            ) : filteredPatients.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-purple-200 hover:scale-110 transition-all duration-300">
                  <User className="h-8 w-8 text-purple-400" />
                </div>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? `No patients found matching "${searchTerm}"` : 'No patients registered yet. Go back to the dashboard to add your first patient.'}
                </p>
              </motion.div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Dementia Stage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredPatients.map((patient, index) => (
                      <motion.tr
                        key={patient.id}
                        custom={index}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, x: -10 }}
                        whileHover="hover"
                        className="border-b border-gray-200 group/row"
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <motion.div 
                              className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center"
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ type: "spring" as const, stiffness: 400, damping: 10 }}
                            >
                              <User className="h-5 w-5 text-blue-600" />
                            </motion.div>
                            <div>
                              <p className="font-medium text-gray-900 group-hover/row:text-blue-700 transition-colors">
                                {patient.first_name} {patient.last_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {calculateAgeFromDatabase(patient.date_of_birth)} years • {formatDatabaseDateOnly(patient.date_of_birth)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm group-hover/row:text-gray-700 transition-colors">
                              <Mail className="h-3 w-3 mr-2 text-gray-400" />
                              {patient.users?.email || 'N/A'}
                            </div>
                            {patient.patient_caregiver_assignments?.[0]?.caregivers && (
                              <div className="flex items-center text-sm">
                                <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                {patient.patient_caregiver_assignments[0].caregivers.phone_number || 'N/A'}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <motion.div whileHover={{ scale: 1.05 }}>
                              {getDementiaStageDisplay(patient.dementia_stage)}
                            </motion.div>
                            <p className="text-xs text-gray-500">Current Stage</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <motion.div whileHover={{ scale: 1.05 }}>
                            {getStatusBadge(patient.users?.is_active ?? true)}
                          </motion.div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{formatDatabaseDateOnly(patient.users.created_at)}</p>
                          <p className="text-xs text-gray-500">Registration</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="View patient details"
                                onClick={() => handleViewPatientDetails(patient)}
                                className="hover:bg-blue-100 hover:text-blue-700"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Edit patient details"
                                onClick={() => handleEditPatientDetails(patient)}
                                className="hover:bg-green-100 hover:text-green-700"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Patient report"
                                onClick={() => handleOpenReport(patient)}
                                className="hover:bg-orange-100 hover:text-orange-700"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Add note"
                                onClick={() => handleAddMedicalNote(patient)}
                                className="hover:bg-purple-100 hover:text-purple-700"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Patient Details Modal */}
      <PatientDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        patient={selectedPatient}
      />

      {/* Patient Edit Modal */}
      <PatientEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        patient={selectedPatient}
        onSave={handleSavePatient}
        isLoading={updatePatientMutation.isPending}
      />

      {/* Add Medical Note Modal */}
      <AddMedicalNoteModal
        isOpen={isAddNoteModalOpen}
        onClose={handleCloseAddNoteModal}
        patient={selectedPatient}
      />

      {/* Patient Report Modal */}
      <PatientReportModal
        isOpen={isReportModalOpen}
        onClose={handleCloseReportModal}
        patient={selectedPatient}
      />

    </motion.div>
  );
}
