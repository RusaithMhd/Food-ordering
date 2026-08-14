'use client';

import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // The onAuthStateChanged listener in AuthProvider will handle the session syncing
      await signInWithPopup(auth, googleProvider);
      router.push('/');
    } catch (error) {
      logger.error('Google sign-in failed', { error });
      // Here you would typically show a toast notification
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your orders
          </p>
        </div>

        <div className="mt-8">
          <Button 
            onClick={handleGoogleSignIn} 
            disabled={isLoading}
            className="w-full h-12 text-lg font-medium"
          >
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
        </div>
      </div>
    </div>
  );
}
