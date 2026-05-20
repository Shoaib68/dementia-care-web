"use client";

import React, { useState, useEffect } from 'react';
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
import { DoctorData, useUpdateDoctor } from '@/features/hospital/hooks/useDoctorManagement';
import { AlertCircle, Edit, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DoctorEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorData | null;
  hospitalId: string;
}

interface EditFormData {
  firstName: string;
  lastName: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  phone: string;
  isActive: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  specialization?: string;
  department?: string;
  licenseNumber?: string;
  phone?: string;
}

export function DoctorEditModal({ 
  isOpen, 
  onClose, 
  doctor, 
  hospitalId 
}: DoctorEditModalProps) {
  const [formData, setFormData] = useState<EditFormData>({
    firstName: '',
    lastName: '',
    specialization: '',
    department: '',
    licenseNumber: '',
    phone: '',
    isActive: true
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<keyof EditFormData>>(new Set());
  
  const updateDoctorMutation = useUpdateDoctor();

  // Pre-populate form data when doctor changes
  useEffect(() => {
    if (doctor) {
      setFormData({
        firstName: doctor.first_name || '',
        lastName: doctor.last_name || '',
        specialization: doctor.specialization || '',
        department: doctor.department || '',
        licenseNumber: doctor.license_number || '',
        phone: doctor.phone_number || '',
        isActive: doctor.users.is_active
      });
    }
  }, [doctor]);

  const getFullName = (doctor: DoctorData) => {
    if (doctor.first_name && doctor.last_name) {
      return `${doctor.first_name} ${doctor.last_name}`;
    }
    return doctor.users.email.split('@')[0];
  };

  const validateField = (field: keyof EditFormData, value: string): string | undefined => {
    switch (field) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2) return 'First name must be at least 2 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'First name can only contain letters, spaces, hyphens, and apostrophes';
        break;
      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        if (value.trim().length < 2) return 'Last name must be at least 2 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(value)) return 'Last name can only contain letters, spaces, hyphens, and apostrophes';
        break;
      case 'specialization':
        if (!value.trim()) return 'Specialization is required';
        if (value.trim().length < 3) return 'Specialization must be at least 3 characters';
        break;
      case 'licenseNumber':
        if (!value.trim()) return 'License number is required';
        if (value.trim().length < 4) return 'License number must be at least 4 characters';
        if (!/^[A-Za-z0-9\-_]+$/.test(value)) return 'License number can only contain letters, numbers, hyphens, and underscores';
        break;
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        // Remove all non-digit characters for validation
        const phoneDigits = value.replace(/\D/g, '');
        if (phoneDigits.length < 10) return 'Phone number must be at least 10 digits';
        if (phoneDigits.length > 15) return 'Phone number cannot exceed 15 digits';
        break;
    }
    return undefined;
  };

  const handleInputChange = (field: keyof EditFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Validate string fields in real-time if they have been touched
    if (typeof value === 'string' && touched.has(field)) {
      const error = validateField(field, value);
      setErrors(prev => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field]; // Remove the error key when field is valid
        }
        return newErrors;
      });
    }
  };

  const handleInputBlur = (field: keyof EditFormData) => {
    setTouched(prev => new Set([...prev, field]));
    const value = formData[field];
    if (typeof value === 'string') {
      const error = validateField(field, value);
      setErrors(prev => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field]; // Remove the error key when field is valid
        }
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate all required fields
    const fieldsToValidate: (keyof EditFormData)[] = [
      'firstName', 'lastName', 'specialization', 'licenseNumber', 'phone'
    ];

    fieldsToValidate.forEach(field => {
      const value = formData[field];
      if (typeof value === 'string') {
        const error = validateField(field, value);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    setTouched(new Set(fieldsToValidate));
    return isValid;
  };

  const handleSubmit = async () => {
    if (!doctor) return;

    // Validate all fields before submitting
    if (!validateForm()) {
      return;
    }

    // Create the updates object, only including changed fields
    const updates: any = {};
    
    if (formData.firstName !== (doctor.first_name || '')) {
      updates.firstName = formData.firstName;
    }
    if (formData.lastName !== (doctor.last_name || '')) {
      updates.lastName = formData.lastName;
    }
    if (formData.specialization !== doctor.specialization) {
      updates.specialization = formData.specialization;
    }
    if (formData.department !== (doctor.department || '')) {
      updates.department = formData.department;
    }
    if (formData.licenseNumber !== doctor.license_number) {
      updates.licenseNumber = formData.licenseNumber;
    }
    if (formData.phone !== (doctor.phone_number || '')) {
      updates.phone = formData.phone;
    }
    if (formData.isActive !== doctor.users.is_active) {
      updates.isActive = formData.isActive;
    }

    // Only proceed if there are changes
    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    updateDoctorMutation.mutate({
      doctorId: doctor.id,
      hospitalId,
      updates
    }, {
      onSuccess: () => {
        onClose();
      },
      onError: (error) => {
        console.error('Error updating doctor:', error);
      }
    });
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (doctor) {
      setFormData({
        firstName: doctor.first_name || '',
        lastName: doctor.last_name || '',
        specialization: doctor.specialization || '',
        department: doctor.department || '',
        licenseNumber: doctor.license_number || '',
        phone: doctor.phone_number || '',
        isActive: doctor.users.is_active
      });
    }
    setErrors({});
    setTouched(new Set());
    updateDoctorMutation.reset();
    onClose();
  };

  if (!doctor) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              Doctor Not Found
            </DialogTitle>
            <DialogDescription>
              The requested doctor information could not be loaded for editing.
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
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Doctor Information
          </DialogTitle>
          <DialogDescription>
            Update {getFullName(doctor)}'s profile information
          </DialogDescription>
        </DialogHeader>

        {/* Error Display */}
        {updateDoctorMutation.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">
                {updateDoctorMutation.error.message || 'Failed to update doctor information'}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  onBlur={() => handleInputBlur('firstName')}
                  placeholder="John"
                  className={errors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                  required
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  onBlur={() => handleInputBlur('lastName')}
                  placeholder="Smith"
                  className={errors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                  required
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Contact Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={doctor.users.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Email address cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onBlur={() => handleInputBlur('phone')}
                  placeholder="+1 (555) 123-4567"
                  className={errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                  required
                />
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization *</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => handleInputChange('specialization', e.target.value)}
                  onBlur={() => handleInputBlur('specialization')}
                  placeholder="Neurologist"
                  className={errors.specialization ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                  required
                />
                {errors.specialization && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.specialization}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="Neurology"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">Medical License Number *</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                onBlur={() => handleInputBlur('licenseNumber')}
                placeholder="MD12345"
                className={errors.licenseNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                required
              />
              {errors.licenseNumber && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.licenseNumber}
                </p>
              )}
            </div>
          </div>

          {/* Account Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Account Status</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">Account Access</p>
                <p className="text-xs text-gray-500">
                  {formData.isActive ? 'Doctor can log in and access the system' : 'Doctor cannot access the system'}
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

        <DialogFooter className="gap-3 pt-6 border-t border-gray-200">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={updateDoctorMutation.isPending}
              className="min-w-24 h-11 border-gray-300 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200"
            >
              Cancel
            </Button>
          </motion.div>
          <motion.div
            whileHover={updateDoctorMutation.isPending ? {} : { scale: 1.02 }}
            whileTap={updateDoctorMutation.isPending ? {} : { scale: 0.98 }}
            animate={updateDoctorMutation.isPending ? { scale: 1 } : { scale: 1 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <Button 
              onClick={handleSubmit}
              disabled={updateDoctorMutation.isPending}
              className="min-w-32 h-11 bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-700 hover:via-amber-700 hover:to-yellow-700 text-white shadow-xl hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
            >
              <div className="flex items-center justify-center gap-2 w-full">
                <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {updateDoctorMutation.isPending ? (
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
                    key={updateDoctorMutation.isPending ? "saving-text" : "save-text"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0"
                  >
                    {updateDoctorMutation.isPending ? "Saving..." : "Save Changes"}
                  </motion.span>
                </AnimatePresence>
              </div>
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DoctorEditModal;
