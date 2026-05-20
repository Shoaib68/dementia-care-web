"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertDialog, AlertDialogContent, AlertDialogOverlay, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Label } from '@/shared/components/ui/label';
import { 
  Users,
  ArrowRight,
  Check,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Stethoscope,
  ChevronLeft,
  ClipboardList
} from 'lucide-react';
import { AssignedPatient, DoctorInfo } from './DoctorDeletionDialog';
import { useBulkPatientAssignment, PatientAssignment } from '@/features/hospital/hooks/useBulkPatientAssignment';

interface AvailableDoctor {
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

interface PatientReassignmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  doctorToDelete: DoctorInfo | null;
  assignedPatients: AssignedPatient[];
  availableDoctors: AvailableDoctor[];
  isLoading?: boolean;
  onReassignmentComplete: () => void;
  onCancel: () => void;
  onGoBack: () => void;
}

export function PatientReassignmentDialog({
  isOpen,
  onOpenChange,
  doctorToDelete,
  assignedPatients,
  availableDoctors,
  isLoading = false,
  onReassignmentComplete,
  onCancel,
  onGoBack
}: PatientReassignmentDialogProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [bulkDoctorId, setBulkDoctorId] = useState<string>('');
  
  // Use the bulk assignment hook
  const bulkAssignMutation = useBulkPatientAssignment();
  const isAssigning = bulkAssignMutation.isPending;

  // Reset assignments when dialog opens or patients change
  React.useEffect(() => {
    if (isOpen) {
      setAssignments({});
      setBulkDoctorId('');
    }
  }, [isOpen, assignedPatients]);

  const doctorToDeleteName = doctorToDelete 
    ? `${doctorToDelete.first_name} ${doctorToDelete.last_name}` 
    : '';

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

  const handleIndividualAssignment = (patientId: string, doctorId: string) => {
    setAssignments(prev => ({
      ...prev,
      [patientId]: doctorId
    }));
  };

  const handleBulkAssignment = (doctorId: string) => {
    setBulkDoctorId(doctorId);
    const newAssignments: Record<string, string> = {};
    assignedPatients.forEach(patient => {
      newAssignments[patient.id] = doctorId;
    });
    setAssignments(newAssignments);
  };

  const getPatientAssignedDoctor = (patientId: string) => {
    const doctorId = assignments[patientId];
    if (!doctorId) return null;
    return availableDoctors.find(doc => doc.id === doctorId);
  };

  const isValidAssignment = useMemo(() => {
    if (assignedPatients.length === 0) return false;
    return assignedPatients.every(patient => assignments[patient.id]);
  }, [assignedPatients, assignments]);

  const handleConfirmReassignment = async () => {
    if (!isValidAssignment) return;

    const patientAssignments: PatientAssignment[] = assignedPatients.map(patient => ({
      patientId: patient.id,
      selectedDoctorId: assignments[patient.id]
    }));

    try {
      await bulkAssignMutation.mutateAsync({
        assignments: patientAssignments,
        notes: `Patients reassigned from Dr. ${doctorToDeleteName}`
      });
      
      // Call the completion callback to handle success state
      onReassignmentComplete();
    } catch (error) {
      console.error('Failed to reassign patients:', error);
      // Error is handled by the mutation's onError callback
    }
  };

  const assignedCount = Object.values(assignments).filter(Boolean).length;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      console.log('PatientReassignmentDialog: onOpenChange called with:', open);
      onOpenChange(open);
    }}>
      <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <AlertDialogTitle className="sr-only">
          Reassign Patients
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
            <div className="p-3 bg-amber-100 rounded-full">
              <ClipboardList className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                Reassign Patients
              </h2>
              <p className="text-sm text-gray-500">
                Assign {assignedPatients.length} patients from {doctorToDeleteName} to other doctors
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {assignedCount} / {assignedPatients.length} assigned
              </p>
              <p className="text-xs text-gray-500">
                {assignedCount === assignedPatients.length ? 'All patients assigned' : 'Select doctors for all patients'}
              </p>
            </div>
          </div>

          {/* Bulk Assignment Section */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <UserCheck className="h-5 w-5 text-blue-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 mb-2">
                    Quick Assignment
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Assign all patients to the same doctor, or customize individual assignments below.
                  </p>
                  <div className="flex items-center space-x-3">
                    <Label htmlFor="bulk-doctor" className="text-sm font-medium text-blue-900 whitespace-nowrap">
                      Assign all to:
                    </Label>
                    <Select
                      value={bulkDoctorId}
                      onValueChange={handleBulkAssignment}
                      disabled={isAssigning}
                    >
                      <SelectTrigger id="bulk-doctor" className="w-full bg-white border-blue-200">
                        <SelectValue placeholder="Select a doctor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDoctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <Stethoscope className="h-3 w-3 text-blue-600" />
                              </div>
                              <div>
                                <span className="font-medium">
                                  {doctor.first_name} {doctor.last_name}
                                </span>
                                <span className="text-sm text-gray-500 ml-2">
                                  {doctor.specialization}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="border-t my-4" />

          {/* Individual Patient Assignments */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-600" />
              <span>Individual Patient Assignments</span>
            </h3>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              <AnimatePresence>
                {assignedPatients.map((patient, index) => {
                  const assignedDoctor = getPatientAssignedDoctor(patient.id);
                  
                  return (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 border rounded-lg bg-white space-y-3"
                    >
                      {/* Patient Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-700">
                              {patient.first_name[0]}{patient.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              ID: {patient.patient_code}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStageBadgeColor(patient.dementia_stage)}>
                          {patient.dementia_stage}
                        </Badge>
                      </div>

                      {/* Doctor Assignment */}
                      <div className="flex items-center space-x-3">
                        <Label className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[80px]">
                          Assign to:
                        </Label>
                        <Select
                          value={assignments[patient.id] || ''}
                          onValueChange={(doctorId) => handleIndividualAssignment(patient.id, doctorId)}
                          disabled={isAssigning}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select doctor..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDoctors.map((doctor) => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                    <Stethoscope className="h-3 w-3 text-green-600" />
                                  </div>
                                  <div>
                                    <span className="font-medium">
                                      {doctor.first_name} {doctor.last_name}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-2">
                                      {doctor.specialization}
                                    </span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {assignedDoctor && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="p-1 bg-green-100 rounded-full"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                console.log('PatientReassignmentDialog: Back button clicked');
                onGoBack();
              }}
              disabled={isAssigning}
              className="text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Deletion
            </Button>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  console.log('PatientReassignmentDialog: Cancel button clicked');
                  onCancel();
                }}
                disabled={isAssigning}
                className="hover:bg-gray-50"
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleConfirmReassignment}
                disabled={!isValidAssignment || isAssigning}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isAssigning ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Reassigning...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-4 w-4" />
                    <span>Confirm Reassignments</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Warning for incomplete assignments */}
          {!isValidAssignment && assignedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2"
            >
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-700">
                  Please assign all {assignedPatients.length} patients to doctors before proceeding.
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  {assignedPatients.length - assignedCount} patient{assignedPatients.length - assignedCount !== 1 ? 's' : ''} still need{assignedPatients.length - assignedCount === 1 ? 's' : ''} to be assigned.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default PatientReassignmentDialog;