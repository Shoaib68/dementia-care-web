"use client";

import React, { useState } from 'react';
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
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { useCreateDoctor } from '@/features/hospital/hooks/useDoctorManagement';
import { useEmailValidation, getEmailValidationStatus } from '@/shared/hooks/useEmailValidation';
import { InvitationSuccessModal } from '@/shared/components/modals/InvitationSuccessModal';
import { 
  AlertCircle, 
  UserPlus, 
  Mail, 
  Phone, 
  User, 
  Stethoscope, 
  Building2, 
  Shield,
  X,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface DoctorCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalId: string;
  userId: string;
  onSuccess?: () => void;
}

interface CreateDoctorForm {
  email: string;
  firstName: string;
  lastName: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  phone: string;
}

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  specialization?: string;
  department?: string;
  licenseNumber?: string;
  phone?: string;
}

export function DoctorCreateModal({ 
  isOpen, 
  onClose, 
  hospitalId, 
  userId,
  onSuccess 
}: DoctorCreateModalProps) {
  const [formData, setFormData] = useState<CreateDoctorForm>({
    email: '',
    firstName: '',
    lastName: '',
    specialization: '',
    department: '',
    licenseNumber: '',
    phone: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<keyof CreateDoctorForm>>(new Set());
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const createDoctorMutation = useCreateDoctor();
  const emailValidation = useEmailValidation('doctor');

  const validateField = (field: keyof CreateDoctorForm, value: string): string | undefined => {
    switch (field) {
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        break;
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

  const handleInputChange = (field: keyof CreateDoctorForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Handle email validation specially
    if (field === 'email') {
      emailValidation.validateEmail(value);
    }

    // Validate the field in real-time if it has been touched
    if (touched.has(field)) {
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

  const handleInputBlur = (field: keyof CreateDoctorForm) => {
    setTouched(prev => new Set([...prev, field]));
    const value = formData[field];
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
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate all required fields
    const fieldsToValidate: (keyof CreateDoctorForm)[] = [
      'email', 'firstName', 'lastName', 'specialization', 'licenseNumber', 'phone'
    ];

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(new Set(fieldsToValidate));
    return isValid;
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      specialization: '',
      department: '',
      licenseNumber: '',
      phone: '',
    });
    setErrors({});
    setTouched(new Set());
    emailValidation.clearValidation();
  };

  const handleSubmit = async () => {
    // Validate all fields before submitting
    if (!validateForm()) {
      return;
    }

    // Check if email validation is complete and valid
    if (!emailValidation.isEmailReady()) {
      setErrors(prev => ({
        ...prev,
        email: 'Please wait for email validation to complete or use a different email'
      }));
      return;
    }

    createDoctorMutation.mutate({
      request: {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        specialization: formData.specialization,
        department: formData.department,
        licenseNumber: formData.licenseNumber,
        phone: formData.phone
      },
      hospitalId,
      createdBy: userId
    }, {
      onSuccess: (data) => {
        // Show success modal with invitation details
        setShowSuccessModal(true);
      },
      onError: (error: any) => {
        // Extract error information safely
        const errorMessage = error?.message || error?.toString() || 'An error occurred';
        const errorCode = error?.code || '';
        
        // Log for debugging in development
        if (process.env.NODE_ENV === 'development') {
          console.log('[Doctor Create] Error caught:', { message: errorMessage, code: errorCode, status: error?.status });
        }
        
        // Handle duplicate license number with specific error code or message
        if (errorCode === 'DUPLICATE_LICENSE_NUMBER' || errorMessage.toLowerCase().includes('license number')) {
          setErrors(prev => ({
            ...prev,
            licenseNumber: errorMessage
          }));
          setTouched(prev => new Set([...prev, 'licenseNumber']));
          // Clear the mutation error so it doesn't show in the general error banner
          setTimeout(() => createDoctorMutation.reset(), 100);
        } else if (errorMessage.toLowerCase().includes('email')) {
          setErrors(prev => ({
            ...prev,
            email: errorMessage
          }));
          setTouched(prev => new Set([...prev, 'email']));
          // Clear the mutation error so it doesn't show in the general error banner
          setTimeout(() => createDoctorMutation.reset(), 100);
        }
        // For other errors, let them show in the general error banner
      }
    });
  };

  const handleCancel = () => {
    resetForm();
    createDoctorMutation.reset();
    onClose();
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    resetForm();
    if (onSuccess) {
      onSuccess();
    } else {
      onClose();
    }
  };

  // Check if form is valid: all required fields filled and no validation errors
  const hasValidationErrors = Object.values(errors).some(error => error !== undefined && error !== '');
  const isFormValid = formData.email.trim() && 
                     formData.firstName.trim() && 
                     formData.lastName.trim() && 
                     formData.specialization.trim() && 
                     formData.licenseNumber.trim() && 
                     formData.phone.trim() &&
                     !hasValidationErrors &&
                     emailValidation.isEmailReady();

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-50">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="flex items-center justify-center gap-3 text-2xl font-bold text-gray-900">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <span>Add New Doctor</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-base mt-2">
            Create a new doctor account and send an invitation email to set up their account
          </DialogDescription>
        </DialogHeader>

        {/* Error Display */}
        {createDoctorMutation.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                {createDoctorMutation.error.message || 'Failed to create doctor account'}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Personal Information Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  onBlur={() => handleInputBlur('firstName')}
                  placeholder="First Name"
                  className={`h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
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
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  onBlur={() => handleInputBlur('lastName')}
                  placeholder="Last Name"
                  className={`h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
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

          {/* Contact Information Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Mail className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onBlur={() => handleInputBlur('email')}
                    placeholder="doctor@gmail.com"
                    className={`h-11 pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500 ${
                      errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    required
                  />
                </div>
                {/* Email validation feedback */}
                {(() => {
                  const status = getEmailValidationStatus(emailValidation);
                  const hasError = errors.email || (emailValidation.result && !emailValidation.result.available);
                  
                  if (hasError) {
                    return (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email || emailValidation.result?.message}
                      </p>
                    );
                  }
                  
                  if (status) {
                    const iconMap = {
                      loading: <Loader2 className="h-3 w-3 animate-spin" />,
                      success: <CheckCircle className="h-3 w-3" />,
                      error: <AlertCircle className="h-3 w-3" />
                    };
                    
                    const colorMap = {
                      blue: 'text-blue-600',
                      green: 'text-green-600',
                      red: 'text-red-600'
                    };
                    
                    return (
                      <p className={`text-sm mt-1 flex items-center gap-1 ${colorMap[status.color as keyof typeof colorMap]}`}>
                        {iconMap[status.icon]}
                        {status.text}
                      </p>
                    );
                  }
                  
                  return null;
                })()}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    onBlur={() => handleInputBlur('phone')}
                    placeholder="042-35123456"
                    className={`h-11 pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500 ${
                      errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    required
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="specialization" className="text-sm font-medium text-gray-700">
                  Medical Specialization *
                </Label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => handleInputChange('specialization', e.target.value)}
                    onBlur={() => handleInputBlur('specialization')}
                    placeholder="Neurologist"
                    className={`h-11 pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500 ${
                      errors.specialization ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    required
                  />
                </div>
                {errors.specialization && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.specialization}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                  Hospital Department
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Neurology"
                    className="h-11 pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="licenseNumber" className="text-sm font-medium text-gray-700">
                  Medical License Number *
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    onBlur={() => handleInputBlur('licenseNumber')}
                    placeholder="MD12345"
                    className={`h-11 pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500 ${
                      errors.licenseNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    required
                  />
                </div>
                {errors.licenseNumber && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.licenseNumber}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Required Fields Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Required Information</p>
                <p className="text-sm text-amber-700 mt-1">
                  Fields marked with * are required. Phone number must be 10-15 digits. A secure password will be automatically generated 
                  and provided after account creation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-6 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={createDoctorMutation.isPending}
            className="min-w-24 h-11 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createDoctorMutation.isPending || !isFormValid}
            className="min-w-32 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-95 hover:scale-[1.02] hover:shadow-xl"
          >
            {createDoctorMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Doctor Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Success Modal */}
      <InvitationSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        invitations={[
          {
            email: formData.email,
            role: 'Doctor'
          }
        ]}
        title="Doctor Invitation Sent!"
        message="An invitation email has been sent to the doctor's email address."
      />
    </Dialog>
  );
}

export default DoctorCreateModal;

