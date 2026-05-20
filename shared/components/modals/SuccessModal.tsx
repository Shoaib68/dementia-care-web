"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Check, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Reusable Success Modal Component
 * 
 * Used for displaying success messages across the application
 * with consistent design and animations.
 * 
 * Features:
 * - Green/teal gradient background (matches create patient style)
 * - Animated checkmark icon
 * - Smooth enter/exit animations
 * - Customizable title, message, and icons
 */
export function SuccessModal({
  isOpen,
  onClose,
  title = "Success!",
  message = "Operation completed successfully.",
  icon: IconComponent = Check,
  actionLabel = "Got It",
  onAction
}: SuccessModalProps) {
  const handleActionClick = () => {
    onAction?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
        <DialogHeader className="text-center pb-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-4"
          >
            <div className="w-16 h-16 bg-teal-50 border-2 border-teal-500 rounded-lg flex items-center justify-center mx-auto">
              <IconComponent className="w-10 h-10 text-teal-600 stroke-[3]" />
            </div>
          </motion.div>
          
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {title}
          </DialogTitle>
          
          <DialogDescription className="text-gray-600 text-base mt-2">
            {message}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-6">
          <Button
            onClick={handleActionClick}
            className="w-full h-11 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SuccessModal;
