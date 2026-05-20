"use client";

import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { LucideIcon, AlertTriangle, Loader2 } from 'lucide-react';

interface DeletionData {
  doctors?: number;
  patients?: number;
  medicalNotes?: number;
  mriScans?: number;
  gameSessions?: number;
  schedules?: number;
}

interface AdvancedConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  warningMessage: string;
  confirmationText: string; // The exact text user must type
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmIcon?: LucideIcon;
  isLoading?: boolean;
  loadingText?: string;
  deletionData?: DeletionData; // Data that will be deleted
}

export const AdvancedConfirmationDialog: React.FC<AdvancedConfirmationDialogProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  warningMessage,
  confirmationText,
  confirmButtonText = 'Delete Permanently',
  cancelButtonText = 'Cancel',
  onConfirm,
  onCancel,
  confirmIcon: ConfirmIcon,
  isLoading = false,
  loadingText = 'Deleting...',
  deletionData,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isConfirmEnabled, setIsConfirmEnabled] = useState(false);

  // Reset input when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
      setIsConfirmEnabled(false);
    }
  }, [isOpen]);

  // Check if input matches confirmation text
  useEffect(() => {
    setIsConfirmEnabled(inputValue === confirmationText);
  }, [inputValue, confirmationText]);

  const handleCancel = () => {
    if (!isLoading) {
      setInputValue('');
      onCancel?.();
      onOpenChange(false);
    }
  };

  const handleConfirm = () => {
    if (!isLoading && isConfirmEnabled) {
      onConfirm();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const getTotalAffectedRecords = () => {
    if (!deletionData) return 0;
    return Object.values(deletionData).reduce((sum, count) => {
      const numValue = Number(count) || 0;
      return sum + numValue;
    }, 0);
  };

  // Helper function to safely format numbers
  const formatNumber = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return 0;
    }
    return Number(value);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 px-6">
          {/* Warning Alert */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {warningMessage}
            </AlertDescription>
          </Alert>

          {/* Data Impact Summary */}
          {deletionData && getTotalAffectedRecords() > 0 && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="font-medium text-gray-900 mb-2">
                This will permanently delete:
              </div>
              <ul className="space-y-1 text-sm text-gray-700">
                {formatNumber(deletionData.doctors) > 0 && (
                  <li>• {formatNumber(deletionData.doctors)} doctor{formatNumber(deletionData.doctors) !== 1 ? 's' : ''}</li>
                )}
                {formatNumber(deletionData.patients) > 0 && (
                  <li>• {formatNumber(deletionData.patients)} patient{formatNumber(deletionData.patients) !== 1 ? 's' : ''}</li>
                )}
                {formatNumber(deletionData.medicalNotes) > 0 && (
                  <li>• {formatNumber(deletionData.medicalNotes)} medical note{formatNumber(deletionData.medicalNotes) !== 1 ? 's' : ''}</li>
                )}
                {formatNumber(deletionData.mriScans) > 0 && (
                  <li>• {formatNumber(deletionData.mriScans)} MRI scan{formatNumber(deletionData.mriScans) !== 1 ? 's' : ''}</li>
                )}
                {formatNumber(deletionData.gameSessions) > 0 && (
                  <li>• {formatNumber(deletionData.gameSessions)} game session{formatNumber(deletionData.gameSessions) !== 1 ? 's' : ''}</li>
                )}
                {formatNumber(deletionData.schedules) > 0 && (
                  <li>• {formatNumber(deletionData.schedules)} schedule{formatNumber(deletionData.schedules) !== 1 ? 's' : ''}</li>
                )}
              </ul>
              <div className="font-medium text-gray-900 mt-2">
                Total: {getTotalAffectedRecords()} record{getTotalAffectedRecords() !== 1 ? 's' : ''}
              </div>
            </div>
          )}

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmation-input" className="text-sm font-medium">
              Type <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-red-600">
                {confirmationText}
              </span> to confirm deletion:
            </Label>
            <Input
              id="confirmation-input"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={`Type "${confirmationText}" here`}
              disabled={isLoading}
              className={`border-2 ${
                inputValue.length > 0
                  ? isConfirmEnabled
                    ? 'border-green-300 bg-green-50'
                    : 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
              autoComplete="off"
            />
            {inputValue.length > 0 && !isConfirmEnabled && (
              <div className="text-sm text-red-600">
                Text doesn't match. Please type exactly: {confirmationText}
              </div>
            )}
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelButtonText}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmEnabled || isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{loadingText}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {ConfirmIcon && <ConfirmIcon className="h-4 w-4" />}
                <span>{confirmButtonText}</span>
              </div>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AdvancedConfirmationDialog;
