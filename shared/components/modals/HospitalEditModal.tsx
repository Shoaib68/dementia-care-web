"use client";

import React, { useState, useEffect } from 'react';
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
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { Hospital, useUpdateHospital, HospitalFormData } from '@/features/super-admin/hooks/useHospitals';
import { useUpdateHospitalStatus } from '@/features/super-admin/hooks/useHospitalStatus';
import CascadeConfirmationDialog from '@/shared/components/ui/cascade-confirmation-dialog';
import { 
  validateOrganizationName,
  validateAddress,
  validatePhoneNumberDetailed,
  sanitizePhoneNumber
} from '@/shared/lib/validation-enhanced';
import { 
  AlertCircle, 
  Edit, 
  X, 
  Building2, 
  Phone, 
  MapPin 
} from 'lucide-react';

interface ValidationError {
  field: string;
  message: string;
}

// Helper validation functions
const sanitizeHospitalFormData = (data: HospitalFormData): HospitalFormData => {
  return {
    hospitalName: data.hospitalName.trim(),
    address: data.address.trim(),
    phone: sanitizePhoneNumber(data.phone),
    adminFirstName: data.adminFirstName.trim(),
    adminLastName: data.adminLastName.trim(),
    adminEmail: data.adminEmail.trim().toLowerCase(),
  };
};

const validateHospitalForm = (data: HospitalFormData): { isValid: boolean; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];
  
  const hospitalNameResult = validateOrganizationName(data.hospitalName, 2, 100);
  if (!hospitalNameResult.isValid) {
    errors.push({ field: 'hospitalName', message: hospitalNameResult.message });
  }
  
  const addressResult = validateAddress(data.address, 10, 250);
  if (!addressResult.isValid) {
    errors.push({ field: 'address', message: addressResult.message });
  }
  
  const phoneResult = validatePhoneNumberDetailed(data.phone);
  if (!phoneResult.isValid) {
    errors.push({ field: 'phone', message: phoneResult.message });
  }
  
  return { isValid: errors.length === 0, errors };
};

const hasFieldError = (errors: ValidationError[], field: string): boolean => {
  return errors.some(error => error.field === field);
};

const getFieldError = (errors: ValidationError[], field: string): string | undefined => {
  return errors.find(error => error.field === field)?.message;
};

interface HospitalEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospital: Hospital | null;
}

interface EditFormData {
  hospitalName: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export function HospitalEditModal({ 
  isOpen, 
  onClose, 
  hospital
}: HospitalEditModalProps) {
  const [formData, setFormData] = useState<EditFormData>({
    hospitalName: '',
    address: '',
    phone: '',
    isActive: true
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showCascadeDialog, setShowCascadeDialog] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<boolean | null>(null);
  
  const updateHospitalMutation = useUpdateHospital({
    onSuccess: () => {
      onClose();
    },
    onError: (error) => {
      console.error('Error updating hospital:', error);
    }
  });
  
  // Hook for cascading hospital status updates
  const updateHospitalStatusMutation = useUpdateHospitalStatus();

  // Pre-populate form data when hospital changes
  useEffect(() => {
    if (hospital) {
      setFormData({
        hospitalName: hospital.name || '',
        address: hospital.address || hospital.location || '',
        phone: hospital.phone_number || hospital.phone || '',
        isActive: hospital.users.is_active
      });
    }
  }, [hospital]);

  const handleInputChange = (field: keyof EditFormData, value: string | boolean) => {
    // Handle status changes with cascade confirmation
    if (field === 'isActive' && typeof value === 'boolean' && hospital) {
      const currentStatus = hospital.users.is_active;
      
      // If status is actually changing, show cascade dialog
      if (value !== currentStatus) {
        setPendingStatusChange(value);
        setShowCascadeDialog(true);
        return; // Don't update form data yet
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific validation errors as user types
    if (typeof value === 'string' && validationErrors.length > 0) {
      setValidationErrors(prev => prev.filter(error => error.field !== field));
    }
  };

  const handleSubmit = async () => {
    if (!hospital) return;

    // Only validate string fields that changed for hospital form structure
    const hospitalFormData: HospitalFormData = {
      hospitalName: formData.hospitalName,
      address: formData.address,
      phone: formData.phone,
      adminFirstName: 'Existing', // Not editable in edit mode
      adminLastName: 'Admin', // Not editable in edit mode
      adminEmail: 'existing@admin.com', // Not editable in edit mode
    };

    const sanitizedData = sanitizeHospitalFormData(hospitalFormData);
    
    // For edit, we only validate fields that can be changed
    const validation = validateHospitalForm(sanitizedData);
    
    if (!validation.isValid) {
      // Filter out admin validation errors since they're not editable
      const filteredErrors = validation.errors.filter(error => 
        error.field !== 'adminFirstName' && 
        error.field !== 'adminLastName' && 
        error.field !== 'adminEmail'
      );
      setValidationErrors(filteredErrors);
      if (filteredErrors.length > 0) return;
    }
    
    setValidationErrors([]);

    // Create the updates object, only including changed fields
    const updates: any = {};
    
    if (formData.hospitalName !== hospital.name) {
      updates.hospitalName = formData.hospitalName;
    }
    if (formData.address !== (hospital.address || hospital.location || '')) {
      updates.address = formData.address;
    }
    if (formData.phone !== (hospital.phone_number || hospital.phone || '')) {
      updates.phone = formData.phone;
    }
    if (formData.isActive !== hospital.users.is_active) {
      updates.isActive = formData.isActive;
    }

    // Only proceed if there are changes
    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    // If there's a status change, it should have been handled by the cascade dialog
    // This means we only have non-status updates here
    updateHospitalMutation.mutate({
      id: hospital.id,
      data: updates
    });
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (hospital) {
      setFormData({
        hospitalName: hospital.name || '',
        address: hospital.address || hospital.location || '',
        phone: hospital.phone_number || hospital.phone || '',
        isActive: hospital.users.is_active
      });
    }
    setValidationErrors([]);
    updateHospitalMutation.reset();
    updateHospitalStatusMutation.reset();
    setShowCascadeDialog(false);
    setPendingStatusChange(null);
    onClose();
  };
  
  // Handle cascade confirmation
  const handleCascadeConfirm = async () => {
    if (!hospital || pendingStatusChange === null) return;
    
    try {
      await updateHospitalStatusMutation.mutateAsync({
        hospitalId: hospital.id,
        isActive: pendingStatusChange
      });
      
      // Update form data to reflect the change
      setFormData(prev => ({ ...prev, isActive: pendingStatusChange }));
      
      // Close dialogs and clean up
      setShowCascadeDialog(false);
      setPendingStatusChange(null);
      
      // Close the edit modal after successful update
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to update hospital status:', errorMessage);
      // Keep the cascade dialog open to show error
    }
  };
  
  // Handle cascade dialog close
  const handleCascadeDialogClose = () => {
    setShowCascadeDialog(false);
    setPendingStatusChange(null);
  };

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
              The requested hospital information could not be loaded for editing.
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
        <Dialog key="hospital-edit-dialog" open={isOpen} onOpenChange={handleCancel}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50/90 via-orange-50/80 to-yellow-50/90 backdrop-blur-sm border-0 shadow-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader className="pb-6">
                <DialogTitle className="flex items-center gap-4">
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30"
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Edit className="h-6 w-6 text-white" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900">Edit Hospital Information</h2>
                    <p className="text-sm text-gray-600 font-medium mt-1">Update Hospital Details & Settings</p>
                  </motion.div>
                </DialogTitle>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <DialogDescription className="text-gray-600 text-base mt-2">
                    Update {hospital.name}'s profile and administrative information with secure validation
                  </DialogDescription>
                </motion.div>
              </DialogHeader>

              {/* Error Display */}
              <AnimatePresence>
                {updateHospitalMutation.error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl shadow-sm"
                  >
                    <div className="flex items-center gap-3 text-red-800">
                      <motion.div
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <AlertCircle className="h-5 w-5" />
                      </motion.div>
                      <p className="text-sm font-medium">
                        {updateHospitalMutation.error.message || 'Failed to update hospital information'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div 
                className="space-y-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {/* Hospital Information */}
                <motion.div 
                  className="bg-white/80 backdrop-blur-sm p-7 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  whileHover={{ y: -2 }}
                >
                  <motion.div 
                    className="flex items-center gap-3 mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 }}
                  >
                    <motion.div
                      className="p-2 bg-orange-100 rounded-xl"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Building2 className="h-5 w-5 text-orange-600" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-gray-900">Hospital Information</h3>
                  </motion.div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hospitalName">Hospital Name *</Label>
                <Input
                  id="hospitalName"
                  value={formData.hospitalName}
                  onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                  placeholder="General Hospital"
                  className={
                    hasFieldError(validationErrors, 'hospitalName') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }
                  required
                />
                {hasFieldError(validationErrors, 'hospitalName') && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError(validationErrors, 'hospitalName')}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Hospital Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Medical Center Drive, City, State 12345"
                    className={`pl-10 ${
                      hasFieldError(validationErrors, 'address') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    required
                  />
                </div>
                {hasFieldError(validationErrors, 'address') && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError(validationErrors, 'address')}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Hospital Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className={`pl-10 ${
                      hasFieldError(validationErrors, 'phone') ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    required
                  />
                </div>
                {hasFieldError(validationErrors, 'phone') && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError(validationErrors, 'phone')}
                  </p>
                )}
              </div>
            </div>
                </motion.div>

          {/* Hospital Status Controls */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Hospital Status</h3>
            
            <div className="space-y-4">
              {/* Admin Account Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">Admin Account Access</p>
                  <p className="text-xs text-gray-500">
                    {formData.isActive ? 'Admin can log in and manage hospital' : 'Admin cannot access the system'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {formData.isActive ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 border-red-200">Inactive</Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleInputChange('isActive', !formData.isActive)}
                    type="button"
                  >
                    {formData.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* System Information (Read-only) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">Hospital ID</Label>
                <Input
                  value={hospital.id}
                  disabled
                  className="bg-gray-50 text-sm font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-500">Registration Date</Label>
                <Input
                  value={new Date(hospital.created_at).toLocaleDateString()}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.0 }}
              >
                <DialogFooter className="gap-3 pt-8 border-t border-white/20">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                      disabled={updateHospitalMutation.isPending}
                      className="min-w-24 h-11 border-gray-300 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={updateHospitalMutation.isPending ? {} : { scale: 1.02 }}
                    whileTap={updateHospitalMutation.isPending ? {} : { scale: 0.98 }}
                    animate={updateHospitalMutation.isPending ? { scale: 1 } : { scale: 1 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <Button 
                      onClick={handleSubmit}
                      disabled={updateHospitalMutation.isPending}
                      className="min-w-32 h-11 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-700 hover:via-amber-700 hover:to-yellow-700 text-white shadow-xl hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <div className="flex items-center justify-center gap-2 w-full">
                        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                          <AnimatePresence mode="wait">
                            {updateHospitalMutation.isPending ? (
                              <motion.div
                                key="loading"
                                initial={{ opacity: 0, rotate: -90 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={{ opacity: 0, rotate: 90 }}
                                transition={{ duration: 0.2 }}
                                className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                              />
                            ) : (
                              <motion.div
                                key="icon"
                                initial={{ opacity: 0, rotate: -90 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={{ opacity: 0, rotate: 90 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Edit className="h-4 w-4" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={updateHospitalMutation.isPending ? "saving-text" : "save-text"}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0"
                          >
                            {updateHospitalMutation.isPending ? "Saving..." : "Save Changes"}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </Button>
                  </motion.div>
                </DialogFooter>
              </motion.div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Cascade Confirmation Dialog */}
      <CascadeConfirmationDialog
        key="cascade-confirmation-dialog"
        isOpen={showCascadeDialog}
        onClose={handleCascadeDialogClose}
        onConfirm={handleCascadeConfirm}
        isLoading={updateHospitalStatusMutation.isPending}
        
        title={pendingStatusChange ? "Activate Hospital" : "Deactivate Hospital"}
        description={pendingStatusChange 
          ? `You are about to activate ${hospital?.name}. This action will restore access for the hospital administrator and all associated doctors.`
          : `You are about to deactivate ${hospital?.name}. This action will restrict access for the hospital administrator and all associated doctors.`
        }
        hospitalName={hospital?.name || ''}
        hospitalId={hospital?.id || ''}
        action={pendingStatusChange ? 'activate' : 'deactivate'}
        
        confirmButtonText={pendingStatusChange ? 'Activate Hospital' : 'Deactivate Hospital'}
      />
    </AnimatePresence>
  );
}

export default HospitalEditModal;
