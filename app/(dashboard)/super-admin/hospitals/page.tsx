"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import AdvancedConfirmationDialog from '@/shared/components/ui/advanced-confirmation-dialog';
import CredentialsModal from '@/shared/components/credentials/CredentialsModal';
import HospitalCreateModal from '@/shared/components/modals/HospitalCreateModal';
import HospitalDetailsModal from '@/shared/components/modals/HospitalDetailsModal';
import HospitalEditModal from '@/shared/components/modals/HospitalEditModal';
import { HospitalTableSkeleton } from '@/shared/components/ui/table-skeleton';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { 
  useHospitals, 
  useDeleteHospital, 
  useHospitalDeletionPreview,
  type DeletionPreviewData 
} from '@/features/super-admin/hooks';
import { 
  Plus, 
  Search, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Edit,
  Eye,
  MoreHorizontal,
  RefreshCw,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { GeneratedCredentials } from '@/features/auth/types';
import { useAuth } from '@/features/auth/hooks/useAuth';

import { Hospital } from '@/features/super-admin/hooks/useHospitals';

export default function HospitalManagementPage() {
  const { user, initialized, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Selected hospital states
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [viewingHospital, setViewingHospital] = useState<Hospital | null>(null);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  
  // Deletion preview data
  const { data: deletionPreview, isLoading: isLoadingPreview } = useHospitalDeletionPreview(
    selectedHospital?.id || ''
  );
  
  // Credentials modal state
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredentials | null>(null);

  // Use React Query hooks for data fetching (gate on auth readiness)
  const isEnabled = initialized && !!user && user.user_type === 'super_admin';
  // Use 'always' to guarantee a fetch on every mount regardless of stale-time or cache state.
  // ProtectedRoute has already verified auth; we don't need the enabled guard here.
  const hospitalsQuery = useHospitals(undefined, { refetchOnMount: 'always', enabled: isEnabled });
  const { data: hospitals, error: hospitalsError, isLoading: hospitalsLoading, refetch: refetchHospitals } = hospitalsQuery;

  // Combined loading flag — drives the table skeleton on both initial load and manual refresh
  const isLoading = hospitalsLoading || isRefreshing;
  
  // Mount-time safeguard: ensure initial fetch triggers reliably
  useEffect(() => {
    if (isEnabled && !hospitals && !hospitalsLoading) {
      refetchHospitals();
    }
  }, [isEnabled, hospitals, hospitalsLoading, refetchHospitals]);

  const deleteHospitalMutation = useDeleteHospital({
    onSuccess: (data) => {
      setDeleteDialogOpen(false);
      setSelectedHospital(null);
    },
    onError: (error) => {
      // Error will be displayed in UI via the error state
    }
  });

  // Filter hospitals based on search term
  const filteredHospitals = React.useMemo(() => {
    if (!hospitals) return [];
    
    if (!searchTerm) return hospitals;
    
    return hospitals.filter(hospital =>
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (hospital.address && hospital.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [hospitals, searchTerm]);

  // Modal handlers
  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  const handleViewHospital = (hospital: Hospital) => {
    setViewingHospital(hospital);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setViewingHospital(null);
  };

  const handleEditHospital = (hospital: Hospital) => {
    setEditingHospital(hospital);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingHospital(null);
  };

  const handleDeleteHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteHospital = () => {
    if (!selectedHospital) return;
    deleteHospitalMutation.mutate(selectedHospital.id);
  };

  const handleHospitalCreated = (credentials: GeneratedCredentials) => {
    setGeneratedCredentials(credentials);
    setShowCredentialsModal(true);
    setShowCreateModal(false);
  };

  const handleCredentialsModalClose = () => {
    setShowCredentialsModal(false);
    setGeneratedCredentials(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchHospitals();
    setTimeout(() => setIsRefreshing(false), 1000); // Add delay for better UX
  };

  const getStatusBadge = (hospital: Hospital) => {
    if (hospital.is_approved && hospital.users.is_active) {
      return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 hover:scale-110 hover:shadow-md transition-all duration-200 cursor-pointer">Active</Badge>;
    } else if (!hospital.is_approved) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 hover:scale-110 hover:shadow-md transition-all duration-200 cursor-pointer">Pending</Badge>;
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
          title="Hospital Management"
          subtitle="Manage hospitals registered in the system"
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
              label: "Add Hospital",
              variant: "default",
              icon: Plus,
              onClick: handleOpenCreateModal,
              disabled: hospitalsLoading,
              className: "hover:shadow-lg hover:scale-105 transition-all duration-200"
            }
          ]}
        />
      </motion.div>

      {/* Global Error Display */}
      <AnimatePresence>
        {(hospitalsError || deleteHospitalMutation.error) && (
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
                    <p className="font-medium">Hospital Deletion Failed</p>
                    <p className="text-sm">
                      {hospitalsError?.message || deleteHospitalMutation.error?.message || 'An error occurred'}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      if (deleteHospitalMutation.error) {
                        deleteHospitalMutation.reset();
                      }
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
      
      {/* Search and Filters */}
      <motion.div variants={itemVariants}>
        <Card className="border border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/30 transition-all duration-300 group">
          <CardHeader className="group-hover:bg-blue-50/20 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:scale-110 transition-all" />
                  <Input
                    placeholder="Search hospitals by name or location..."
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


      {/* Hospitals Table */}
      <motion.div variants={itemVariants}>
        <Card className="border border-gray-200 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100/40 hover:bg-gradient-to-br hover:from-purple-50/10 hover:to-white transition-all duration-300 group">
          <CardHeader className="group-hover:bg-purple-50/20 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 group-hover:scale-110 transition-all">
                <Building2 className="h-5 w-5 text-purple-600 group-hover:text-purple-700 transition-colors" />
              </div>
              <div>
                <CardTitle className="group-hover:text-purple-800 transition-colors">Hospitals ({filteredHospitals.length})</CardTitle>
                <CardDescription className="group-hover:text-purple-700 transition-colors">List of all registered hospitals</CardDescription>
              </div>
            </div>
          </CardHeader>
        <CardContent>
          {isLoading ? (
            <HospitalTableSkeleton rows={5} />
          ) : filteredHospitals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-purple-200 hover:scale-110 transition-all duration-300">
                <Building2 className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-gray-500 mb-4">
                {searchTerm ? `No hospitals found matching "${searchTerm}"` : 'No hospitals registered yet'}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={handleOpenCreateModal} 
                  className="bg-purple-600 hover:bg-purple-700 hover:scale-105 hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Hospital
                </Button>
              )}
            </motion.div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHospitals.map((hospital, index) => (
                  <motion.tr
                    key={hospital.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="border-b border-gray-200 hover:bg-purple-50/30 hover:border-purple-200 transition-all duration-200 group/row"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover/row:bg-blue-200 group-hover/row:scale-110 transition-all">
                          <Building2 className="h-5 w-5 text-blue-600 group-hover/row:text-blue-700 transition-colors" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover/row:text-purple-800 transition-colors">{hospital.name}</p>
                          {hospital.location && (
                            <div className="flex items-center text-sm text-gray-500 group-hover/row:text-purple-600 transition-colors">
                              <MapPin className="h-3 w-3 mr-1 group-hover/row:scale-110 transition-transform" />
                              {hospital.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {(hospital.phone_number || hospital.phone) ? (
                          <div className="flex items-center text-sm group-hover/row:text-purple-700 transition-colors">
                            <Phone className="h-3 w-3 mr-2 text-gray-400 group-hover/row:text-purple-500 group-hover/row:scale-110 transition-all" />
                            {hospital.phone_number || hospital.phone}
                          </div>
                        ) : (
                          <div className="flex items-center text-sm text-gray-400 group-hover/row:text-purple-400 transition-colors">
                            <Phone className="h-3 w-3 mr-2 group-hover/row:scale-110 transition-transform" />
                            Not provided
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium group-hover/row:text-purple-800 transition-colors">{hospital.users.email}</p>
                      <p className="text-xs text-gray-500 group-hover/row:text-purple-600 transition-colors">Hospital Administrator</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600 group-hover/row:text-purple-700 transition-colors">
                        {new Date(hospital.created_at).toLocaleDateString()}
                      </p>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(hospital)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="View hospital details"
                          onClick={() => handleViewHospital(hospital)}
                          className="hover:bg-blue-50 hover:text-blue-700 hover:scale-110 transition-all duration-200"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Edit hospital"
                          onClick={() => handleEditHospital(hospital)}
                          className="hover:bg-yellow-50 hover:text-yellow-700 hover:scale-110 transition-all duration-200"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Delete hospital"
                          onClick={() => handleDeleteHospital(hospital)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:scale-110 hover:shadow-md transition-all duration-200"
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

      {/* Hospital Create Modal */}
      <HospitalCreateModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onSuccess={handleHospitalCreated}
      />

      {/* Hospital Details Modal */}
      <HospitalDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        hospital={viewingHospital}
      />

      {/* Hospital Edit Modal */}
      <HospitalEditModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        hospital={editingHospital}
      />

      {/* Advanced Delete Confirmation Dialog */}
      <AdvancedConfirmationDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Hospital Permanently"
        description={`You are about to permanently delete the hospital "${selectedHospital?.name || 'Unknown Hospital'}" and ALL associated data. This action is irreversible.`}
        warningMessage="This will cascade delete all associated doctors, patients, medical records, game sessions, schedules, and IoT device data. All user accounts will also be permanently removed from the authentication system."
        confirmationText={selectedHospital?.name || ''}
        confirmButtonText="Delete Hospital"
        cancelButtonText="Cancel"
        onConfirm={confirmDeleteHospital}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedHospital(null);
        }}
        confirmIcon={Trash2}
        isLoading={deleteHospitalMutation.isPending}
        loadingText="Deleting hospital and all associated data..."
        deletionData={deletionPreview ? {
          doctors: deletionPreview.doctors,
          patients: deletionPreview.patients,
          medicalNotes: deletionPreview.medicalNotes,
          mriScans: deletionPreview.mriScans,
          gameSessions: deletionPreview.gameSessions,
          schedules: deletionPreview.schedules,
        } : undefined}
      />

      {/* Credentials Modal */}
      {showCredentialsModal && generatedCredentials && (
        <CredentialsModal
          isOpen={showCredentialsModal}
          onClose={handleCredentialsModalClose}
          credentials={generatedCredentials}
          userType="Hospital Admin"
          title="Hospital Admin Created Successfully"
          subtitle="Hospital and admin account have been created. Save these credentials securely."
        />
      )}
    </motion.div>
  );
}
