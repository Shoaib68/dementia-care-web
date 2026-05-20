import { NextRequest, NextResponse } from 'next/server';
import { 
  withErrorHandling,
  verifyAuth,
  validateRequestBody,
  createSuccessResponse,
  parseJsonBody,
  ApiError
} from '@/shared/lib/api/api-server';
import { PatientManagementService, CreatePatientRequest } from '@/features/doctor/services/patient-management';

// Interface for patient creation request
interface PatientCreationRequest {
  patientDetails: {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
    dementiaStage: 'mild' | 'moderate' | 'severe';
    medicalHistory?: Record<string, unknown>;
  };
  caregiverDetails: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    emergencyContact?: string;
    address?: string;
  };
  doctorId: string;
  hospitalId: string;
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  // Verify authentication - only doctors can access
  const auth = await verifyAuth('doctor');
  
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get('doctorId') || auth.userId;
  const search = searchParams.get('search') || undefined;
  const dementiaStage = searchParams.get('dementiaStage') as 'mild' | 'moderate' | 'severe' | null;
  const status = searchParams.get('status') as 'active' | 'inactive' | null;
  
  // Use PatientManagementService to fetch patients
  const result = await PatientManagementService.getPatientsByDoctor(
    doctorId,
    {
      search,
      dementiaStage: dementiaStage || undefined,
      status: status || undefined
    }
  );

  if (!result.success) {
    throw new ApiError(
      result.error || 'Failed to fetch patients',
      500,
      'PATIENTS_FETCH_FAILED'
    );
  }

  return createSuccessResponse(result.data, 'Patients retrieved successfully');
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  // Verify authentication - only doctors can create patients
  const auth = await verifyAuth('doctor');
  
  // Parse and validate request body
  const body = await parseJsonBody<PatientCreationRequest>(request);
  const validatedData = await validateRequestBody<PatientCreationRequest>(
    body, 
    ['patientDetails', 'caregiverDetails', 'doctorId', 'hospitalId']
  );
  
  // Validate nested objects exist and are objects
  if (!validatedData.patientDetails || typeof validatedData.patientDetails !== 'object') {
    throw new ApiError('patientDetails must be an object', 400, 'VALIDATION_ERROR');
  }
  
  if (!validatedData.caregiverDetails || typeof validatedData.caregiverDetails !== 'object') {
    throw new ApiError('caregiverDetails must be an object', 400, 'VALIDATION_ERROR');
  }
  
  // Validate required nested fields
  const patientDetails = validatedData.patientDetails;
  if (!patientDetails.firstName || !patientDetails.lastName || !patientDetails.email || !patientDetails.dateOfBirth || !patientDetails.dementiaStage) {
    throw new ApiError('Missing required patient details (firstName, lastName, email, dateOfBirth, dementiaStage)', 400, 'VALIDATION_ERROR');
  }
  
  const caregiverDetails = validatedData.caregiverDetails;
  if (!caregiverDetails.firstName || !caregiverDetails.lastName || !caregiverDetails.phoneNumber) {
    throw new ApiError('Missing required caregiver details (firstName, lastName, phoneNumber)', 400, 'VALIDATION_ERROR');
  }
  
  const doctorId: string = validatedData.doctorId as string;
  const hospitalId: string = validatedData.hospitalId as string;
  
  // Use PatientManagementService to create patient and caregiver
  const result = await PatientManagementService.createPatientWithCaregiver(
    {
      patientDetails,
      caregiverDetails,
      doctorId,
      hospitalId
    },
    auth.userId
  );

  if (!result.success) {
    if (result.error === 'This email is already registered to a patient account') {
      throw new ApiError(
        result.error,
        409, // Conflict
        'DUPLICATE_EMAIL'
      );
    } else {
      throw new ApiError(
        result.error || 'Failed to create patient and caregiver',
        500,
        'PATIENT_CREATION_FAILED'
      );
    }
  }

  return createSuccessResponse(
    {
      patientId: result.patientId,
      caregiverId: result.caregiverId,
      message: result.message
    },
    result.message || 'Patient and caregiver created successfully',
    201
  );
}

export const GET = withErrorHandling(handleGET);
export const POST = withErrorHandling(handlePOST);
