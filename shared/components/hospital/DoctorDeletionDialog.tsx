"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertDialog, AlertDialogContent, AlertDialogOverlay, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { 
  AlertTriangle,
  Users,
  ChevronDown,
  ChevronUp,
  Trash2,
  UserX,
  ArrowRight,
  Stethoscope
} from 'lucide-react';

export interface DoctorInfo {
  id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  department?: string;
  users: {
    email: string;
    is_active: boolean;
  };
}

export interface AssignedPatient {
  id: string;
  first_name: string;
  last_name: string;
  dementia_stage: 'mild' | 'moderate' | 'severe';
  patient_code: string;
}

interface DoctorDeletionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  doctor: DoctorInfo | null;
  isLoading?: boolean;
  hasPatients?: boolean;
  patientCount?: number;
  assignedPatients?: AssignedPatient[];
  onConfirmDeletion: () => void;
  onRequestReassignment: () => void;
  onCancel: () => void;
}

export function DoctorDeletionDialog({
  isOpen,
  onOpenChange,
  doctor,
  isLoading = false,
  hasPatients = false,
  patientCount = 0,
  assignedPatients = [],
  onConfirmDeletion,
  onRequestReassignment,
  onCancel
}: DoctorDeletionDialogProps) {
  const [showPatients, setShowPatients] = useState(false);

  if (!doctor) return null;

  const doctorName = `${doctor.first_name} ${doctor.last_name}`;

  const getStageBadgeColor = (stage: 'mild' | 'moderate' | 'severe') => {
    switch (stage) {
      case 'mild':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'severe':
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogTitle className="sr-only">
          {hasPatients ? 'Cannot Delete Doctor' : 'Delete Doctor'}
        </AlertDialogTitle>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${hasPatients ? 'bg-amber-100' : 'bg-red-100'}`}>
              {hasPatients ? (
                <AlertTriangle className={`h-6 w-6 ${hasPatients ? 'text-amber-600' : 'text-red-600'}`} />
              ) : (
                <UserX className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {hasPatients ? 'Cannot Delete Doctor' : 'Delete Doctor'}
              </h2>
              <p className="text-sm text-gray-500">
                {hasPatients 
                  ? 'This doctor has assigned patients'
                  : 'This action cannot be undone'
                }
              </p>
            </div>
          </div>

          {/* Doctor Information */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{doctorName}</CardTitle>
                  <CardDescription>{doctor.specialization}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">{doctor.users.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Department:</span>
                  <p className="font-medium">{doctor.department || 'General'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patient Warning */}
          {hasPatients && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-amber-900">
                        Doctor has {patientCount} assigned patient{patientCount !== 1 ? 's' : ''}
                      </h3>
                      <p className="text-sm text-amber-700 mt-1">
                        Before deleting this doctor, you must reassign their patients to other doctors in your hospital.
                      </p>
                      
                      {assignedPatients.length > 0 && (
                        <div className="mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPatients(!showPatients)}
                            className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 p-0 h-auto"
                          >
                            <span className="flex items-center space-x-2">
                              <span>{showPatients ? 'Hide' : 'View'} Assigned Patients</span>
                              {showPatients ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </span>
                          </Button>
                        </div>
                      )}

                      <AnimatePresence>
                        {showPatients && assignedPatients.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-3 space-y-2 overflow-hidden"
                          >
                            {assignedPatients.map((patient, index) => (
                              <motion.div
                                key={patient.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between p-3 bg-white rounded-lg border"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-purple-700">
                                      {patient.first_name[0]}{patient.last_name[0]}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {patient.first_name} {patient.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      ID: {patient.patient_code}
                                    </p>
                                  </div>
                                </div>
                                <Badge className={getStageBadgeColor(patient.dementia_stage)}>
                                  {patient.dementia_stage}
                                </Badge>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* No Patients Warning */}
          {!hasPatients && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-red-900">
                        Permanent Deletion
                      </h3>
                      <p className="text-sm text-red-700 mt-1">
                        This will permanently delete the doctor's account and all associated data. 
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="hover:bg-gray-50"
            >
              Cancel
            </Button>
            
            {hasPatients ? (
              <Button
                onClick={onRequestReassignment}
                disabled={isLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Reassign Patients
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={onConfirmDeletion}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Doctor</span>
                  </div>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default DoctorDeletionDialog;