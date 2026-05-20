"use client";

/**
 * Add Patient Page - Doctor Portal
 * 
 * This page allows doctors to create both patient and caregiver accounts simultaneously.
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCreatePatient, PatientFormData } from '@/features/doctor/hooks/usePatients';
import { useMultiEmailValidation } from '@/shared/hooks/useEmailValidation';
import { InlineEmailValidation } from '@/shared/components/form/EmailValidationIndicator';
import { cn } from '@/shared/lib/utils';
import { InvitationSuccessModal } from '@/shared/components/modals/InvitationSuccessModal';
import { User, UserPlus, AlertCircle, ArrowLeft, Users } from 'lucide-react';

// Mock medical conditions for the form
const commonConditions = [
  'Memory Loss',
  'Confusion',
  'Difficulty with Language',
  'Problem-solving Issues',
  'Mood Changes',
  'Behavioral Changes',
  'Sleep Disturbances',
  'Motor Function Issues'
];

export default function AddPatientPage() {
  const { user } = useAuth();
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Email validation for both patient and caregiver
  const emailValidation = useMultiEmailValidation();
  
  const [patientData, setPatientData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    dementiaStage: '' as 'mild' | 'moderate' | 'severe' | '',
    medicalHistory: '',
    currentMedications: '',
    primaryConcerns: '',
    familyHistory: '',
  });
  
  const [caregiverData, setCaregiverData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    address: '',
  });
  
  const createPatientMutation = useCreatePatient({
    onSuccess: (data) => {
      // Show success modal with invitation details
      setShowSuccessModal(true);
    },
    onError: (error) => {
      // Error handling is done via the mutation's error state
    },
  });
  

  const handlePatientInputChange = (field: keyof typeof patientData, value: string) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
    
    // Trigger email validation for patient email
    if (field === 'email' && value) {
      emailValidation.validatePatientEmail(value);
    }
  };
  
  const handleCaregiverInputChange = (field: keyof typeof caregiverData, value: string) => {
    setCaregiverData(prev => ({ ...prev, [field]: value }));
    
    // Trigger email validation for caregiver email (optional field)
    if (field === 'email' && value) {
      emailValidation.validateCaregiverEmail(value);
    }
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev => 
      prev.includes(condition) 
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!user?.id || user.user_type !== 'doctor') {
      alert('Authentication error. Please log out and log back in.');
      return;
    }
    
    // Get hospital ID from doctor profile
    const hospitalId = user?.doctor_profile?.hospital_id;
    
    if (!hospitalId) {
      alert(
        'Doctor profile setup required.\n\n' +
        'Your doctor account needs to be properly linked to a hospital. ' +
        'Please try logging out and back in again. If the problem persists, ' +
        'contact your hospital administrator.'
      );
      return;
    }
    
    // Prepare medical history with selected conditions
    const medicalHistoryData = {
      conditions: selectedConditions,
      history: patientData.medicalHistory,
      medications: patientData.currentMedications,
      familyHistory: patientData.familyHistory,
      primaryConcerns: patientData.primaryConcerns,
    };
    
    const formData: PatientFormData = {
      patientDetails: {
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        email: patientData.email,
        dateOfBirth: patientData.dateOfBirth,
        dementiaStage: patientData.dementiaStage as 'mild' | 'moderate' | 'severe',
        medicalHistory: medicalHistoryData,
      },
      caregiverDetails: {
        firstName: caregiverData.firstName,
        lastName: caregiverData.lastName,
        phoneNumber: caregiverData.phoneNumber,
        email: caregiverData.email,
        address: caregiverData.address,
      },
      doctorId: user.id,
      hospitalId: hospitalId,
    };
    
    createPatientMutation.mutate(formData);
  };

  const resetForm = () => {
    setPatientData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      dementiaStage: '',
      medicalHistory: '',
      currentMedications: '',
      primaryConcerns: '',
      familyHistory: '',
    });
    setCaregiverData({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      address: '',
    });
    setSelectedConditions([]);
    emailValidation.clearAllValidations();
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    resetForm();
  };
  
  const isFormValid = () => {
    // Basic form validation
    const basicFieldsValid = (
      patientData.firstName &&
      patientData.lastName &&
      patientData.dateOfBirth &&
      patientData.email &&
      patientData.dementiaStage &&
      patientData.primaryConcerns &&
      caregiverData.firstName &&
      caregiverData.lastName &&
      caregiverData.phoneNumber &&
      caregiverData.email // Make caregiver email mandatory
    );
    
    // Email validation
    const emailsValid = emailValidation.areAllEmailsReady();
    const noEmailErrors = !emailValidation.hasAnyErrors();
    
    return basicFieldsValid && emailsValid && noEmailErrors;
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Add New Patient"
        subtitle="Enter patient information to add them to your care"
        actions={[
          {
            label: "Back",
            variant: "outline",
            icon: ArrowLeft,
            onClick: () => window.history.back()
          }
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Basic Information
            </CardTitle>
            <CardDescription>Patient&apos;s personal and contact details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                value={patientData.firstName}
                onChange={(e) => handlePatientInputChange('firstName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                value={patientData.lastName}
                onChange={(e) => handlePatientInputChange('lastName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={patientData.dateOfBirth}
                onChange={(e) => handlePatientInputChange('dateOfBirth', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={patientData.gender}
                onChange={(e) => handlePatientInputChange('gender', e.target.value)}
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={patientData.phone}
                onChange={(e) => handlePatientInputChange('phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientEmail">Email Address *</Label>
              <div className="relative">
                <Input
                  id="patientEmail"
                  type="email"
                  placeholder="patient@email.com"
                  value={patientData.email}
                  onChange={(e) => handlePatientInputChange('email', e.target.value)}
                  className={cn(
                    emailValidation.patient.isValid === false ? 'border-red-500 focus:border-red-500' : '',
                    emailValidation.patient.isValid === true ? 'border-green-500' : ''
                  )}
                  required
                />
                {emailValidation.patient.isValidating && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {patientData.email && (
                <InlineEmailValidation
                  state={emailValidation.patient.isValidating ? 'validating' : 
                        emailValidation.patient.error ? 'error' :
                        emailValidation.patient.isValid === true ? 'valid' :
                        emailValidation.patient.isValid === false ? 'invalid' : 'idle'}
                  message={emailValidation.patient.error || emailValidation.patient.result?.message}
                  suggestions={emailValidation.patient.result?.suggestions}
                  onSuggestionClick={(suggestion) => {
                    handlePatientInputChange('email', suggestion);
                  }}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dementiaStage">Dementia Stage *</Label>
              <select
                id="dementiaStage"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={patientData.dementiaStage}
                onChange={(e) => handlePatientInputChange('dementiaStage', e.target.value)}
                required
              >
                <option value="">Select dementia stage</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter full address"
                value={patientData.address}
                onChange={(e) => handlePatientInputChange('address', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Caregiver Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Caregiver Information
            </CardTitle>
            <CardDescription>Details of the assigned caregiver for this patient</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="caregiverFirstName">First Name *</Label>
              <Input
                id="caregiverFirstName"
                placeholder="Enter caregiver first name"
                value={caregiverData.firstName}
                onChange={(e) => handleCaregiverInputChange('firstName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caregiverLastName">Last Name *</Label>
              <Input
                id="caregiverLastName"
                placeholder="Enter caregiver last name"
                value={caregiverData.lastName}
                onChange={(e) => handleCaregiverInputChange('lastName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caregiverPhone">Phone Number *</Label>
              <Input
                id="caregiverPhone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={caregiverData.phoneNumber}
                onChange={(e) => handleCaregiverInputChange('phoneNumber', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caregiverEmail">Email Address *</Label>
              <div className="relative">
                <Input
                  id="caregiverEmail"
                  type="email"
                  placeholder="caregiver@email.com"
                  value={caregiverData.email}
                  onChange={(e) => handleCaregiverInputChange('email', e.target.value)}
                  className={cn(
                    emailValidation.caregiver.isValid === false ? 'border-red-500 focus:border-red-500' : '',
                    emailValidation.caregiver.isValid === true ? 'border-green-500' : ''
                  )}
                  required
                />
                {emailValidation.caregiver.isValidating && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {caregiverData.email && (
                <InlineEmailValidation
                  state={emailValidation.caregiver.isValidating ? 'validating' : 
                        emailValidation.caregiver.error ? 'error' :
                        emailValidation.caregiver.isValid === true ? 'valid' :
                        emailValidation.caregiver.isValid === false ? 'invalid' : 'idle'}
                  message={emailValidation.caregiver.error || emailValidation.caregiver.result?.message}
                  suggestions={emailValidation.caregiver.result?.suggestions}
                  onSuggestionClick={(suggestion) => {
                    handleCaregiverInputChange('email', suggestion);
                  }}
                />
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="caregiverAddress">Address</Label>
              <Input
                id="caregiverAddress"
                placeholder="Enter caregiver address"
                value={caregiverData.address}
                onChange={(e) => handleCaregiverInputChange('address', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
              Medical Information
            </CardTitle>
            <CardDescription>Patient&apos;s medical history and current condition</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primaryConcerns">Primary Concerns *</Label>
              <textarea
                id="primaryConcerns"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Describe the main reasons for the visit..."
                value={patientData.primaryConcerns}
                onChange={(e) => handlePatientInputChange('primaryConcerns', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Common Symptoms/Conditions</Label>
              <p className="text-sm text-gray-600">Select applicable conditions:</p>
              <div className="flex flex-wrap gap-2">
                {commonConditions.map((condition) => (
                  <Badge
                    key={condition}
                    variant={selectedConditions.includes(condition) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-blue-100"
                    onClick={() => toggleCondition(condition)}
                  >
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalHistory">Medical History</Label>
              <textarea
                id="medicalHistory"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Previous diagnoses, surgeries, major illnesses..."
                value={patientData.medicalHistory}
                onChange={(e) => handlePatientInputChange('medicalHistory', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentMedications">Current Medications</Label>
              <textarea
                id="currentMedications"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="List current medications and dosages..."
                value={patientData.currentMedications}
                onChange={(e) => handlePatientInputChange('currentMedications', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="familyHistory">Family History</Label>
              <textarea
                id="familyHistory"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Family history of dementia, Alzheimer's, or other relevant conditions..."
                value={patientData.familyHistory}
                onChange={(e) => handlePatientInputChange('familyHistory', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Alert className="flex-1 mr-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please ensure all required fields are completed accurately. Both patient and caregiver accounts will be created simultaneously.
                </AlertDescription>
              </Alert>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Clear Form
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPatientMutation.isPending || !isFormValid() || emailValidation.isAnyValidating()} 
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {createPatientMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating Accounts...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Patient & Caregiver
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {createPatientMutation.error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {createPatientMutation.error.message || 'Failed to create patient and caregiver accounts'}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </form>

      {/* Success Modal */}
      <InvitationSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        invitations={[
          {
            email: patientData.email,
            role: 'Patient'
          },
          {
            email: caregiverData.email,
            role: 'Caregiver'
          }
        ]}
        title="Invitation Emails Sent!"
        message="Invitation emails have been sent to both the patient and caregiver."
      />
    </div>
  );
}

