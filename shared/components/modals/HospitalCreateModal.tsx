"use client";

import React, { useState } from 'react';
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
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { useCreateHospital, HospitalFormData } from '@/features/super-admin/hooks';
import { InvitationSuccessModal } from '@/shared/components/modals/InvitationSuccessModal';
import { 
  validateEmailDetailed,
  validatePhoneNumberDetailed,
  validatePersonName,
  validateOrganizationName,
  validateAddress,
  formatPhoneNumber,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeName
} from '@/shared/lib/validation-enhanced';

interface ValidationError {
  field: keyof HospitalFormData;
  message: string;
}

// Helper validation functions
const validateField = (field: keyof HospitalFormData, value: string): ValidationError | null => {
  switch (field) {
    case 'hospitalName': {
      const result = validateOrganizationName(value, 2, 100);
      return result.isValid ? null : { field, message: result.message };
    }
    case 'address': {
      const result = validateAddress(value, 10, 250);
      return result.isValid ? null : { field, message: result.message };
    }
    case 'phone': {
      const result = validatePhoneNumberDetailed(value);
      return result.isValid ? null : { field, message: result.message };
    }
    case 'adminFirstName':
    case 'adminLastName': {
      const result = validatePersonName(value, field === 'adminFirstName' ? 'First name' : 'Last name');
      return result.isValid ? null : { field, message: result.message };
    }
    case 'adminEmail': {
      const result = validateEmailDetailed(value);
      return result.isValid ? null : { field, message: result.message };
    }
    default:
      return null;
  }
};

const validateHospitalForm = (data: HospitalFormData): { isValid: boolean; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];
  (Object.keys(data) as Array<keyof HospitalFormData>).forEach(key => {
    const error = validateField(key, data[key]);
    if (error) errors.push(error);
  });
  return { isValid: errors.length === 0, errors };
};

const sanitizeHospitalFormData = (data: HospitalFormData): HospitalFormData => {
  return {
    hospitalName: (data.hospitalName || '').trim(),
    address: (data.address || '').trim(),
    phone: sanitizePhoneNumber(data.phone || ''),
    adminFirstName: sanitizeName(data.adminFirstName || ''),
    adminLastName: sanitizeName(data.adminLastName || ''),
    adminEmail: sanitizeEmail(data.adminEmail || ''),
  };
};

const isFormDataComplete = (data: HospitalFormData): boolean => {
  return Object.values(data).every(value => (value || '').trim().length > 0);
};

const hasFieldError = (errors: ValidationError[], field: keyof HospitalFormData): boolean => {
  return errors.some(error => error.field === field);
};

const getFieldError = (errors: ValidationError[], field: keyof HospitalFormData): string | undefined => {
  return errors.find(error => error.field === field)?.message;
};
import { 
  AlertCircle, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  UserPlus,
  Shield,
  Check,
  X
} from 'lucide-react';

interface HospitalCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function HospitalCreateModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: HospitalCreateModalProps) {
  const [formData, setFormData] = useState<HospitalFormData>({
    hospitalName: '',
    address: '',
    phone: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add submission lock
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdAdminEmail, setCreatedAdminEmail] = useState<string>('');
  const [fieldTouched, setFieldTouched] = useState<Record<keyof HospitalFormData, boolean>>({
    hospitalName: false,
    address: false,
    phone: false,
    adminFirstName: false,
    adminLastName: false,
    adminEmail: false,
  });

  const createHospitalMutation = useCreateHospital({
    onSuccess: (data) => {
      setIsSubmitting(false);
      
      // Show success modal with invitation details
      setCreatedAdminEmail(data.adminEmail || formData.adminEmail);
      setShowSuccessModal(true);
    },
    onError: (error: any) => {
      console.log('Hospital creation failed:', error);
      setIsSubmitting(false);
      // Check if it's an email already exists error
      if (error?.message && (error.message.includes('already registered') || error.message.includes('already exists'))) {
        // Add email validation error to show below email field
        setValidationErrors(prev => {
          const filtered = prev.filter(error => error.field !== 'adminEmail');
          return [...filtered, {
            field: 'adminEmail' as keyof HospitalFormData,
            message: error.message
          }];
        });
        setServerError(null); // Clear general server error
      } else {
        // For other errors, show in general error area
        setServerError(error?.message || 'Failed to create hospital account');
      }
    }
  });

  // Add cleanup effect to reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      resetForm();
      setIsSubmitting(false);
      createHospitalMutation.reset();
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof HospitalFormData, value: string) => {
    let processedValue = value;
    
    // Format phone number as user types
    if (field === 'phone' && !value.startsWith('+')) {
      // Only format if not starting with + (international)
      processedValue = formatPhoneNumber(value);
    }
    
    console.log(`Field ${field} changed to:`, processedValue);
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Mark field as touched
    setFieldTouched(prev => ({ ...prev, [field]: true }));
    
    // Clear server errors when user starts typing in email field
    if (field === 'adminEmail') {
      setServerError(null);
      console.log('Cleared server error for email field');
    }
    
    // Real-time validation for the current field
    const fieldError = validateField(field, processedValue);
    
    setValidationErrors(prev => {
      // Remove existing errors for this field (including server-side errors)
      const filtered = prev.filter(error => error.field !== field);
      // Add new error if validation failed
      return fieldError ? [...filtered, fieldError] : filtered;
    });
  };

  const handleFieldBlur = (field: keyof HospitalFormData) => {
    // Mark field as touched on blur
    setFieldTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field on blur
    const value = formData[field];
    const fieldError = validateField(field, value);
    
    setValidationErrors(prev => {
      const filtered = prev.filter(error => error.field !== field);
      return fieldError ? [...filtered, fieldError] : filtered;
    });
  };

  const resetForm = () => {
    console.log('Resetting form state');
    setFormData({
      hospitalName: '',
      address: '',
      phone: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
    });
    setValidationErrors([]);
    setServerError(null);
    setIsSubmitting(false);
    setFieldTouched({
      hospitalName: false,
      address: false,
      phone: false,
      adminFirstName: false,
      adminLastName: false,
      adminEmail: false,
    });
  };

  const handleSubmit = async () => {
    // Prevent duplicate submissions
    if (isSubmitting || createHospitalMutation.isPending) {
      console.log('Submission already in progress, ignoring');
      return;
    }

    console.log('Starting hospital submission with current form data:', formData);
    
    // Sanitize and validate form data - use fresh state
    const sanitizedData = sanitizeHospitalFormData(formData);
    console.log('Sanitized data to be submitted:', sanitizedData);
    const validation = validateHospitalForm(sanitizedData);
    
    if (!validation.isValid) {
      console.log('Validation failed:', validation.errors);
      setValidationErrors(validation.errors);
      return;
    }
    
    setValidationErrors([]);
    setServerError(null);
    setIsSubmitting(true);
    
    // Use React Query mutation with fresh data
    console.log('Submitting hospital creation with:', sanitizedData);
    createHospitalMutation.mutate(sanitizedData);
  };

  const handleCancel = () => {
    console.log('Canceling hospital creation');
    resetForm();
    setServerError(null);
    setIsSubmitting(false);
    createHospitalMutation.reset();
    onClose();
  };

  // Check if form is valid: all required fields filled and no validation errors
  const hasValidationErrorsPresent = validationErrors.length > 0;
  const isDataComplete = isFormDataComplete(formData);
  const isFormValid = isDataComplete && !hasValidationErrorsPresent && !isSubmitting;
  
  console.log('Form validation state:', {
    isDataComplete,
    hasValidationErrorsPresent,
    isSubmitting,
    isFormValid
  });
  
  // Get field validation state for UI feedback
  const getFieldValidationState = (field: keyof HospitalFormData) => {
    const isTouched = fieldTouched[field];
    const hasError = hasFieldError(validationErrors, field);
    const hasValue = (formData[field] || '').trim().length > 0;
    
    if (!isTouched && !hasValue) return 'default';
    if (hasError) return 'error';
    if (hasValue && !hasError) return 'success';
    return 'default';
  };
  
  // Get input field classes based on validation state
  const getInputFieldClasses = (field: keyof HospitalFormData, baseClasses: string = '') => {
    const state = getFieldValidationState(field);
    const base = baseClasses || 'h-11 border-2 transition-all duration-200';
    
    switch (state) {
      case 'error':
        return `${base} border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50`;
      case 'success':
        return `${base} border-green-500 focus:border-green-500 focus:ring-green-500 bg-green-50`;
      default:
        return `${base} border-gray-300 focus:border-blue-500 focus:ring-blue-500`;
    }
  };
  
  // Get validation icon for input field
  const getValidationIcon = (field: keyof HospitalFormData) => {
    const state = getFieldValidationState(field);
    const hasValue = (formData[field] || '').trim().length > 0;
    
    if (!hasValue) return null;
    
    switch (state) {
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
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

  return (
    <>
      <InvitationSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        invitations={[
          {
            email: createdAdminEmail,
            role: 'Hospital Admin'
          }
        ]}
      />
      
      <AnimatePresence>
        {isOpen && (
        <Dialog open={isOpen} onOpenChange={handleCancel}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 backdrop-blur-sm border-0 shadow-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader className="text-center pb-4">
                <DialogTitle className="flex items-center justify-center gap-4 text-2xl font-bold text-gray-900">
                  <motion.div 
                    className="w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30"
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Building2 className="h-7 w-7 text-white" />
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    Add New Hospital
                  </motion.span>
                </DialogTitle>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <DialogDescription className="text-gray-600 text-base mt-3 max-w-md mx-auto">
                    Create a new hospital and send an invitation email to the hospital admin
                  </DialogDescription>
                </motion.div>
              </DialogHeader>

              {/* General Error Display */}
              <AnimatePresence>
                {serverError && (
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
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      </motion.div>
                      <p className="text-sm font-medium">
                        {serverError}
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
                {/* Hospital Information Section */}
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
                      className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center shadow-sm"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-gray-900">Hospital Information</h3>
                  </motion.div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="hospitalName" className="text-sm font-medium text-gray-700">
                  Hospital Name *
                </Label>
                <div className="relative">
                  <Input
                    id="hospitalName"
                    value={formData.hospitalName}
                    onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                    onBlur={() => handleFieldBlur('hospitalName')}
                    placeholder="General Hospital"
                    className={getInputFieldClasses('hospitalName', 'h-11 pr-10')}
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getValidationIcon('hospitalName')}
                  </div>
                </div>
                {hasFieldError(validationErrors, 'hospitalName') && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1 animate-in slide-in-from-top-2">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError(validationErrors, 'hospitalName')}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                  Hospital Address *
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    onBlur={() => handleFieldBlur('address')}
                    placeholder="123 Medical Center Drive, City, State 12345"
                    className={getInputFieldClasses('address', 'h-11 pl-10 pr-10')}
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getValidationIcon('address')}
                  </div>
                </div>
                {hasFieldError(validationErrors, 'address') && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1 animate-in slide-in-from-top-2">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError(validationErrors, 'address')}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Hospital Phone Number *
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    onBlur={() => handleFieldBlur('phone')}
                    placeholder="+92-21-12345678"
                    className={getInputFieldClasses('phone', 'h-11 pl-10 pr-10')}
                    maxLength={20}
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getValidationIcon('phone')}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {hasFieldError(validationErrors, 'phone') ? (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1 animate-in slide-in-from-top-2">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError(validationErrors, 'phone')}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Format: +92-21-12345678 or +92 21 1234 5678</p>
                  )}
                </div>
              </div>
                  </div>
                </motion.div>

                {/* Hospital Admin Information Section */}
                <motion.div 
                  className="bg-white/80 backdrop-blur-sm p-7 rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 }}
                  whileHover={{ y: -2 }}
                >
                  <motion.div 
                    className="flex items-center gap-3 mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.9 }}
                  >
                    <motion.div 
                      className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center shadow-sm"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                    >
                      <User className="h-5 w-5 text-green-600" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-gray-900">Hospital Administrator</h3>
                  </motion.div>
            
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="adminFirstName" className="text-sm font-medium text-gray-700">
                  Admin First Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Input
                    id="adminFirstName"
                    value={formData.adminFirstName}
                    onChange={(e) => handleInputChange('adminFirstName', e.target.value)}
                    onBlur={() => handleFieldBlur('adminFirstName')}
                    placeholder="First Name"
                    className={getInputFieldClasses('adminFirstName', 'h-11 pl-10 pr-10')}
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getValidationIcon('adminFirstName')}
                  </div>
                </div>
                {hasFieldError(validationErrors, 'adminFirstName') && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1 animate-in slide-in-from-top-2">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError(validationErrors, 'adminFirstName')}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminLastName" className="text-sm font-medium text-gray-700">
                  Admin Last Name *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Input
                    id="adminLastName"
                    value={formData.adminLastName}
                    onChange={(e) => handleInputChange('adminLastName', e.target.value)}
                    onBlur={() => handleFieldBlur('adminLastName')}
                    placeholder="Last Name"
                    className={getInputFieldClasses('adminLastName', 'h-11 pl-10 pr-10')}
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getValidationIcon('adminLastName')}
                  </div>
                </div>
                {hasFieldError(validationErrors, 'adminLastName') && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1 animate-in slide-in-from-top-2">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError(validationErrors, 'adminLastName')}
                  </p>
                )}
              </div>
                  </div>
            
                  <div className="grid grid-cols-1 gap-6 mt-6">
              <div className="space-y-2">
                <Label htmlFor="adminEmail" className="text-sm font-medium text-gray-700">
                  Admin Email Address *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                    onBlur={() => handleFieldBlur('adminEmail')}
                    placeholder="admin@hospital.com"
                    className={getInputFieldClasses('adminEmail', 'h-11 pl-10 pr-10')}
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getValidationIcon('adminEmail')}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {hasFieldError(validationErrors, 'adminEmail') ? (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1 animate-in slide-in-from-top-2">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError(validationErrors, 'adminEmail')}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">This will be the admin's login email</p>
                  )}
                </div>
              </div>
                  </div>
                </motion.div>
                {/* Required Fields Notice */}
                <motion.div 
                  className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.0 }}
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      animate={{ rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-medium text-amber-800">Required Information</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Fields marked with * are required. A secure password will be automatically generated 
                        for the hospital admin and provided after account creation.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.1 }}
              >
                <DialogFooter className="gap-3 pt-8 border-t border-white/20">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                      disabled={createHospitalMutation.isPending || isSubmitting}
                      className="min-w-24 h-11 border-gray-300 text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      onClick={handleSubmit}
                      disabled={createHospitalMutation.isPending || isSubmitting || !isFormValid}
                      className="min-w-48 h-11 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    >
                      <div className="flex items-center justify-center gap-2 w-full">
                        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                          <AnimatePresence mode="wait">
                            {(createHospitalMutation.isPending || isSubmitting) ? (
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
                                <UserPlus className="h-4 w-4" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={(createHospitalMutation.isPending || isSubmitting) ? "loading-text" : "default-text"}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0"
                          >
                            {(createHospitalMutation.isPending || isSubmitting) ? "Creating Hospital..." : "Create Hospital & Admin"}
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
    </AnimatePresence>
    </>
  );
}

export default HospitalCreateModal;
