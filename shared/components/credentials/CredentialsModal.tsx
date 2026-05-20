"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/shared/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Copy, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  Download,
  Shield,
  Key
} from 'lucide-react';
import { GeneratedCredentials } from '@/features/auth/types';

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: GeneratedCredentials;
  userType: 'Hospital Admin' | 'Doctor' | 'Patient' | 'Caregiver';
  title?: string;
  subtitle?: string;
}

export default function CredentialsModal({
  isOpen,
  onClose,
  credentials,
  userType,
  title = "Credentials Generated Successfully",
  subtitle = "Save these credentials securely. They will not be displayed again."
}: CredentialsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const downloadCredentials = () => {
    const credentialText = `
${userType} Account Credentials
================================

Email: ${credentials.email}
Password: ${credentials.password}
User ID: ${credentials.userId}

Generated on: ${new Date().toLocaleString()}

IMPORTANT: Store these credentials securely. 
The password cannot be recovered if lost.
    `.trim();

    const blob = new Blob([credentialText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${userType.toLowerCase().replace(' ', '-')}-credentials-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog key="credentials-dialog" open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-green-50/90 via-emerald-50/80 to-teal-50/90 backdrop-blur-sm border-0 shadow-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <DialogHeader className="text-center pb-6">
                <DialogTitle className="flex items-center justify-center gap-4 text-2xl font-bold text-gray-900">
                  <motion.div 
                    className="w-14 h-14 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-green-500/30"
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <CheckCircle className="h-7 w-7 text-white" />
                  </motion.div>
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    {title}
                  </motion.span>
                </DialogTitle>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <DialogDescription className="text-gray-600 text-base mt-3 max-w-md mx-auto">
                    {subtitle}
                  </DialogDescription>
                </motion.div>
              </DialogHeader>

              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {/* Warning Alert */}
                <motion.div 
                  className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5 shadow-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      animate={{ rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-medium text-amber-800">Important Security Notice</p>
                      <p className="text-sm text-amber-700 mt-1">
                        Save these credentials immediately. For security reasons, passwords cannot be retrieved later.
                        The user should change their password after first login.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* User Type Badge */}
                <motion.div 
                  className="flex justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                >
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-sm px-4 py-2 hover:scale-105 transition-all duration-200">
                    <Shield className="h-4 w-4 mr-2" />
                    {userType} Account
                  </Badge>
                </motion.div>

                {/* Credentials Display */}
                <motion.div 
                  className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 }}
                >
                  <div className="space-y-4">
                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        Email Address
                      </label>
                      <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-sm font-mono break-all text-gray-800">{credentials.email}</span>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(credentials.email, 'email')}
                            className="ml-2 p-2 h-8 w-8 hover:bg-green-100 hover:text-green-700"
                          >
                            <AnimatePresence mode="wait">
                              {copiedField === 'email' ? (
                                <motion.div
                                  key="check"
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 180 }}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="copy"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                >
                                  <Copy className="h-4 w-4" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Button>
                        </motion.div>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                        <Key className="h-3 w-3" />
                        Temporary Password
                      </label>
                      <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-sm font-mono break-all text-gray-800">
                          {showPassword ? credentials.password : '••••••••••••'}
                        </span>
                        <div className="flex items-center ml-2 space-x-1">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowPassword(!showPassword)}
                              className="p-2 h-8 w-8 hover:bg-blue-100 hover:text-blue-700"
                            >
                              <AnimatePresence mode="wait">
                                {showPassword ? (
                                  <motion.div
                                    key="hide"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                  >
                                    <EyeOff className="h-4 w-4" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="show"
                                    initial={{ scale: 0, rotate: 180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: -180 }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </Button>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(credentials.password, 'password')}
                              className="p-2 h-8 w-8 hover:bg-green-100 hover:text-green-700"
                            >
                              <AnimatePresence mode="wait">
                                {copiedField === 'password' ? (
                                  <motion.div
                                    key="check"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="copy"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* User ID */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        User ID (Technical Reference)
                      </label>
                      <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                        <span className="text-xs font-mono text-gray-600 break-all">
                          {credentials.userId}
                        </span>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(credentials.userId, 'userId')}
                            className="ml-2 p-2 h-8 w-8 hover:bg-green-100 hover:text-green-700"
                          >
                            <AnimatePresence mode="wait">
                              {copiedField === 'userId' ? (
                                <motion.div
                                  key="check"
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 180 }}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="copy"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                >
                                  <Copy className="h-4 w-4" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.0 }}
              >
                <DialogFooter className="gap-3 pt-6 border-t border-white/20">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full"
                  >
                    <Button
                      onClick={downloadCredentials}
                      variant="outline"
                      className="w-full h-11 border-gray-300 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Credentials
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full"
                  >
                    <Button
                      onClick={onClose}
                      className="w-full h-11 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      I Have Saved The Credentials
                    </Button>
                  </motion.div>
                </DialogFooter>

                {/* Footer Note */}
                <motion.div 
                  className="text-xs text-gray-500 text-center pt-4 border-t border-gray-200/50 mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 1.2 }}
                >
                  Generated on {new Date().toLocaleString()}
                </motion.div>
              </motion.div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
