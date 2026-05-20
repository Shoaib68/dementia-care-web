"use client";

/**
 * MRIFeedbackSection
 * -------------------------------------------------
 * Self-contained feedback form rendered below the AI
 * analysis result on the MRI Analysis page.
 *
 * Responsibilities:
 *  - Lets the doctor verify or correct the AI prediction
 *  - Optionally links the scan to one of their patients
 *  - Accepts optional clinical notes
 *  - Calls useMRIFeedback() to upload the image and persist
 *    the complete record in the mri_scans table
 *  - Shows a success state with Scan ID after saving
 *
 * All UI is built with the shared component library
 * (Button, Textarea, Label, Select, Badge) to stay
 * consistent with the rest of the portal.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button }   from '@/shared/components/ui/button';
import { Badge }    from '@/shared/components/ui/badge';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label }    from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useMRIFeedback }          from '@/features/mri-analysis/hooks/useMRIFeedback';
import { DEMENTIA_STAGE_CONFIG }   from '@/features/mri-analysis/types';
import type {
  DementiaClassificationResult,
  DementiaStage,
} from '@/features/mri-analysis/types';
import type { SavedScanResult }    from '@/features/mri-analysis/hooks/useMRIFeedback';
import type { Patient }            from '@/features/doctor/hooks/usePatients';
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Save,
  User,
  RotateCcw,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MRIFeedbackSectionProps {
  /** AI classification result returned by the Modal.com model */
  analysisResult: DementiaClassificationResult;
  /** The image file the doctor uploaded (required for storage) */
  selectedFile: File;
  /** Doctor's patient list – shown in the optional patient-link dropdown */
  patients?: Patient[];
  /** Called when the doctor presses "Analyze Another Scan" after a save */
  onAnalyzeAnother: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MRIFeedbackSection({
  analysisResult,
  selectedFile,
  patients = [],
  onAnalyzeAnother,
}: MRIFeedbackSectionProps) {
  const feedbackMutation = useMRIFeedback();

  // null  → doctor has not yet answered
  // true  → agrees with AI
  // false → disagrees, must pick actual stage
  const [isCorrect,         setIsCorrect]         = useState<boolean | null>(null);
  const [doctorFinalStage,  setDoctorFinalStage]  = useState<DementiaStage | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [doctorNotes,       setDoctorNotes]       = useState<string>('');
  const [savedResult,       setSavedResult]       = useState<SavedScanResult | null>(null);

  // The stage the doctor ultimately accepts
  const finalStage: DementiaStage | null =
    isCorrect === true ? analysisResult.prediction : doctorFinalStage;

  const canSubmit = isCorrect !== null && finalStage !== null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCorrectClick = useCallback(() => {
    setIsCorrect(true);
    setDoctorFinalStage(null); // clear any previous incorrect selection
  }, []);

  const handleIncorrectClick = useCallback(() => {
    setIsCorrect(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canSubmit || !finalStage) return;

    feedbackMutation.mutate(
      {
        file:              selectedFile,
        aiDiagnosisStage:  analysisResult.prediction,
        aiConfidenceScore: analysisResult.confidence,
        doctorVerified:    isCorrect === true,
        doctorFinalStage:  finalStage,
        doctorNotes:       doctorNotes.trim() || undefined,
        patientId:         selectedPatientId || undefined,
      },
      { onSuccess: (result) => setSavedResult(result) }
    );
  }, [
    canSubmit,
    finalStage,
    selectedFile,
    analysisResult,
    isCorrect,
    doctorNotes,
    selectedPatientId,
    feedbackMutation,
  ]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="border-t border-slate-200 pt-6">
      <AnimatePresence mode="wait">

        {/* ── SUCCESS STATE ─────────────────────────────────────────────── */}
        {savedResult ? (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <div className="w-16 h-16 bg-teal-50 border-2 border-teal-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Check className="w-10 h-10 text-teal-600 stroke-[3]" />
              </div>
              <p className="font-semibold text-green-800 text-lg">Scan &amp; Feedback Saved</p>
              <p className="text-sm text-green-700 mt-1">
                The MRI image has been uploaded and your feedback recorded in the database.
              </p>

              {/* Scan ID chip */}
              <div className="mt-3 inline-flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-1.5">
                <span className="text-xs text-slate-500">Scan ID:</span>
                <span className="text-xs font-mono text-slate-700">{savedResult.scanId}</span>
              </div>

              {/* Feedback status badge */}
              <div className="mt-2">
                <Badge
                  className={`border ${
                    savedResult.feedbackStatus === 'correct'
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : 'bg-orange-100 text-orange-700 border-orange-300'
                  }`}
                >
                  {savedResult.feedbackStatus === 'correct'
                    ? '✓ AI Prediction Verified'
                    : '⚠ Stage Corrected by Doctor'}
                </Badge>
              </div>
            </div>

            <Button
              onClick={onAnalyzeAnother}
              variant="outline"
              className="w-full border-slate-300 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Analyze Another Scan
            </Button>
          </motion.div>

        ) : (

        /* ── FEEDBACK FORM ────────────────────────────────────────────── */
          <motion.div
            key="feedback-form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Section heading */}
            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              Doctor Feedback
            </h4>

            {/* ── Correct / Incorrect toggle ────────────────────────────── */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-600">
                Is the AI prediction correct?
              </Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCorrectClick}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all ${
                    isCorrect === true
                      ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-green-300 hover:bg-green-50/50'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Yes, Correct
                </button>
                <button
                  type="button"
                  onClick={handleIncorrectClick}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all ${
                    isCorrect === false
                      ? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-red-300 hover:bg-red-50/50'
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  No, Incorrect
                </button>
              </div>
            </div>

            {/* ── Actual-stage selector (only when incorrect) ───────────── */}
            <AnimatePresence>
              {isCorrect === false && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-1">
                    <Label className="text-sm font-medium text-slate-700">
                      Select the correct stage:
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Non', 'Mild', 'Moderate', 'Severe'] as DementiaStage[]).map((stage) => {
                        const cfg      = DEMENTIA_STAGE_CONFIG[stage];
                        const selected = doctorFinalStage === stage;
                        return (
                          <button
                            key={stage}
                            type="button"
                            onClick={() => setDoctorFinalStage(stage)}
                            className={`py-2.5 px-3 rounded-lg border-2 text-sm font-medium text-left transition-all ${
                              selected
                                ? `${cfg.borderColor} ${cfg.bgColor} ${cfg.color} shadow-sm`
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Patient selector (optional) ───────────────────────────── */}
            {patients.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  Link to Patient
                  <span className="font-normal text-slate-400">(optional)</span>
                </Label>
                <Select
                  value={selectedPatientId}
                  onValueChange={setSelectedPatientId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="— No patient selected —" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.first_name} {p.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* ── Clinical notes (optional) ─────────────────────────────── */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Clinical Notes
                <span className="ml-1 font-normal text-slate-400">(optional)</span>
              </Label>
              <Textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Add any clinical observations or notes about this scan..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* ── Mutation error banner ─────────────────────────────────── */}
            {feedbackMutation.isError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">
                  {feedbackMutation.error?.message ?? 'Failed to save. Please try again.'}
                </p>
              </motion.div>
            )}

            {/* ── Submit button ─────────────────────────────────────────── */}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || feedbackMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white disabled:opacity-50"
            >
              {feedbackMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Analysis &amp; Feedback
                </>
              )}
            </Button>

            <p className="text-center text-xs text-slate-500">
              This will upload the MRI image and store your feedback in the database.
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

export default MRIFeedbackSection;
