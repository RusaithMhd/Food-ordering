'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { createClient } from '@/lib/supabase/browser';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Hotel, Mail, Lock, User, Phone, ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react';
import { 
  signUpWithEmail, 
  signInWithEmail, 
  sendEmailOtp, 
  verifyEmailOtp, 
  requestPasswordReset,
  resendVerificationEmail 
} from '@/actions/auth/supabase';

type Mode = 'LOGIN' | 'REGISTER' | 'OTP' | 'FORGOT_PASSWORD' | 'UNCONFIRMED_EMAIL';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const { user, userRole, loading } = useAuth();
  const supabase = createClient();

  // Mode state
  const [mode, setMode] = useState<Mode>('LOGIN');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP states
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !loading) {
      if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'MANAGER') {
        window.location.href = '/admin';
      } else if (userRole === 'KITCHEN') {
        window.location.href = '/kitchen';
      } else if (userRole === 'DELIVERY') {
        window.location.href = '/delivery';
      } else {
        window.location.href = redirectPath;
      }
    }
  }, [user, userRole, loading, redirectPath]);

  // Handle countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    clearMessages();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(`Google sign-in failed: ${err.message || err}`);
      setIsLoading(false);
    }
  };

  // Email + Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();

    try {
      const res = await signInWithEmail({ email, password });
      if (res.success) {
        // Redirect handled by AuthProvider state change listener
      } else {
        if (res.isUnconfirmed) {
          setMode('UNCONFIRMED_EMAIL');
        }
        setErrorMsg(res.error || 'Login failed.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMsg('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await signUpWithEmail({
        email,
        fullName,
        phone: phoneNumber,
        password,
      });

      if (res.success) {
        if (res.sessionRequired) {
          setMode('UNCONFIRMED_EMAIL');
          setSuccessMsg(res.message);
        } else {
          setSuccessMsg('Registration successful!');
        }
      } else {
        setErrorMsg(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMsg('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password Link Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();

    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setSuccessMsg('Recovery email sent. Please check your inbox.');
      } else {
        setErrorMsg(res.error || 'Failed to send reset link.');
      }
    } catch (err: any) {
      setErrorMsg('Reset request failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send OTP Flow
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();

    try {
      const res = await sendEmailOtp(email);
      if (res.success) {
        setMode('OTP');
        setOtpCode(['', '', '', '', '', '']);
        setCooldown(60); // 60s cooldown
        setSuccessMsg('Verification code sent to your email.');
      } else {
        setErrorMsg(res.error || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setErrorMsg('Request failed. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP Flow
  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    clearMessages();

    try {
      const res = await sendEmailOtp(email);
      if (res.success) {
        setCooldown(60);
        setOtpCode(['', '', '', '', '', '']);
        setSuccessMsg('A new verification code has been sent.');
      } else {
        setErrorMsg(res.error || 'Resend failed.');
      }
    } catch (err: any) {
      setErrorMsg('Request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Signup Verification Email
  const handleResendVerification = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    clearMessages();

    try {
      const res = await resendVerificationEmail(email);
      if (res.success) {
        setCooldown(60);
        setSuccessMsg('Verification link resent. Please check your inbox.');
      } else {
        setErrorMsg(res.error || 'Resend failed.');
      }
    } catch (err: any) {
      setErrorMsg('Request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Verification Input handling
  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim().slice(0, 6);
    if (!/^\d+$/.test(pasteData)) return;

    const digits = pasteData.split('');
    const newOtp = [...otpCode];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = digits[i] || '';
    }
    setOtpCode(newOtp);
    otpInputsRef.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpCode.join('');
    if (code.length < 6) {
      setErrorMsg('Please enter the complete 6-digit code.');
      return;
    }
    setIsLoading(true);
    clearMessages();

    try {
      const res = await verifyEmailOtp(email, code);
      if (res.success) {
        // Handled by AuthProvider listener redirect
      } else {
        setErrorMsg(res.error || 'Invalid code.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMsg('Verification failed.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#FAFAFA] font-sans selection:bg-indigo-200 selection:text-indigo-900">
      {/* Background blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-indigo-100/40 to-blue-100/40 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-rose-100/40 to-amber-100/40 blur-3xl" />
      
      <div className="w-full max-w-md p-6 relative z-10">
        <div className="bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-lg shadow-slate-200">
              <Hotel className="h-8 w-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
              {mode === 'LOGIN' && 'Welcome Back'}
              {mode === 'REGISTER' && 'Create Account'}
              {mode === 'OTP' && 'Verify Code'}
              {mode === 'FORGOT_PASSWORD' && 'Reset Password'}
              {mode === 'UNCONFIRMED_EMAIL' && 'Verify Email'}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 font-semibold">
              {mode === 'LOGIN' && 'Sign in to your Atheef Hotel account'}
              {mode === 'REGISTER' && 'Register to place and track orders'}
              {mode === 'OTP' && `We sent a 6-digit code to ${email}`}
              {mode === 'FORGOT_PASSWORD' && 'Enter email to receive password reset link'}
              {mode === 'UNCONFIRMED_EMAIL' && `Please confirm verification sent to ${email}`}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold text-left animate-in fade-in duration-200">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-xs font-bold text-left animate-in fade-in duration-200">
              {successMsg}
            </div>
          )}

          {/* Form Content */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 transition-all font-semibold text-slate-950" 
                    placeholder="name@domain.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  <button 
                    type="button" 
                    onClick={() => setMode('FORGOT_PASSWORD')}
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-600 hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 transition-all font-semibold text-slate-950" 
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-13 rounded-2xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={(e) => { clearMessages(); setMode('OTP'); }}
                  className="h-13 rounded-2xl border-slate-200 hover:bg-slate-50 font-bold text-xs"
                >
                  <KeyRound className="w-4 h-4 mr-2 text-indigo-500" />
                  Code / OTP
                </Button>
                
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="h-13 rounded-2xl border-slate-200 hover:bg-slate-50 font-bold text-xs"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
              </div>

              <div className="text-center pt-4">
                <p className="text-slate-400 text-xs font-semibold">
                  Don't have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => { clearMessages(); setMode('REGISTER'); }}
                    className="text-indigo-500 hover:text-indigo-600 font-bold hover:underline"
                  >
                    Register Now
                  </button>
                </p>
              </div>
            </form>
          )}

          {mode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 transition-all font-semibold text-slate-950" 
                    placeholder="Jane Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 transition-all font-semibold text-slate-950" 
                    placeholder="name@domain.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 transition-all font-semibold text-slate-950" 
                    placeholder="0770802365"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Password (6+ chars)</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 transition-all font-semibold text-slate-950" 
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 transition-all font-semibold text-slate-950" 
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-13 rounded-2xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all"
              >
                {isLoading ? 'Creating Account...' : 'Register'}
              </Button>

              <div className="text-center pt-4">
                <button 
                  type="button" 
                  onClick={() => { clearMessages(); setMode('LOGIN'); }}
                  className="text-xs font-bold text-slate-500 hover:text-indigo-500 flex items-center justify-center mx-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Sign In
                </button>
              </div>
            </form>
          )}

          {mode === 'OTP' && (
            <div className="space-y-6">
              {/* Send Email Box if not entered yet */}
              {!cooldown ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 transition-all font-semibold text-slate-950" 
                        placeholder="name@domain.com"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-13 rounded-2xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all"
                  >
                    {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleOtpVerify} className="space-y-6">
                  {/* 6 digit OTP boxes */}
                  <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                    {otpCode.map((digit, idx) => (
                      <input 
                        key={idx}
                        ref={(el) => { otpInputsRef.current[idx] = el; }}
                        type="text" 
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        className="w-12 h-14 text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-950"
                      />
                    ))}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-13 rounded-2xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all"
                  >
                    {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                  </Button>

                  <div className="text-center pt-2 flex flex-col items-center space-y-2">
                    {cooldown > 0 ? (
                      <span className="text-xs text-slate-400 font-bold">Resend code in {cooldown}s</span>
                    ) : (
                      <button 
                        type="button" 
                        onClick={handleResendOtp}
                        className="text-xs font-bold text-indigo-500 hover:underline"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </form>
              )}

              <div className="text-center pt-2">
                <button 
                  type="button" 
                  onClick={() => { clearMessages(); setMode('LOGIN'); }}
                  className="text-xs font-bold text-slate-500 hover:text-indigo-500 flex items-center justify-center mx-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Sign In
                </button>
              </div>
            </div>
          )}

          {mode === 'FORGOT_PASSWORD' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 transition-all font-semibold text-slate-950" 
                    placeholder="name@domain.com"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-13 rounded-2xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all"
              >
                {isLoading ? 'Sending Link...' : 'Send Reset Link'}
              </Button>

              <div className="text-center pt-4">
                <button 
                  type="button" 
                  onClick={() => { clearMessages(); setMode('LOGIN'); }}
                  className="text-xs font-bold text-slate-500 hover:text-indigo-500 flex items-center justify-center mx-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Sign In
                </button>
              </div>
            </form>
          )}

          {mode === 'UNCONFIRMED_EMAIL' && (
            <div className="space-y-6 text-center">
              <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl text-sm font-medium border border-amber-100 leading-relaxed">
                We sent a confirmation link to <strong>{email}</strong>. Please check your inbox and verify your email to unlock your account.
              </div>

              {cooldown > 0 ? (
                <p className="text-xs text-slate-400 font-bold">Resend link in {cooldown}s</p>
              ) : (
                <Button 
                  onClick={handleResendVerification}
                  variant="outline"
                  className="w-full h-13 rounded-2xl border-slate-200 hover:bg-slate-50 font-bold text-sm"
                >
                  Resend Verification Email
                </Button>
              )}

              <button 
                type="button" 
                onClick={() => { clearMessages(); setMode('LOGIN'); }}
                className="text-xs font-bold text-slate-500 hover:text-indigo-500 flex items-center justify-center mx-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Sign In
              </button>
            </div>
          )}

          {/* Footer signature */}
          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center justify-center space-y-1.5 select-none">
            <p className="text-[10px] text-slate-400 font-bold tracking-tight">
              Secured by Supabase Auth
            </p>
            <p className="text-[9px] text-slate-300 font-semibold tracking-tight">
              Developed by <a href="https://www.rusaith.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-500 hover:underline font-bold">Rusaith</a>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
