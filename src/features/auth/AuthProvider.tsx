'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { verifySession } from '@/actions/auth/verify-session';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: string | null;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, userRole: null });

export const useAuth = () => useContext(AuthContext);

let lastVerifiedToken: string | null = null;
let cachedRole: string | null = null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Sync session with the server and map to Supabase
        try {
          const token = await firebaseUser.getIdToken();
          
          // Prevent duplicate verify calls (e.g. from React 18 Strict Mode double-mounts)
          if (token === lastVerifiedToken) {
            setUserRole(cachedRole);
            setLoading(false);
            return;
          }
          
          const res = await verifySession(token);
          if (res.success) {
            lastVerifiedToken = token;
            cachedRole = res.role || null;
            setUserRole(res.role || null);
          } else {
            console.error('Session verification failed on server');
            lastVerifiedToken = null;
            cachedRole = null;
            setUserRole(null);
            await auth.signOut();
          }
        } catch (error) {
          console.error('Exception during session verification:', error);
          lastVerifiedToken = null;
          cachedRole = null;
          setUserRole(null);
          await auth.signOut();
        }
      } else {
        // Clear session
        try {
          await verifySession(null);
        } catch (e) {
          console.error('Failed to clear session on server');
        }
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userRole }}>
      {children}
    </AuthContext.Provider>
  );
}
