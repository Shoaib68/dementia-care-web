"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { AlertCircle, User, Stethoscope, UserPlus } from 'lucide-react';
import { HospitalPatient } from '@/features/hospital/services/patient-assignment';
import { DoctorData } from '@/features/hospital/hooks/useDoctorManagement';
import { useAssignPatient } from '@/features/hospital/hooks/usePatientAssignment';

interface AssignDoctorDialogProps {
  patient: HospitalPatient;
  doctors: DoctorData[];
  currentDoctorId?: string;
  trigger?: React.ReactNode;
}

export function AssignDoctorDialog({
  patient,
  doctors,
  currentDoctorId,
  trigger
}: AssignDoctorDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(currentDoctorId || '');
  
  const assignPatientMutation = useAssignPatient();

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
  const currentDoctor = doctors.find(d => d.id === currentDoctorId);

  const handleAssign = async () => {
    if (!selectedDoctorId) return;

    try {
      await assignPatientMutation.mutateAsync({
        patientId: patient.id,
        doctorId: selectedDoctorId
      });
      
      setOpen(false);
    } catch (error) {
      // Error handling is managed by the mutation
      console.error('Assignment failed:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when dialog is closed
      setSelectedDoctorId(currentDoctorId || '');
    }
    setOpen(newOpen);
  };

  const getDementiaStageColor = (stage: string) => {
    switch (stage) {
      case 'mild': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'severe': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isAssignmentChanged = selectedDoctorId !== currentDoctorId;
  const isCurrentlyAssigned = !!currentDoctorId;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-1" />
            {isCurrentlyAssigned ? 'Reassign' : 'Assign'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-purple-600" />
            <span>
              {isCurrentlyAssigned ? 'Reassign Patient to Doctor' : 'Assign Patient to Doctor'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {isCurrentlyAssigned 
              ? 'Change the doctor assignment for this patient.'
              : 'Select a doctor to assign this patient to.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Patient Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Patient Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <p className="font-medium">{patient.first_name} {patient.last_name}</p>
              </div>
              <div>
                <span className="text-gray-600">Patient Code:</span>
                <p className="font-medium">{patient.patient_code}</p>
              </div>
              <div>
                <span className="text-gray-600">Dementia Stage:</span>
                <div className="mt-1">
                  <Badge className={getDementiaStageColor(patient.dementia_stage)}>
                    {patient.dementia_stage}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <div className="mt-1">
                  <Badge className={patient.users.is_active ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}>
                    {patient.users.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Current Assignment */}
          {currentDoctor && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <Stethoscope className="h-4 w-4 mr-2" />
                Currently Assigned Doctor
              </h4>
              <div className="text-sm text-blue-800">
                <p className="font-medium">{currentDoctor.first_name} {currentDoctor.last_name}</p>
                <p>{currentDoctor.specialization}</p>
                {currentDoctor.department && (
                  <p className="text-blue-600">{currentDoctor.department} Department</p>
                )}
              </div>
            </div>
          )}

          {/* Doctor Selection */}
          <div>
            <Label htmlFor="doctor-select" className="text-base font-medium">
              {isCurrentlyAssigned ? 'Select New Doctor' : 'Select Doctor'}
            </Label>
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedDoctorId === doctor.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDoctorId(doctor.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="doctor"
                          value={doctor.id}
                          checked={selectedDoctorId === doctor.id}
                          onChange={() => setSelectedDoctorId(doctor.id)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {doctor.first_name} {doctor.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{doctor.specialization}</p>
                          {doctor.department && (
                            <p className="text-xs text-gray-500">{doctor.department} Department</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={doctor.users.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {doctor.users.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {doctor.id === currentDoctorId && (
                        <Badge variant="outline">Current</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning for reassignment */}
          {isAssignmentChanged && currentDoctor && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-800 font-medium">Assignment Change</p>
                  <p className="text-amber-700 mt-1">
                    This patient will be reassigned from <strong>{currentDoctor.first_name} {currentDoctor.last_name}</strong> to{' '}
                    <strong>{selectedDoctor?.first_name} {selectedDoctor?.last_name}</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={assignPatientMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!selectedDoctorId || assignPatientMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {assignPatientMutation.isPending ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                {isCurrentlyAssigned ? 'Reassigning...' : 'Assigning...'}
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                {isCurrentlyAssigned ? 'Reassign Patient' : 'Assign Patient'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AssignDoctorDialog;