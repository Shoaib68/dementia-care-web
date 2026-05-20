/**
 * MRI Analysis Types
 * Types for the dementia classification AI model integration
 */

// Modal.com API response types
export interface DementiaClassificationResult {
  prediction: DementiaStage;
  confidence: number;
  all_probabilities: DementiaProbabilities;
}

export interface DementiaProbabilities {
  Non: number;
  Mild: number;
  Moderate: number;
  Severe: number;
}

export type DementiaStage = 'Non' | 'Mild' | 'Moderate' | 'Severe';

// API error response
export interface MRIAnalysisError {
  error: string;
  traceback?: string;
}

// Health check response
export interface MRIHealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  model: string;
}

// Classes response
export interface MRIClassesResponse {
  classes: DementiaStage[];
}

// Analysis request/response for internal use
export interface AnalyzeMRIRequest {
  file: File;
  patientId?: string;
  notes?: string;
}

export interface MRIAnalysisState {
  isAnalyzing: boolean;
  result: DementiaClassificationResult | null;
  error: string | null;
  selectedFile: File | null;
  previewUrl: string | null;
}

// For storing analysis history
export interface MRIAnalysisRecord {
  id: string;
  patientId?: string;
  patientName?: string;
  analysisDate: string;
  prediction: DementiaStage;
  confidence: number;
  allProbabilities: DementiaProbabilities;
  imageUrl?: string;
  notes?: string;
  analyzedBy: string;
}

// Feedback loop types
export type FeedbackStatus = 'correct' | 'incorrect';

export interface SavedMRIScan {
  scanId: string;
  fileUrl: string;
  feedbackStatus: FeedbackStatus;
}

/**
 * Thrown when Gemini determines the uploaded image is not a brain MRI.
 * Carries the short AI-generated description of what the image actually is.
 * Hooks check `instanceof MRIValidationError` to distinguish this from real errors.
 */
export class MRIValidationError extends Error {
  public readonly type = 'VALIDATION_REJECTED' as const;
  public readonly description: string;

  constructor(description: string) {
    super(`Not a brain MRI image: ${description}`);
    this.name = 'MRIValidationError';
    this.description = description;
  }
}

// Stage styling configuration
export interface StageConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

export const DEMENTIA_STAGE_CONFIG: Record<DementiaStage, StageConfig> = {
  Non: {
    label: 'Non-Demented',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'No signs of dementia detected'
  },
  Mild: {
    label: 'Mild Dementia',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: 'Early-stage cognitive impairment'
  },
  Moderate: {
    label: 'Moderate Dementia',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'Significant cognitive decline'
  },
  Severe: {
    label: 'Severe Dementia',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Advanced cognitive impairment'
  }
};
