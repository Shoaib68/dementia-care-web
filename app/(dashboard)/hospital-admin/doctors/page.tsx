"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { DoctorTableSkeleton } from '@/shared/components/ui/table-skeleton';
import { DoctorDetailsModal } from '@/shared/components/modals/DoctorDetailsModal';
import { DoctorEditModal } from '@/shared/components/modals/DoctorEditModal';
import { DoctorCreateModal } from '@/shared/components/modals/DoctorCreateModal';
import CredentialsModal from '@/shared/components/credentials/CredentialsModal';
import DoctorDeletionWorkflow from '@/shared/components/hospital/DoctorDeletionWorkflow';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDoctors, useCreateDoctor, DoctorData } from '@/features/hospital/hooks/useDoctorManagement';
import type { DoctorInfo } from '@/shared/components/hospital/DoctorDeletionDialog';
import { useHospitalValidation } from '@/features/hospital/hooks/useHospitalData';
import { GeneratedCredentials } from '@/features/auth/types';
import { 
  Plus, 
  Search, 
  Mail, 
  Edit,
  Eye,
  MoreHorizontal,
  Stethoscope,
  RefreshCw,
  AlertCircle,
  Trash2
} from 'lucide-react';

export default function DoctorManagementPage() {
  const { user, loading, initialized } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use hospital validation hook to handle missing hospital data
  const { 
    isHospitalDataAvailable, 
    hospitalInfo, 
    isLoading: hospitalLoading, 
    error: hospitalError 
  } = useHospitalValidation();
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletionWorkflowOpen, setDeletionWorkflowOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Selected doctor states
  const [doctorToDelete, setDoctorToDelete] = useState<DoctorInfo | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<DoctorData | null>(null);
  const [editingDoctor, setEditingDoctor] = useState<DoctorData | null>(null);
  
  // Credentials modal state
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredentials | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Use TanStack Query to fetch doctors data - use hospital validation as fallback
  const hospitalId = user?.hospital?.id || hospitalInfo?.id || '';
  const doctorsQuery = useDoctors({
    hospitalId,
    enabled: !!hospitalId && isHospitalDataAvailable
  });
  const { data: doctors = [], error, refetch, isFetching, isLoading: doctorsQueryLoading } = doctorsQuery;

  // Combined loading flag — same pattern as super-admin portal
  const showSkeleton = hospitalLoading || (doctorsQueryLoading && doctors.length === 0) || isRefreshing;

  // Mount-time safeguard: ensure initial fetch triggers reliably
  useEffect(() => {
    if (!!hospitalId && isHospitalDataAvailable && doctors.length === 0 && !doctorsQueryLoading) {
      refetch();
    }
  }, [hospitalId, isHospitalDataAvailable, doctors.length, doctorsQueryLoading, refetch]);
  
  
  const createDoctorMutation = useCreateDoctor();

  // Filter doctors based on search term
  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];
    
    if (!searchTerm) return doctors;
    
    return doctors.filter((doctor: DoctorData) => {
      const searchLower = searchTerm.toLowerCase();
      const doctorName = `${doctor.first_name} ${doctor.last_name}`.toLowerCase();
      const department = (doctor.department || '').toLowerCase();
      
      return doctorName.includes(searchLower) ||
        doctor.users.email.toLowerCase().includes(searchLower) ||
        doctor.specialization.toLowerCase().includes(searchLower) ||
        department.includes(searchLower) ||
        doctor.license_number.toLowerCase().includes(searchLower);
    });
  }, [doctors, searchTerm]);


  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleDeleteDoctor = (doctor: DoctorData) => {
    // Convert DoctorData to DoctorInfo format
    const doctorInfo: DoctorInfo = {
      id: doctor.id,
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      specialization: doctor.specialization,
      department: doctor.department,
      users: {
        email: doctor.users.email,
        is_active: doctor.users.is_active
      }
    };
    
    setDoctorToDelete(doctorInfo);
    setDeletionWorkflowOpen(true);
  };

  const handleViewDoctor = (doctor: DoctorData) => {
    setViewingDoctor(doctor);
    setDetailsModalOpen(true);
  };

  const handleEditDoctor = (doctor: DoctorData) => {
    setEditingDoctor(doctor);
    setEditModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setViewingDoctor(null);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingDoctor(null);
  };
  
  const handleCredentialsModalClose = () => {
    setShowCredentialsModal(false);
    setGeneratedCredentials(null);
  };
  
  const handleDoctorCreated = (credentials: GeneratedCredentials) => {
    // Show success modal with credentials
    setGeneratedCredentials(credentials);
    setShowCredentialsModal(true);
    setShowCreateModal(false);
  };

  const handleDeletionWorkflowComplete = () => {
    setDoctorToDelete(null);
    setDeletionWorkflowOpen(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000); // Add delay for better UX
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 hover:scale-110 hover:shadow-md transition-all duration-200 cursor-pointer">Active</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200 hover:scale-110 hover:shadow-md transition-all duration-200 cursor-pointer">Inactive</Badge>;
    }
  };

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
          title="Doctor Management"
          subtitle="Manage doctors in your hospital"
          actions={[
            {
              label: isRefreshing ? "Refreshing..." : "Refresh",
              variant: "outline",
              icon: RefreshCw,
              onClick: handleRefresh,
              disabled: isRefreshing,
              className: "hover:shadow-md hover:scale-105 transition-all duration-200 hover:border-blue-300 hover:text-blue-700"
            },
            {
              label: "Add Doctor",
              variant: "default",
              icon: Plus,
              onClick: handleOpenCreateModal,
              disabled: showSkeleton,
              className: "hover:shadow-lg hover:scale-105 transition-all duration-200"
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
      
      {/* Global Error Display */}
      <AnimatePresence>
        {(error || createDoctorMutation.error || hospitalError) && (
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
                    <p className="text-sm">
                      {error?.message || createDoctorMutation.error?.message || hospitalError?.message || 'An error occurred'}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      if (createDoctorMutation.error) createDoctorMutation.reset();
                    }}
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-red-600 hover:text-red-700 hover:scale-105 transition-all"
                  >
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success Message Display */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-green-200 bg-green-50 hover:border-green-300 hover:shadow-lg hover:shadow-green-100/50 transition-all duration-200 group">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-green-800">
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Doctor Deleted Successfully</p>
                    <p className="text-sm">{successMessage}</p>
                  </div>
                  <Button
                    onClick={() => setSuccessMessage(null)}
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-green-600 hover:text-green-700 hover:scale-105 transition-all"
                  >
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Search and Filters */}
      <motion.div variants={itemVariants}>
        <Card className="border border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/30 transition-all duration-300 group">
          <CardHeader className="group-hover:bg-blue-50/20 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                  <Input
                    placeholder="Search doctors by name, email, specialization, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 group-hover:border-blue-300 transition-colors focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>


      {/* Doctors Table */}
      <motion.div variants={itemVariants}>
        <Card className="border border-gray-200 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/40 hover:bg-gradient-to-br hover:from-purple-50/10 hover:to-white transition-all duration-300 group">
          <CardHeader className="group-hover:bg-purple-50/20 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 group-hover:scale-110 transition-all">
                <Stethoscope className="h-5 w-5 text-purple-600 group-hover:text-purple-700 transition-colors" />
              </div>
              <div>
                <CardTitle className="group-hover:text-purple-800 transition-colors">Hospital Doctors ({filteredDoctors.length})</CardTitle>
                <CardDescription className="group-hover:text-purple-700 transition-colors">List of all doctors in your hospital</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
          {showSkeleton ? (
              <DoctorTableSkeleton rows={5} />
            ) : filteredDoctors.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-purple-200 hover:scale-110 transition-all duration-300">
                  <Stethoscope className="h-8 w-8 text-purple-400" />
                </div>
                <p className="text-gray-500 mb-4">
                  {searchTerm ? `No doctors found matching "${searchTerm}"` : 'No doctors registered yet'}
                </p>
                {!searchTerm && (
                  <Button 
                    onClick={handleOpenCreateModal} 
                    className="bg-purple-600 hover:bg-purple-700 hover:scale-105 hover:shadow-lg transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Doctor
                  </Button>
                )}
              </motion.div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.map((doctor: DoctorData, index) => (
                    <motion.tr
                      key={doctor.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="border-b border-gray-200 hover:bg-purple-50/30 hover:border-purple-200 transition-all duration-200 group/row"
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover/row:bg-blue-200 group-hover/row:scale-110 transition-all">
                            <Stethoscope className="h-5 w-5 text-blue-600 group-hover/row:text-blue-700 transition-colors" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 group-hover/row:text-purple-800 transition-colors">
                              {doctor.first_name && doctor.last_name 
                                ? `${doctor.first_name} ${doctor.last_name}` 
                                : doctor.users.email.split('@')[0]
                              }
                            </p>
                            <p className="text-sm text-gray-500 group-hover/row:text-purple-600 transition-colors">{doctor.specialization}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm group-hover/row:text-purple-700 transition-colors">
                            <Mail className="h-3 w-3 mr-2 text-gray-400 group-hover/row:text-purple-500 group-hover/row:scale-110 transition-all" />
                            {doctor.users.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium group-hover/row:text-purple-800 transition-colors">{doctor.department || 'Not specified'}</p>
                        <p className="text-xs text-gray-500 group-hover/row:text-purple-600 transition-colors">{doctor.specialization}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-gray-500 group-hover/row:text-purple-600 transition-colors">{doctor.license_number}</p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(doctor.users.is_active)}
                          <p className="text-xs text-gray-500 group-hover/row:text-purple-600 transition-colors">Updated {new Date(doctor.updated_at).toLocaleDateString()}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="View doctor details"
                            onClick={() => handleViewDoctor(doctor)}
                            className="hover:bg-blue-50 hover:text-blue-700 hover:scale-110 transition-all duration-200"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="Edit doctor"
                            onClick={() => handleEditDoctor(doctor)}
                            className="hover:bg-yellow-50 hover:text-yellow-700 hover:scale-110 transition-all duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteDoctor(doctor)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:scale-110 hover:shadow-md transition-all duration-200"
                            title="Delete doctor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Doctor Create Modal */}
      <DoctorCreateModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        hospitalId={hospitalId}
        userId={user?.id || ''}
        onSuccess={handleDoctorCreated}
      />
      
      {/* Credentials Modal */}
      {showCredentialsModal && generatedCredentials && (
        <CredentialsModal
          isOpen={showCredentialsModal}
          onClose={handleCredentialsModalClose}
          credentials={generatedCredentials}
          userType="Doctor"
          title="Doctor Account Created Successfully"
          subtitle="The doctor account has been created. Save these credentials securely and share them with the doctor."
        />
      )}
      
      {/* Doctor Details Modal */}
      <DoctorDetailsModal
        isOpen={detailsModalOpen}
        onClose={handleCloseDetailsModal}
        doctor={viewingDoctor}
      />
      
      {/* Doctor Edit Modal */}
      <DoctorEditModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        doctor={editingDoctor}
        hospitalId={hospitalId}
      />
      
      {/* Doctor Deletion Workflow */}
      <DoctorDeletionWorkflow
        isOpen={deletionWorkflowOpen}
        onOpenChange={setDeletionWorkflowOpen}
        doctor={doctorToDelete}
        hospitalId={hospitalId}
        onComplete={handleDeletionWorkflowComplete}
      />
    </motion.div>
  );
}
