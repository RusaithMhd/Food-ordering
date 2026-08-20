'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Hotel, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { changeUserPassword } from '@/actions/auth/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await changeUserPassword(password);
      if (res.success) {
        setSuccessMsg('Your password has been successfully updated.');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setErrorMsg(res.error || 'Failed to update password. Link might be expired.');
      }
    } catch (err: any) {
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#FAFAFA] font-sans selection:bg-indigo-200 selection:text-indigo-900">
      {/* Background blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-indigo-100/40 to-blue-100/40 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-rose-100/40 to-amber-100/40 blur-3xl" />
      
      <div className="w-full max-w-md p-6 relative z-10">
        <div className="bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white text-center">
          
          <div className="w-16 h-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-lg shadow-slate-200">
            <Hotel className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
            Create New Password
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 font-semibold">
            Please enter your new password below.
          </p>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mt-6 mb-2 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold text-left animate-in fade-in duration-200">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mt-6 mb-2 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-xs font-bold text-left animate-in fade-in duration-200">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4 mt-6 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">New Password (6+ chars)</label>
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

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Confirm New Password</label>
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
              className="w-full h-13 rounded-2xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all mt-2"
            >
              {isLoading ? 'Updating Password...' : 'Reset Password'}
            </Button>

            <div className="text-center pt-4">
              <button 
                type="button" 
                onClick={() => router.push('/login')}
                className="text-xs font-bold text-slate-500 hover:text-indigo-500 flex items-center justify-center mx-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Sign In
              </button>
            </div>
          </form>

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
