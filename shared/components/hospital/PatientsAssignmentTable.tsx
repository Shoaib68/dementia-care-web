"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Users, UserPlus, Stethoscope, Calendar, AlertCircle } from 'lucide-react';
import { HospitalPatient } from '@/features/hospital/services/patient-assignment';
import { DoctorData } from '@/features/hospital/hooks/useDoctorManagement';
import AssignDoctorDialog from './AssignDoctorDialog';

interface PatientsAssignmentTableProps {
  patients: HospitalPatient[];
  doctors: DoctorData[];
  isLoading?: boolean;
  error?: Error | null;
}

export function PatientsAssignmentTable({
  patients,
  doctors,
  isLoading,
  error
}: PatientsAssignmentTableProps) {
  const getDementiaStageColor = (stage: string) => {
    switch (stage) {
      case 'mild':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'severe':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };


  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patients Management</CardTitle>
          <CardDescription>Loading patients...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patients Management</CardTitle>
          <CardDescription>Error loading patients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (patients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patients Management</CardTitle>
          <CardDescription>No patients found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No patients found in this hospital</p>
            <p className="text-sm text-gray-400">
              Patients will appear here once doctors create patient accounts
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Hospital Patients ({patients.length})</span>
        </CardTitle>
        <CardDescription>
          Manage patient assignments to doctors in your hospital
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Assigned Doctor</TableHead>
                <TableHead>Dementia Stage</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => {
                const assignedDoctor = patient.doctors;

                return (
                  <TableRow key={patient.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <p className="text-sm text-gray-500">{patient.patient_code}</p>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {assignedDoctor ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Stethoscope className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {assignedDoctor.first_name} {assignedDoctor.last_name}
                            </p>
                            <p className="text-sm text-gray-500">{assignedDoctor.specialization}</p>
                            {assignedDoctor.department && (
                              <p className="text-xs text-gray-400">{assignedDoctor.department}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">Unassigned</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge className={getDementiaStageColor(patient.dementia_stage)}>
                        {patient.dementia_stage}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(patient.updated_at)}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <AssignDoctorDialog
                        patient={patient}
                        doctors={doctors}
                        currentDoctorId={patient.primary_doctor_id}
                        trigger={
                          <Button variant="outline" size="sm" className="text-blue-600 hover:bg-blue-50">
                            <UserPlus className="h-4 w-4 mr-1" />
                            {assignedDoctor ? 'Reassign' : 'Assign'}
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default PatientsAssignmentTable;