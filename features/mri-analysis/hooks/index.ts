/**
 * MRI Analysis Hooks
 * Centralized exports for all MRI-related React Query hooks
 */

export {
  // Main query hooks
  usePatientMRIScans,
  useMRIScan,
  useAllMRIScans,
  
  // Mutation hooks
  useUploadMRIScan,
  useAnalyzeMRIScan,
  useDeleteMRIScan,
  
  // Utility hooks
  useMRIAnalysisStatus,
  usePatientMRIHistory,
  useMRIError,
  
  // Types
  type MRIFilters,
  type MRIAnalysisResult,
} from './useMRIScans';

// AI Model Analysis hooks (Modal.com deployed model)
export {
  useMRIAnalysis,
  useMRIApiHealth,
  useMRIClasses,
} from './useMRIAnalysis';

export {
  useMRIFeedback,
  type MRIFeedbackPayload,
  type SavedScanResult,
} from './useMRIFeedback';
