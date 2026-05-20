/**
 * User-friendly error messages mapping
 * Maps technical error codes to human-readable messages
 * Supports localization structure for future i18n implementation
 */

// Base error messages in English
export const ERROR_MESSAGES = {
  // Authentication errors
  AUTHENTICATION_ERROR: {
    title: 'Authentication Required',
    message: 'Please log in to continue.',
    action: 'Log in now',
  },
  INVALID_CREDENTIALS: {
    title: 'Invalid Credentials',
    message: 'The email or password you entered is incorrect.',
    action: 'Try again',
  },
  SESSION_EXPIRED: {
    title: 'Session Expired',
    message: 'Your session has expired. Please log in again.',
    action: 'Log in',
  },
  TOKEN_INVALID: {
    title: 'Invalid Token',
    message: 'Your authentication token is invalid. Please log in again.',
    action: 'Log in',
  },

  // Authorization errors
  AUTHORIZATION_ERROR: {
    title: 'Access Denied',
    message: "You don't have permission to perform this action.",
    action: 'Contact administrator',
  },
  INSUFFICIENT_PERMISSIONS: {
    title: 'Insufficient Permissions',
    message: 'Your account does not have the required permissions for this operation.',
    action: 'Request access',
  },
  ROLE_REQUIRED: {
    title: 'Role Required',
    message: 'This action requires specific user roles.',
    action: 'Contact support',
  },

  // Validation errors
  VALIDATION_ERROR: {
    title: 'Validation Error',
    message: 'Please check your input and try again.',
    action: 'Review and retry',
  },
  REQUIRED_FIELD_MISSING: {
    title: 'Required Information Missing',
    message: 'Please fill in all required fields.',
    action: 'Complete form',
  },
  INVALID_EMAIL_FORMAT: {
    title: 'Invalid Email',
    message: 'Please enter a valid email address.',
    action: 'Correct email',
  },
  PASSWORD_TOO_WEAK: {
    title: 'Weak Password',
    message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers.',
    action: 'Strengthen password',
  },
  INVALID_DATE_FORMAT: {
    title: 'Invalid Date',
    message: 'Please enter a valid date in the correct format.',
    action: 'Check date format',
  },
  INVALID_PHONE_NUMBER: {
    title: 'Invalid Phone Number',
    message: 'Please enter a valid phone number.',
    action: 'Check phone number',
  },

  // Resource errors
  NOT_FOUND_ERROR: {
    title: 'Resource Not Found',
    message: 'The requested resource could not be found.',
    action: 'Go back',
  },
  PATIENT_NOT_FOUND: {
    title: 'Patient Not Found',
    message: 'The patient you\'re looking for does not exist.',
    action: 'Check patient list',
  },
  DOCTOR_NOT_FOUND: {
    title: 'Doctor Not Found',
    message: 'The doctor you\'re looking for does not exist.',
    action: 'Check doctor list',
  },
  HOSPITAL_NOT_FOUND: {
    title: 'Hospital Not Found',
    message: 'The hospital you\'re looking for does not exist.',
    action: 'Check hospital list',
  },
  MRI_SCAN_NOT_FOUND: {
    title: 'MRI Scan Not Found',
    message: 'The MRI scan you\'re looking for does not exist.',
    action: 'Check scan list',
  },

  // Conflict errors
  CONFLICT_ERROR: {
    title: 'Resource Already Exists',
    message: 'This item already exists in the system.',
    action: 'Use existing item',
  },
  EMAIL_ALREADY_EXISTS: {
    title: 'Email Already Registered',
    message: 'An account with this email address already exists.',
    action: 'Use different email',
  },
  HOSPITAL_ALREADY_EXISTS: {
    title: 'Hospital Already Exists',
    message: 'A hospital with this name already exists.',
    action: 'Use different name',
  },
  LICENSE_NUMBER_EXISTS: {
    title: 'License Number In Use',
    message: 'A doctor with this license number already exists.',
    action: 'Check license number',
  },

  // Network and server errors
  NETWORK_ERROR: {
    title: 'Connection Problem',
    message: 'Please check your internet connection and try again.',
    action: 'Retry',
  },
  SERVER_ERROR: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    action: 'Try again later',
  },
  SERVICE_UNAVAILABLE: {
    title: 'Service Unavailable',
    message: 'The service is temporarily unavailable. Please try again later.',
    action: 'Try again later',
  },
  TIMEOUT_ERROR: {
    title: 'Request Timeout',
    message: 'The request took too long to complete. Please try again.',
    action: 'Retry',
  },
  RATE_LIMIT_ERROR: {
    title: 'Too Many Requests',
    message: 'You\'ve made too many requests. Please wait and try again.',
    action: 'Wait and retry',
  },

  // File upload errors
  FILE_TOO_LARGE: {
    title: 'File Too Large',
    message: 'The file you\'re trying to upload is too large.',
    action: 'Use smaller file',
  },
  INVALID_FILE_TYPE: {
    title: 'Invalid File Type',
    message: 'Please upload a file in the supported format.',
    action: 'Check file type',
  },
  UPLOAD_FAILED: {
    title: 'Upload Failed',
    message: 'Failed to upload the file. Please try again.',
    action: 'Retry upload',
  },

  // MRI and analysis errors
  MRI_ANALYSIS_FAILED: {
    title: 'Analysis Failed',
    message: 'The MRI scan could not be analyzed. Please try again or contact support.',
    action: 'Retry analysis',
  },
  INVALID_MRI_FORMAT: {
    title: 'Invalid MRI Format',
    message: 'The MRI scan format is not supported. Please use JPG format.',
    action: 'Convert to JPG',
  },
  AI_SERVICE_UNAVAILABLE: {
    title: 'AI Service Unavailable',
    message: 'The AI analysis service is currently unavailable.',
    action: 'Try again later',
  },

  // Database errors
  DATABASE_ERROR: {
    title: 'Database Error',
    message: 'A database error occurred. Please try again.',
    action: 'Retry operation',
  },
  CONNECTION_FAILED: {
    title: 'Database Connection Failed',
    message: 'Could not connect to the database. Please try again later.',
    action: 'Try again later',
  },

  // Generic fallback errors
  UNKNOWN_ERROR: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred. Please try again or contact support.',
    action: 'Contact support',
  },
  OPERATION_FAILED: {
    title: 'Operation Failed',
    message: 'The operation could not be completed. Please try again.',
    action: 'Retry',
  },
} as const;

// Type for error message keys
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

// Error message interface
export interface ErrorMessage {
  title: string;
  message: string;
  action: string;
}

// Helper function to get error message
export const getErrorMessage = (
  code: string,
  fallbackMessage?: string
): ErrorMessage => {
  const errorKey = code as ErrorMessageKey;
  
  if (errorKey in ERROR_MESSAGES) {
    return ERROR_MESSAGES[errorKey];
  }

  // Return fallback or unknown error
  return {
    title: 'Error',
    message: fallbackMessage || 'An unexpected error occurred.',
    action: 'Try again',
  };
};

// Helper function to get error message by HTTP status
export const getErrorMessageByStatus = (
  status: number,
  fallbackMessage?: string
): ErrorMessage => {
  switch (status) {
    case 400:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case 401:
      return ERROR_MESSAGES.AUTHENTICATION_ERROR;
    case 403:
      return ERROR_MESSAGES.AUTHORIZATION_ERROR;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND_ERROR;
    case 409:
      return ERROR_MESSAGES.CONFLICT_ERROR;
    case 429:
      return ERROR_MESSAGES.RATE_LIMIT_ERROR;
    case 500:
    case 502:
    case 503:
    case 504:
      return ERROR_MESSAGES.SERVER_ERROR;
    case 0:
      return ERROR_MESSAGES.NETWORK_ERROR;
    default:
      return {
        title: 'Error',
        message: fallbackMessage || `Request failed with status ${status}`,
        action: 'Try again',
      };
  }
};

// Validation-specific error messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL: 'Please enter a valid email address',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  PHONE: 'Please enter a valid phone number',
  DATE: 'Please enter a valid date',
  PASSWORD_STRENGTH: 'Password must contain uppercase, lowercase, and numbers',
  CONFIRM_PASSWORD: 'Passwords do not match',
  DEMENTIA_STAGE: 'Please select a valid dementia stage',
  FILE_SIZE: (maxSize: string) => `File size must be less than ${maxSize}`,
  FILE_TYPE: (allowedTypes: string[]) => 
    `File must be one of: ${allowedTypes.join(', ')}`,
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  HOSPITAL_CREATED: 'Hospital created successfully',
  DOCTOR_CREATED: 'Doctor added successfully',
  PATIENT_CREATED: 'Patient and caregiver added successfully',
  MRI_UPLOADED: 'MRI scan uploaded successfully',
  MRI_ANALYZED: 'MRI scan analyzed successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  DATA_SAVED: 'Data saved successfully',
  EMAIL_SENT: 'Email sent successfully',
} as const;

export type SuccessMessageKey = keyof typeof SUCCESS_MESSAGES;
