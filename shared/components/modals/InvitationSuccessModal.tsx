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
import { Check, Mail, Send, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface InvitationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitations: {
    email: string;
    role: string;
  }[];
  title?: string;
  message?: string;
}

export function InvitationSuccessModal({
  isOpen,
  onClose,
  invitations,
  title = "Invitation Email Sent!",
  message = "An invitation email has been sent successfully."
}: InvitationSuccessModalProps) {
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
              <Check className="w-10 h-10 text-teal-600 stroke-[3]" />
            </div>
          </motion.div>
          
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {title}
          </DialogTitle>
          
          <DialogDescription className="text-gray-600 text-base mt-2">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invitation Details */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
            <div className="space-y-3">
              {invitations.map((invitation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-100"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Send className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {invitation.role}
                    </p>
                    <p className="text-sm text-gray-600 break-all">
                      {invitation.email}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Next Steps</p>
                <p className="text-sm text-blue-700 mt-1">
                  {invitations.length > 1 ? 'They' : 'The user'} will receive an email with a secure link to set up {invitations.length > 1 ? 'their' : 'their'} password and access the system.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full h-11 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            Got It
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default InvitationSuccessModal;
