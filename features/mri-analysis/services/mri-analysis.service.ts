/**
 * MRI Analysis Service
 *
 * Client-side service that communicates exclusively with our own Next.js API
 * routes — never directly with Modal.com or Gemini.
 *
 * Security model:
 *   MODAL_API_URL  → server-side env var, only accessible in /api/doctor/mri-analysis/classify
 *   GEMINI_API_KEY → server-side env var, only accessible in the same route
 *
 * Flow:  browser → /api/doctor/mri-analysis/classify → Gemini (validate)
 *                                                     → Modal.com  (classify)
 */

import type {
  DementiaClassificationResult,
  MRIHealthCheckResponse,
  MRIClassesResponse,
  MRIAnalysisError,
} from '../types';
import { MRIValidationError } from '../types';

/**
 * MRI Analysis Service class
 */
export class MRIAnalysisService {
  /**
   * Analyze an MRI image for dementia classification.
   *
   * The request is proxied through our server-side API route which:
   *  1. Validates the image with Gemini (is it actually a brain MRI?)
   *  2. If valid, forwards to Modal.com for dementia stage classification
   *
   * @throws MRIValidationError when Gemini determines the image is not a brain MRI
   * @throws Error for any other analysis failure
   */
  static async analyzeImage(file: File): Promise<DementiaClassificationResult> {
    // Client-side guards (fast-fail before a network round-trip)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPG, PNG, or WebP image.');
    }
    if (file.size > 1 * 1024 * 1024) {
      throw new Error('File size too large. Maximum size is 1 MB.');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/doctor/mri-analysis/classify', {
        method: 'POST',
        body: formData,
      });

      // 422 means Gemini rejected the image (not a brain MRI)
      if (response.status === 422) {
        const result = await response.json();
        if (result.type === 'VALIDATION_REJECTED') {
          throw new MRIValidationError(
            result.description || 'This does not appear to be a brain MRI image.',
          );
        }
      }

      if (!response.ok) {
        const result = await response.json().catch(() => ({ error: 'Server error' }));
        throw new Error(result.error || `Server error (${response.status})`);
      }

      const result = await response.json();

      if (
        !result.data ||
        !result.data.prediction ||
        result.data.confidence === undefined ||
        !result.data.all_probabilities
      ) {
        throw new Error('Invalid response from analysis service. Missing required fields.');
      }

      return result.data as DementiaClassificationResult;
    } catch (error) {
      // Always re-throw MRIValidationError as-is so the hook can identify it
      if (error instanceof MRIValidationError) throw error;
      if (error instanceof Error) throw new Error(`MRI Analysis failed: ${error.message}`);
      throw new Error('MRI Analysis failed: Unknown error occurred');
    }
  }

  /**
   * Check if the classification pipeline is reachable.
   * Returns a default healthy response — actual deep health checks happen server-side.
   */
  static async healthCheck(): Promise<MRIHealthCheckResponse> {
    return { status: 'healthy', model: 'DementiaClassifier (Gemini + Modal.com)' };
  }

  /**
   * Return the known dementia classification classes.
   */
  static async getClasses(): Promise<MRIClassesResponse> {
    return { classes: ['Non', 'Mild', 'Moderate', 'Severe'] };
  }

  /**
   * Create a preview URL for the selected file
   * @param file - The file to create a preview for
   * @returns Object URL for the file preview
   */
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke a preview URL to free memory
   * @param url - The URL to revoke
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Format confidence score as percentage
   * @param confidence - The confidence score (0-1)
   * @returns Formatted percentage string
   */
  static formatConfidence(confidence: number): string {
    return `${(confidence * 100).toFixed(1)}%`;
  }

  /**
   * Get the highest probability class from results
   * @param probabilities - All probability scores
   * @returns The class with highest probability
   */
  static getHighestProbabilityClass(probabilities: Record<string, number>): string {
    let highest = { class: '', probability: 0 };
    
    for (const [className, probability] of Object.entries(probabilities)) {
      if (probability > highest.probability) {
        highest = { class: className, probability };
      }
    }
    
    return highest.class;
  }
}

export default MRIAnalysisService;
