'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Mail, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Logo } from '@/shared/components/ui/Logo';
import { useForgotPassword } from '@/features/auth/hooks/usePasswordReset';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { mutate: sendResetEmail, isPending } = useForgotPassword();

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email.trim())) {
      return;
    }

    sendResetEmail(
      { email: email.trim().toLowerCase() },
      {
        onSuccess: (data) => {
          if (data.success) {
            setIsSuccess(true);
          } else {
            setEmailError(data.message);
          }
        },
        onError: (error) => {
          setEmailError('An unexpected error occurred. Please try again.');
          console.error('Forgot password error:', error);
        },
      }
    );
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
          {/* Left: Success message */}
          <div className="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-sm sm:max-w-md"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <Logo 
                    width={120} 
                    height={140} 
                    className="drop-shadow-lg sm:w-20 sm:h-20" 
                    priority={true} 
                  />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-teal-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                  Dementia Care
                </h1>
                <p className="text-sm sm:text-base text-neutral-600">Healthcare Platform</p>
              </div>

              {/* Success Card */}
              <Card className="bg-white/80 backdrop-blur-sm border border-neutral-200/60 shadow-2xl rounded-2xl sm:rounded-3xl">
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="mb-6"
                  >
                    <div className="w-16 h-16 bg-teal-50 border-2 border-teal-500 rounded-lg flex items-center justify-center mx-auto">
                      <Check className="w-10 h-10 text-teal-600 stroke-[3]" />
                    </div>
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-neutral-900 mb-3">
                    Check Your Email
                  </h2>
                  
                  <p className="text-neutral-600 mb-6 leading-relaxed">
                    If an account exists with <span className="font-semibold text-teal-600">{email}</span>, 
                    you will receive password reset instructions shortly.
                  </p>
                  
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 text-left">
                    <p className="text-sm text-teal-800 mb-2">
                      <strong>Next Steps:</strong>
                    </p>
                    <ul className="text-sm text-teal-700 space-y-1 list-disc list-inside">
                      <li>Check your inbox for a password reset email</li>
                      <li>Don&apos;t forget to check your spam folder</li>
                      <li>Click the &quot;Reset Password&quot; button in the email</li>
                      <li>The link works once and expires in 1 hour</li>
                    </ul>
                  </div>
                  
                  <Button
                    onClick={handleBackToLogin}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right: Background image */}
          <div className="hidden lg:block relative overflow-hidden">
            <img
              src="/api/background-image"
              alt="Healthcare Platform Image"
              className="w-full h-full object-cover"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left: Form */}
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10">
          <div className="w-full max-w-sm sm:max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4 sm:mb-6">
                <Logo 
                  width={120} 
                  height={140} 
                  className="drop-shadow-lg sm:w-20 sm:h-20" 
                  priority={true} 
                />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-teal-600 via-purple-600 to-green-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                Dementia Care
              </h1>
              <p className="text-sm sm:text-base text-neutral-600">Healthcare Platform</p>
            </div>

            {/* Card */}
            <Card className="bg-white/80 backdrop-blur-sm border border-neutral-200/60 shadow-2xl rounded-2xl sm:rounded-3xl">
              <CardHeader className="pb-2 px-4 sm:px-6">
                <CardTitle className="text-xl sm:text-2xl text-center text-neutral-800">
                  Forgot Password?
                </CardTitle>
                <CardDescription className="text-center text-neutral-600 text-sm sm:text-base">
                  Enter your email address and we&apos;ll send you instructions to reset your password
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-neutral-700 font-semibold text-sm tracking-wide">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${
                        emailError ? 'text-red-500' : 'text-neutral-500 group-focus-within:text-teal-500'
                      }`} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={handleEmailChange}
                        className={`pl-12 pr-4 py-2.5 sm:py-3 bg-white/70 border rounded-xl text-neutral-900 placeholder-neutral-400 text-sm sm:text-base ${
                          emailError
                            ? 'border-red-400/60 focus:border-red-500/80 focus:ring-red-500/20'
                            : 'border-neutral-300/60 focus:border-teal-400/60 focus:ring-teal-400/20'
                        }`}
                        required
                        disabled={isPending}
                        aria-invalid={!!emailError}
                        aria-describedby={emailError ? 'email-error' : undefined}
                      />
                    </div>
                    {emailError && (
                      <p id="email-error" className="text-sm text-red-600 mt-1">
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isPending || !email}
                    className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-teal-500 to-purple-500 hover:from-teal-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>

                  {/* Back to Login */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      disabled={isPending}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Background image */}
        <div className="hidden lg:block relative overflow-hidden">
          <img
            src="/api/background-image"
            alt="Healthcare Platform Image"
            className="w-full h-full object-cover"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        </div>
      </div>
    </div>
  );
}
