'use client';

import { useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { useAuth } from '@/features/auth/AuthProvider';
import { auth, googleProvider } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Hotel } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, userRole, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'MANAGER') {
        router.push('/admin');
      } else if (userRole === 'KITCHEN') {
        router.push('/kitchen');
      } else if (userRole === 'DELIVERY') {
        router.push('/delivery');
      } else {
        router.push('/');
      }
    }
  }, [user, userRole, loading, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // The useEffect above will handle the redirect once the role is fetched
    } catch (error: any) {
      console.error('Google sign-in failed:', error);
      alert(`Sign in failed: ${error?.message || 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#FAFAFA]">
      {/* Decorative background blur */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-indigo-100/40 to-blue-100/40 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-rose-100/40 to-amber-100/40 blur-3xl" />
      
      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white text-center">
          
          <div className="w-20 h-20 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl mx-auto flex items-center justify-center mb-8 shadow-lg shadow-slate-200">
            <Hotel className="h-10 w-10 text-white" />
          </div>
          
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-500 mb-10 font-medium">
            Sign in to manage your orders &amp; staff account
          </p>

          <Button 
            onClick={handleGoogleSignIn} 
            disabled={isLoading}
            className="w-full h-14 rounded-2xl text-[17px] font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3" />
                Connecting...
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </div>
            )}
          </Button>
          
          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium">
              Secured by Firebase Auth
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
