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
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { useHospitalStatistics } from '@/features/super-admin/hooks/useHospitalStatistics';
import { 
  AlertTriangle, 
  Users, 
  Hospital,
  CheckCircle,
  XCircle,
  ArrowDown,
  Activity
} from 'lucide-react';

export interface CascadeConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  
  // Configuration
  title: string;
  description: string;
  hospitalName: string;
  hospitalId: string;
  action: 'activate' | 'deactivate';
  
  // UI customization
  confirmButtonText?: string;
  confirmButtonVariant?: 'default' | 'destructive';
}

export function CascadeConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  description,
  hospitalName,
  hospitalId,
  action,
  confirmButtonText,
  confirmButtonVariant = action === 'deactivate' ? 'destructive' : 'default'
}: CascadeConfirmationDialogProps) {
  // Fetch hospital statistics using the same approach as HospitalDetailsModal
  const { 
    data: statistics, 
    isLoading: statisticsLoading, 
    error: statisticsError 
  } = useHospitalStatistics(hospitalId, {
    enabled: isOpen && !!hospitalId // Only fetch when dialog is open
  });
  
  const totalDoctors = statistics?.totalDoctors || 0;
  const affectedDoctors = totalDoctors;
  const isDeactivating = action === 'deactivate';
  const isDataLoading = isLoading || statisticsLoading;

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.3,
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-lg bg-gradient-to-br from-slate-50/95 via-white/95 to-slate-100/95 backdrop-blur-sm border-0 shadow-2xl">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <DialogHeader className="pb-4">
                <motion.div variants={itemVariants}>
                  <DialogTitle className="flex items-center gap-4">
                    <motion.div 
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                        isDeactivating 
                          ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-red-500/30' 
                          : 'bg-gradient-to-br from-green-500 via-green-600 to-green-700 shadow-green-500/30'
                      }`}
                      initial={{ rotate: -10, scale: 0.8 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      whileHover={{ scale: 1.05, rotate: 5 }}
                    >
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                    >
                      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                      <p className="text-sm text-gray-600 font-medium mt-1">
                        {isDeactivating ? 'Cascading Deactivation' : 'Cascading Activation'}
                      </p>
                    </motion.div>
                  </DialogTitle>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <DialogDescription className="text-gray-700 text-base leading-relaxed pt-2">
                    {description}
                  </DialogDescription>
                </motion.div>
              </DialogHeader>

              {/* Hospital Information */}
              <motion.div 
                variants={itemVariants}
                className="space-y-6"
              >
                {/* Hospital Overview */}
                <motion.div 
                  className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-md border border-white/50"
                  whileHover={{ y: -2, shadow: '0 8px 32px rgba(0,0,0,0.12)' }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      className="p-2 bg-blue-100 rounded-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Hospital className="h-5 w-5 text-blue-600" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-gray-900">Hospital Information</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Hospital Name:</span>
                      <span className="font-medium text-gray-900">{hospitalName}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Doctors:</span>
                      {statisticsLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                          <span className="text-sm text-gray-500">Loading...</span>
                        </div>
                      ) : statisticsError ? (
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Error loading
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-medium">
                          <Users className="h-3 w-3 mr-1" />
                          {totalDoctors}
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Impact Warning */}
                {(statisticsLoading || (affectedDoctors > 0)) && (
                  <motion.div 
                    variants={itemVariants}
                    className={`p-4 rounded-xl border-l-4 ${
                      isDeactivating
                        ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-400'
                        : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <motion.div
                        animate={{ rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Activity className={`h-5 w-5 ${
                          isDeactivating ? 'text-red-600' : 'text-green-600'
                        }`} />
                      </motion.div>
                      <h4 className={`font-semibold ${
                        isDeactivating ? 'text-red-800' : 'text-green-800'
                      }`}>
                        Cascading Effect
                      </h4>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowDown className={`h-4 w-4 ${
                        isDeactivating ? 'text-red-600' : 'text-green-600'
                      }`} />
                      <p className={`text-sm font-medium ${
                        isDeactivating ? 'text-red-800' : 'text-green-800'
                      }`}>
                        {statisticsLoading ? (
                          'Loading doctor information...'
                        ) : statisticsError ? (
                          'Unable to load doctor information'
                        ) : (
                          isDeactivating 
                            ? `All ${affectedDoctors} doctor${affectedDoctors !== 1 ? 's' : ''} will lose access to the system`
                            : `All ${affectedDoctors} doctor${affectedDoctors !== 1 ? 's' : ''} will regain access to the system`
                        )}
                      </p>
                    </div>
                    
                    <p className={`text-xs ${
                      isDeactivating ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {statisticsLoading ? (
                        'Please wait while we load the doctor information...'
                      ) : statisticsError ? (
                        'There was an issue loading doctor information, but the action will still affect all doctors.'
                      ) : (
                        isDeactivating
                          ? 'All doctors will be restricted from login until the hospital is reactivated.'
                          : 'All doctors will be able to login and manage their patients immediately.'
                      )}
                    </p>
                  </motion.div>
                )}
                
                {!statisticsLoading && !statisticsError && affectedDoctors === 0 && (
                  <motion.div 
                    variants={itemVariants}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <p className="text-sm font-medium text-blue-800">
                        No doctors will be affected by this change.
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <DialogFooter className="gap-3 pt-6 border-t border-gray-200/50">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      variant="outline" 
                      onClick={onClose}
                      disabled={isDataLoading}
                      className="min-w-24 h-11 border-gray-300 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      variant={confirmButtonVariant}
                      onClick={onConfirm}
                      disabled={isDataLoading}
                      className={`min-w-32 h-11 shadow-lg hover:shadow-xl transition-all duration-300 ${
                        confirmButtonVariant === 'destructive' 
                          ? 'bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900' 
                          : 'bg-gradient-to-r from-green-600 via-green-700 to-green-800 hover:from-green-700 hover:via-green-800 hover:to-green-900'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Processing...
                        </>
                      ) : statisticsLoading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Loading data...
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          {confirmButtonText || `${isDeactivating ? 'Deactivate' : 'Activate'} Hospital`}
                        </>
                      )}
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

export default CascadeConfirmationDialog;