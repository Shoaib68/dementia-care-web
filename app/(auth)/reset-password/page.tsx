"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Check, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent } from '@/shared/components/ui/card';
import { supabase } from '@/shared/lib/supabase';
import Logo from '@/shared/components/ui/Logo';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get('token_hash') || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // No pre-verification here: we verify the OTP on submit to avoid email client prefetch consuming the token

  // Password validation requirements
  const passwordRequirements = [
    { label: 'At least 8 characters', test: password.length >= 8 },
    { label: 'Contains uppercase letter', test: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', test: /[a-z]/.test(password) },
    { label: 'Contains number', test: /\d/.test(password) },
    { label: 'Contains special character', test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) }
  ];

  const isPasswordValid = passwordRequirements.every(req => req.test);
  const doPasswordsMatch = password === confirmPassword && password.length > 0;
  const canSubmit = isPasswordValid && doPasswordsMatch && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) return;
    
    setErrorMessage('');
    
    // Require token in URL
    if (!tokenHash) {
      setErrorMessage('Invalid or missing reset link. Please use the latest email link.');
      return;
    }

    setLoading(true);

    try {
      // 1) Verify OTP using token hash from URL (type: recovery)
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery',
      });
      if (verifyError) {
        setErrorMessage(verifyError.message);
        setLoading(false);
        return;
      }

      // 2) Update password
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setErrorMessage(updateError.message);
        setLoading(false);
        return;
      }

      // Optional: sign out to force login with new password
      await supabase.auth.signOut();

      setSuccess(true);
      setLoading(false);
    } catch (err: unknown) {
      console.error('Reset password error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // We no longer pre-verify or block the page; token is verified on submit

  // Show success message
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full mx-4 p-8 bg-white rounded-2xl shadow-lg text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="w-16 h-16 bg-teal-50 border-2 border-teal-500 rounded-lg flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-teal-600 stroke-[3]" />
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Password Reset Successful!</h2>
          <p className="text-neutral-600 mb-6">
            Your password has been updated successfully. You can now log in with your new password.
          </p>
          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600"
          >
            Continue to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  // Show reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size={80} className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-neutral-900">Reset Your Password</h1>
          <p className="text-neutral-600 mt-2">
            Create a new password for your account
          </p>
          {/* We purposely do not show email here to avoid leaking info */}
        </div>

        {/* Form Card */}
        <Card className="bg-white/80 backdrop-blur-sm border border-neutral-200/60 shadow-2xl rounded-2xl">
          <CardContent className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800"
                >
                  {errorMessage}
                </motion.div>
              )}

              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-700 font-semibold">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white border-neutral-300"
                    placeholder="Enter new password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-neutral-700 font-semibold">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white border-neutral-300"
                    placeholder="Confirm new password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              {password && (
                <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-neutral-700 mb-2">Password Requirements:</p>
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {req.test ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-neutral-300" />
                      )}
                      <span className={`text-sm ${req.test ? 'text-green-700' : 'text-neutral-500'}`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                  {confirmPassword && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-200">
                      {doPasswordsMatch ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm ${doPasswordsMatch ? 'text-green-700' : 'text-red-600'}`}>
                        Passwords match
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>

              {/* Back to Login */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  disabled={loading}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
