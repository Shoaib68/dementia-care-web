'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Check, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { supabase } from '@/shared/lib/supabase';
import Logo from '@/shared/components/ui/Logo';

export default function SetupPasswordPage() {
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

  // Password validation
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

    if (!tokenHash) {
      setErrorMessage('Invalid or missing invitation link. Please request a new invitation from your administrator.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // 1) Verify OTP using token hash from URL (type: invite)
      // Verified on submit (not page load) to prevent email scanners consuming the token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'invite',
      });
      if (verifyError) {
        setErrorMessage(verifyError.message);
        setLoading(false);
        return;
      }

      // 2) Set the user's password
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setErrorMessage(updateError.message);
        setLoading(false);
        return;
      }

      // 3) Sign out so user must log in with new credentials
      await supabase.auth.signOut();

      setSuccess(true);
      setLoading(false);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      console.error('Setup password error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

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
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Password Set Successfully!</h2>
          <p className="text-neutral-600 mb-4">
            Your account is now ready. You will be redirected to login...
          </p>
        </motion.div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-neutral-900">Setup Your Password</h1>
          <p className="text-neutral-600 mt-2">
            Create a secure password for your Dementia Care account
          </p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
            >
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">Error</p>
                <p className="text-sm text-red-700 mt-1 whitespace-pre-line">
                  {errorMessage}
                </p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-700 font-medium">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-neutral-700 font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="Confirm your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && !doPasswordsMatch && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  Passwords do not match
                </p>
              )}
              {confirmPassword && doPasswordsMatch && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-neutral-700 mb-3">Password Requirements:</p>
              {passwordRequirements.map((requirement, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {requirement.test ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-neutral-300" />
                  )}
                  <span className={requirement.test ? 'text-green-700' : 'text-neutral-600'}>
                    {requirement.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-gradient-to-r from-teal-400 to-purple-500 hover:from-teal-500 hover:to-purple-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Setting up your password...
                </>
              ) : (
                'Setup Password & Continue'
              )}
            </Button>
          </form>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-500 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-teal-600 hover:text-teal-700 font-medium">
            Sign in here
          </a>
        </p>
      </motion.div>
    </div>
  );
}
