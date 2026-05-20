"use client";

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { PageHeader } from '@/shared/components/common/PageHeader';
import { useMRIAnalysis } from '@/features/mri-analysis/hooks';
import { usePatients }    from '@/features/doctor/hooks/usePatients';
import { useAuthStore }   from '@/shared/store/authStore';
import { DEMENTIA_STAGE_CONFIG, type DementiaStage } from '@/features/mri-analysis/types';
import { MRIAnalysisService }   from '@/features/mri-analysis/services/mri-analysis.service';
import { MRIFeedbackSection }   from '@/shared/components/mri/MRIFeedbackSection';
import { 
  Brain,
  Upload,
  FileImage,
  AlertCircle,
  Trash2,
  Activity,
  TrendingUp,
  Info,
  RefreshCw,
  Zap,
} from 'lucide-react';

// Optimized animation variants - reduced complexity
const pageContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const pageItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
};

export default function MRIAnalysisPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Auth – needed to seed the patients query
  const user = useAuthStore((s) => s.user);

  // Use the MRI analysis hook
  const {
    selectedFile,
    previewUrl,
    handleFileSelect,
    fileSizeError,
    isAnalyzing,
    analysisResult,
    validationRejection,
    analysisError,
    analyzeImage,
    clearAnalysis
  } = useMRIAnalysis();

  // Patient list for the optional patient-link dropdown inside MRIFeedbackSection
  const { data: patients = [] } = usePatients(
    { doctorId: user?.id },
    { enabled: !!user?.id }
  );

  // Full reset: clear image + analysis so doctor can start fresh
  const handleAnalyzeAnother = useCallback(() => {
    clearAnalysis();
  }, [clearAnalysis]);

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle upload area click
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle analyze button click
  const handleAnalyze = useCallback(async () => {
    try {
      await analyzeImage();
    } catch {
      // All error states (analysisError, validationRejection) are managed by the
      // hook and surfaced in the UI. No console logging needed here.
    }
  }, [analyzeImage]);

  // Get stage configuration for display
  const getStageConfig = (stage: DementiaStage) => {
    return DEMENTIA_STAGE_CONFIG[stage] || DEMENTIA_STAGE_CONFIG.Non;
  };

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={pageContainerVariants}
    >
      <PageHeader
        title="MRI Analysis"
        subtitle="AI-powered dementia classification using deep learning"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <motion.div variants={pageItemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="h-5 w-5 text-purple-600" />
                Upload MRI Scan
              </CardTitle>
              <CardDescription>
                Upload a brain MRI image for dementia classification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <motion.div
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                  transition-all duration-300 ease-in-out
                  ${isDragging 
                    ? 'border-purple-500 bg-purple-50 scale-[1.02]' 
                    : 'border-slate-300 bg-slate-50 hover:border-purple-400 hover:bg-purple-50/50'
                  }
                  ${selectedFile ? 'opacity-60' : ''}
                `}
                onClick={handleUploadClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                whileHover={{ scale: selectedFile ? 1 : 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                <motion.div
                  animate={{ y: isDragging ? -5 : 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-purple-500' : 'text-slate-400'}`} />
                  <p className="font-medium text-slate-700">
                    {isDragging ? 'Drop your image here' : 'Click or drag MRI image here'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    JPG, PNG, WebP
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Max size: 1 MB
                  </p>
                </motion.div>
              </motion.div>

              {/* File-size error — shown immediately when an oversized file is picked */}
              <AnimatePresence>
                {fileSizeError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-800">File too large</p>
                      <p className="text-xs text-red-600 mt-0.5 break-words">{fileSizeError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Image Preview */}
              <AnimatePresence>
                {previewUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-lg">
                      <img
                        src={previewUrl}
                        alt="MRI Preview"
                        className="w-full h-64 object-contain bg-black"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="text-white text-sm font-medium truncate">
                          {selectedFile?.name}
                        </p>
                        <p className="text-white/70 text-xs">
                          {selectedFile && (selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !selectedFile}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          'Analyze Image'
                        )}
                      </Button>
                      <Button
                        onClick={clearAnalysis}
                        variant="outline"
                        className="border-slate-300 hover:bg-slate-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              <AnimatePresence>
                {analysisError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Analysis Failed</p>
                        <p className="text-sm text-red-600 mt-1">{analysisError}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Section */}
        <motion.div variants={pageItemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Analysis Results
              </CardTitle>
              <CardDescription>
                AI-powered dementia classification results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
              {isAnalyzing ? (
                  /* ── Loading state ── */
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-pulse" />
                      <div className="absolute inset-0 w-16 h-16 border-4 border-purple-600 rounded-full animate-spin border-t-transparent" />
                    </div>
                    <p className="mt-4 text-slate-600 font-medium">Analyzing MRI scan...</p>
                    <p className="text-sm text-slate-500">Validating image and running AI classification</p>
                  </motion.div>

                ) : analysisResult ? (
                  /* ── Result + Feedback ── */
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Main Prediction */}
                    <div className={`p-6 rounded-xl border-2 ${getStageConfig(analysisResult.prediction).bgColor} ${getStageConfig(analysisResult.prediction).borderColor}`}>
                      <span className="text-sm font-medium text-slate-600 uppercase tracking-wide">Prediction Result</span>
                      <h3 className={`text-3xl font-bold mt-2 ${getStageConfig(analysisResult.prediction).color}`}>
                        {getStageConfig(analysisResult.prediction).label}
                      </h3>
                      <p className="text-slate-600 mt-1">
                        {getStageConfig(analysisResult.prediction).description}
                      </p>
                    </div>

                    {/* Confidence Score */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Confidence Score</span>
                        <span className="text-lg font-bold text-purple-600">
                          {MRIAnalysisService.formatConfidence(analysisResult.confidence)}
                        </span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${analysisResult.confidence * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {/* All Probabilities */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        All Probabilities
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(analysisResult.all_probabilities).map(([stage, probability]) => {
                          const stageKey = stage as DementiaStage;
                          const config = getStageConfig(stageKey);
                          return (
                            <motion.div
                              key={stage}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                              <span className={`font-medium ${config.color}`}>{config.label}</span>
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <motion.div
                                    className={`h-full rounded-full ${
                                      stageKey === analysisResult.prediction
                                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                                        : 'bg-slate-400'
                                    }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${probability * 100}%` }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-slate-700 w-14 text-right">
                                  {MRIAnalysisService.formatConfidence(probability)}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Medical Disclaimer */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800">Medical Disclaimer</p>
                          <p className="text-sm text-amber-700 mt-1">
                            This AI analysis is intended to assist medical professionals and should not
                            be used as the sole basis for diagnosis. Always consult with qualified
                            healthcare providers for medical decisions.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ── Doctor Feedback (extracted reusable component) ── */}
                    <MRIFeedbackSection
                      analysisResult={analysisResult}
                      selectedFile={selectedFile!}
                      patients={patients}
                      onAnalyzeAnother={handleAnalyzeAnother}
                    />

                  </motion.div>

                ) : validationRejection ? (
                  /* ── Validation rejection: Gemini says it's not a brain MRI ── */
                  <motion.div
                    key="validation-rejected"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col items-center justify-center py-10 text-center"
                  >
                    {/* Warning icon */}
                    <div className="p-4 bg-amber-100 rounded-full mb-5">
                      <AlertCircle className="h-12 w-12 text-amber-500" />
                    </div>

                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      Not a Brain MRI Scan
                    </h3>

                    {/* What Gemini identified — 2-sentence description */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-5 max-w-sm w-full text-left">
                      <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">
                        AI analysis:
                      </p>
                      <p className="text-sm text-amber-900 leading-relaxed">
                        {validationRejection}
                      </p>
                    </div>

                    <p className="text-sm text-slate-500 max-w-sm mb-6">
                      Please upload a valid brain MRI scan image to run the dementia
                      classification analysis.
                    </p>

                    <button
                      onClick={clearAnalysis}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100 font-medium text-sm transition-all"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Upload Different Image
                    </button>
                  </motion.div>

                ) : (
                  /* ── Empty state ── */
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="p-4 bg-slate-100 rounded-full mb-4">
                      <Brain className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700">No Analysis Yet</h3>
                    <p className="text-slate-500 mt-2 max-w-sm">
                      Upload an MRI scan image and click &quot;Analyze Image&quot; to get
                      AI-powered dementia classification results.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>

    </motion.div>
  );
}
