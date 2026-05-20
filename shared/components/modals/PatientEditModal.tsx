"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDeactivatePatient, useActivatePatient } from '@/features/doctor/hooks/usePatients';
import { ConfirmationDialog } from '@/shared/components/ui/confirmation-dialog';
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
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/shared/components/ui/select';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { SuccessModal } from '@/shared/components/modals/SuccessModal';
import { Patient } from '@/features/doctor/hooks/usePatients';
import { useFetchLastMedicalNote } from '@/features/doctor/hooks/useMedicalNote';
import { getPatientFullName, getTodayDateString } from '@/shared/lib/utils';
import { statusIndicators } from '@/shared/styles/effects';
import { 
  User, 
  Calendar,
  Heart,
  Users,
  MessageSquare,
  Save,
  X,
  AlertCircle,
  UserCheck,
  UserX
} from 'lucide-react';

// Ultra-simple validation schema - almost everything is optional
const patientEditSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string().optional(),
  dementiaStage: z.enum(['mild', 'moderate', 'severe']),
  medicalHistory: z.object({
    conditions: z.array(z.string()).optional(),
    medications: z.string().optional(),
    history: z.string().optional(),
    familyHistory: z.string().optional(),
    primaryConcerns: z.string().optional()
  }).optional(),
  caregiverFirstName: z.string().optional(),
  caregiverLastName: z.string().optional(),
  caregiverPhone: z.string().optional(),
  caregiverAddress: z.string().optional(),
  // Medical note fields
  medicalNoteContent: z.string().optional().nullable(),
  medicalNoteRecommendations: z.string().optional().nullable(),
  medicalNoteFollowUpDate: z.string().optional().nullable()
});

type PatientEditFormData = z.infer<typeof patientEditSchema>;

interface PatientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSave?: (data: PatientEditFormData) => Promise<void>;
  isLoading?: boolean;
}

export function PatientEditModal({ 
  isOpen, 
  onClose, 
  patient,
  onSave,
  isLoading = false 
}: PatientEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);

  const deactivatePatient = useDeactivatePatient();
  const activatePatient = useActivatePatient();

  const handleToggleStatus = () => {
    setIsStatusConfirmOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!patient) return;
    const isActive = patient.users?.is_active ?? true;
    const action = isActive ? 'deactivate' : 'activate';
    setIsStatusConfirmOpen(false);
    setIsTogglingStatus(true);
    try {
      if (isActive) {
        await deactivatePatient.mutateAsync(patient.id);
      } else {
        await activatePatient.mutateAsync(patient.id);
      }
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || `Failed to ${action} patient. Please try again.`);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Fetch last medical note for the patient
  const { data: lastMedicalNote, isLoading: isFetchingNote, refetch: refetchMedicalNote } = useFetchLastMedicalNote(patient?.id);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset,
    clearErrors,
    getValues
  } = useForm<PatientEditFormData>({
    resolver: zodResolver(patientEditSchema),
    mode: 'onSubmit', // Only validate on submit
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      dementiaStage: 'mild',
      medicalHistory: {
        conditions: [],
        medications: '',
        history: '',
        familyHistory: '',
        primaryConcerns: ''
      },
      caregiverFirstName: '',
      caregiverLastName: '',
      caregiverPhone: '',
      caregiverAddress: '',
      medicalNoteContent: '',
      medicalNoteRecommendations: '',
      medicalNoteFollowUpDate: ''
    }
  });


  const watchedDementiaStage = watch('dementiaStage');
  const watchedMedicalNoteContent = watch('medicalNoteContent');
  const medicalNoteContentLength = watchedMedicalNoteContent?.length || 0;

  const todayDateString = getTodayDateString();

  // Reset form when patient changes or modal opens
  useEffect(() => {
    if (patient && isOpen) {
      // Handle both array and object formats for patient_caregiver_assignments
      let assignments = patient.patient_caregiver_assignments;
      if (assignments && !Array.isArray(assignments)) {
        assignments = [assignments];
      }
      
      const primaryCaregiver = assignments?.[0]?.caregivers;
      
      const formData = {
        firstName: patient.first_name || '',
        lastName: patient.last_name || '',
        dateOfBirth: patient.date_of_birth || '',
        dementiaStage: patient.dementia_stage || 'mild',
        medicalHistory: {
          conditions: patient.medical_history?.conditions || [],
          medications: patient.medical_history?.medications || '',
          history: patient.medical_history?.history || '',
          familyHistory: patient.medical_history?.familyHistory || '',
          primaryConcerns: patient.medical_history?.primaryConcerns || ''
        },
        caregiverFirstName: primaryCaregiver?.first_name || '',
        caregiverLastName: primaryCaregiver?.last_name || '',
        caregiverPhone: primaryCaregiver?.phone_number || '',
        caregiverAddress: primaryCaregiver?.address || '',
        medicalNoteContent: lastMedicalNote?.note_content || '',
        medicalNoteRecommendations: lastMedicalNote?.recommendations || '',
        medicalNoteFollowUpDate: lastMedicalNote?.follow_up_date || ''
      };
      
      reset(formData);
      clearErrors();
      setSubmitError(null);
      
    }
  }, [patient, isOpen, lastMedicalNote, reset, clearErrors]);

  // Separate effect to ensure medical note data is displayed when it's fetched
  useEffect(() => {
    if (lastMedicalNote && isOpen) {
      setValue('medicalNoteContent', lastMedicalNote.note_content || '');
      setValue('medicalNoteRecommendations', lastMedicalNote.recommendations || '');
      setValue('medicalNoteFollowUpDate', lastMedicalNote.follow_up_date || '');
    }
  }, [lastMedicalNote, isOpen, setValue]);

  // Debug effect to log state changes
  useEffect(() => {
    // Medical note data is being fetched and will be displayed
  }, [lastMedicalNote, isFetchingNote, isOpen]);

  // Trigger refetch when modal opens or patient changes
  useEffect(() => {
    if (isOpen && patient?.id) {
      refetchMedicalNote();
    }
  }, [isOpen, patient?.id, refetchMedicalNote]);

  const handleFormSubmit = async (data: PatientEditFormData) => {
    if (!patient || !onSave) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSave(data);
      
      // Show success modal after successful save
      setIsSubmitting(false);
      setShowSuccessModal(true);
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to update patient. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onClose();
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };



  const getDementiaStageBadge = (stage: 'mild' | 'moderate' | 'severe') => {
    const classMap = {
      mild: statusIndicators.mildBadge,
      moderate: statusIndicators.moderateBadge,
      severe: statusIndicators.severeBadge,
    };
    return (
      <Badge className={classMap[stage] ?? 'bg-gray-100 text-gray-800 border-gray-200'}>
        {stage.charAt(0).toUpperCase() + stage.slice(1)}
      </Badge>
    );
  };

  if (!patient) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              Patient Not Found
            </DialogTitle>
            <DialogDescription>
              The requested patient information could not be loaded.
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
    <>
      <AnimatePresence>
        {isOpen && (
          <Dialog open={isOpen} onOpenChange={handleCancel}>
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
                    className="w-14 h-14 bg-gradient-to-br from-green-500 via-teal-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/30"
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <User className="h-7 w-7 text-white" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <h2 className="text-2xl font-bold text-gray-900">Edit Patient Details</h2>
                    <p className="text-sm text-gray-600 font-medium mt-1">
                      {getPatientFullName(patient)} • ID: {patient.patient_code}
                    </p>
                  </motion.div>
                </DialogTitle>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <DialogDescription className="text-gray-600 text-base mt-2">
                    Update patient information, medical details, and caregiver contacts
                  </DialogDescription>
                </motion.div>
              </DialogHeader>

              <form onSubmit={handleSubmit(handleFormSubmit)}>
                <motion.div 
                  className="space-y-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  {/* Error Display */}
                  <AnimatePresence>
                    {submitError && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-red-50 border border-red-200 p-4 rounded-xl"
                      >
                        <div className="flex items-center space-x-2 text-red-800">
                          <AlertCircle className="h-5 w-5" />
                          <div>
                            <p className="font-medium">Update Failed</p>
                            <p className="text-sm">{submitError}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Personal Information */}
                  <motion.div
                    className="bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg rounded-xl p-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900">Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          {...register('firstName')}
                          placeholder="Enter first name"
                          disabled={isSubmitting}
                          className={errors.firstName ? 'border-red-500' : ''}
                        />
                        {errors.firstName && (
                          <p className="text-sm text-red-600">{errors.firstName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          {...register('lastName')}
                          placeholder="Enter last name"
                          disabled={isSubmitting}
                          className={errors.lastName ? 'border-red-500' : ''}
                        />
                        {errors.lastName && (
                          <p className="text-sm text-red-600">{errors.lastName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          {...register('dateOfBirth')}
                          disabled={isSubmitting}
                          className={errors.dateOfBirth ? 'border-red-500' : ''}
                        />
                        {errors.dateOfBirth && (
                          <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dementiaStage">Dementia Stage</Label>
                        <div className="flex items-center gap-3">
                          <Select 
                            value={watchedDementiaStage} 
                            onValueChange={(value) => setValue('dementiaStage', value as 'mild' | 'moderate' | 'severe', { shouldValidate: true })}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger className={errors.dementiaStage ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select dementia stage" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mild">Mild</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="severe">Severe</SelectItem>
                            </SelectContent>
                          </Select>
                          {watchedDementiaStage && getDementiaStageBadge(watchedDementiaStage)}
                        </div>
                        {errors.dementiaStage && (
                          <p className="text-sm text-red-600">{errors.dementiaStage.message}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Medical Information */}
                  <motion.div
                    className="bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg rounded-xl p-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-green-100 rounded-xl">
                        <Heart className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900">Medical History Details</h3>
                    </div>

                    <div className="space-y-6">
                      {/* Current Conditions */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-700">Common Symptoms/Conditions</Label>
                        <p className="text-xs text-gray-500">Select applicable conditions:</p>
                        
                        {/* Predefined conditions buttons */}
                        <div className="flex flex-wrap gap-2">
                          {['Memory Loss', 'Confusion', 'Difficulty with Language', 'Problem-solving Issues', 'Mood Changes', 'Behavioral Changes', 'Sleep Disturbances', 'Motor Function Issues'].map((condition) => {
                            const isSelected = watch('medicalHistory')?.conditions?.includes(condition);
                            return (
                              <button
                                key={condition}
                                type="button"
                                onClick={() => {
                                  const currentConditions = watch('medicalHistory')?.conditions || [];
                                  if (isSelected) {
                                    setValue('medicalHistory.conditions', currentConditions.filter(c => c !== condition), { shouldValidate: true });
                                  } else {
                                    setValue('medicalHistory.conditions', [...currentConditions, condition], { shouldValidate: true });
                                  }
                                }}
                                disabled={isSubmitting}
                                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white border-2 border-emerald-600'
                                    : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-emerald-300'
                                }`}
                              >
                                {condition}
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected conditions display */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-700">Selected Conditions</Label>
                          <div className="flex flex-wrap gap-2 min-h-10 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            {watch('medicalHistory')?.conditions?.map((condition, index) => (
                              <Badge 
                                key={index}
                                className="bg-amber-100 text-amber-800 border-amber-200 cursor-pointer hover:bg-amber-200 transition-colors"
                                onClick={() => {
                                  const updated = watch('medicalHistory')?.conditions?.filter((_, i) => i !== index) || [];
                                  setValue('medicalHistory.conditions', updated, { shouldValidate: true });
                                }}
                              >
                                {condition} ✕
                              </Badge>
                            ))}
                            {!watch('medicalHistory')?.conditions?.length && (
                              <p className="text-sm text-gray-400 italic">No conditions selected</p>
                            )}
                          </div>
                        </div>

                        {/* Custom condition input */}
                        <Input
                          id="addCondition"
                          placeholder="Or type a custom condition and press Enter to add..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              const currentConditions = watch('medicalHistory')?.conditions || [];
                              if (!currentConditions.includes(e.currentTarget.value.trim())) {
                                setValue('medicalHistory.conditions', [...currentConditions, e.currentTarget.value.trim()], { shouldValidate: true });
                              }
                              e.currentTarget.value = '';
                            }
                          }}
                          disabled={isSubmitting}
                          className="text-sm"
                        />
                      </div>

                      {/* Medications */}
                      <div className="space-y-2">
                        <Label htmlFor="medications">Medications</Label>
                        <Input
                          id="medications"
                          {...register('medicalHistory.medications')}
                          placeholder="e.g., none, aspirin, blood pressure medication..."
                          disabled={isSubmitting}
                        />
                      </div>

                      {/* Medical History */}
                      <div className="space-y-2">
                        <Label htmlFor="history">Medical History</Label>
                        <Textarea
                          id="history"
                          {...register('medicalHistory.history')}
                          placeholder="e.g., Health issues, past surgeries, medical events..."
                          rows={3}
                          disabled={isSubmitting}
                          className="resize-none"
                        />
                      </div>

                      {/* Family History */}
                      <div className="space-y-2">
                        <Label htmlFor="familyHistory">Family History</Label>
                        <Textarea
                          id="familyHistory"
                          {...register('medicalHistory.familyHistory')}
                          placeholder="e.g., heart issue and sugar, genetic conditions..."
                          rows={3}
                          disabled={isSubmitting}
                          className="resize-none"
                        />
                      </div>

                      {/* Primary Concerns */}
                      <div className="space-y-2">
                        <Label htmlFor="primaryConcerns">Primary Concerns</Label>
                        <Textarea
                          id="primaryConcerns"
                          {...register('medicalHistory.primaryConcerns')}
                          placeholder="e.g., forget things, memory issues, behavioral concerns..."
                          rows={3}
                          disabled={isSubmitting}
                          className="resize-none"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Caregiver Information */}
                  <motion.div
                    className="bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg rounded-xl p-6"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-purple-100 rounded-xl">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900">Caregiver Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="caregiverFirstName">Caregiver First Name</Label>
                        <Input
                          id="caregiverFirstName"
                          {...register('caregiverFirstName')}
                          placeholder="Enter caregiver first name"
                          disabled={isSubmitting}
                          className={errors.caregiverFirstName ? 'border-red-500' : ''}
                        />
                        {errors.caregiverFirstName && (
                          <p className="text-sm text-red-600">{errors.caregiverFirstName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="caregiverLastName">Caregiver Last Name</Label>
                        <Input
                          id="caregiverLastName"
                          {...register('caregiverLastName')}
                          placeholder="Enter caregiver last name"
                          disabled={isSubmitting}
                          className={errors.caregiverLastName ? 'border-red-500' : ''}
                        />
                        {errors.caregiverLastName && (
                          <p className="text-sm text-red-600">{errors.caregiverLastName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="caregiverPhone">Caregiver Phone</Label>
                        <Input
                          id="caregiverPhone"
                          type="tel"
                          {...register('caregiverPhone')}
                          placeholder="Enter phone number"
                          disabled={isSubmitting}
                          className={errors.caregiverPhone ? 'border-red-500' : ''}
                        />
                        {errors.caregiverPhone && (
                          <p className="text-sm text-red-600">{errors.caregiverPhone.message}</p>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="caregiverAddress">Caregiver Address</Label>
                        <Textarea
                          id="caregiverAddress"
                          {...register('caregiverAddress')}
                          placeholder="Enter complete address"
                          rows={2}
                          disabled={isSubmitting}
                          className={`resize-none ${errors.caregiverAddress ? 'border-red-500' : ''}`}
                        />
                        {errors.caregiverAddress && (
                          <p className="text-sm text-red-600">{errors.caregiverAddress.message}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Medical Notes Section */}
                {isFetchingNote ? (
                  <motion.div
                    className="bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg rounded-xl p-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.85 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-purple-100 rounded-xl">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900">Medical Notes</h3>
                    </div>
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner size="md" />
                    </div>
                  </motion.div>
                ) : lastMedicalNote ? (
                  <motion.div
                    className="bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg rounded-xl p-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.85 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-purple-100 rounded-xl">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900">Medical Notes</h3>
                    </div>

                    {/* Error Display */}


                    <div className="space-y-6">
                      {/* Clinical Note */}
                      <div className="space-y-2">
                        <Label htmlFor="medicalNoteContent" className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">Clinical Note</span>
                          <span className="text-xs text-gray-500 ml-auto">{medicalNoteContentLength} / 2000</span>
                        </Label>
                        <Textarea
                          id="medicalNoteContent"
                          {...register('medicalNoteContent')}
                          placeholder="Clinical observations and medical information..."
                          disabled={isSubmitting}
                          rows={4}
                          className="resize-none"
                        />
                      </div>

                      {/* Recommendations */}
                      <div className="space-y-2">
                        <Label htmlFor="medicalNoteRecommendations" className="font-semibold text-gray-900">
                          Recommendations
                        </Label>
                        <Textarea
                          id="medicalNoteRecommendations"
                          {...register('medicalNoteRecommendations')}
                          placeholder="Treatment recommendations and follow-up actions..."
                          disabled={isSubmitting}
                          rows={3}
                          className="resize-none"
                        />
                      </div>

                      {/* Follow-up Date */}
                      <div className="space-y-2">
                        <Label htmlFor="medicalNoteFollowUpDate" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold text-gray-900">Follow-up Date</span>
                        </Label>
                        <Input
                          id="medicalNoteFollowUpDate"
                          type="date"
                          {...register('medicalNoteFollowUpDate')}
                          disabled={isSubmitting}
                          min={todayDateString}
                        />
                      </div>


                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    className="bg-gradient-to-br from-purple-50/80 to-indigo-50/80 border border-purple-200/50 shadow-lg rounded-xl p-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.85 }}
                  >
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-3 bg-purple-100 rounded-full">
                        <MessageSquare className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">No Medical Notes Yet</h3>
                        <p className="text-sm text-gray-600 mt-2">
                          This patient doesn't have any medical notes yet. Create one using the "Add Note" action button to get started.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.9 }}
                >
                  <DialogFooter className="pt-8 border-t border-white/20 gap-3 flex-wrap">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={handleCancel}
                        disabled={isSubmitting || isTogglingStatus}
                        className="min-w-24 h-11 border-gray-300 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200"
                      >
                        Cancel
                      </Button>
                    </motion.div>

                    {/* Activate / Deactivate toggle */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="mr-auto"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleToggleStatus}
                        disabled={isSubmitting || isTogglingStatus}
                        className={
                          (patient?.users?.is_active ?? true)
                            ? 'min-w-36 h-11 border-red-300 text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-400 hover:shadow-md transition-all duration-200'
                            : 'min-w-36 h-11 border-green-300 text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-400 hover:shadow-md transition-all duration-200'
                        }
                      >
                        {isTogglingStatus ? (
                          <>
                            <LoadingSpinner size="sm" />
                            {(patient?.users?.is_active ?? true) ? 'Deactivating...' : 'Activating...'}
                          </>
                        ) : (patient?.users?.is_active ?? true) ? (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            Deactivate Patient
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Activate Patient
                          </>
                        )}
                      </Button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="submit"
                        disabled={isSubmitting || isTogglingStatus}
                        className="min-w-32 h-11 text-white shadow-lg hover:shadow-xl transition-all duration-200 bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </DialogFooter>
                </motion.div>
              </form>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>

    {/* Success Modal */}
    <SuccessModal
      isOpen={showSuccessModal}
      onClose={handleSuccessModalClose}
      title="Patient Updated!"
      message={`${patient?.first_name} ${patient?.last_name}'s information has been updated successfully.`}
    />

    {/* Activate / Deactivate Confirmation Dialog */}
    <ConfirmationDialog
      isOpen={isStatusConfirmOpen}
      onOpenChange={setIsStatusConfirmOpen}
      title={(patient?.users?.is_active ?? true) ? 'Deactivate Patient' : 'Activate Patient'}
      description={
        (patient?.users?.is_active ?? true)
          ? `Are you sure you want to deactivate ${patient?.first_name} ${patient?.last_name}? Their caregiver will also be deactivated.`
          : `Are you sure you want to activate ${patient?.first_name} ${patient?.last_name}? Their caregiver will also be activated.`
      }
      confirmText={(patient?.users?.is_active ?? true) ? 'Deactivate' : 'Activate'}
      confirmVariant={(patient?.users?.is_active ?? true) ? 'destructive' : 'default'}
      onConfirm={handleConfirmToggleStatus}
      isLoading={isTogglingStatus}
      loadingText={(patient?.users?.is_active ?? true) ? 'Deactivating...' : 'Activating...'}
    />
    </>
  );
}

export default PatientEditModal;