"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/shared/components/ui/Logo';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthErrorMessage } from '@/shared/components/auth/AuthErrorMessage';
import { schemas } from '@/shared/lib/validation';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const { 
    user, 
    loading, 
    authError, 
    login, 
    redirectToDashboard, 
    clearAuthError,
    getErrorMessage,
    isFieldError 
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      redirectToDashboard();
    }
  }, [user, redirectToDashboard]);

  // Clear errors when user starts typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear previous errors
    clearAuthError();
    setValidationErrors(prev => ({ ...prev, email: undefined }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    // Clear previous errors
    clearAuthError();
    setValidationErrors(prev => ({ ...prev, password: undefined }));
  };

  // Client-side validation
  const validateForm = (): boolean => {
    const validation = schemas.login.safeParse({ email: email.trim(), password });
    
    if (!validation.success) {
      const errors: { email?: string; password?: string } = {};
      
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === 'email' || field === 'password') {
          errors[field as keyof typeof errors] = issue.message;
        }
      });
      
      setValidationErrors(errors);
      return false;
    }
    
    setValidationErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors({});
    
    // Validate form first
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        // Keep loading state true, don't set to false - let the redirect happen
        redirectToDashboard();
        return; // Don't execute finally block
      }
      // Error handling is managed by the auth store and hook
    } catch (error) {
      console.error('Unexpected error during login:', error);
      setIsLoading(false);
    }
    
    // Only set loading to false if login failed
    setIsLoading(false);
  };

  // Show loading screen during auth check, form submission, OR when user exists (redirecting)
  if (loading || isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <Logo width={200} height={250} className="drop-shadow-lg" priority />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left: Auth form */}
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
                <CardTitle className="text-xl sm:text-2xl text-center text-neutral-800">Welcome Back</CardTitle>
                <CardDescription className="text-center text-neutral-600 text-sm sm:text-base">
                  Sign in to access your dashboard
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
                        validationErrors.email || (authError && isFieldError('email')) ? 'text-red-500' : 'text-neutral-500 group-focus-within:text-teal-500'
                      }`} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={handleEmailChange}
                        autoComplete="off"
                        className={`pl-12 pr-4 py-2.5 sm:py-3 bg-white/70 border rounded-xl text-neutral-900 placeholder-neutral-400 text-sm sm:text-base ${
                          validationErrors.email || (authError && isFieldError('email'))
                            ? 'border-red-400/60 focus:border-red-500/80 focus:ring-red-500/20'
                            : 'border-neutral-300/60 focus:border-teal-400/60 focus:ring-teal-400/20'
                        }`}
                        required
                        disabled={isLoading}
                        aria-invalid={!!(validationErrors.email || (authError && isFieldError('email')))}
                        aria-describedby={validationErrors.email ? 'email-error' : undefined}
                      />
                    </div>
                  </div>
                  
                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-neutral-700 font-semibold text-sm tracking-wide">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={() => router.push('/forgot-password')}
                        className="text-xs sm:text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
                        disabled={isLoading}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${
                        validationErrors.password || (authError && isFieldError('password')) ? 'text-red-500' : 'text-neutral-500 group-focus-within:text-teal-500'
                      }`} />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={handlePasswordChange}
                        autoComplete="off"
                        className={`pl-12 pr-12 py-2.5 sm:py-3 bg-white/70 border rounded-xl text-neutral-900 placeholder-neutral-400 text-sm sm:text-base ${
                          validationErrors.password || (authError && isFieldError('password'))
                            ? 'border-red-400/60 focus:border-red-500/80 focus:ring-red-500/20'
                            : 'border-neutral-300/60 focus:border-teal-400/60 focus:ring-teal-400/20'
                        }`}
                        required
                        disabled={isLoading}
                        aria-invalid={!!(validationErrors.password || (authError && isFieldError('password')))}
                        aria-describedby={validationErrors.password ? 'password-error' : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  <AuthErrorMessage error={authError} onDismiss={clearAuthError} />

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-500 to-purple-600 hover:from-teal-600 hover:to-purple-700 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-white/30 animate-pulse" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center mt-6 sm:mt-8 text-neutral-500 text-xs sm:text-sm">
              Secure access to healthcare management platform
            </div>
          </div>
        </div>

        {/* Right: Image only */}
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
