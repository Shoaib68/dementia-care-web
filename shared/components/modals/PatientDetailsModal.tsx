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
import { Patient, usePatient } from '@/features/doctor/hooks/usePatients';
import { formatDatabaseDate, formatDatabaseDateOnly, calculateAgeFromDatabase, getPatientFullName } from '@/shared/lib/utils';
import { statusIndicators } from '@/shared/styles/effects';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Heart,
  Shield,
  Activity,
  Users,
  Smartphone,
  MapPin,
  Clock,
  FileText,
  Pill,
  AlertTriangle,
  FileHeart,
  X 
} from 'lucide-react';

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  patientId?: string;
  isLoading?: boolean;
}

export function PatientDetailsModal({ 
  isOpen, 
  onClose, 
  patient: initialPatient, 
  patientId,
  isLoading: externalLoading = false 
}: PatientDetailsModalProps) {
  // Fetch fresh patient data if only ID is provided
  const { 
    data: fetchedPatient, 
    isLoading: fetchLoading, 
    error: fetchError 
  } = usePatient(patientId || '', { enabled: !initialPatient && !!patientId });

  const patient = initialPatient || fetchedPatient;
  const isLoading = externalLoading || fetchLoading;

  const getStatusBadge = (isActive: boolean) => (
    <Badge className={isActive ? statusIndicators.completedBadge : statusIndicators.errorBadge}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );

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

  const getPrimaryCaregiver = (patient: Patient) => {
    return patient.patient_caregiver_assignments?.[0]?.caregivers || null;
  };

  // Parse and format medical history
  const parseMedicalHistory = (medicalHistory: any) => {
    if (!medicalHistory || typeof medicalHistory !== 'object') {
      return {
        history: '',
        conditions: [],
        medications: '',
        familyHistory: '',
        primaryConcerns: ''
      };
    }

    return {
      history: medicalHistory.history || medicalHistory.notes || '',
      conditions: Array.isArray(medicalHistory.conditions) ? medicalHistory.conditions : [],
      medications: medicalHistory.medications || '',
      familyHistory: medicalHistory.familyHistory || '',
      primaryConcerns: medicalHistory.primaryConcerns || ''
    };
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

  const primaryCaregiver = getPrimaryCaregiver(patient);

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
                    <User className="h-7 w-7 text-white" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                  <h2 className="text-2xl font-bold text-gray-900">{getPatientFullName(patient)}</h2>
                    <p className="text-sm text-gray-600 font-medium mt-1">Patient ID: {patient.patient_code} • Complete Medical Profile</p>
                  </motion.div>
                </DialogTitle>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <DialogDescription className="text-gray-600 text-base mt-2">
                    Comprehensive patient information, medical history, and care team details
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
                  <div className="flex items-center gap-4">
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.7 }}
                    >
                      {getStatusBadge(patient.users.is_active)}
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.8 }}
                    >
                      {getDementiaStageBadge(patient.dementia_stage)}
                    </motion.div>
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Registered: {formatDatabaseDate(patient.users.created_at)}
                  </div>
                </motion.div>

                {/* Personal Information */}
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
                          <User className="h-5 w-5 text-blue-600" />
                        </motion.div>
                        <h3 className="font-semibold text-lg text-gray-900">Personal Information</h3>
                      </motion.div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                          <label className="text-sm font-medium text-gray-500">Full Name</label>
                            <p className="text-sm font-medium">{getPatientFullName(patient)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Email Address</label>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <p className="text-sm">{patient.users.email}</p>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Patient Code</label>
                            <p className="text-sm font-mono text-gray-700">{patient.patient_code}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Age</label>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <p className="text-sm">{calculateAgeFromDatabase(patient.date_of_birth)} years old</p>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                            <p className="text-sm">{formatDatabaseDateOnly(patient.date_of_birth)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Account Status</label>
                            <p className="text-sm">
                              {patient.users.is_active ? (
                                <span className="text-green-600">Active & Accessible</span>
                              ) : (
                                <span className="text-red-600">Inactive</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Medical Information */}
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
                          <Heart className="h-5 w-5 text-green-600" />
                        </motion.div>
                        <h3 className="font-semibold text-lg text-gray-900">Medical Information</h3>
                      </motion.div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Dementia Stage</label>
                            <div className="mt-1">
                              {getDementiaStageBadge(patient.dementia_stage)}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Registration Date</label>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <p className="text-sm">{formatDatabaseDate(patient.users.created_at)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {patient.medical_history && Object.keys(patient.medical_history).length > 0 && (
                            <div className="space-y-4">
                              <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <FileHeart className="h-4 w-4" />
                                Medical History Details
                              </label>
                              
                              {(() => {
                                const medHistory = parseMedicalHistory(patient.medical_history);
                                return (
                                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 space-y-4">
                                    
                                    {/* Medical Conditions */}
                                    {medHistory.conditions && medHistory.conditions.length > 0 && (
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                                          <span className="text-sm font-medium text-gray-700">Current Conditions</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {medHistory.conditions.map((condition: string, index: number) => (
                                            <Badge key={index} className="bg-orange-100 text-orange-800 border-orange-200">
                                              {condition}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Medications */}
                                    {medHistory.medications && (
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <Pill className="h-4 w-4 text-blue-500" />
                                          <span className="text-sm font-medium text-gray-700">Medications</span>
                                        </div>
                                        <p className="text-sm text-gray-600 bg-white p-2 rounded-lg border">
                                          {medHistory.medications}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {/* Medical History */}
                                    {medHistory.history && (
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <FileText className="h-4 w-4 text-green-500" />
                                          <span className="text-sm font-medium text-gray-700">Medical History</span>
                                        </div>
                                        <p className="text-sm text-gray-600 bg-white p-2 rounded-lg border">
                                          {medHistory.history}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {/* Family History */}
                                    {medHistory.familyHistory && (
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <Users className="h-4 w-4 text-purple-500" />
                                          <span className="text-sm font-medium text-gray-700">Family History</span>
                                        </div>
                                        <p className="text-sm text-gray-600 bg-white p-2 rounded-lg border">
                                          {medHistory.familyHistory}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {/* Primary Concerns */}
                                    {medHistory.primaryConcerns && medHistory.primaryConcerns !== 'none' && (
                                      <div>
                                        <div className="flex items-center gap-2 mb-2">
                                          <Heart className="h-4 w-4 text-red-500" />
                                          <span className="text-sm font-medium text-gray-700">Primary Concerns</span>
                                        </div>
                                        <p className="text-sm text-gray-600 bg-white p-2 rounded-lg border">
                                          {medHistory.primaryConcerns}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {/* Empty State */}
                                    {!medHistory.conditions?.length && 
                                     !medHistory.medications && 
                                     !medHistory.history && 
                                     !medHistory.familyHistory && 
                                     (!medHistory.primaryConcerns || medHistory.primaryConcerns === 'none') && (
                                      <div className="text-center py-4">
                                        <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No detailed medical history available</p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()} 
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Caregiver Information */}
                {primaryCaregiver && (
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
                            <Users className="h-5 w-5 text-purple-600" />
                          </motion.div>
                          <h3 className="font-semibold text-lg text-gray-900">Primary Caregiver</h3>
                        </motion.div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Caregiver Name</label>
                              <p className="text-sm font-medium">
                                {primaryCaregiver.first_name} {primaryCaregiver.last_name}
                              </p>
                            </div>
                            {primaryCaregiver.phone_number && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Phone Number</label>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <p className="text-sm">{primaryCaregiver.phone_number}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Caregiver ID</label>
                              <p className="text-sm font-mono text-gray-700">{primaryCaregiver.id}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Relationship</label>
                              <p className="text-sm">Primary Caregiver</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

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
                          <Shield className="h-5 w-5 text-slate-600" />
                        </motion.div>
                        <h3 className="font-semibold text-lg text-gray-900">System Information</h3>
                      </motion.div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Patient ID</label>
                            <p className="text-sm font-mono text-gray-700">{patient.id}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Account Created</label>
                            <p className="text-sm">{formatDatabaseDate(patient.users.created_at)}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Hospital ID</label>
                            <p className="text-sm font-mono text-gray-700">{patient.hospital_id}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Profile Updated</label>
                            <p className="text-sm">{formatDatabaseDate(patient.updated_at)}</p>
                          </div>
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

export default PatientDetailsModal;