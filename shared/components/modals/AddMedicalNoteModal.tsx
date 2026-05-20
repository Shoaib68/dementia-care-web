"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Textarea } from '@/shared/components/ui/textarea';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { SuccessModal } from '@/shared/components/modals/SuccessModal';
import { useAddMedicalNote } from '@/features/doctor/hooks/useAddMedicalNote';
import { Patient } from '@/features/doctor/hooks/usePatients';
import { getPatientFullName, getTodayDateString } from '@/shared/lib/utils';
import { 
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Send,
  X,
  Calendar
} from 'lucide-react';

// Validation schema for medical note
const medicalNoteSchema = z.object({
  noteContent: z.string()
    .min(1, 'Note content is required')
    .min(5, 'Note must be at least 5 characters')
    .max(2000, 'Note cannot exceed 2000 characters'),
  recommendations: z.string()
    .max(1000, 'Recommendations cannot exceed 1000 characters')
    .optional()
    .nullable(),
  followUpDate: z.string()
    .optional()
    .nullable()
    .refine(
      (date) => {
        if (!date) return true; // Optional field
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      },
      'Follow-up date cannot be in the past'
    )
});

type MedicalNoteFormData = z.infer<typeof medicalNoteSchema>;

interface AddMedicalNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
}

export default function AddMedicalNoteModal({ 
  isOpen, 
  onClose, 
  patient
}: AddMedicalNoteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const todayDateString = getTodayDateString();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    clearErrors,
    watch
  } = useForm<MedicalNoteFormData>({
    resolver: zodResolver(medicalNoteSchema),
    mode: 'onSubmit',
    defaultValues: {
      noteContent: '',
      recommendations: '',
      followUpDate: ''
    }
  });

  const addMedicalNoteMutation = useAddMedicalNote({
    onSuccess: () => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
    },
    onError: (error) => {
      setSubmitError(error.message || 'Failed to add medical note. Please try again.');
      setIsSubmitting(false);
    }
  });

  const noteContentLength = watch('noteContent')?.length || 0;

  const handleFormSubmit = async (data: MedicalNoteFormData) => {
    if (!patient) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await addMedicalNoteMutation.mutateAsync({
        patientId: patient.id,
        noteContent: data.noteContent,
        recommendations: data.recommendations || undefined,
        followUpDate: data.followUpDate || undefined
      });
    } catch (error: any) {
      // Error is already handled in the mutation onError
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    reset();
    clearErrors();
    setSubmitError(null);
    onClose();
  };

  const handleCancel = () => {
    onClose();
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50/90 via-purple-50/80 to-indigo-50/90 backdrop-blur-sm border-0 shadow-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                <DialogHeader className="pb-6">
                  <DialogTitle className="flex items-center gap-4">
                    <motion.div 
                      className="w-14 h-14 bg-gradient-to-br from-purple-500 via-pink-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/30"
                      initial={{ rotate: -10, scale: 0.8 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <MessageSquare className="h-7 w-7 text-white" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                    >
                      <h2 className="text-2xl font-bold text-gray-900">Add Medical Note</h2>
                      <p className="text-sm text-gray-600 font-medium mt-1">
                      Patient: {getPatientFullName(patient)}
                      </p>
                    </motion.div>
                  </DialogTitle>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                  >
                    <DialogDescription className="text-gray-600 text-base mt-2">
                      Document clinical observations and recommendations for this patient's care
                    </DialogDescription>
                  </motion.div>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleFormSubmit)}>
                  <motion.div 
                    className="space-y-6"
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
                              <p className="font-medium">Failed to Add Note</p>
                              <p className="text-sm">{submitError}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Note Content */}
                    <motion.div
                      className="bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg rounded-xl p-6"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                    >
                      <div className="space-y-3">
                        <Label htmlFor="noteContent" className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold text-gray-900">Clinical Note</span>
                          <span className="text-xs text-gray-500 ml-auto">{noteContentLength} / 2000</span>
                        </Label>
                        <Textarea
                          id="noteContent"
                          {...register('noteContent')}
                          placeholder="Document clinical observations, symptoms, assessments, and any relevant medical information..."
                          disabled={isSubmitting}
                          className={`min-h-32 resize-none ${errors.noteContent ? 'border-red-500' : ''}`}
                        />
                        {errors.noteContent && (
                          <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-600"
                          >
                            {errors.noteContent.message}
                          </motion.p>
                        )}
                      </div>
                    </motion.div>

                    {/* Recommendations */}
                    <motion.div
                      className="bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg rounded-xl p-6"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.7 }}
                    >
                      <div className="space-y-3">
                        <Label htmlFor="recommendations" className="font-semibold text-gray-900">
                          Recommendations (Optional)
                        </Label>
                        <Textarea
                          id="recommendations"
                          {...register('recommendations')}
                          placeholder="Include any treatment recommendations, medication adjustments, lifestyle changes, or follow-up actions..."
                          disabled={isSubmitting}
                          className={`min-h-24 resize-none ${errors.recommendations ? 'border-red-500' : ''}`}
                        />
                        {errors.recommendations && (
                          <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-600"
                          >
                            {errors.recommendations.message}
                          </motion.p>
                        )}
                      </div>
                    </motion.div>

                    {/* Follow-up Date */}
                    <motion.div
                      className="bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg rounded-xl p-6"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.8 }}
                    >
                      <div className="space-y-3">
                        <Label htmlFor="followUpDate" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold text-gray-900">Follow-up Date (Optional)</span>
                        </Label>
                        <Input
                          id="followUpDate"
                          type="date"
                          {...register('followUpDate')}
                          disabled={isSubmitting}
                          min={todayDateString}
                          className={errors.followUpDate ? 'border-red-500' : ''}
                        />
                        {errors.followUpDate && (
                          <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-600"
                          >
                            {errors.followUpDate.message}
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Footer with buttons */}
                  <DialogFooter className="mt-8 flex gap-3">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.9 }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="hover:bg-gray-100"
                      >
                        Cancel
                      </Button>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.9 }}
                    >
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <LoadingSpinner size="sm" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Save Note
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </DialogFooter>
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
        title="Medical Note Added"
        message="The medical note has been successfully added to the patient's record."
        icon={CheckCircle}
      />
    </>
  );
}
