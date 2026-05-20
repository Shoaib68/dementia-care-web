"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { Hospital } from '@/features/super-admin/hooks/useHospitals';
import { useHospitalStatistics } from '@/features/super-admin/hooks/useHospitalStatistics';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Calendar,
  Activity,
  Users,
  FileText,
  X 
} from 'lucide-react';

interface HospitalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: Hospital | null;
  isLoading?: boolean;
}

export function HospitalDetailsModal({ 
  isOpen, 
  onClose, 
  hospital, 
  isLoading = false 
}: HospitalDetailsModalProps) {
  // Fetch hospital statistics
  const { 
    data: statistics, 
    isLoading: statisticsLoading, 
    error: statisticsError 
  } = useHospitalStatistics(hospital?.id);

  const getStatusBadge = (hospital: Hospital) => {
    if (hospital.is_approved && hospital.users.is_active) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
    } else if (!hospital.is_approved) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Approval</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Inactive</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!hospital) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              Hospital Not Found
            </DialogTitle>
            <DialogDescription>
              The requested hospital information could not be loaded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50/90 via-blue-50/80 to-indigo-50/90 backdrop-blur-sm border-0 shadow-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader className="pb-6">
                <DialogTitle className="flex items-center gap-4">
                  <motion.div 
                    className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30"
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Building2 className="h-7 w-7 text-white" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900">{hospital.name}</h2>
                    <p className="text-sm text-gray-600 font-medium mt-1">Hospital Information & Statistics</p>
                  </motion.div>
                </DialogTitle>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <DialogDescription className="text-gray-600 text-base mt-2">
                    Complete hospital profile and administrative overview with real-time statistics
                  </DialogDescription>
                </motion.div>
              </DialogHeader>

              <motion.div 
                className="space-y-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {/* Status and Quick Info */}
                <motion.div 
                  className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 }}
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.7 }}
                  >
                    {getStatusBadge(hospital)}
                  </motion.div>
                  <div className="text-sm text-gray-600 font-medium">
                    Created: {formatDate(hospital.created_at)}
                  </div>
                </motion.div>

                {/* Hospital Information */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="pt-6">
                      <motion.div 
                        className="flex items-center gap-3 mb-6"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.8 }}
                      >
                        <motion.div
                          className="p-2 bg-blue-100 rounded-xl"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </motion.div>
                        <h3 className="font-semibold text-lg text-gray-900">Hospital Information</h3>
                      </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Hospital Name</label>
                    <p className="text-sm font-medium">{hospital.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{hospital.address || hospital.location || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p className="text-sm">{hospital.phone_number || hospital.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
                </motion.div>

                {/* Hospital Administrator Information */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.9 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="pt-6">
                      <motion.div 
                        className="flex items-center gap-3 mb-6"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 1.0 }}
                      >
                        <motion.div
                          className="p-2 bg-green-100 rounded-xl"
                          whileHover={{ scale: 1.1, rotate: -5 }}
                        >
                          <User className="h-5 w-5 text-green-600" />
                        </motion.div>
                        <h3 className="font-semibold text-lg text-gray-900">Hospital Administrator</h3>
                      </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Admin Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-sm">{hospital.users.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Status</label>
                    <p className="text-sm">
                      {hospital.users.is_active ? (
                        <span className="text-green-600">Active & Accessible</span>
                      ) : (
                        <span className="text-red-600">Inactive</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Date</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-sm">{formatDate(hospital.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
                </motion.div>

                {/* Hospital Statistics */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.1 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="pt-6">
                      <motion.div 
                        className="flex items-center gap-3 mb-6"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 1.2 }}
                      >
                        <motion.div
                          className="p-2 bg-purple-100 rounded-xl"
                          whileHover={{ scale: 1.1, rotate: 10 }}
                        >
                          <Activity className="h-5 w-5 text-purple-600" />
                        </motion.div>
                        <h3 className="font-semibold text-lg text-gray-900">Hospital Statistics</h3>
                      </motion.div>
              
              {statisticsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <LoadingSpinner size="lg" />
                  <span className="text-sm font-medium text-gray-600">Loading statistics...</span>
                </div>
              ) : statisticsError ? (
                <div className="text-center py-8">
                  <div className="text-red-600 mb-2">Failed to load statistics</div>
                  <div className="text-sm text-gray-500">{statisticsError.message}</div>
                </div>
              ) : (
                <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div 
                          className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 1.3 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                          >
                            <Users className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                          </motion.div>
                          <div className="text-3xl font-bold text-gray-900 mb-1">
                            {statistics?.totalDoctors || 0}
                          </div>
                          <div className="text-sm font-medium text-blue-600">Doctors</div>
                        </motion.div>
                        <motion.div 
                          className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 1.4 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                        >
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: -5 }}
                          >
                            <FileText className="h-10 w-10 text-green-600 mx-auto mb-3" />
                          </motion.div>
                          <div className="text-3xl font-bold text-gray-900 mb-1">
                            {statistics?.totalPatients || 0}
                          </div>
                          <div className="text-sm font-medium text-green-600">Patients</div>
                        </motion.div>
                      </div>
                  
                  {(statistics?.totalDoctors === 0 && statistics?.totalPatients === 0) && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Getting Started:</strong> This hospital hasn't added any doctors or patients yet. 
                        Statistics will appear once hospital administrators begin using the system.
                      </p>
                    </div>
                  )}
                </>
              )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* System Information */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.3 }}
                  whileHover={{ y: -2 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="pt-6">
                      <motion.div 
                        className="flex items-center gap-3 mb-6"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 1.4 }}
                      >
                        <motion.div
                          className="p-2 bg-slate-100 rounded-xl"
                          whileHover={{ scale: 1.1, rotate: -10 }}
                        >
                          <Calendar className="h-5 w-5 text-slate-600" />
                        </motion.div>
                        <h3 className="font-semibold text-lg text-gray-900">System Information</h3>
                      </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Hospital ID</label>
                    <p className="text-sm font-mono text-gray-700">{hospital.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created Date</label>
                    <p className="text-sm">{formatDate(hospital.created_at)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(hospital)}
                    </div>
                  </div>
                  {hospital.users.updated_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Edited</label>
                      <p className="text-sm">{formatDate(hospital.users.updated_at)}</p>
                    </div>
                  )}
                </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.6 }}
              >
                <DialogFooter className="pt-8 border-t border-white/20">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      variant="outline" 
                      onClick={onClose}
                      className="min-w-24 h-11 border-gray-300 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200"
                    >
                      Close
                    </Button>
                  </motion.div>
                </DialogFooter>
              </motion.div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

export default HospitalDetailsModal;
